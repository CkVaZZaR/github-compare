import base64
import hashlib
import json
import secrets
from urllib.parse import urlencode

from cryptography.fernet import Fernet, InvalidToken
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from .config import settings
from .github import GitHubError

SESSION_COOKIE = "session"
STATE_COOKIE = "oauth_state"
STATE_TTL = 600

router = APIRouter(prefix="/api/auth")


def _make_fernet() -> Fernet:
    # Fernet нужен 32-байтный ключ — выводим его из произвольной строки.
    # Без SESSION_SECRET ключ случайный и сессии не переживают перезапуск
    secret = settings.session_secret or secrets.token_hex(32)
    key = hashlib.sha256(secret.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


# Токен пользователя хранится в cookie зашифрованным, на сервере сессий нет
fernet = _make_fernet()


def read_session(request: Request) -> dict | None:
    """{token, login, avatar_url} вошедшего пользователя или None"""
    raw = request.cookies.get(SESSION_COOKIE)
    if not raw:
        return None
    try:
        return json.loads(fernet.decrypt(raw, ttl=settings.session_ttl))
    except (InvalidToken, ValueError):
        return None


def _set_cookie(response: Response, name: str, value: str, max_age: int) -> None:
    response.set_cookie(
        name,
        value,
        max_age=max_age,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


def clear_session(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/")


def _safe_next(next_url: str | None) -> str:
    # Только относительные пути, чтобы не было открытого редиректа
    if next_url and next_url.startswith("/") and not next_url.startswith("//"):
        return next_url
    return "/"


@router.get("/login")
async def login(next: str | None = None):
    if not settings.oauth_enabled:
        raise HTTPException(404, "oauth_disabled")
    state = secrets.token_urlsafe(16)
    # Без scope'ов: доступ только к публичным данным, но лимит 5000/ч на пользователя
    query = urlencode({"client_id": settings.github_client_id, "state": state})
    response = RedirectResponse(f"{settings.github_oauth_url}/authorize?{query}")
    _set_cookie(
        response,
        STATE_COOKIE,
        json.dumps({"state": state, "next": _safe_next(next)}),
        STATE_TTL,
    )
    return response


@router.get("/callback")
async def callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
):
    try:
        saved = json.loads(request.cookies.get(STATE_COOKIE, ""))
    except ValueError:
        saved = {}
    if not isinstance(saved, dict):
        saved = {}
    next_url = _safe_next(saved.get("next"))

    def fail() -> RedirectResponse:
        sep = "&" if "?" in next_url else "?"
        response = RedirectResponse(f"{next_url}{sep}auth_error=1")
        response.delete_cookie(STATE_COOKIE, path="/")
        return response

    # Пользователь отказался, или state не совпал (CSRF / протухшая cookie)
    if not code or not state or not secrets.compare_digest(
        state, saved.get("state", "")
    ):
        return fail()

    github = request.app.state.github
    try:
        token = await github.exchange_code(code)
        user = await github.get("/user", token=token)
    except GitHubError:
        return fail()

    session = {
        "token": token,
        "login": user["login"],
        "avatar_url": user["avatar_url"],
    }
    response = RedirectResponse(next_url)
    response.delete_cookie(STATE_COOKIE, path="/")
    _set_cookie(
        response,
        SESSION_COOKIE,
        fernet.encrypt(json.dumps(session).encode()).decode(),
        settings.session_ttl,
    )
    return response


@router.post("/logout", status_code=204)
async def logout(response: Response):
    clear_session(response)


@router.get("/me")
async def me(request: Request):
    session = request.state.session
    user = (
        {"login": session["login"], "avatar_url": session["avatar_url"]}
        if session
        else None
    )
    return {"enabled": settings.oauth_enabled, "user": user}

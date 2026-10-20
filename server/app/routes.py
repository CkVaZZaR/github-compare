from typing import Annotated

from fastapi import APIRouter, Path, Request

from .config import settings

router = APIRouter(prefix="/api")

# Ограничения логина GitHub: латиница, цифры и дефис, до 39 символов
Login = Annotated[str, Path(pattern=r"^[A-Za-z0-9-]{1,39}$")]


async def github_get(request: Request, path: str, params=None):
    # Вошедший пользователь тратит свой лимит, гость — анонимный лимит IP сервера
    session = request.state.session
    if session:
        return await request.app.state.github.get(
            path, params, token=session["token"], key=session["login"]
        )
    return await request.app.state.github.get(path, params)


# Кэш общий: без scope'ов токен пользователя видит те же публичные данные
async def cached_get(request: Request, key: str, path: str, params=None):
    cache = request.app.state.cache
    data = cache.get(key)
    if data is None:
        data = await github_get(request, path, params)
        cache.set(key, data)
    return data


@router.get("/users/{login}")
async def get_user(login: Login, request: Request):
    return await cached_get(request, f"user:{login.lower()}", f"/users/{login}")


@router.get("/users/{login}/repos")
async def get_repos(login: Login, request: Request):
    return await cached_get(
        request,
        f"repos:{login.lower()}",
        f"/users/{login}/repos",
        {"per_page": 100},
    )


@router.get("/rate_limit")
async def get_rate_limit(request: Request):
    # Запрос к /rate_limit не расходует лимит, поэтому не кэшируем
    return await github_get(request, "/rate_limit")


@router.get("/health")
async def health(request: Request):
    return {
        "status": "ok",
        "oauth": settings.oauth_enabled,
        "cache_ttl": settings.cache_ttl,
        "rate_limit": request.app.state.github.rate_limits.get(""),
    }

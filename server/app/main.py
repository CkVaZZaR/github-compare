import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .auth import clear_session, read_session
from .auth import router as auth_router
from .cache import TTLCache
from .config import settings
from .github import GitHubClient, GitHubError
from .routes import router

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not settings.oauth_enabled:
        logger.warning(
            "GITHUB_CLIENT_ID/SECRET не заданы — вход отключён, "
            "все делят анонимный лимит 60 запросов/ч"
        )
    elif not settings.session_secret:
        logger.warning("SESSION_SECRET не задан — сессии сбросятся при перезапуске")
    app.state.github = GitHubClient()
    app.state.cache = TTLCache(settings.cache_ttl)
    yield
    await app.state.github.close()


app = FastAPI(title="Анализатор GitHub", lifespan=lifespan)
app.include_router(router)
app.include_router(auth_router)


@app.middleware("http")
async def session_and_rate_limit(request: Request, call_next):
    request.state.session = read_session(request)
    # Отдаём последний известный лимит в каждом ответе, в том числе из кэша,
    # чтобы бейдж на фронте показывал актуальное значение. У вошедшего
    # пользователя — его личный лимит, у гостя — общий анонимный
    response = await call_next(request)
    session = request.state.session
    key = session["login"] if session else ""
    rate_limit = request.app.state.github.rate_limits.get(key)
    if rate_limit:
        response.headers["x-ratelimit-limit"] = str(rate_limit["limit"])
        response.headers["x-ratelimit-remaining"] = str(rate_limit["remaining"])
        response.headers["x-ratelimit-reset"] = str(rate_limit["reset"])
    return response


@app.exception_handler(GitHubError)
async def github_error_handler(request: Request, exc: GitHubError):
    body = {"detail": exc.detail}
    if exc.reset is not None:
        body["reset"] = exc.reset
    if exc.detail == "rate_limit" and not request.state.session:
        # Гостям подсказываем войти: у вошедшего свой лимит
        body["login_available"] = settings.oauth_enabled
    response = JSONResponse(status_code=exc.status, content=body)
    if exc.status == 401:
        # Токен отозван — сессия больше не действительна
        clear_session(response)
    return response

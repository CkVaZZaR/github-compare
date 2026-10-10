import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .cache import TTLCache
from .config import settings
from .github import GitHubClient, GitHubError
from .routes import router

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not settings.github_token:
        logger.warning("GITHUB_TOKEN не задан — лимит GitHub API 60 запросов/ч")
    app.state.github = GitHubClient()
    app.state.cache = TTLCache(settings.cache_ttl)
    yield
    await app.state.github.close()


app = FastAPI(title="Анализатор GitHub", lifespan=lifespan)
app.include_router(router)


@app.middleware("http")
async def add_rate_limit_headers(request: Request, call_next):
    # Отдаём последний известный лимит в каждом ответе, в том числе из кэша,
    # чтобы бейдж на фронте показывал актуальное значение
    response = await call_next(request)
    rate_limit = request.app.state.github.rate_limit
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
    return JSONResponse(status_code=exc.status, content=body)

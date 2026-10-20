import time

import httpx

from .config import settings


class GitHubError(Exception):
    def __init__(self, status: int, detail: str, reset: int | None = None):
        self.status = status
        self.detail = detail
        self.reset = reset


class GitHubClient:
    def __init__(self):
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        self._client = httpx.AsyncClient(
            base_url=settings.github_api_url, headers=headers, timeout=10
        )
        # Последний известный лимит: у вошедшего пользователя свой,
        # гости делят анонимный лимит IP сервера (60/ч).
        # Ключ — логин пользователя или "" для гостей
        self.rate_limits: dict[str, dict[str, int]] = {}

    async def close(self) -> None:
        await self._client.aclose()

    def _remember_rate_limit(self, key: str, response: httpx.Response) -> None:
        h = response.headers
        if "x-ratelimit-limit" not in h or "x-ratelimit-remaining" not in h:
            return
        new = {
            "limit": int(h["x-ratelimit-limit"]),
            "remaining": int(h["x-ratelimit-remaining"]),
            "reset": int(h.get("x-ratelimit-reset", 0)),
        }
        old = self.rate_limits.get(key)
        # Внутри одного окна лимит только убывает: параллельные ответы приходят
        # в произвольном порядке, а /rate_limit может отставать
        if (
            old
            and old["limit"] == new["limit"]
            and time.time() < old["reset"]
            and new["remaining"] > old["remaining"]
        ):
            return
        self.rate_limits[key] = new

    async def get(
        self,
        path: str,
        params: dict | None = None,
        token: str | None = None,
        key: str | None = None,
    ):
        """token — OAuth-токен пользователя, key — его логин для учёта лимита
        (None — не запоминать). Без token — анонимный запрос"""
        headers = {"Authorization": f"Bearer {token}"} if token else None
        try:
            response = await self._client.get(path, params=params, headers=headers)
        except httpx.HTTPError as exc:
            raise GitHubError(502, f"GitHub недоступен: {exc}") from exc

        if token is None:
            self._remember_rate_limit("", response)
        elif key is not None:
            self._remember_rate_limit(key, response)

        if response.status_code == 401 and token:
            # Пользователь отозвал доступ приложения на GitHub
            raise GitHubError(401, "unauthorized")
        if response.status_code == 404:
            raise GitHubError(404, "not_found")
        if response.status_code in (403, 429) and (
            response.headers.get("x-ratelimit-remaining") == "0"
            or "retry-after" in response.headers
        ):
            reset = int(
                response.headers.get("x-ratelimit-reset")
                or time.time() + int(response.headers.get("retry-after", 60))
            )
            raise GitHubError(429, "rate_limit", reset)
        if response.status_code >= 400:
            raise GitHubError(502, f"GitHub ответил {response.status_code}")

        return response.json()

    async def exchange_code(self, code: str) -> str:
        """Обменивает code из OAuth-редиректа на токен пользователя"""
        try:
            response = await self._client.post(
                f"{settings.github_oauth_url}/access_token",
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                },
                headers={"Accept": "application/json"},
            )
        except httpx.HTTPError as exc:
            raise GitHubError(502, f"GitHub недоступен: {exc}") from exc
        token = response.json().get("access_token") if response.is_success else None
        if not token:
            raise GitHubError(400, "oauth_failed")
        return token

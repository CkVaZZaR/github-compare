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
        if settings.github_token:
            headers["Authorization"] = f"Bearer {settings.github_token}"
        self._client = httpx.AsyncClient(
            base_url=settings.github_api_url, headers=headers, timeout=10
        )
        # Последний известный лимит: {limit, remaining, reset (unix, с)}
        self.rate_limit: dict[str, int] | None = None

    async def close(self) -> None:
        await self._client.aclose()

    def _remember_rate_limit(self, response: httpx.Response) -> None:
        h = response.headers
        if "x-ratelimit-limit" not in h or "x-ratelimit-remaining" not in h:
            return
        new = {
            "limit": int(h["x-ratelimit-limit"]),
            "remaining": int(h["x-ratelimit-remaining"]),
            "reset": int(h.get("x-ratelimit-reset", 0)),
        }
        old = self.rate_limit
        # Внутри одного окна лимит только убывает: параллельные ответы приходят
        # в произвольном порядке, а /rate_limit может отставать
        if (
            old
            and old["limit"] == new["limit"]
            and time.time() < old["reset"]
            and new["remaining"] > old["remaining"]
        ):
            return
        self.rate_limit = new

    async def get(self, path: str, params: dict | None = None):
        try:
            response = await self._client.get(path, params=params)
        except httpx.HTTPError as exc:
            raise GitHubError(502, f"GitHub недоступен: {exc}") from exc

        self._remember_rate_limit(response)

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

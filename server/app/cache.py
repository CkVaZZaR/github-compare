import time
from typing import Any


class TTLCache:
    """Кэш в памяти процесса. Интерфейс get/set оставлен минимальным,
    чтобы позже заменить реализацию на Redis."""

    def __init__(self, ttl: int):
        self.ttl = ttl
        self._data: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        item = self._data.get(key)
        if item is None:
            return None
        stored_at, value = item
        if time.time() - stored_at > self.ttl:
            del self._data[key]
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        self._data[key] = (time.time(), value)

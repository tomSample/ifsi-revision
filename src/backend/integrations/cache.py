"""Small in-process TTL cache for integration responses."""
from dataclasses import dataclass
from time import monotonic
from typing import Any, Callable, Dict, Optional


@dataclass
class CacheEntry:
    value: Any
    expires_at: float


class TTLCache:
    """Bounded enough for API responses and safe to use from Flask handlers."""

    def __init__(self, default_ttl: int = 900):
        self.default_ttl = default_ttl
        self._entries: Dict[str, CacheEntry] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._entries.get(key)
        if entry is None:
            return None
        if entry.expires_at <= monotonic():
            self._entries.pop(key, None)
            return None
        return entry.value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> Any:
        self._entries[key] = CacheEntry(
            value=value,
            expires_at=monotonic() + (ttl if ttl is not None else self.default_ttl),
        )
        return value

    def get_or_set(self, key: str, loader: Callable[[], Any], ttl: Optional[int] = None) -> Any:
        cached = self.get(key)
        if cached is not None:
            return cached
        return self.set(key, loader(), ttl)


integration_cache = TTLCache()

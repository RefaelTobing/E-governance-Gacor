import time
from collections import deque

from starlette.responses import JSONResponse

from app.core.config import settings
from app.core.security import verify_token

# Rate limiting in-process untuk endpoint tulis publik (BE-26, NFR-002).
# Tanpa dependency berat sesuai aturan `docs/01-tech-stack.md` §7.

# (method, path) yang dibatasi. Path tanpa query string di ASGI scope.
_TARGET = {
    ("POST", f"{settings.API_V1_STR}/reports"),
    ("POST", f"{settings.API_V1_STR}/uploads"),
}

# Benteng memori: jumlah kunci maksimum sebelum store dibersihkan paksa.
MAX_KUNCI = 10_000

_store: dict[str, deque] = {}

PESAN_429 = (
    "Terlalu banyak permintaan. Mohon tunggu beberapa menit lalu coba kirim lagi."
)


def reset_store() -> None:
    """Kosongkan hitungan (dipakai conftest antar test)."""
    _store.clear()


def _now() -> float:
    return time.time()


def _kunci(scope: dict) -> str:
    """Kunci hybrid: user id bila token valid, selain itu IP klien."""
    headers = {
        k.decode("latin-1").lower(): v.decode("latin-1")
        for k, v in scope.get("headers", [])
    }
    auth = headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        payload = verify_token(auth[7:])
        if payload and payload.get("sub"):
            return f"user:{payload['sub']}"
    client = scope.get("client")
    return f"ip:{client[0]}" if client else "ip:unknown"


def _buang_kadaluarsa(deret: deque, sekarang: float, jendela: int) -> None:
    while deret and deret[0] <= sekarang - jendela:
        deret.popleft()


def _store_penuh(_store: dict, sekarang: float, jendela: int) -> None:
    """Bersihkan kunci kadaluarsa dulu; kalau masih penuh, buang semua (fail-open)."""
    for kunci in list(_store):
        _buang_kadaluarsa(_store[kunci], sekarang, jendela)
        if not _store[kunci]:
            del _store[kunci]
    if len(_store) >= MAX_KUNCI:
        _store.clear()


class RateLimitMiddleware:
    """Balas 429 bila satu kunci (user/IP) melewati ambang di jendela berjalan."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if (
            scope["type"] != "http"
            or not settings.RATE_LIMIT_ENABLED
            or (scope["method"], scope["path"].rstrip("/")) not in _TARGET
        ):
            await self.app(scope, receive, send)
            return

        sekarang = _now()
        jendela = settings.RATE_LIMIT_WINDOW_S
        kunci = _kunci(scope)

        deret = _store.get(kunci)
        if deret is None:
            if len(_store) >= MAX_KUNCI:
                _store_penuh(_store, sekarang, jendela)
            deret = deque()
            _store[kunci] = deret

        _buang_kadaluarsa(deret, sekarang, jendela)

        if len(deret) >= settings.RATE_LIMIT_MAX:
            # Sisa waktu = timestamp tertua + jendela - sekarang.
            # Timestamp tidak ditambah saat ditolak agar spam tak mengunci terus.
            sisa = max(1, int(deret[0] + jendela - sekarang) + 1)
            res = JSONResponse(status_code=429, content={"detail": PESAN_429})
            res.headers["Retry-After"] = str(sisa)
            await res(scope, receive, send)
            return

        deret.append(sekarang)
        await self.app(scope, receive, send)

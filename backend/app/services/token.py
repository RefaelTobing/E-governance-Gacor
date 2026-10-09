from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.models.base import utcnow
from app.models.token_blacklist import TokenBlacklist
from app.models.user import User


def _dari_epoch(exp) -> Optional[datetime]:
    """Ubah claim `exp` (epoch detik) jadi datetime naif UTC, sinkron dengan kolom DATETIME."""
    if not exp:
        return None
    return datetime.fromtimestamp(float(exp), tz=timezone.utc).replace(tzinfo=None)


def user_dari_token(db: Session, token: Optional[str]) -> Optional[User]:
    """User aktif dari token, atau None bila token rusak, di-blacklist, atau user tak ada.

    Satu-satunya jalur baca token untuk otorisasi: cek blacklist di sini supaya token
    yang sudah logout ditolak seragam di semua endpoint (bukan hanya di get_current_user).
    """
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None

    jti = payload.get("jti")
    if jti and db.get(TokenBlacklist, jti) is not None:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        return None
    return user


def blacklist_token(db: Session, payload: dict) -> None:
    """Catat token yang di-logout + buang baris blacklist yang sudah kedaluwarsa.

    Idempoten: logout dua kali dengan token sama tidak membuat baris ganda.
    """
    jti = payload.get("jti")
    if not jti:
        return

    db.execute(delete(TokenBlacklist).where(TokenBlacklist.expires_at < utcnow()))
    if db.get(TokenBlacklist, jti) is None:
        db.add(TokenBlacklist(jti=jti, expires_at=_dari_epoch(payload.get("exp")) or utcnow()))
    db.commit()

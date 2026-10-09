from sqlalchemy import Column, DateTime, String

from app.models.base import Base, utcnow


class TokenBlacklist(Base):
    """Daftar token yang sudah di-logout, agar sesi berhenti sebelum masa 7 hari (BE-55).

    Kunci `jti` (bukan seluruh token) supaya nilai sensitif tidak ikut tersimpan.
    `expires_at` menyalin masa berlaku token: setelah lewat, barisnya boleh dibuang.
    """

    __tablename__ = "token_blacklist"

    jti = Column(String(36), primary_key=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow)

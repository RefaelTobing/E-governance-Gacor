import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base, utcnow


class FotoLike(Base):
    """Like pengguna atas satu foto galeri ruang publik (BE-58).

    Target like adalah `foto_url`, bukan laporan: foto galeri bisa berasal dari
    laporan warga, unggahan admin, atau data resmi Satu Data, dan semuanya
    boleh disukai. Satu pengguna hanya boleh satu like per URL foto; unlike
    dilakukan dengan menghapus baris. Total like menjadi sumber urutan "like
    terbanyak" untuk foto utama (BE-57) dan tampilan galeri (FE-44).
    """

    __tablename__ = "foto_like"
    __table_args__ = (
        UniqueConstraint("foto_url", "user_id", name="uq_foto_like_pengguna"),
    )

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    foto_url = Column(Text, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User")
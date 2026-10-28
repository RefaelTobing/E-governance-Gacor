import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base, utcnow


class FotoLike(Base):
    """Like dari pengguna atas foto laporan warga (BE-58).

    Target like adalah laporan tayang yang membawa foto (foto_url). Satu
    pengguna hanya boleh satu like per foto; like dibatalkan dengan menghapus
    baris (unlike). Total like menjadi sumber urutan "like terbanyak" untuk
    foto utama (BE-57) dan tampilan galeri (FE-44).
    """

    __tablename__ = "foto_like"
    __table_args__ = (
        UniqueConstraint("laporan_id", "user_id", name="uq_foto_like_pengguna"),
    )

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    laporan_id = Column(String(50), ForeignKey("laporan.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow)

    laporan = relationship("Laporan", back_populates="likes")
    user = relationship("User")

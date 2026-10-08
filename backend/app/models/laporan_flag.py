import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base, utcnow


class LaporanFlag(Base):
    """Flag dari pengguna lain atas laporan tayang yang dianggap tidak pantas (BE-25)."""

    __tablename__ = "laporan_flag"
    # Satu pengguna hanya boleh satu flag per laporan; ini benteng anti-spam
    # utama selama rate-limiting (BE-26) belum ada.
    __table_args__ = (
        UniqueConstraint("laporan_id", "user_id", name="uq_laporan_flag_pengguna"),
    )

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    laporan_id = Column(String(50), ForeignKey("laporan.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow)

    laporan = relationship("Laporan", back_populates="flags")
    user = relationship("User")

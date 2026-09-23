import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, utcnow

class Fasilitas(Base):
    __tablename__ = "fasilitas"

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    ruang_publik_id = Column(String(50), ForeignKey("ruang_publik.id"), nullable=False)
    nama = Column(String(255), nullable=False)
    kategori = Column(String(100))
    status = Column(String(50), default="baik")
    lokasi_spesifik = Column(String(255))
    deskripsi = Column(Text)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    ruang_publik = relationship("RuangPublik", back_populates="fasilitas")
    laporan = relationship("Laporan", back_populates="fasilitas", cascade="all, delete-orphan")

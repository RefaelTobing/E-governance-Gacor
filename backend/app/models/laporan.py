import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class Laporan(Base):
    __tablename__ = "laporan"

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"))
    ruang_publik_id = Column(String(50), ForeignKey("ruang_publik.id"), nullable=False)
    fasilitas_id = Column(String(50), ForeignKey("fasilitas.id"))
    jenis_masalah = Column(String(100))
    deskripsi = Column(Text, nullable=False)
    mode_identitas = Column(String(50), default="tampilkan_nama")
    nama_pelapor = Column(String(255))
    status = Column(String(50), default="menunggu_verifikasi")
    foto_url = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    ruang_publik = relationship("RuangPublik", back_populates="laporan")
    fasilitas = relationship("Fasilitas", back_populates="laporan")
    timeline = relationship("LaporanTimeline", back_populates="laporan", cascade="all, delete-orphan")

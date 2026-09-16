import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DECIMAL, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class RuangPublik(Base):
    __tablename__ = "ruang_publik"

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    nama = Column(String(255), nullable=False)
    kategori_id = Column(String(50), ForeignKey("categories.id"))
    wilayah = Column(String(100))
    alamat = Column(Text)
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    deskripsi = Column(Text)
    jam_operasional = Column(String(255))
    tiket_masuk = Column(String(255))
    akses_disabilitas = Column(String(255))
    ramah_hewan = Column(String(255))
    verified = Column(Boolean, default=False)
    status_general = Column(String(50))
    image_url = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    kategori = relationship("Category")
    fasilitas = relationship("Fasilitas", back_populates="ruang_publik", cascade="all, delete-orphan")
    laporan = relationship("Laporan", back_populates="ruang_publik", cascade="all, delete-orphan")

import uuid
from sqlalchemy import Column, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, utcnow

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
    # Lokasi: dari klien (user) dan dari EXIF foto (diisi BE-21).
    lat_user = Column(Float)
    long_user = Column(Float)
    lat_exif = Column(Float)
    long_exif = Column(Float)
    jarak_browser_rp = Column(Float)
    jarak_exif_rp = Column(Float)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    user = relationship("User")
    ruang_publik = relationship("RuangPublik", back_populates="laporan")
    fasilitas = relationship("Fasilitas", back_populates="laporan")
    timeline = relationship("LaporanTimeline", back_populates="laporan", cascade="all, delete-orphan")

    # Properti turunan dari relasi, dipakai untuk memperkaya response laporan.
    # Relasi perlu di-eager load agar tidak memicu query berulang (N+1).
    @property
    def ruang_publik_nama(self) -> str | None:
        return self.ruang_publik.nama if self.ruang_publik else None

    @property
    def wilayah(self) -> str | None:
        return self.ruang_publik.wilayah if self.ruang_publik else None

    @property
    def fasilitas_nama(self) -> str | None:
        return self.fasilitas.nama if self.fasilitas else None

import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, utcnow


class RuangPublikFoto(Base):
    __tablename__ = "ruang_publik_foto"

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    ruang_publik_id = Column(String(50), ForeignKey("ruang_publik.id"), nullable=False, index=True)
    foto_url = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    ruang_publik = relationship("RuangPublik", back_populates="foto_resmi")

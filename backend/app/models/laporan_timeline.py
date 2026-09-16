from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class LaporanTimeline(Base):
    __tablename__ = "laporan_timeline"

    id = Column(Integer, primary_key=True, autoincrement=True)
    laporan_id = Column(String(50), ForeignKey("laporan.id"), nullable=False)
    status = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    laporan = relationship("Laporan", back_populates="timeline")

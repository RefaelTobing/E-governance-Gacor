from sqlalchemy import Column, Integer, String, DateTime, JSON
from app.models.base import Base, utcnow


class EtlRun(Base):
    __tablename__ = "etl_run"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pemicu = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False)
    mulai = Column(DateTime, nullable=False, default=utcnow)
    selesai = Column(DateTime, nullable=True)
    tahap_gagal = Column(String(50), nullable=True)
    hitung = Column(JSON, nullable=True)
    tahap = Column(JSON, nullable=True)

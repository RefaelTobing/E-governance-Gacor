import uuid
from sqlalchemy import Boolean, Column, String, DateTime
from app.models.base import Base, utcnow

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="warga")
    # Admin menonaktifkan akun, bukan menghapusnya: laporan yang sudah pernah
    # dibuat user itu harus tetap punya pemiliknya.
    is_active = Column(Boolean, nullable=False, default=True, server_default="1")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

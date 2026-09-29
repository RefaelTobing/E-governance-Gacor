from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

ROLE_WARGA = "warga"
ROLE_ADMIN = "admin"
MIN_PASSWORD_LENGTH = 8

# Satu-satunya role yang boleh dibuat lewat endpoint publik. Role admin hanya
# bisa dibuat lewat seed atau endpoint users/ yang butuh sesi admin.
ROLE_PUBLIK = {ROLE_WARGA}


def _validasi_sandi(password: str) -> str:
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Kata sandi minimal {MIN_PASSWORD_LENGTH} karakter")
    return password


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = ROLE_WARGA

    @field_validator("email")
    @classmethod
    def email_kecil(cls, v: EmailStr) -> str:
        # MySQL tidak membedakan huruf besar/kecil, tapi tabel ini juga dibaca
        # aplikasi lain. Diseragamkan di titik masuk supaya satu orang tidak
        # bisa mendaftar dua akun dengan beda kapitalisasi email.
        return str(v).strip().lower()


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def sandi_terhits(cls, v: str) -> str:
        return _validasi_sandi(v)


class AdminCreate(BaseModel):
    """Dipakai endpoint users/ untuk menambah petugas. Role tidak bisa dipilih
    pemanggil karena endpoint itu khusus admin."""

    name: str
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def email_kecil(cls, v: EmailStr) -> str:
        return str(v).strip().lower()

    @field_validator("password")
    @classmethod
    def sandi_terhits(cls, v: str) -> str:
        return _validasi_sandi(v)


class AdminUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None

    @field_validator("password")
    @classmethod
    def sandi_terhits(cls, v: Optional[str]) -> Optional[str]:
        return None if v is None else _validasi_sandi(v)


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

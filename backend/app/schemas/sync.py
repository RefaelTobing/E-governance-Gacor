from datetime import datetime, timezone

from pydantic import BaseModel, field_validator


def _ke_utc(nilai: datetime | None) -> datetime | None:
    """Waktu dari tabel DATETIME polos ditandai UTC, sama seperti SyncResult."""
    if nilai is None or nilai.tzinfo is not None:
        return nilai
    return nilai.replace(tzinfo=timezone.utc)


class TahapSync(BaseModel):
    tahap: str
    status: str
    detik: int
    log: list[str]


class SyncResult(BaseModel):
    status: str
    mulai: datetime
    selesai: datetime
    total_detik: int
    tahap: list[TahapSync]
    tahap_gagal: str | None = None


class RiwayatItem(BaseModel):
    id: int
    pemicu: str
    status: str
    mulai: datetime
    selesai: datetime | None = None
    tahap_gagal: str | None = None
    hitung: dict | None = None
    tahap: list[dict] | None = None

    @field_validator("mulai", "selesai")
    @classmethod
    def tandai_utc(cls, nilai: datetime | None) -> datetime | None:
        return _ke_utc(nilai)

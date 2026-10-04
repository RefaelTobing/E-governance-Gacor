from datetime import datetime

from pydantic import BaseModel


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

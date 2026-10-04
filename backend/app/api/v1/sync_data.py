import threading
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_admin
from app.etl.scheduler import TAHAP, jalankan_tahap
from app.models.user import User
from app.schemas.sync import SyncResult, TahapSync

router = APIRouter()

# Lock hanya di dalam proses API; run scheduler (proses terpisah, jam 02:00)
# tidak saling terkunci. Diterima: jalur manual dan jalur terjadwal jarang bentrok.
SYNC_LOCK = threading.Lock()
LOG_TAIL = 100


def _nama_tahap(modul: str) -> str:
    return modul.removeprefix("app.etl.")


@router.post("", response_model=SyncResult)
def sync_data(_: User = Depends(get_current_admin)):
    if not SYNC_LOCK.acquire(blocking=False):
        raise HTTPException(
            status_code=409,
            detail="Sinkronisasi sedang berjalan, coba lagi setelah selesai.",
        )
    try:
        mulai = datetime.now(timezone.utc)
        daftar: list[TahapSync] = []
        tahap_gagal: str | None = None

        for modul in TAHAP:
            mulai_tahap = time.time()
            sukses, log = jalankan_tahap(modul)
            nama = _nama_tahap(modul)
            daftar.append(
                TahapSync(
                    tahap=nama,
                    status="sukses" if sukses else "gagal",
                    detik=int(time.time() - mulai_tahap),
                    log=log[-LOG_TAIL:],
                )
            )
            if not sukses:
                tahap_gagal = nama
                break

        selesai = datetime.now(timezone.utc)
        return SyncResult(
            status="sukses" if tahap_gagal is None else "gagal",
            mulai=mulai,
            selesai=selesai,
            total_detik=int((selesai - mulai).total_seconds()),
            tahap=daftar,
            tahap_gagal=tahap_gagal,
        )
    finally:
        SYNC_LOCK.release()

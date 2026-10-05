import threading

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.etl import pipeline as etl_pipeline
from app.models.etl_run import EtlRun
from app.models.user import User
from app.schemas.sync import RiwayatItem, SyncResult

router = APIRouter()

# Lock hanya di dalam proses API; run scheduler (proses terpisah) tidak saling
# terkunci. Diterima karena jalur manual dan jalur terjadwal jarang bentrok.
SYNC_LOCK = threading.Lock()


@router.post("", response_model=SyncResult)
def sync_data(_: User = Depends(get_current_admin)):
    if not SYNC_LOCK.acquire(blocking=False):
        raise HTTPException(
            status_code=409,
            detail="Sinkronisasi sedang berjalan, coba lagi setelah selesai.",
        )
    try:
        return etl_pipeline.jalankan_pipeline("manual")
    finally:
        SYNC_LOCK.release()


@router.get("", response_model=list[RiwayatItem])
def riwayat_sync(
    limit: int = Query(default=20, ge=1, le=200),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    runs = db.scalars(select(EtlRun).order_by(EtlRun.id.desc()).limit(limit)).all()
    return [
        RiwayatItem(
            id=r.id,
            pemicu=r.pemicu,
            status=r.status,
            mulai=r.mulai,
            selesai=r.selesai,
            tahap_gagal=r.tahap_gagal,
            hitung=r.hitung,
            tahap=r.tahap,
        )
        for r in runs
    ]

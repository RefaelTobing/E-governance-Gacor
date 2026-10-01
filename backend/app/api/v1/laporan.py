from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_current_admin, get_db, oauth2_scheme
from app.models.user import User
from app.schemas.laporan import (
    LaporanCreate,
    LaporanDetailResponse,
    LaporanResponse,
    LaporanStatusUpdate,
)
from app.services import laporan as crud_laporan

router = APIRouter()


@router.post("", response_model=LaporanResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    laporan_in: LaporanCreate,
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
):
    """Kirim laporan baru dari warga."""
    user_id = None
    if token:
        try:
            from app.core.security import verify_token
            payload = verify_token(token)
            if payload:
                user_id = payload.get("sub")
        except Exception:
            pass
            
    return crud_laporan.create_report(db, laporan_in, user_id=user_id)


@router.get("", response_model=List[LaporanResponse])
def read_reports(
    status: Optional[str] = Query(None, description="Filter status laporan"),
    wilayah: Optional[str] = Query(None, description="Filter wilayah"),
    q: Optional[str] = Query(None, description="Search jenis masalah/deskripsi"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Daftar laporan masyarakat."""
    return crud_laporan.get_reports(
        db, status=status, wilayah=wilayah, q=q, skip=skip, limit=limit
    )


@router.get("/stats/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """Statistik ringkasan laporan untuk dashboard admin."""
    return crud_laporan.get_dashboard_stats(db)


@router.get("/stats/moderasi")
def get_moderasi_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """Statistik antrian moderasi."""
    return crud_laporan.get_moderasi_stats(db)


@router.get("/{laporan_id}", response_model=LaporanDetailResponse)
def read_report(laporan_id: str, db: Session = Depends(get_db)):
    """Detail satu laporan beserta riwayat timeline."""
    report = crud_laporan.get_report_by_id(db, laporan_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laporan tidak ditemukan"
        )
    return report


@router.patch("/{laporan_id}/status", response_model=LaporanDetailResponse)
def update_report_status(
    laporan_id: str,
    payload: LaporanStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """Update status laporan oleh admin."""
    updated = crud_laporan.update_report_status(
        db,
        laporan_id=laporan_id,
        status=payload.status,
        title=payload.title,
        description=payload.description
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laporan tidak ditemukan"
        )
    return updated

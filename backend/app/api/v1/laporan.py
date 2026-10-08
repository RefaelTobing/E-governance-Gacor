from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_active_user,
    get_current_admin,
    get_db,
    oauth2_scheme_optional,
)
from app.core.security import verify_token
from app.models.laporan import Laporan
from app.models.user import User
from app.schemas.laporan import (
    LaporanApproveRequest,
    LaporanCreate,
    LaporanDetailResponse,
    LaporanFlagResponse,
    LaporanRejectRequest,
    LaporanResponse,
    LaporanStatusResponse,
    LaporanStatusUpdate,
    STATUS_KANONIK,
)
from app.schemas.user import ROLE_ADMIN
from app.services import laporan as crud_laporan

router = APIRouter()
admin_router = APIRouter()


def _peninjau(db: Session, token: Optional[str]) -> Optional[User]:
    if not token:
        return None
    payload = verify_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == payload.get("sub")).first()


def _boleh_lihat(db: Session, report: Laporan, token: Optional[str]) -> bool:
    """Laporan anonim penuh terbuka dengan bukti id UUID (BE-24);
    laporan berpemilik hanya pemilik atau admin aktif."""
    if not report.user_id:
        return True
    peninjau = _peninjau(db, token)
    return peninjau is not None and peninjau.is_active and (
        peninjau.id == report.user_id or peninjau.role == ROLE_ADMIN
    )


@router.post("", response_model=LaporanResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    laporan_in: LaporanCreate,
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme_optional)
):
    """Kirim laporan baru dari warga."""
    user_id = None
    if token:
        try:
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
    """Daftar laporan masyarakat - hanya yang tayang (BE-52); antrian moderasi pindah
    ke GET /admin/reports."""
    return crud_laporan.get_reports(
        db, status=status, wilayah=wilayah, q=q, skip=skip, limit=limit,
        hanya_tayang=True,
    )


# Sebelum GET /{laporan_id} supaya "mine" tidak tertangkap sebagai id (404).
@router.get("/mine", response_model=List[LaporanResponse])
def read_my_reports(
    status: Optional[str] = Query(None, description="Filter status laporan"),
    wilayah: Optional[str] = Query(None, description="Filter wilayah"),
    q: Optional[str] = Query(None, description="Search jenis masalah/deskripsi"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Riwayat "Laporan Saya": laporan milik pemanggil, semua status (BE-50)."""
    return crud_laporan.get_reports(
        db,
        status=status,
        wilayah=wilayah,
        q=q,
        skip=skip,
        limit=limit,
        user_id=user.id,
    )


@admin_router.get("/reports", response_model=List[LaporanResponse])
def read_admin_reports(
    status: Optional[str] = Query(None, description="Filter status (kanonik, atau 'semua')"),
    wilayah: Optional[str] = Query(None, description="Filter wilayah"),
    q: Optional[str] = Query(None, description="Search jenis masalah/deskripsi"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Antrian tinjauan admin: semua status, proteksi role admin (BE-28).

    Nilai `status` divalidasi ke STATUS_KANONIK (atau 'semua') agar tidak ada
    filter ngawur yang diam-diam mengosongkan antrian.
    """
    if status and status != "semua" and status not in STATUS_KANONIK:
        raise HTTPException(
            status_code=422,
            detail=f"Status tidak dikenal: {status}",
        )
    return crud_laporan.get_reports(
        db, status=status, wilayah=wilayah, q=q, skip=skip, limit=limit
    )


# Sebelum route ber-{laporan_id} supaya "flagged" tidak tertangkap sebagai id.
@admin_router.get("/reports/flagged", response_model=List[LaporanResponse])
def read_flagged_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Daftar laporan yang di-flag pengguna lain, terpisah dari antrian (BE-31)."""
    return crud_laporan.get_flagged_reports(db, skip=skip, limit=limit)


@admin_router.post(
    "/reports/{laporan_id}/approve", response_model=LaporanDetailResponse
)
def approve_report(
    laporan_id: str,
    payload: Optional[LaporanApproveRequest] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Setujui laporan: status jadi diverifikasi/tayang (BE-29). Guard ada di
    endpoint, bukan di service, supaya PATCH /status tetap bebas sampai BE-51."""
    report = crud_laporan.get_report_by_id(db, laporan_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laporan tidak ditemukan",
        )
    if report.status not in ("menunggu_verifikasi", "ditolak"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Laporan tidak bisa disetujui dari status {report.status}",
        )
    return crud_laporan.update_report_status(
        db,
        laporan_id=laporan_id,
        status="diverifikasi",
        title="Laporan disetujui",
        description=payload.description if payload else None,
    )


@admin_router.post(
    "/reports/{laporan_id}/reject", response_model=LaporanDetailResponse
)
def reject_report(
    laporan_id: str,
    payload: LaporanRejectRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Tolak laporan: status jadi ditolak + alasan tersimpan (BE-30).

    Alasan wajib (divalidasi skema). Laporan yang sudah ditolak tidak bisa
    ditolak ulang (409); status tayang boleh diturunkan lewat endpoint ini.
    """
    report = crud_laporan.get_report_by_id(db, laporan_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laporan tidak ditemukan",
        )
    if report.status == "ditolak":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Laporan sudah berstatus ditolak",
        )
    return crud_laporan.reject_report(
        db, laporan_id=laporan_id, alasan=payload.alasan
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
def read_report(
    laporan_id: str,
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme_optional),
):
    """Detail satu laporan beserta timeline (BE-52): berpemilik hanya
    pemilik/admin, anonim penuh terbuka dengan bukti id UUID."""
    report = crud_laporan.get_report_by_id(db, laporan_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laporan tidak ditemukan"
        )
    if not _boleh_lihat(db, report, token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya pelapor atau admin yang boleh melihat laporan ini"
        )
    return report


@router.get("/{laporan_id}/status", response_model=LaporanStatusResponse)
def read_report_status(
    laporan_id: str,
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme_optional),
):
    """Status laporan untuk pelapor (BE-24).

    Laporan berpemilik hanya terbaca pemilik atau admin. Laporan anonim penuh
    (user_id None) dibuka bagi siapa pun yang mengetahui id UUID-nya: id menjadi
    bukti kepemilikan, dan response hanya berisi status + timeline.
    """
    report = crud_laporan.get_report_by_id(db, laporan_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laporan tidak ditemukan"
        )

    if not _boleh_lihat(db, report, token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya pelapor atau admin yang boleh melihat status laporan ini"
        )

    return report


@router.post(
    "/{laporan_id}/flag",
    response_model=LaporanFlagResponse,
    status_code=status.HTTP_201_CREATED,
)
def flag_report(
    laporan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Flag laporan tayang yang dianggap tidak pantas (BE-25); aturan di `flag_laporan`."""
    return crud_laporan.flag_laporan(db, laporan_id, user_id=current_user.id)


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

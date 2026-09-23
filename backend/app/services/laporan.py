from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.laporan import Laporan

def get_reports_by_ruang_publik(
    db: Session, ruang_publik_id: str, skip: int = 0, limit: int = 100
) -> list[Laporan]:
    """
    Mengambil daftar laporan yang sudah disetujui/tayang otomatis untuk satu ruang publik.
    """
    stmt = (
        select(Laporan)
        .where(
            Laporan.ruang_publik_id == ruang_publik_id,
            Laporan.status.in_(["disetujui", "tayang_otomatis"])
        )
        .order_by(Laporan.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(stmt).all())

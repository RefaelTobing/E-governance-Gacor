from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.laporan import Laporan
from app.models.ruang_publik import RuangPublik

router = APIRouter()


@router.get("/summary")
def get_statistics_summary(db: Session = Depends(get_db)):
    total_ruang_publik = db.query(RuangPublik).count()
    total_laporan_selesai = db.query(Laporan).filter(Laporan.status == "selesai").count()
    total_laporan = db.query(Laporan).count()
    
    now = datetime.now()
    awal_bulan = datetime(now.year, now.month, 1)
    laporan_bulan_ini = db.query(Laporan).filter(Laporan.created_at >= awal_bulan).count()
    
    tingkat_penyelesaian_persen = round((total_laporan_selesai / total_laporan) * 100) if total_laporan > 0 else 0
    
    return {
        "total_ruang_publik": total_ruang_publik,
        "total_laporan_selesai": total_laporan_selesai,
        "laporan_bulan_ini": laporan_bulan_ini,
        "tingkat_penyelesaian_persen": tingkat_penyelesaian_persen
    }


@router.get("/testimonials")
def get_testimonials():
    return [
        {"id": 1, "quote": "Aplikasi ini sangat membantu! Dalam 3 hari sudah diperbaiki!", "name": "Budi Santoso", "role": "Warga Jakarta Pusat", "rating": 5, "emoji": "🇮🇩"},
        {"id": 2, "quote": "Fitur peta presisi sangat akurat untuk lokasi fasilitas rusak.", "name": "Siti Nurhaliza", "role": "Pengguna Aktif", "rating": 5, "emoji": "🇮🇩"},
        {"id": 3, "quote": "Saya suka bisa lapor secara anonim tanpa ribet daftar akun.", "name": "Ahmad Wijaya", "role": "Relawan Lingkungan", "rating": 5, "emoji": "🇮🇩"},
        {"id": 4, "quote": "Transparansi pengelolaan ruang publik meningkat drastis.", "name": "Dewi Lestari", "role": "Ibu Rumah Tangga", "rating": 5, "emoji": "🇮🇩"},
        {"id": 5, "quote": "Pelaporan cepat dan prosesnya jelas!", "name": "Eko Prasetyo", "role": "Pegawai Swasta", "rating": 4, "emoji": "🇮🇩"}
    ]


@router.get("/hero-slides")
def get_hero_slides():
    return [
        {"image": "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=1200&auto=format&fit=crop", "title": "Taman Suropati", "location": "Menteng, Jakarta Pusat"},
        {"image": "https://images.unsplash.com/photo-1584467735871-8e853e8e12b7?q=80&w=1200&auto=format&fit=crop", "title": "Tebet Eco Park", "location": "Tebet, Jakarta Selatan"},
        {"image": "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop", "title": "Hutan Kota GBK", "location": "Senayan, Jakarta Pusat"},
        {"image": "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop", "title": "Taman Lapangan Banteng", "location": "Sawah Besar, Jakarta Pusat"}
    ]

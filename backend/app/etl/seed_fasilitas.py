"""Isi tabel fasilitas untuk ruang publik yang belum punya fasilitas.

Tabel `fasilitas` tidak punya sumber data resmi: file Satu Data di
`data/processed/` tidak punya kolom fasilitas sama sekali, jadi tanpa script ini
halaman `/dashboard/fasilitas`, filter fasilitas publik (`GET /facilities`), dan
halaman detail ruang publik selalu kosong.

Isinya **data contoh**, dibuat mengikuti kategori tiap ruang publik:

    python -m app.etl.seed_fasilitas             # isi ruang publik yang belum punya fasilitas
    python -m app.etl.seed_fasilitas --reset     # hapus baris hasil seed (id diawali "seed-")

Idempoten dan tidak menimpa kerja admin:
- id baris diturunkan dari id ruang publik (`seed-<hash>-<n>`), jadi dijalankan
  berapa kali pun hasilnya sama;
- ruang publik yang sudah punya fasilitas, termasuk yang dibuat admin lewat
  `POST /api/v1/admin/facilities` atau impor CSV, dilewati;
- `--reset` hanya menghapus baris berprefix `seed-` dan menolak berjalan bila
  ada laporan yang menunjuk baris itu.
"""
from __future__ import annotations

import argparse
import hashlib
import random
from collections import Counter

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.fasilitas import Fasilitas
from app.models.laporan import Laporan
from app.models.ruang_publik import RuangPublik

# (nama fasilitas, kategori) per kategori ruang publik. Nama dipilih agar ikut
# muncul sebagai opsi filter di GET /api/v1/facilities.
KATALOG: dict[str, list[tuple[str, str]]] = {
    "taman-kota": [
        ("Toilet Umum", "Sanitasi"),
        ("Jalur Lari", "Olahraga"),
        ("Area Parkir", "Parkir"),
        ("Penerangan Jalan", "Penerangan"),
        ("Pos Penjagaan", "Keamanan"),
        ("Tempat Sampah", "Kebersihan"),
        ("Bangku Taman", "Perabot"),
    ],
    "taman-lingkungan": [
        ("Toilet Umum", "Sanitasi"),
        ("Area Bermain Anak", "Rekreasi"),
        ("Jalur Lari", "Olahraga"),
        ("Penerangan Jalan", "Penerangan"),
        ("Tempat Sampah", "Kebersihan"),
        ("Bangku Taman", "Perabot"),
        ("Kran Air Minum", "Sanitasi"),
    ],
    "rptra": [
        ("Area Bermain Anak", "Rekreasi"),
        ("Toilet Umum", "Sanitasi"),
        ("Ruang Serbaguna", "Bangunan"),
        ("Parkir Sepeda", "Parkir"),
        ("Penerangan Jalan", "Penerangan"),
        ("Tempat Sampah", "Kebersihan"),
        ("Bangku Taman", "Perabot"),
        ("Pos Penjagaan", "Keamanan"),
    ],
    "taman-interaktif": [
        ("Peralatan Fitness Outdoor", "Olahraga"),
        ("Jalur Lari", "Olahraga"),
        ("Area Bermain Anak", "Rekreasi"),
        ("Toilet Umum", "Sanitasi"),
        ("Penerangan Jalan", "Penerangan"),
        ("Parkir Sepeda", "Parkir"),
        ("Tempat Sampah", "Kebersihan"),
    ],
}

# Untuk ruang publik tanpa kategori (kolom kategori_id NULL).
KATALOG_UMUM: list[tuple[str, str]] = [
    ("Toilet Umum", "Sanitasi"),
    ("Tempat Sampah", "Kebersihan"),
    ("Penerangan Jalan", "Penerangan"),
    ("Bangku Taman", "Perabot"),
]

LOKASI = [
    "sisi utara",
    "sisi selatan",
    "sisi timur",
    "sisi barat",
    "dekat pintu masuk",
    "dekat jalur utama",
    "dekat area bermain",
    "sepanjang pagar",
]

# Distribusi kondisi: wajar untuk data contoh, bukan hasil inspeksi nyata.
STATUS = [("baik", 80), ("perlu_perhatian", 15), ("rusak", 5)]

DESKRIPSI_SEED = "Data contoh hasil seed; perbarui lewat Edit bila kondisi terbaru berbeda."


def _id_seed(ruang_publik_id: str, urutan: int) -> str:
    """Id stabil per ruang publik; diawali "seed-" supaya --reset bisa memilih."""
    potongan = hashlib.sha1(ruang_publik_id.encode("utf-8")).hexdigest()[:16]
    return f"seed-{potongan}-{urutan}"


def _pilih_status(rng: random.Random) -> str:
    gulir = rng.randrange(100)
    berjalan = 0
    for status, bobot in STATUS:
        berjalan += bobot
        if gulir < berjalan:
            return status
    return STATUS[0][0]


def _baris_fasilitas(rp: RuangPublik, rng: random.Random) -> list[Fasilitas]:
    katalog = KATALOG.get(rp.kategori_id or "") or KATALOG_UMUM
    kandidat = katalog[:]
    rng.shuffle(kandidat)
    jumlah = rng.randint(3, min(6, len(kandidat)))

    baris: list[Fasilitas] = []
    for urutan, (nama, kategori) in enumerate(kandidat[:jumlah], start=1):
        status = _pilih_status(rng)
        deskripsi = DESKRIPSI_SEED
        if status != "baik":
            deskripsi = f"{DESKRIPSI_SEED} Kondisi tercatat: {status.replace('_', ' ')}."
        baris.append(
            Fasilitas(
                id=_id_seed(rp.id, urutan),
                ruang_publik_id=rp.id,
                nama=nama,
                kategori=kategori,
                status=status,
                lokasi_spesifik=f"Area {rng.choice(LOKASI)}",
                deskripsi=deskripsi,
            )
        )
    return baris


def seed_fasilitas(db: Session) -> tuple[int, Counter]:
    """Isi fasilitas untuk ruang publik yang belum punya baris fasilitas."""
    sudah_ada = set(db.scalars(select(Fasilitas.ruang_publik_id).distinct()).all())
    id_terdaftar = set(db.scalars(select(Fasilitas.id)).all())

    baru = 0
    per_kategori: Counter = Counter()
    for rp in db.scalars(select(RuangPublik).order_by(RuangPublik.id)).all():
        if rp.id in sudah_ada:
            continue
        for baris in _baris_fasilitas(rp, random.Random(rp.id)):
            if baris.id in id_terdaftar:
                continue
            db.add(baris)
            baru += 1
            id_terdaftar.add(baris.id)
            per_kategori[rp.kategori_id or "(tanpa kategori)"] += 1
    db.commit()
    return baru, per_kategori


def reset(db: Session) -> int:
    """Hapus baris hasil seed saja; baris buatan admin dipertahankan."""
    id_seed = list(db.scalars(select(Fasilitas.id).where(Fasilitas.id.like("seed-%"))).all())
    if not id_seed:
        print("reset       : tidak ada baris hasil seed")
        return 0

    dirujuk = db.scalar(
        select(Laporan.id).where(Laporan.fasilitas_id.in_(id_seed)).limit(1)
    )
    if dirujuk:
        raise SystemExit(
            f"--reset menolak: ada laporan yang menunjuk baris hasil seed ({dirujuk}). "
            "Hapus dulu laporan terkait."
        )

    db.execute(delete(Fasilitas).where(Fasilitas.id.like("seed-%")))
    db.commit()
    print(f"reset       : {len(id_seed)} baris hasil seed dihapus")
    return len(id_seed)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--reset", action="store_true", help="hapus baris hasil seed lalu keluar")
    args = parser.parse_args()

    with SessionLocal() as db:
        if args.reset:
            reset(db)
            return

        sebelum = db.scalar(select(Fasilitas.id).limit(1))
        baru, per_kategori = seed_fasilitas(db)
        total = db.scalar(select(func.count()).select_from(Fasilitas))
        print(f"fasilitas   : {baru} baru (total {total})")
        if baru == 0:
            print("            : tidak ada ruang publik tanpa fasilitas; tidak ada yang diubah")
        if sebelum:
            print("            : baris hasil admin/seed lama tidak disentuh")
        for kategori, jumlah in sorted(per_kategori.items(), key=lambda x: -x[1]):
            print(f"  {kategori:20s} {jumlah}")


if __name__ == "__main__":
    main()

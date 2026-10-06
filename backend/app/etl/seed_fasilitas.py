"""Isi tabel fasilitas dari katalog di data/processed/fasilitas.csv.

Tabel `fasilitas` tidak punya sumber data resmi: file Satu Data di
`data/processed/` tidak punya kolom fasilitas, jadi tanpa script ini
halaman `/dashboard/fasilitas`, filter fasilitas publik (`GET /facilities`), dan
halaman detail ruang publik selalu kosong.

Katalognya sendiri ditulis manusia di `data/processed/fasilitas.md`, lalu
diturunkan sekali menjadi `fasilitas.csv`. Tiap baris katalog dipasang ke
**semua** ruang publik, dengan `status` "baik" dan `deskripsi` kosong: katalog
hanya menyebut keberadaan fasilitas, bukan kondisinya. Kondisi berubah lewat
edit admin atau laporan warga.

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
import csv
import hashlib
from collections import Counter
from pathlib import Path

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.fasilitas import Fasilitas
from app.models.laporan import Laporan
from app.models.ruang_publik import RuangPublik

PROCESSED_DIR = Path(__file__).resolve().parents[3] / "data" / "processed"
KATALOG_CSV = PROCESSED_DIR / "fasilitas.csv"


def baca_katalog(path: Path = KATALOG_CSV) -> list[tuple[str, str | None]]:
    """Katalog (nama, kategori) dari CSV; nama wajib unik supaya id seed stabil."""
    if not path.exists():
        raise SystemExit(f"katalog fasilitas tidak ditemukan: {path}")

    with open(path, encoding="utf-8-sig", newline="") as berkas:
        baris = list(csv.DictReader(berkas))

    if not baris or "nama" not in (baris[0] or {}):
        raise SystemExit(f"{path.name} tidak layak dipakai: header wajib punya kolom nama")

    hasil: list[tuple[str, str | None]] = []
    dilihat: set[str] = set()
    for nomor, row in enumerate(baris, start=2):
        nama = (row.get("nama") or "").strip()
        if not nama:
            raise SystemExit(f"{path.name} baris {nomor}: nama kosong")
        if nama.casefold() in dilihat:
            raise SystemExit(f"{path.name} baris {nomor}: nama {nama!r} ganda")
        dilihat.add(nama.casefold())

        kategori = (row.get("kategori") or "").strip() or None
        if kategori and len(kategori) > 100:
            raise SystemExit(f"{path.name} baris {nomor}: kategori lebih dari 100 karakter")
        hasil.append((nama, kategori))

    return hasil


def _id_seed(ruang_publik_id: str, urutan: int) -> str:
    """Id stabil per ruang publik; diawali "seed-" supaya --reset bisa memilih.

    Urutan dua digit supaya pengurutan string mengikuti urutan katalog, bukan
    menyelipkan -10 di depan -2.
    """
    potongan = hashlib.sha1(ruang_publik_id.encode("utf-8")).hexdigest()[:16]
    return f"seed-{potongan}-{urutan:02d}"


def seed_fasilitas(db: Session, katalog: list[tuple[str, str | None]] | None = None) -> tuple[int, Counter]:
    """Isi fasilitas untuk ruang publik yang belum punya baris fasilitas."""
    if katalog is None:
        katalog = baca_katalog()

    sudah_ada = set(db.scalars(select(Fasilitas.ruang_publik_id).distinct()).all())
    id_terdaftar = set(db.scalars(select(Fasilitas.id)).all())

    baru = 0
    per_kategori: Counter = Counter()
    for rp in db.scalars(select(RuangPublik).order_by(RuangPublik.id)).all():
        if rp.id in sudah_ada:
            continue
        for urutan, (nama, kategori) in enumerate(katalog, start=1):
            baris_id = _id_seed(rp.id, urutan)
            if baris_id in id_terdaftar:
                continue
            db.add(Fasilitas(
                id=baris_id,
                ruang_publik_id=rp.id,
                nama=nama,
                kategori=kategori,
                status="baik",
            ))
            baru += 1
            id_terdaftar.add(baris_id)
            per_kategori[kategori or "(tanpa kategori)"] += 1
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
    parser.add_argument("--katalog", help="path katalog CSV; default data/processed/fasilitas.csv")
    args = parser.parse_args()

    with SessionLocal() as db:
        if args.reset:
            reset(db)
            return

        katalog = baca_katalog(Path(args.katalog) if args.katalog else KATALOG_CSV)
        sebelum = db.scalar(select(Fasilitas.id).limit(1))
        baru, per_kategori = seed_fasilitas(db, katalog)
        total = db.scalar(select(func.count()).select_from(Fasilitas))
        print(f"katalog     : {len(katalog)} fasilitas dari {KATALOG_CSV.name}")
        print(f"fasilitas   : {baru} baru (total {total})")
        if baru == 0:
            print("            : tidak ada ruang publik tanpa fasilitas; tidak ada yang diubah")
        if sebelum:
            print("            : baris hasil admin/seed lama tidak disentuh")
        for kategori, jumlah in sorted(per_kategori.items(), key=lambda x: -x[1]):
            print(f"  {kategori:20s} {jumlah}")


if __name__ == "__main__":
    main()

"""Isi tabel categories dan ruang_publik dari hasil olah di data/processed.

Sumber bawaan adalah `ruang_publik.csv`, di mana kolom
`tipe` menentukan kategori barisnya (Taman Lingkungan, RPTRA, ...). File lain
tetap bisa dipakai lewat `--file`:

    python -m app.etl.seed_db                                   # data terbaru
    python -m app.etl.seed_db --reset                           # ganti total isi tabel
    python -m app.etl.seed_db --file ../data/processed/ruang_publik_lainnya.csv

Idempoten: baris dengan id yang sudah ada dilewati, tidak pernah di-update
(aturan merge FEAT-012, lihat docs/features/data-master-service.md).
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.etl.kategori import slug_tipe
from app.models.category import Category
from app.models.fasilitas import Fasilitas
from app.models.laporan import Laporan
from app.models.ruang_publik import RuangPublik

PROCESSED_DIR = Path(__file__).resolve().parents[3] / "data" / "processed"
SUMBER_BAWAAN = PROCESSED_DIR / "ruang_publik.csv"

# Hanya kolom ini yang boleh dibawa dari file sumber. Kolom lain di file
# (kecamatan, kelurahan, tipe) tidak ada di tabel dan dibuang saat seed.
KOLOM_RUANG_PUBLIK = {
    nama for nama in RuangPublik.__table__.columns.keys()
    if nama not in {"created_at", "updated_at"}
}


def _cari_file(arg: str | None) -> Path:
    if arg:
        kandidat = [Path(arg), PROCESSED_DIR / arg]
        for path in kandidat:
            if path.exists():
                return path
        raise SystemExit(f"file sumber tidak ditemukan: {arg}")

    if SUMBER_BAWAAN.exists():
        return SUMBER_BAWAAN
    for path in (PROCESSED_DIR / "ruang_publik_lainnya.csv", PROCESSED_DIR / "ruang_publik_rth_generik.csv"):
        if path.exists():
            return path
    raise SystemExit(f"tidak ada file sumber di {PROCESSED_DIR}")


def _baca_kategori() -> pd.DataFrame:
    json_path = PROCESSED_DIR / "categories.json"
    if json_path.exists():
        return pd.DataFrame(json.load(open(json_path, encoding="utf-8")))
    return pd.read_csv(PROCESSED_DIR / "categories.csv", encoding="utf-8-sig")


def _baca_ruang_publik(path: Path) -> pd.DataFrame:
    if path.suffix == ".json":
        return pd.DataFrame(json.load(open(path, encoding="utf-8")))
    return pd.read_csv(path, encoding="utf-8-sig")


def _kategori_id(tipe, id_kategori: set[str]):
    """Kategori baris diturunkan dari kolom `tipe`; tipe di luar master -> None."""
    if tipe is None or pd.isna(tipe):
        return None
    slug = slug_tipe(tipe)
    return slug if slug in id_kategori else None


def _ke_bool(value) -> bool:
    # MySQL mengubah string 'True' menjadi 0, jadi konversi dilakukan di sini.
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "y", "ya"}
    if value is None or pd.isna(value):
        return False
    return bool(value)


def _bersihkan_nilai(value):
    if value is None:
        return None
    if isinstance(value, str):
        teks = value.strip()
        return teks or None
    if pd.isna(value):
        return None
    return value


def _siapkan(df: pd.DataFrame, path: Path) -> pd.DataFrame:
    """Samakan skema file sumber dengan kolom tabel ruang_publik."""
    id_kategori = set(_baca_kategori()["id"])

    if "tipe" in df.columns:
        df = df.assign(
            kategori_id=[_kategori_id(t, id_kategori) for t in df["tipe"]]
        )

    df = df[[kolom for kolom in df.columns if kolom in KOLOM_RUANG_PUBLIK]]

    if "verified" in df.columns:
        df = df.assign(verified=[_ke_bool(v) for v in df["verified"]])

    masalah: list[str] = []
    for wajib in ("id", "nama"):
        if wajib not in df.columns:
            masalah.append(f"kolom {wajib} tidak ada")
    if masalah:
        raise SystemExit(f"{path.name} tidak layak di-seed: " + "; ".join(masalah))

    if df["id"].isna().any():
        masalah.append(f"{int(df['id'].isna().sum())} baris tanpa id")
    if df["id"].duplicated().any():
        duplikat = df.loc[df["id"].duplicated(), "id"].head(5).tolist()
        masalah.append(f"id duplikat {duplikat}")
    if df["nama"].isna().any():
        masalah.append(f"{int(df['nama'].isna().sum())} baris tanpa nama")
    if masalah:
        raise SystemExit(f"{path.name} tidak layak di-seed: " + "; ".join(masalah))

    if "latitude" in df.columns:
        tanpa_koordinat = int((df["latitude"].isna() | df["longitude"].isna()).sum())
        if tanpa_koordinat:
            # Kolom boleh NULL di tabel; pencarian radius membuang baris ini.
            print(f"peringatan  : {tanpa_koordinat} baris tanpa koordinat")

    tanpa_kategori = int(df["kategori_id"].isna().sum()) if "kategori_id" in df.columns else 0
    if tanpa_kategori:
        print(
            f"peringatan  : {tanpa_kategori} baris tanpa kategori "
            "(tipe tidak ada di master categories) -> kategori_id NULL"
        )
    return df


def _bersihkan_nilai_record(record: dict) -> dict:
    return {k: _bersihkan_nilai(v) for k, v in record.items()}


def seed_categories(db: Session, df: pd.DataFrame) -> int:
    baru = 0
    for row in df.itertuples():
        if db.get(Category, row.id) is None:
            db.add(Category(id=row.id, label=row.label, icon_name=_bersihkan_nilai(row.icon_name)))
            baru += 1
    return baru


def seed_ruang_publik(db: Session, df: pd.DataFrame) -> int:
    ada = set(db.scalars(select(RuangPublik.id)).all())
    baru = 0
    for record in df.to_dict("records"):
        if record["id"] in ada:
            continue
        db.add(RuangPublik(**_bersihkan_nilai_record(record)))
        baru += 1
    return baru


def reset(db: Session) -> None:
    """Kosongkan categories + ruang_publik sebelum diisi ulang.

    Menolak berjalan bila masih ada laporan/fasilitas yang menempel, karena
    baris itu milik data transaksi, bukan milik seed.
    """
    n_laporan = db.query(Laporan).count()
    n_fasilitas = db.query(Fasilitas).count()
    if n_laporan or n_fasilitas:
        raise SystemExit(
            f"--reset menolak: masih ada {n_laporan} laporan dan "
            f"{n_fasilitas} fasilitas yang menempel di ruang_publik. "
            "Hapus/pindahkan dulu sebelum mengganti total data."
        )

    n_rp = db.query(RuangPublik).count()
    n_kat = db.query(Category).count()
    db.query(RuangPublik).delete()
    db.query(Category).delete()
    db.commit()
    print(f"reset       : {n_rp} ruang_publik & {n_kat} categories dihapus")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--file", help="file sumber ruang publik (csv/json); default data terbaru")
    parser.add_argument("--reset", action="store_true", help="kosongkan tabel dulu sebelum seed")
    args = parser.parse_args()

    path_ruang = _cari_file(args.file)
    df_kategori = _baca_kategori()
    df_ruang = _siapkan(_baca_ruang_publik(path_ruang), path_ruang)

    with SessionLocal() as db:
        if args.reset:
            reset(db)
        n_cat = seed_categories(db, df_kategori)
        n_rp = seed_ruang_publik(db, df_ruang)
        db.commit()

        per_kategori = (
            db.query(RuangPublik.kategori_id, func.count(RuangPublik.id))
            .group_by(RuangPublik.kategori_id)
            .all()
        )
        print(f"sumber      : {path_ruang.name} ({len(df_ruang)} baris)")
        print(f"categories  : {n_cat} baru (total {db.query(Category).count()})")
        print(f"ruang_publik: {n_rp} baru (total {db.query(RuangPublik).count()})")
        for kategori, jumlah in sorted(per_kategori, key=lambda x: -(x[1] or 0)):
            print(f"  {kategori or '(tanpa kategori)':20s} {jumlah}")


if __name__ == "__main__":
    main()

"""Isi tabel categories dan ruang_publik dari hasil transform di data/processed."""
from __future__ import annotations

from pathlib import Path

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.category import Category
from app.models.ruang_publik import RuangPublik

PROCESSED_DIR = Path(__file__).resolve().parents[3] / "data" / "processed"

# Kolom CSV yang tidak punya padanan di model RuangPublik.
KOLOM_DILEWATI = {"kecamatan", "kelurahan"}


def _bersihkan_nilai(value):
    # pandas mengubah sel kosong jadi NaN; kolom DB harus NULL, bukan string "nan".
    return None if pd.isna(value) else value


def seed_categories(db: Session, df: pd.DataFrame) -> int:
    baru = 0
    for row in df.itertuples():
        if db.get(Category, row.id) is None:
            db.add(Category(id=row.id, label=row.label, icon_name=_bersihkan_nilai(row.icon_name)))
            baru += 1
    return baru


def seed_ruang_publik(db: Session, df: pd.DataFrame) -> int:
    kolom = [c for c in df.columns if c not in KOLOM_DILEWATI]
    ada = set(db.scalars(select(RuangPublik.id)).all())

    baru = 0
    for record in df[kolom].to_dict("records"):
        if record["id"] in ada:
            continue
        db.add(RuangPublik(**{k: _bersihkan_nilai(v) for k, v in record.items()}))
        baru += 1
    return baru


def main() -> None:
    categories = pd.read_csv(PROCESSED_DIR / "categories.csv")
    ruang_publik = pd.read_csv(PROCESSED_DIR / "ruang_publik.csv")

    with SessionLocal() as db:
        n_cat = seed_categories(db, categories)
        n_rp = seed_ruang_publik(db, ruang_publik)
        db.commit()

        print(f"categories baru: {n_cat} (total {db.query(Category).count()})")
        print(f"ruang_publik baru: {n_rp} (total {db.query(RuangPublik).count()})")


if __name__ == "__main__":
    main()
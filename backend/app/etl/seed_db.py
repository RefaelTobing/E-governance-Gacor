"""Isi tabel categories dan ruang_publik dari hasil transform di data/processed.

Mendukung input CSV (legacy) maupun JSON (output ETL baru).
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.category import Category
from app.models.ruang_publik import RuangPublik

PROCESSED_DIR = Path(__file__).resolve().parents[3] / "data" / "processed"

KOLOM_DILEWATI = {"kecamatan", "kelurahan"}

_csv_categories = PROCESSED_DIR / "categories.csv"
_csv_ruang = PROCESSED_DIR / "ruang_publik.csv"
_json_categories = PROCESSED_DIR / "categories.json"
_json_ruang = PROCESSED_DIR / "ruang_publik.json"

_use_json = _json_categories.exists() and _json_ruang.exists()


def _load_categories():
    if _use_json:
        import json
        return pd.DataFrame(json.load(open(_json_categories, encoding="utf-8")))
    return pd.read_csv(_csv_categories)


def _load_ruang_publik():
    if _use_json:
        import json
        df = pd.DataFrame(json.load(open(_json_ruang, encoding="utf-8")))
    else:
        df = pd.read_csv(_csv_ruang)
    for col in KOLOM_DILEWATI:
        if col in df.columns:
            df.drop(columns=[col], inplace=True)
    return df


def _bersihkan_nilai(value):
    return None if pd.isna(value) else value


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
        db.add(RuangPublik(**{k: _bersihkan_nilai(v) for k, v in record.items()}))
        baru += 1
    return baru


def main() -> None:
    categories_df = _load_categories()
    ruang_df = _load_ruang_publik()
    fmt = "json" if _use_json else "csv"
    with SessionLocal() as db:
        n_cat = seed_categories(db, categories_df)
        n_rp = seed_ruang_publik(db, ruang_df)
        db.commit()
        print(f"format       : {fmt}")
        print(f"categories   : {n_cat} baru (total {db.query(Category).count()})")
        print(f"ruang_publik : {n_rp} baru (total {db.query(RuangPublik).count()})")


if __name__ == "__main__":
    main()
"""Baca dataset mentah dari data/raw sebagai titik awal tahap ETL."""
from __future__ import annotations

from pathlib import Path

import pandas as pd

RAW_DIR = Path(__file__).resolve().parents[3] / "data" / "raw"


def _clean(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = df.columns.str.strip()
    text_cols = df.select_dtypes(include=["object", "string"]).columns
    df[text_cols] = df[text_cols].apply(lambda col: col.str.strip())
    return df


def list_raw_files(raw_dir: Path = RAW_DIR) -> list[Path]:
    return sorted(p for p in raw_dir.iterdir() if p.suffix.lower() in {".csv", ".xls", ".xlsx"})


def read_raw_csv(path: Path) -> pd.DataFrame:
    # Ekspor Satu Data Jakarta memakai UTF-8 BOM dan padding spasi di nilai teks.
    return _clean(pd.read_csv(path, encoding="utf-8-sig"))


def read_raw_xls(path: Path) -> pd.DataFrame:
    # File .xls dari Satu Data Jakarta sebenarnya HTML <table>, bukan Excel biner,
    # jadi dibaca lewat read_html. Tiap file berisi satu tabel.
    tables = pd.read_html(path)
    if len(tables) != 1:
        raise ValueError(f"{path.name}: diharapkan 1 tabel, ditemukan {len(tables)}")
    return _clean(tables[0])


def read_raw_file(path: Path) -> pd.DataFrame:
    if path.suffix.lower() == ".csv":
        return read_raw_csv(path)
    return read_raw_xls(path)


def load_all_raw(raw_dir: Path = RAW_DIR) -> dict[str, pd.DataFrame]:
    return {path.stem: read_raw_file(path) for path in list_raw_files(raw_dir)}


def main() -> None:
    for name, df in load_all_raw().items():
        print(f"\n{name} ({df.shape[0]} baris x {df.shape[1]} kolom)")
        print(f"kolom: {', '.join(df.columns)}")
        print(df.head().to_string(index=False))


if __name__ == "__main__":
    main()
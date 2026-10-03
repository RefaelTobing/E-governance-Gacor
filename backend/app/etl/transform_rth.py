"""Transform dataset RTH mentah menjadi tabel siap-insert (categories, ruang_publik).

Sumber (.xls berisi HTML) tidak punya kolom tipe, jadi satu-satunya tipe yang
bisa diturunkan adalah RPTRA (dari nama). Baris lain keluar tanpa kategori.
Master kategori tetap 4 tipe di app/etl/kategori.py.
"""
from __future__ import annotations

import hashlib
from pathlib import Path

import pandas as pd

from .kategori import KATEGORI_TIPE, kategori_id_dari_tipe
from .read_raw import RAW_DIR, read_raw_file

PROCESSED_DIR = RAW_DIR.parent / "processed"
RTH_FILE = RAW_DIR / "data-ruang-terbuka-hijau-(rth)-komponen-data.xls"

# TPU bukan ruang publik untuk rekreasi, jadi tidak masuk direktori.
JENIS_DIKECUALIKAN = {"TPU"}

WILAYAH_PREFIX = "KOTA ADM. "

# Kolom yang belum tersedia di sumber mana pun; diisi kosong sampai ada penggantinya.
KOLOM_KOSONG = [
    "latitude",
    "longitude",
    "deskripsi",
    "jam_operasional",
    "tiket_masuk",
    "akses_disabilitas",
    "ramah_hewan",
    "status_general",
    "image_url",
]


def _normalize_wilayah(value: str) -> str:
    # Sumber menulis "KOTA ADM. JAKARTA SELATAN"; UI memakai "Jakarta Selatan".
    return value.removeprefix(WILAYAH_PREFIX).title()


def _stable_id(nama: str, kecamatan: str, kelurahan: str) -> str:
    # ID diturunkan dari natural key, bukan urutan baris, supaya tidak berubah
    # saat ETL dijalankan ulang (FEAT-012: edit manual harus bertahan).
    key = "|".join([nama, kecamatan, kelurahan]).upper()
    return "rth-" + hashlib.sha1(key.encode()).hexdigest()[:12]


def _tipe_dari_nama(nama: str) -> str | None:
    # Satu-satunya tipe yang bisa dikenali dari sumber ini (lihat docstring).
    return "RPTRA" if str(nama).upper().startswith("RPTRA") else None


def build_categories() -> pd.DataFrame:
    return pd.DataFrame(KATEGORI_TIPE)


def build_ruang_publik(df: pd.DataFrame) -> pd.DataFrame:
    df = df.fillna("")
    tipe = df["nama_rth"].map(_tipe_dari_nama)
    out = pd.DataFrame(
        {
            "id": [
                _stable_id(r.nama_rth, r.kecamatan, r.kelurahan)
                for r in df.itertuples()
            ],
            "nama": df["nama_rth"],
            "kategori_id": tipe.map(kategori_id_dari_tipe),
            "tipe": tipe,
            "wilayah": df["wilayah"].map(_normalize_wilayah),
            "alamat": df["alamat_rth"],
            "verified": False,
            "kecamatan": df["kecamatan"],
            "kelurahan": df["kelurahan"],
        }
    )
    for kolom in KOLOM_KOSONG:
        out[kolom] = None

    urutan = [
        "id", "nama", "kategori_id", "tipe", "wilayah", "alamat",
        "latitude", "longitude", "deskripsi", "jam_operasional",
        "tiket_masuk", "akses_disabilitas", "ramah_hewan",
        "verified", "status_general", "image_url",
        "kecamatan", "kelurahan",
    ]
    return out[urutan]


def transform(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    df = df[~df["jenis_rth"].isin(JENIS_DIKECUALIKAN)]
    return build_categories(), build_ruang_publik(df)


def main() -> None:
    df = read_raw_file(RTH_FILE)
    categories, ruang_publik = transform(df)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    categories.to_csv(PROCESSED_DIR / "categories.csv", index=False)
    ruang_publik.to_csv(PROCESSED_DIR / "ruang_publik_mentah.csv", index=False)

    print(f"categories: {len(categories)} baris")
    print(categories.to_string(index=False))
    print(f"\nruang_publik: {len(ruang_publik)} baris")
    print(f"id unik: {ruang_publik['id'].nunique()}")
    print(f"tipe: {ruang_publik['tipe'].value_counts(dropna=False).to_dict()}")
    print(f"periode_data sumber: {sorted(df['periode_data'].unique())}")
    print(f"\noutput: {PROCESSED_DIR / 'ruang_publik_mentah.csv'} (data mentah)")
    print("catatan: seed memakai ruang_publik.csv (data hasil pembersihan).")


if __name__ == "__main__":
    main()
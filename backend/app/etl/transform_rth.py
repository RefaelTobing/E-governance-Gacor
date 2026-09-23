"""Transform dataset RTH mentah menjadi tabel siap-insert (categories, ruang_publik)."""
from __future__ import annotations

import hashlib
from pathlib import Path

import pandas as pd

from .read_raw import RAW_DIR, read_raw_file

PROCESSED_DIR = RAW_DIR.parent / "processed"
RTH_FILE = RAW_DIR / "data-ruang-terbuka-hijau-(rth)-komponen-data.xls"

# jenis_rth di sumber -> (id kategori, label)
JENIS_TO_KATEGORI = {
    "TAMAN": ("taman", "Taman"),
    "JALUR HIJAU": ("jalur-hijau", "Jalur Hijau"),
    "HUTAN": ("hutan", "Hutan"),
    "KEBUN BIBIT": ("kebun-bibit", "Kebun Bibit"),
    "TAMAN MARGASATWA": ("taman-margasatwa", "Taman Margasatwa"),
}

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


def build_categories(df: pd.DataFrame) -> pd.DataFrame:
    jenis_dipakai = sorted(df["jenis_rth"].unique())
    tak_dikenal = [j for j in jenis_dipakai if j not in JENIS_TO_KATEGORI]
    if tak_dikenal:
        raise ValueError(f"jenis_rth belum dipetakan: {tak_dikenal}")

    rows = [
        {"id": JENIS_TO_KATEGORI[j][0], "label": JENIS_TO_KATEGORI[j][1], "icon_name": None}
        for j in jenis_dipakai
    ]
    return pd.DataFrame(rows)


def build_ruang_publik(df: pd.DataFrame) -> pd.DataFrame:
    df = df.fillna("")
    out = pd.DataFrame(
        {
            "id": [
                _stable_id(r.nama_rth, r.kecamatan, r.kelurahan)
                for r in df.itertuples()
            ],
            "nama": df["nama_rth"],
            "kategori_id": df["jenis_rth"].map(lambda j: JENIS_TO_KATEGORI[j][0]),
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
        "id", "nama", "kategori_id", "wilayah", "alamat",
        "latitude", "longitude", "deskripsi", "jam_operasional",
        "tiket_masuk", "akses_disabilitas", "ramah_hewan",
        "verified", "status_general", "image_url",
        "kecamatan", "kelurahan",
    ]
    return out[urutan]


def transform(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    df = df[~df["jenis_rth"].isin(JENIS_DIKECUALIKAN)]
    return build_categories(df), build_ruang_publik(df)


def main() -> None:
    df = read_raw_file(RTH_FILE)
    categories, ruang_publik = transform(df)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    categories.to_csv(PROCESSED_DIR / "categories.csv", index=False)
    ruang_publik.to_csv(PROCESSED_DIR / "ruang_publik.csv", index=False)

    print(f"categories: {len(categories)} baris")
    print(categories.to_string(index=False))
    print(f"\nruang_publik: {len(ruang_publik)} baris")
    print(f"id unik: {ruang_publik['id'].nunique()}")
    print(f"periode_data sumber: {sorted(df['periode_data'].unique())}")
    print(f"\noutput: {PROCESSED_DIR}")


if __name__ == "__main__":
    main()
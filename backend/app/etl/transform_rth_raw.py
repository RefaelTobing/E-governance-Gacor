"""Transform data raw rth_dki_coordinates.csv -> categories.json + ruang_publik_mentah.json.

Kategori mengikuti 4 tipe data terbaru (lihat app/etl/kategori.py):
    nama diawali "RPTRA"     -> RPTRA
    JENIS_OBJEK Taman Lingkungan / Taman Interaktif / Taman Kota -> tipe itu sendiri
    selain itu               -> tanpa tipe, kategori_id NULL

Hasilnya file mentah `ruang_publik_mentah.json`:
id yang dihitung dari file raw tidak sama dengan id data hasil pembersihan,
jadi file ini bukan bahan seed. Sumber seed tetap `ruang_publik.csv`.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Optional

import pandas as pd

from app.etl.kategori import KATEGORI_TIPE, kategori_id_dari_tipe

ROOT = Path(__file__).resolve().parents[3]
RAW_FILE = ROOT / "data" / "raw" / "rth_dki_coordinates.csv"
PROCESSED_DIR = ROOT / "data" / "processed"

# JENIS_OBJEK yang nilainya persis sama dengan salah satu tipe di master kategori.
JENIS_YANG_JADI_TIPE = ("Taman Lingkungan", "Taman Interaktif", "Taman Kota")

KOTA_PREFIX = "Kota Adm. "
KAB_PREFIX = "Kab. Adm. "


def _normalize_wilayah(value: str) -> Optional[str]:
    if not isinstance(value, str) or not value.strip():
        return None
    v = value.strip()
    if v.startswith(KOTA_PREFIX):
        return v.removeprefix(KOTA_PREFIX).title()
    if v.startswith(KAB_PREFIX):
        return v.removeprefix(KAB_PREFIX).title()
    return v.title()


def _stable_id(nama: str, kecamatan: str, kelurahan: str) -> str:
    key = "|".join([nama or "", kecamatan or "", kelurahan or ""]).upper()
    return "rth-" + hashlib.sha1(key.encode()).hexdigest()[:12]


def _clean(value) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, float) and pd.isna(value):
        return None
    s = str(value).strip()
    if not s or s.lower() in {"<null>", "null", "nan", "none"}:
        return None
    return s


def _tipe_dari(nama: str, jenis: Optional[str]) -> Optional[str]:
    if nama.upper().startswith("RPTRA"):
        return "RPTRA"
    if jenis in JENIS_YANG_JADI_TIPE:
        return jenis
    return None


def build_categories() -> list[dict]:
    return [dict(kategori) for kategori in KATEGORI_TIPE]


def build_ruang_publik(df: pd.DataFrame) -> list[dict]:
    rows = []
    for r in df.to_dict(orient="records"):
        nama = _clean(r.get("NAMA_OBJEK"))
        if not nama:
            continue
        kecamatan = _clean(r.get("KECAMATAN"))
        kelurahan = _clean(r.get("KELURAHAN"))
        jenis = _clean(r.get("JENIS_OBJEK"))
        tipe = _tipe_dari(nama, jenis)
        kategori_id = kategori_id_dari_tipe(tipe)
        verif = _clean(r.get("VERIFIKASI"))
        try:
            lat = float(r["Y"]) if pd.notna(r["Y"]) else None
        except (TypeError, ValueError):
            lat = None
        try:
            lng = float(r["X"]) if pd.notna(r["X"]) else None
        except (TypeError, ValueError):
            lng = None
        rows.append(
            {
                "id": _stable_id(nama, kecamatan or "", kelurahan or ""),
                "nama": nama,
                "kategori_id": kategori_id,
                "tipe": tipe,
                "wilayah": _normalize_wilayah(r.get("KOTA")),
                "alamat": _clean(r.get("ALAMAT_OBJEK")),
                "latitude": lat,
                "longitude": lng,
                "deskripsi": None,
                "jam_operasional": None,
                "tiket_masuk": None,
                "akses_disabilitas": None,
                "ramah_hewan": None,
                "verified": (verif == "Y"),
                "status_general": None,
                "image_url": None,
                "kecamatan": kecamatan,
                "kelurahan": kelurahan,
            }
        )
    return rows


def main() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(RAW_FILE)

    categories = build_categories()
    ruang_publik = build_ruang_publik(df)

    with open(PROCESSED_DIR / "categories.json", "w", encoding="utf-8") as f:
        json.dump(categories, f, ensure_ascii=False, indent=2)
    with open(PROCESSED_DIR / "ruang_publik_mentah.json", "w", encoding="utf-8") as f:
        json.dump(ruang_publik, f, ensure_ascii=False, indent=2)

    total = len(ruang_publik)
    with_koord = sum(1 for r in ruang_publik if r["latitude"] and r["longitude"])
    by_tipe: dict[str, int] = {}
    by_wilayah: dict[str, int] = {}
    for r in ruang_publik:
        t = r["tipe"] or "(tanpa tipe)"
        by_tipe[t] = by_tipe.get(t, 0) + 1
        w = r["wilayah"] or "(null)"
        by_wilayah[w] = by_wilayah.get(w, 0) + 1

    print(f"total ruang_publik: {total}")
    print(f"dengan koordinat  : {with_koord}")
    print(f"output            : {PROCESSED_DIR / 'ruang_publik_mentah.json'} (data mentah)")
    print("catatan          : seed memakai ruang_publik.csv (data hasil pembersihan),")
    print("                   bukan file ini, supaya id kembar tidak masuk tabel.")
    print("\nDistribusi tipe:")
    for t, v in sorted(by_tipe.items(), key=lambda x: -x[1]):
        print(f"  {t:24s} {v}")
    print("\nDistribusi wilayah:")
    for k, v in sorted(by_wilayah.items(), key=lambda x: -x[1]):
        print(f"  {k:30s} {v}")


if __name__ == "__main__":
    main()

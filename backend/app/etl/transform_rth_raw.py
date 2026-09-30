"""Transform data raw rth_dki_coordinates.csv -> categories.json + ruang_publik.json.

Pemetaan JENIS_OBJEK mengikuti data processed (ruang_publik.csv):
    RTH          -> taman
    Jalur Hijau  -> jalur-hijau
    Hutan        -> hutan
    Kebun Bibit  -> kebun-bibit
    Taman Kota   -> taman
    Taman Margasatwa -> taman-margasatwa
    Belum Diketahui -> null
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Optional

import pandas as pd

ROOT = Path(__file__).resolve().parents[3]
RAW_FILE = ROOT / "data" / "raw" / "rth_dki_coordinates.csv"
PROCESSED_DIR = ROOT / "data" / "processed"

JENIS_TO_KATEGORI = {
    "RTH": "taman",
    "Taman Kota": "taman",
    "Jalur Hijau": "jalur-hijau",
    "Hutan": "hutan",
    "Kebun Bibit": "kebun-bibit",
    "Taman Margasatwa": "taman-margasatwa",
}

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


def build_categories(df: pd.DataFrame) -> list[dict]:
    used = set()
    for j in df["JENIS_OBJEK"]:
        v = _clean(j)
        if v and v in JENIS_TO_KATEGORI:
            used.add(JENIS_TO_KATEGORI[v])
    return [
        {"id": "hutan", "label": "Hutan", "icon_name": "TreePine"},
        {"id": "jalur-hijau", "label": "Jalur Hijau", "icon_name": "Route"},
        {"id": "kebun-bibit", "label": "Kebun Bibit", "icon_name": "Sprout"},
        {"id": "taman", "label": "Taman", "icon_name": "Trees"},
        {"id": "taman-margasatwa", "label": "Taman Margasatwa", "icon_name": "PawPrint"},
    ]


def build_ruang_publik(df: pd.DataFrame) -> list[dict]:
    rows = []
    for r in df.to_dict(orient="records"):
        nama = _clean(r.get("NAMA_OBJEK"))
        if not nama:
            continue
        kecamatan = _clean(r.get("KECAMATAN"))
        kelurahan = _clean(r.get("KELURAHAN"))
        jenis = _clean(r.get("JENIS_OBJEK"))
        kategori_id = JENIS_TO_KATEGORI.get(jenis) if jenis else None
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

    categories = build_categories(df)
    ruang_publik = build_ruang_publik(df)

    with open(PROCESSED_DIR / "categories.json", "w", encoding="utf-8") as f:
        json.dump(categories, f, ensure_ascii=False, indent=2)
    with open(PROCESSED_DIR / "ruang_publik.json", "w", encoding="utf-8") as f:
        json.dump(ruang_publik, f, ensure_ascii=False, indent=2)

    total = len(ruang_publik)
    with_koord = sum(1 for r in ruang_publik if r["latitude"] and r["longitude"])
    by_kategori: dict[str, int] = {}
    by_wilayah: dict[str, int] = {}
    for r in ruang_publik:
        k = r["kategori_id"] or "(null)"
        by_kategori[k] = by_kategori.get(k, 0) + 1
        w = r["wilayah"] or "(null)"
        by_wilayah[w] = by_wilayah.get(w, 0) + 1

    print(f"total ruang_publik: {total}")
    print(f"dengan koordinat  : {with_koord}")
    print(f"output            : {PROCESSED_DIR}")
    print("\nDistribusi kategori:")
    for k, v in sorted(by_kategori.items(), key=lambda x: -x[1]):
        print(f"  {k:20s} {v}")
    print("\nDistribusi wilayah:")
    for k, v in sorted(by_wilayah.items(), key=lambda x: -x[1]):
        print(f"  {k:30s} {v}")


if __name__ == "__main__":
    main()

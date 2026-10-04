"""Kunci pencocokan baris ruang publik: file sumber vs tabel database.

Dipakai transform (BE-15) dan seed/load (BE-16) supaya nama, kecamatan, dan
kelurahan dinormalisasi dengan cara yang sama di kedua tahap. Kunci yang
berbeda antar tahap membuat baris yang sama dianggap dua tempat berbeda,
lalu masuk dua kali sebagai data baru.
"""
from __future__ import annotations

import re

import pandas as pd


def teks(value) -> str:
    if value is None or (isinstance(value, str) and not value.strip()):
        return ""
    try:
        if pd.isna(value):
            return ""
    except (TypeError, ValueError):
        pass
    return re.sub(r"\s+", " ", str(value)).strip()


def kunci_alami(nama, kecamatan, kelurahan) -> str:
    return "|".join(teks(v).upper() for v in (nama, kecamatan, kelurahan))


def kunci_nama(nama) -> str:
    return teks(nama).upper()

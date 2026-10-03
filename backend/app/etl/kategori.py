"""Master kategori ruang publik: 4 tipe hasil pembersihan data.

Sumber daftar kategori untuk seluruh tahap ETL. Hasil tulisnya ada di
`data/processed/categories.json` (+ `.csv`) yang dibaca `seed_db`, jadi
tambah kategori = tambah baris di sini lalu tulis ulang file tersebut.
"""
from __future__ import annotations

import re

KATEGORI_TIPE: list[dict] = [
    {"id": "taman-lingkungan", "label": "Taman Lingkungan", "icon_name": "Trees"},
    {"id": "rptra", "label": "RPTRA", "icon_name": "Footprints"},
    {"id": "taman-interaktif", "label": "Taman Interaktif", "icon_name": "Dumbbell"},
    {"id": "taman-kota", "label": "Taman Kota", "icon_name": "Leaf"},
]

# nama tipe di sumber -> id kategori (dihitung sekali, jangan ditulis tangan)
TIPE_KE_ID = {k["label"].lower(): k["id"] for k in KATEGORI_TIPE}


def slug_tipe(tipe: str) -> str:
    """Taman Lingkungan -> taman-lingkungan."""
    return re.sub(r"[^a-z0-9]+", "-", str(tipe).lower()).strip("-")


def kategori_id_dari_tipe(tipe: str | None) -> str | None:
    """Petakan nilai kolom `tipe` ke id kategori.

    Mengembalikan None untuk tipe yang tidak ada di master, supaya baris tetap
    bisa di-seed tanpa melanggar foreign key (kategori memang nullable).
    """
    if tipe is None:
        return None
    teks = str(tipe).strip()
    if not teks:
        return None
    return TIPE_KE_ID.get(teks.lower())

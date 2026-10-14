"""Bangun `data/Images/images_index.csv`: peta ruang publik -> daftar berkas foto.

Hasil scraping foto ada di `data/Images/images/` dengan nama `<id>_<n>.jpg`.
`images_manifest.csv` adalah daftar tiap berkas beserta id pemiliknya;
`output.csv` memuat nama + `image_status` tiap id. Skrip ini menggabungkan
keduanya, memvalidasi berkasnya benar-benar ada di disk dan id-nya ada di
master `ruang_publik.csv`, lalu menulis satu indeks datar yang dipakai
`import_photos.py`.

    python -m app.etl.build_images_index

Keluaran: `data/Images/images_index.csv` (satu baris per berkas foto).
Berkas yang tidak ada di disk atau id yang tidak dikenal di DB dilewati dan
dilaporkan di baris ringkasan, bukan digagalkan seluruhnya.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[3]
IMAGES_DIR = ROOT / "data" / "Images"
FOTO_DIR = IMAGES_DIR / "images"
MANIFEST = IMAGES_DIR / "images_manifest.csv"
OUTPUT = IMAGES_DIR / "output.csv"
MASTER = ROOT / "data" / "processed" / "ruang_publik.csv"
INDEKS = IMAGES_DIR / "images_index.csv"

KOLOM = ["ruang_publik_id", "nama", "image_status", "urutan", "file", "ada_di_db"]


def _urutan(nama_file: str) -> int:
    """Ambil angka urutan dari `<id>_<n>.jpg`; 0 bila tidak berpola (agar tetap terurut)."""
    stem = Path(nama_file).stem
    ekor = stem.rsplit("_", 1)[-1]
    return int(ekor) if ekor.isdigit() else 0


def _baca() -> tuple[pd.DataFrame, pd.DataFrame, set[str]]:
    manifest = pd.read_csv(MANIFEST, encoding="utf-8-sig")
    output = pd.read_csv(OUTPUT, encoding="utf-8-sig")
    master = pd.read_csv(MASTER, encoding="utf-8-sig")
    return manifest, output, set(master["id"].astype(str))


def build_index() -> pd.DataFrame:
    manifest, output, id_master = _baca()

    # Nama + status per id; id unik di output.csv (hasil verifikasi data).
    info = (
        output[["id", "nama", "image_status"]]
        .drop_duplicates(subset="id")
        .set_index("id")
    )

    baris: list[dict] = []
    dilewati = {"file_hilang": 0, "id_tak_dikenal": 0}
    for rec in manifest.to_dict("records"):
        rp_id = str(rec["id"]).strip()
        nama_file = str(rec["file"]).strip()
        if not (FOTO_DIR / nama_file).is_file():
            dilewati["file_hilang"] += 1
            continue
        if rp_id not in id_master:
            dilewati["id_tak_dikenal"] += 1
            continue
        meta = info.loc[rp_id] if rp_id in info.index else None
        baris.append({
            "ruang_publik_id": rp_id,
            "nama": (meta["nama"] if meta is not None else None),
            "image_status": (meta["image_status"] if meta is not None else None),
            # Path relatif terhadap data/Images/, dipakai import_photos.py.
            "file": f"images/{nama_file}",
        })

    if not baris:
        raise SystemExit("tidak ada berkas foto yang cocok dengan master ruang_publik")

    df = pd.DataFrame(baris)
    df = df.sort_values(["ruang_publik_id", "file"]).reset_index(drop=True)
    # Urutan 1..n per ruang publik, agar print/urutan galeri konsisten.
    df["urutan"] = df.groupby("ruang_publik_id").cumcount() + 1
    df["ada_di_db"] = True

    print(f"manifest    : {len(manifest)} berkas, {manifest['id'].nunique()} id")
    print(f"indeks      : {len(df)} berkas, {df['ruang_publik_id'].nunique()} id")
    print(f"per status  : {df['image_status'].value_counts(dropna=False).to_dict()}")
    if dilewati["file_hilang"]:
        print(f"dilewati    : {dilewati['file_hilang']} berkas tidak ada di disk")
    if dilewati["id_tak_dikenal"]:
        print(f"dilewati    : {dilewati['id_tak_dikenal']} berkas dengan id di luar master")
    return df[KOLOM]


def main() -> None:
    for path in (MANIFEST, OUTPUT, MASTER):
        if not path.exists():
            raise SystemExit(f"tidak ditemukan: {path}")

    df = build_index()
    INDEKS.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(INDEKS, index=False, encoding="utf-8")
    print(f"keluaran    : {INDEKS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

"""Migrasi foto galeri ruang publik dari JPEG ke WebP di Supabase Storage.

Untuk tiap baris `ruang_publik_foto` yang URL-nya berakhiran `.jpg`, skrip
mengunduh berkasnya dari bucket, mengonversi ke WebP (Pillow), mengunggah
`<uuid>.webp`, lalu memperbarui `foto_url` di database. Urutannya sengaja
begitu: baris DB baru diubah **setelah** unggahan WebP sukses, jadi URL lama
tidak pernah menunjuk berkas yang belum ada.

    python -m app.etl.convert_photos_webp --dry-run
    python -m app.etl.convert_photos_webp
    python -m app.etl.convert_photos_webp --resume
    python -m app.etl.convert_photos_webp --cleanup

`--dry-run` hanya menghitung total byte lama vs proyeksi WebP tanpa menulis
apa pun. `--cleanup` (dijalankan terpisah setelah semua baris jadi `.webp`)
menghapus berkas `.jpg` lama dari bucket.

Log per baris ditulis ke `data/Images/convert_webp_log.csv` dan dipakai oleh
`--resume` agar cukup menambal yang belum sukses saat proses terputus.
"""
from __future__ import annotations

import argparse
import csv
import io
import os
import sys
from pathlib import Path

import psycopg
from PIL import Image

from app.core.config import settings
from app.core.file_upload import get_supabase

ROOT = Path(__file__).resolve().parents[3]
LOG = ROOT / "data" / "Images" / "convert_webp_log.csv"

LOG_KOLOM = ["id", "foto_url_lama", "foto_url_baru", "status", "byte_lama", "byte_baru", "pesan"]

# Sumber foto sudah JPEG q78 (600 px), jadi q80 hampir tak menghemat. q75
# menekan ~20% ukuran tanpa penurunan yang terlihat pada foto 600 px.
WEBP_QUALITY = 75
WEBP_METHOD = 6

# Koneksi polos psycopg (bukan SQLAlchemy) supaya skrip ini tak bergantung ORM;
# DATABASE_URL memakai skema SQLAlchemy `postgresql+psycopg://`, dibersihkan dulu.
def _dsn() -> str:
    return settings.DATABASE_URL.replace("postgresql+psycopg://", "postgresql://")


def _koneksi() -> psycopg.Connection:
    """Pooler Supabase (PgBouncer, transaction mode) tak mendukung prepared
    statement lintas transaksi: matikan via `prepare_threshold=None`, sama
    seperti `app/core/database.py`."""
    return psycopg.connect(_dsn(), prepare_threshold=None)


def _baca_log() -> dict[str, dict]:
    if not LOG.exists():
        return {}
    with open(LOG, encoding="utf-8-sig", newline="") as fh:
        return {r["id"]: r for r in csv.DictReader(fh)}


def _tulis_log(baris: list[dict]) -> None:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG, "w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=LOG_KOLOM)
        writer.writeheader()
        writer.writerows(baris)


def _ambil_baris(db: psycopg.Connection) -> list[tuple[str, str]]:
    with db.cursor() as cur:
        cur.execute(
            "SELECT id, foto_url FROM ruang_publik_foto "
            "WHERE foto_url ILIKE '%.jpg' OR foto_url ILIKE '%.jpeg' "
            "ORDER BY created_at, id"
        )
        return cur.fetchall()


def _kunci_dari_url(foto_url: str) -> str:
    """Ambil nama berkas (uuid + ekstensi) dari public URL Supabase."""
    return foto_url.rsplit("/", 1)[-1]


def _url_webp(foto_url: str) -> tuple[str, str]:
    """Kembalikan (url_lama_tanpa_basis, url_baru) dengan ekstensi ditukar ke .webp."""
    dasar, _, nama = foto_url.rpartition("/")
    basis = nama.rsplit(".", 1)[0]
    return nama, f"{dasar}/{basis}.webp"


def _konversi(data: bytes) -> bytes:
    with Image.open(io.BytesIO(data)) as img:
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="WEBP", quality=WEBP_QUALITY, method=WEBP_METHOD)
        return buf.getvalue()


def _update_url(db: psycopg.Connection, row_id: str, url_baru: str) -> None:
    try:
        with db.cursor() as cur:
            cur.execute("UPDATE ruang_publik_foto SET foto_url = %s WHERE id = %s", (url_baru, row_id))
        db.commit()
    except Exception:
        db.rollback()
        raise


def _list_bucket(supabase, bucket: str) -> list[str]:
    """Daftar seluruh nama berkas di bucket (list() berpaginasi 1000 per panggilan)."""
    nama: list[str] = []
    offset = 0
    while True:
        batch = supabase.storage.from_(bucket).list(options={"limit": 1000, "offset": offset})
        if not batch:
            break
        nama += [f["name"] for f in batch]
        offset += 1000
        if len(batch) < 1000:
            break
    return nama


def _cleanup(db: psycopg.Connection, bucket: str, supabase) -> None:
    """Hapus berkas `.jpg` lama yang sudah punya padanan `.webp` di bucket.

    Daftar diambil dari listing bucket (bukan log) agar tak bergantung kelengkapan
    log. Berkas `.jpg` tanpa padanan `.webp` dilaporkan, bukan dihapus.
    """
    nama = _list_bucket(supabase, bucket)
    webp_stem = {n.rsplit(".", 1)[0] for n in nama if n.lower().endswith(".webp")}
    jpg = [n for n in nama if n.lower().endswith((".jpg", ".jpeg"))]
    siap = [n for n in jpg if n.rsplit(".", 1)[0] in webp_stem]
    yatim = [n for n in jpg if n.rsplit(".", 1)[0] not in webp_stem]

    if not siap:
        print("cleanup     : tidak ada berkas .jpg dengan padanan .webp")
    else:
        for i in range(0, len(siap), 100):
            batch = siap[i : i + 100]
            supabase.storage.from_(bucket).remove(batch)
            print(f"  hapus {min(i + 100, len(siap))}/{len(siap)} …")
        print(f"cleanup     : {len(siap)} berkas .jpg dihapus dari bucket '{bucket}'")
    if yatim:
        print(f"perhatian   : {len(yatim)} berkas .jpg tanpa padanan .webp dibiarkan (tidak dirujuk DB?)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="hitung estimasi tanpa menulis apa pun")
    parser.add_argument("--resume", action="store_true", help="lewati baris yang sudah sukses di log")
    parser.add_argument("--limit", type=int, default=0, help="batasi jumlah baris (0 = semua)")
    parser.add_argument("--cleanup", action="store_true", help="hapus berkas .jpg lama dari bucket (tanpa konversi)")
    args = parser.parse_args()

    if not settings.SUPABASE_URL:
        raise SystemExit("SUPABASE_URL kosong: skrip ini hanya untuk mode Supabase Storage")

    bucket = settings.SUPABASE_STORAGE_BUCKET_RUANG_PUBLIK
    supabase = get_supabase()

    with _koneksi() as db:
        if args.cleanup:
            _cleanup(db, bucket, supabase)
            return

        baris = _ambil_baris(db)
        if args.limit:
            baris = baris[: args.limit]
        log_sebelum = _baca_log() if args.resume else {}
        print(f"target      : {len(baris)} baris .jpg di bucket '{bucket}'")

        log_baru: list[dict] = []
        hitung = {"sukses": 0, "gagal": 0, "dilewati": 0}
        total_lama = 0
        total_baru = 0

        for i, (row_id, foto_url_lama) in enumerate(baris, start=1):
            kunci_lama, url_baru = _url_webp(foto_url_lama)

            if args.resume and log_sebelum.get(row_id, {}).get("status") == "sukses":
                hitung["dilewati"] += 1
                log_baru.append({
                    "id": row_id, "foto_url_lama": foto_url_lama, "foto_url_baru": url_baru,
                    "status": "dilewati", "byte_lama": "", "byte_baru": "", "pesan": "sudah sukses",
                })
                continue

            try:
                raw = supabase.storage.from_(bucket).download(kunci_lama)
                webp = _konversi(raw)
            except Exception as exc:  # noqa: BLE001 - laporkan apa pun per baris
                hitung["gagal"] += 1
                log_baru.append({
                    "id": row_id, "foto_url_lama": foto_url_lama, "foto_url_baru": "",
                    "status": "gagal", "byte_lama": "", "byte_baru": "", "pesan": str(exc)[:200],
                })
                print(f"  gagal   : {kunci_lama} -> {exc}")
                continue

            total_lama += len(raw)
            total_baru += len(webp)

            if args.dry_run:
                hitung["sukses"] += 1
                log_baru.append({
                    "id": row_id, "foto_url_lama": foto_url_lama, "foto_url_baru": url_baru,
                    "status": "dry-run", "byte_lama": len(raw), "byte_baru": len(webp), "pesan": "",
                })
                if i % 200 == 0:
                    print(f"  {i}/{len(baris)} … hemat {100 * (1 - total_baru / total_lama):.1f}%")
                continue

            try:
                supabase.storage.from_(bucket).upload(
                    path=_kunci_dari_url(url_baru),
                    file=webp,
                    file_options={"content-type": "image/webp", "upsert": "true"},
                )
                _update_url(db, row_id, url_baru)
            except Exception as exc:  # noqa: BLE001
                hitung["gagal"] += 1
                log_baru.append({
                    "id": row_id, "foto_url_lama": foto_url_lama, "foto_url_baru": "",
                    "status": "gagal", "byte_lama": len(raw), "byte_baru": len(webp), "pesan": str(exc)[:200],
                })
                print(f"  gagal   : {kunci_lama} -> {exc}")
                continue

            hitung["sukses"] += 1
            log_baru.append({
                "id": row_id, "foto_url_lama": foto_url_lama, "foto_url_baru": url_baru,
                "status": "sukses", "byte_lama": len(raw), "byte_baru": len(webp), "pesan": "",
            })
            if i % 50 == 0:
                _tulis_log(log_baru)
                print(f"  {i}/{len(baris)} … sukses {hitung['sukses']}, gagal {hitung['gagal']}")

        _tulis_log(log_baru)

    mode = "dry-run" if args.dry_run else "migrasi"
    print(f"{mode}     : {hitung['sukses']} sukses, {hitung['gagal']} gagal, {hitung['dilewati']} dilewati")
    if total_lama:
        hemat = 100 * (1 - total_baru / total_lama)
        print(
            f"ukuran      : {total_lama / 1024 / 1024:.1f} MB -> {total_baru / 1024 / 1024:.1f} MB "
            f"(hemat {hemat:.1f}%)"
        )
    if not args.dry_run:
        print(f"log         : {LOG.relative_to(ROOT)}")
    if hitung["gagal"]:
        sys.exit(1)


if __name__ == "__main__":
    main()

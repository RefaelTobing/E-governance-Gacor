"""Impor foto hasil scraping ke galeri ruang publik lewat endpoint admin.

Membaca `data/Images/images_index.csv` (hasil `build_images_index`), login
sebagai admin, lalu memanggil `POST /api/v1/admin/public-spaces/{id}/photos`
satu berkas per request. Backend yang memindahkan berkas ke `storage/ruang-publik/`
sehingga tidak ada penyalinan ganda di sisi klien.

    python -m app.etl.import_photos --email admin@contoh.id --password sandi
    python -m app.etl.import_photos --email ... --password ... --limit 2
    python -m app.etl.import_photos --email ... --password ... --skip-existing --resume
    python -m app.etl.import_photos --email ... --password ... --workers 8

Sandi lebih aman lewat env `RUKA_ADMIN_EMAIL` / `RUKA_ADMIN_PASSWORD` daripada
argumen baris perintah (argumen tersimpan di riwayat shell).

`--workers` menjalankan beberapa unggahan paralel (ThreadPoolExecutor). Server
dev bisa ~1-2 detik per request, jadi 2605 berkas sekuensial sangat lama; naikkan
worker bila server sanggup. Jangan setel terlalu tinggi agar tidak membanjiri
database.

Log per berkas ditulis ke `data/Images/import_photos_log.csv` (disegarkan tiap
`--flush-every` unggahan), dipakai oleh `--resume` agar cukup menambal yang
belum sukses saat proses terputus.

Catatan soal anti-dobel: backend menyimpan berkas dengan nama acak (UUID),
jadi nama berkas sumber tidak bisa dicocokkan lagi setelah tersimpan. Karena
itu `--skip-existing` bekerja per ruang publik: RP yang sudah punya foto resmi
apa pun dilewati seluruhnya (aman dijalankan ulang untuk impor penuh), tapi
isian yang kurang pada RP tersebut tidak bisa ditambal otomatis. Mekanisme
anti-dobel paling andal tetap `--resume` (berbasis log).
"""
from __future__ import annotations

import argparse
import csv
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[3]
IMAGES_DIR = ROOT / "data" / "Images"
INDEKS = IMAGES_DIR / "images_index.csv"
LOG = IMAGES_DIR / "import_photos_log.csv"

LOG_KOLOM = ["ruang_publik_id", "file", "status", "pesan"]


def _baca_index(path: Path) -> list[dict]:
    if not path.exists():
        raise SystemExit(
            f"{path} tidak ada. Jalankan dulu: python -m app.etl.build_images_index"
        )
    with open(path, encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def _baca_log() -> dict[tuple[str, str], str]:
    """(ruang_publik_id, file) -> status dari log sebelumnya; untuk --resume."""
    if not LOG.exists():
        return {}
    with open(LOG, encoding="utf-8-sig", newline="") as fh:
        return {(r["ruang_publik_id"], r["file"]): r["status"] for r in csv.DictReader(fh)}


def _tulis_log(baris: list[dict]) -> None:
    with open(LOG, "w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=LOG_KOLOM)
        writer.writeheader()
        writer.writerows(baris)


def _login(base_url: str, email: str, password: str) -> str:
    # Impor foto butuh akses admin, jadi lewat jalur /admin/login (OAuth2 password
    # flow: field `username` diisi email). /auth/login hanya menerima role warga.
    resp = requests.post(
        f"{base_url}/api/v1/admin/login",
        data={"username": email, "password": password},
        timeout=30,
    )
    if resp.status_code != 200:
        raise SystemExit(f"login gagal ({resp.status_code}): {resp.text[:300]}")
    return resp.json()["access_token"]


def _jumlah_foto_terpasang(base_url: str, headers: dict, rp_id: str) -> int:
    resp = requests.get(
        f"{base_url}/api/v1/admin/public-spaces/{rp_id}/photos",
        headers=headers,
        timeout=30,
    )
    if resp.status_code != 200:
        return -1  # tidak diketahui; jangan paksa lewati
    return len(resp.json())


def _unggah(base_url: str, headers: dict, rp_id: str, path: Path) -> tuple[str, str]:
    with open(path, "rb") as fh:
        resp = requests.post(
            f"{base_url}/api/v1/admin/public-spaces/{rp_id}/photos",
            headers=headers,
            files={"file": (path.name, fh, "image/jpeg")},
            timeout=60,
        )
    if resp.status_code == 201:
        return "sukses", resp.json().get("foto_url", "")
    return "gagal", f"{resp.status_code}: {resp.text[:200]}"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--index", default=str(INDEKS), help="file images_index.csv")
    parser.add_argument("--base-url", default=os.environ.get("RUKA_API_URL", "http://localhost:8000"))
    parser.add_argument("--email", default=os.environ.get("RUKA_ADMIN_EMAIL"))
    parser.add_argument("--password", default=os.environ.get("RUKA_ADMIN_PASSWORD"))
    parser.add_argument("--limit", type=int, default=0, help="batasi jumlah berkas (0 = semua)")
    parser.add_argument("--skip-existing", action="store_true", help="lewati RP yang sudah punya foto resmi")
    parser.add_argument("--resume", action="store_true", help="lewati berkas yang sudah sukses di log")
    parser.add_argument("--delay", type=float, default=0.05, help="jeda antar-request per worker (detik)")
    parser.add_argument("--workers", type=int, default=1, help="jumlah unggahan paralel (default 1)")
    parser.add_argument("--flush-every", type=int, default=50, help="tulis log tiap N hasil (untuk --resume)")
    args = parser.parse_args()

    if not args.email or not args.password:
        raise SystemExit("email & password admin wajib (argumen atau env RUKA_ADMIN_EMAIL/RUKA_ADMIN_PASSWORD)")

    baris = _baca_index(Path(args.index))
    if args.limit:
        baris = baris[: args.limit]
    log_sebelum = _baca_log() if args.resume else {}

    # Jumlah baris index per RP, untuk --skip-existing.
    jumlah_index: dict[str, int] = {}
    for row in baris:
        rp = row["ruang_publik_id"].strip()
        jumlah_index[rp] = jumlah_index.get(rp, 0) + 1

    token = _login(args.base_url, args.email, args.password)
    headers = {"Authorization": f"Bearer {token}"}
    print(f"login ok    : {args.email} -> {args.base_url}")

    # --skip-existing: putuskan per RP, karena nama berkas tersimpan sudah
    # diacak backend. RP yang sudah punya foto resmi apa pun dilewati seluruhnya
    # supaya tidak pernah membuat duplikat (kita tak tahu berkas mana yang ada).
    rp_dilewati: set[str] = set()
    if args.skip_existing:
        for rp_id in jumlah_index:
            terpasang = _jumlah_foto_terpasang(args.base_url, headers, rp_id)
            if terpasang > 0:
                rp_dilewati.add(rp_id)
                if terpasang < jumlah_index[rp_id]:
                    print(
                        f"peringatan  : {rp_id} sudah punya {terpasang}/"
                        f"{jumlah_index[rp_id]} foto; dilewati agar tidak dobel "
                        "(isian kurang tidak bisa ditambal otomatis)"
                    )
        print(f"skip-existing: {len(rp_dilewati)} RP dilewati ({len(jumlah_index) - len(rp_dilewati)} akan diproses)")

    # Pisahkan baris yang perlu diunggah dari yang langsung dilewati.
    log_baru: list[dict] = []
    hitung = {"sukses": 0, "gagal": 0, "dilewati": 0}
    tugas: list[tuple[str, str, Path]] = []

    for row in baris:
        rp_id = row["ruang_publik_id"].strip()
        rel = row["file"].strip()
        path = IMAGES_DIR / rel
        kunci = (rp_id, rel)

        if args.resume and log_sebelum.get(kunci) == "sukses":
            hitung["dilewati"] += 1
            log_baru.append({"ruang_publik_id": rp_id, "file": rel, "status": "dilewati", "pesan": "sudah sukses"})
        elif rp_id in rp_dilewati:
            hitung["dilewati"] += 1
            log_baru.append({"ruang_publik_id": rp_id, "file": rel, "status": "dilewati", "pesan": "RP sudah terisi"})
        elif not path.is_file():
            hitung["gagal"] += 1
            log_baru.append({"ruang_publik_id": rp_id, "file": rel, "status": "gagal", "pesan": "berkas tidak ada"})
        else:
            tugas.append((rp_id, rel, path))

    _tulis_log(log_baru)  # tulis keputusan awal dulu, supaya progress tidak hilang
    print(f"diproses    : {len(tugas)} berkas diunggah, {hitung['dilewati']} dilewati")

    lock = threading.Lock()

    def _proses(item: tuple[str, str, Path]) -> dict:
        rp_id, rel, path = item
        if args.delay:
            time.sleep(args.delay)
        status, pesan = _unggah(args.base_url, headers, rp_id, path)
        return {"ruang_publik_id": rp_id, "file": rel, "status": status, "pesan": pesan}

    selesai = 0
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = [pool.submit(_proses, t) for t in tugas]
        for fut in as_completed(futures):
            hasil = fut.result()
            with lock:
                selesai += 1
                hitung[hasil["status"]] += 1
                log_baru.append(hasil)
                if selesai % args.flush_every == 0:
                    _tulis_log(log_baru)
                    print(f"  {selesai}/{len(tugas)} … sukses {hitung['sukses']}, gagal {hitung['gagal']}")

    _tulis_log(log_baru)
    print(
        f"selesai     : {hitung['sukses']} sukses, {hitung['gagal']} gagal, "
        f"{hitung['dilewati']} dilewati (total {len(baris)})"
    )
    print(f"log         : {LOG.relative_to(ROOT)}")
    if hitung["gagal"]:
        sys.exit(1)


if __name__ == "__main__":
    main()

"""Jadwalkan pipeline sinkronisasi ETL: Extract -> Transform -> Load (BE-17).

Berjalan sebagai proses terpisah dari server API, dari folder backend:

    python -m app.etl.scheduler           # ikut jadwal ETL_JADWAL (default 02:00 WIB)
    python -m app.etl.scheduler --once    # jalankan sekali lalu keluar (pengecekan/cron)

Ketiga tahap dijalankan berurutan lewat subprocess. Gagal satu tahap (misal
portal Satu Data yang tanpa SLA) membatalkan run; file raw lama tetap dipakai
run berikutnya. Kandidat baru tetap menunggu review manual: seed_db dipanggil
tanpa --pakai-kandidat (lihat docs/features/etl-worker.md).
"""
from __future__ import annotations

import argparse
import logging
import os
import subprocess
import sys
from collections.abc import Sequence
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings

logger = logging.getLogger("etl.scheduler")

WIB = ZoneInfo("Asia/Jakarta")
BACKEND_DIR = Path(__file__).resolve().parents[2]

TAHAP: dict[str, int] = {
    "app.etl.extract_satudata": 1800,
    "app.etl.transform_rth_raw": 600,
    "app.etl.seed_db": 600,
}


def jalankan_tahap(modul: str) -> tuple[bool, list[str]]:
    """Jalankan satu tahap sebagai subprocess; kembalikan (sukses, log_lines)."""
    env = {**os.environ, "PYTHONIOENCODING": "utf-8"}
    try:
        hasil = subprocess.run(
            [sys.executable, "-m", modul],
            cwd=BACKEND_DIR,
            env=env,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=TAHAP[modul],
        )
    except subprocess.TimeoutExpired:
        logger.error("%s melewati batas %d detik, tahap dibatalkan", modul, TAHAP[modul])
        return False, [f"TIMEOUT: melewati batas {TAHAP[modul]} detik"]

    log: list[str] = []
    for baris in hasil.stdout.splitlines():
        if baris.strip():
            logger.info("%s | %s", modul, baris)
            log.append(baris)
    for baris in hasil.stderr.splitlines():
        if baris.strip():
            logger.error("%s | %s", modul, baris)
            log.append(baris)
    if hasil.returncode != 0:
        logger.error("%s keluar dengan kode %d", modul, hasil.returncode)
    return hasil.returncode == 0, log


def jalankan_pipeline() -> bool:
    """Eksekusi ketiga tahap berurutan; gagal tahap membatalkan run."""
    mulai = datetime.now(WIB)
    logger.info("pipeline mulai")
    for modul in TAHAP:
        sukses, _ = jalankan_tahap(modul)
        if not sukses:
            logger.error("pipeline dibatalkan, tahap %s gagal", modul)
            return False
    logger.info(
        "pipeline selesai, total %d detik",
        int((datetime.now(WIB) - mulai).total_seconds()),
    )
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--once",
        action="store_true",
        help="jalankan pipeline sekali lalu keluar, tanpa menunggu jadwal",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="[%(asctime)s] %(levelname)s %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    # Supaya hanya log milik scheduler yang tampil; APScheduler sendiri cukup
    # diam di level warning.
    logging.getLogger("apscheduler").setLevel(logging.WARNING)

    if args.once:
        return 0 if jalankan_pipeline() else 1

    try:
        trigger = CronTrigger.from_crontab(settings.ETL_JADWAL, timezone=WIB)
    except ValueError as exc:
        print(
            f"ETL_JADWAL tidak valid ({settings.ETL_JADWAL!r}): {exc}",
            file=sys.stderr,
        )
        return 2

    scheduler = BlockingScheduler()
    scheduler.add_job(
        jalankan_pipeline,
        trigger=trigger,
        id="etl-pipeline",
        max_instances=1,          # run lama belum selesai, run baru tidak diantre ganda
        coalesce=True,            # jadwal yang tertinggal cukup sekali jalan
        misfire_grace_time=3600,
    )
    berikut = trigger.get_next_fire_time(None, datetime.now(WIB))
    logger.info(
        "jadwal %r WIB, run berikutnya %s; tekan Ctrl+C untuk berhenti",
        settings.ETL_JADWAL,
        berikut,
    )
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("scheduler dihentikan")
    return 0


if __name__ == "__main__":
    sys.exit(main())

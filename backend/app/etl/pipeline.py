"""Jalankan pipeline ETL dengan logging hasil run ke tabel etl_run (BE-19).

Modul terpadu dipakai scheduler (BE-17) dan endpoint manual (BE-18): membuat
baris run, mencatat tiap tahap (status, durasi, 100 baris log terakhir), lalu
menutup run dengan status akhir, tahap yang gagal, dan hitung insert/update/skip.
"""
from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone, timedelta

from sqlalchemy import select

from app.core.database import SessionLocal
from app.etl.scheduler import TAHAP, jalankan_tahap
from app.models.etl_run import EtlRun
from app.schemas.sync import SyncResult, TahapSync

logger = logging.getLogger("etl.pipeline")
LOG_TAIL = 100
STALE_TIMEOUT = timedelta(hours=2)


def _nama_tahap(modul: str) -> str:
    return modul.removeprefix("app.etl.")


def _baca_hitung(log_lines: list[str]) -> dict | None:
    for baris in log_lines:
        if baris.startswith("ETL_HITUNG "):
            try:
                return json.loads(baris.removeprefix("ETL_HITUNG "))
            except json.JSONDecodeError:
                logger.warning("ETL_HITUNG tidak valid JSON: %s", baris)
                return None
    return None


def _tandai_terputus() -> None:
    batas = datetime.now(timezone.utc).replace(tzinfo=None) - STALE_TIMEOUT
    with SessionLocal() as db:
        hasil = db.scalars(
            select(EtlRun).where(
                EtlRun.status == "berjalan", EtlRun.mulai < batas
            )
        ).all()
        for run in hasil:
            run.status = "gagal"
            run.tahap_gagal = "terputus"
            run.selesai = datetime.now(timezone.utc).replace(tzinfo=None)
        db.commit()
        if hasil:
            logger.warning("%d run stale ditandai terputus", len(hasil))


def jalankan_pipeline(pemicu: str) -> SyncResult:
    _tandai_terputus()
    mulai = datetime.now(timezone.utc)

    db_run = EtlRun(
        pemicu=pemicu,
        status="berjalan",
        mulai=mulai.replace(tzinfo=None),
    )
    with SessionLocal() as db:
        db.add(db_run)
        db.commit()
        db.refresh(db_run)
        run_id = db_run.id

    daftar: list[TahapSync] = []
    tahap_gagal: str | None = None
    hitung: dict | None = None

    for modul in TAHAP:
        mulai_tahap = time.time()
        sukses, raw_log = jalankan_tahap(modul)
        nama = _nama_tahap(modul)

        log = [b for b in raw_log if not b.startswith("ETL_HITUNG ")]
        log_capped = log[-LOG_TAIL:]

        daftar.append(
            TahapSync(
                tahap=nama,
                status="sukses" if sukses else "gagal",
                detik=int(time.time() - mulai_tahap),
                log=log_capped,
            )
        )

        if nama == "seed_db" and sukses:
            hitung = _baca_hitung(raw_log)

        if not sukses:
            tahap_gagal = nama
            break

    selesai = datetime.now(timezone.utc)
    status_akhir = "sukses" if tahap_gagal is None else "gagal"

    tahap_data = [
        {
            "tahap": t.tahap,
            "status": t.status,
            "detik": t.detik,
            "log": t.log,
        }
        for t in daftar
    ]
    with SessionLocal() as db:
        db_run = db.get(EtlRun, run_id)
        if db_run:
            db_run.status = status_akhir
            db_run.selesai = selesai.replace(tzinfo=None)
            db_run.tahap_gagal = tahap_gagal
            db_run.hitung = hitung
            db_run.tahap = tahap_data
            db.commit()

    return SyncResult(
        status=status_akhir,
        mulai=mulai,
        selesai=selesai,
        total_detik=int((selesai - mulai).total_seconds()),
        tahap=daftar,
        tahap_gagal=tahap_gagal,
    )

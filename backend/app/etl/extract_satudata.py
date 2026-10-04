"""Tahap Extract (BE-14): unduh dataset RTH & RPTRA terbaru ke data/raw/.

Dua sumber, satu perintah:
- Satu Data Jakarta (satudata.jakarta.go.id) -> atribut (nama, alamat, jenis), tanpa koordinat
- Jakarta Satu Geoportal (ArcGIS REST)       -> koordinat + nama, tanpa alamat lengkap

Keduanya API publik tanpa SLA. Kalau portal mengubah format, perbaiki konstanta di bawah.
Hasil: CSV + <nama>.meta.json di data/raw/ (keduanya masuk .gitignore).

Contoh:
    python -m app.etl.extract_satudata
    python -m app.etl.extract_satudata --source geoportal --dataset geoportal_rth_koordinat
    python -m app.etl.extract_satudata --page-url persentase-ruang-terbuka-hijau --output satudata_persentase
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = ROOT / "data" / "raw"

SATUDATA_API = "https://satudata.jakarta.go.id/backend/api/v2/satudata"
SATUDATA_PORTAL = "https://satudata.jakarta.go.id/open-data/detail"
GEOPORTAL_API = "https://jakartasatu.jakarta.go.id/server/rest/services"

SATUDATA_DATASETS: dict[str, str] = {
    "satudata_rth": "data-ruang-terbuka-hijau-rth",
    "satudata_rptra": "jumlah-ruang-publik-terpadu-ramah-anak-rptra",
    "satudata_rptra_belum_diresmikan": (
        "data-ruang-publik-terbuka-ramah-anak-rptra-yang-belum-diresmikan-di-dki-jakarta"
    ),
}

# Kolom teknis yang ikut terbawa tiap baris API Satu Data, bukan bagian dataset.
KOLOM_SISTEM = {
    "id",
    "rn",
    "user_id",
    "tanggal_upload",
    "tanggal_update",
    "uid_upload",
    "batch_upload",
    "jadwal_rilis",
    "created_at",
    "updated_at",
}

# Urutan kolom menyesuaikan rth_dki_coordinates.csv supaya file baru bisa menggantikannya 1:1.
KOLOM_RTH_GEO = [
    "OBJECTID",
    "NAMA_OBJEK",
    "JENIS_OBJEK",
    "LUAS_OBJEK",
    "X",
    "Y",
    "KELURAHAN",
    "KECAMATAN",
    "KOTA",
    "SKPD",
    "KEPEMILIKAN_OBJEK",
    "KATEGORI_OBJEK",
    "PENGELOLA_OBJEK",
    "ALAMAT_OBJEK",
    "NO_SERTIFIKAT",
    "KONDISI_OBJEK",
    "STATUS",
    "VERIFIKASI",
]

GEOPORTAL_DATASETS: dict[str, dict[str, Any]] = {
    "geoportal_rth_koordinat": {
        "service": "RTH_SKPD_DKI/RTH_SKPD_DKI_View",
        "layer": 0,
        "kolom": KOLOM_RTH_GEO,
    },
    "geoportal_rptra_koordinat": {
        "service": "RPTRA_DKI_Jakarta",
        "layer": 2,
        "kolom": [
            "OBJECTID",
            "NAMA_RPTRA",
            "ALAMAT",
            "LUAS",
            "X",
            "Y",
            "WADMKD",
            "WADMKC",
            "WADMKK",
        ],
    },
}

PER_HALAMAN = 100
JEDA_DETIK = 0.2
WIB = timezone(timedelta(hours=7))


def _session() -> requests.Session:
    # Portal kedua pernah putus/timeout saat pengujian, jadi retry dipasang di level transport.
    retry = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({"GET", "POST"}),
    )
    adapter = HTTPAdapter(max_retries=retry)
    session = requests.Session()
    session.headers["User-Agent"] = "raku-jakarta-etl/1.0"
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def _buka(resp: requests.Response) -> Any:
    resp.raise_for_status()
    # Respons portal memuat UTF-8 BOM di depan, json.loads menolaknya.
    teks = resp.text.lstrip("\ufeff")
    data = json.loads(teks)
    if isinstance(data, dict) and data.get("error"):
        raise RuntimeError(f"API menolak permintaan: {data['error']}")
    return data


def _post(session: requests.Session, url: str, payload: dict, timeout: float) -> Any:
    return _buka(session.post(url, json=payload, timeout=timeout))


def _get(session: requests.Session, url: str, params: dict, timeout: float) -> Any:
    return _buka(session.get(url, params=params, timeout=timeout))


def _nilai(obj: Any, kunci: str) -> Any:
    # Detail Satu Data membungkus metadata (periode, tanggal rilis) dalam list berisi satu objek.
    if isinstance(obj, list):
        if not obj:
            return None
        if isinstance(obj[0], dict):
            return obj[0].get(kunci)
        return obj
    if isinstance(obj, dict):
        return obj.get(kunci)
    return obj


def unduh_satudata(
    session: requests.Session, page_url: str, timeout: float
) -> tuple[list[str], list[dict], dict[str, Any]]:
    meta = _post(
        session,
        f"{SATUDATA_API}/detail",
        {"kategori": "dataset", "page_url": page_url, "data_no": 1},
        timeout,
    )
    total = int(meta.get("totalFiledata") or 0)
    baris: list[dict] = []
    halaman = 1
    total_halaman = 1

    while halaman <= total_halaman:
        data = _post(
            session,
            f"{SATUDATA_API}/get-table-data",
            {
                "page_url": page_url,
                "kategori": "dataset",
                "page": halaman,
                "per_page": PER_HALAMAN,
                "sort_field": "rn",
                "sort_order": "asc",
                "filters": {},
            },
            timeout,
        )
        batch = data.get("data") or []
        if not batch:
            break
        baris.extend(batch)
        total_halaman = int(data.get("total_pages") or total_halaman)
        halaman += 1
        if halaman <= total_halaman:
            time.sleep(JEDA_DETIK)

    if len(baris) != total:
        raise RuntimeError(f"jumlah baris {len(baris)} tidak sama dengan total {total}")

    if baris:
        kolom = [k for k in baris[0] if k not in KOLOM_SISTEM]
    else:
        komponen = json.loads(meta["data"].get("komponen_data") or "[]")
        kolom = [k["header_komponen"] for k in komponen]

    rilis = _nilai(meta.get("lastUpdatefiledata"), "tanggal_upload")
    info = {
        "title": meta["data"].get("title"),
        "periode_data": _nilai(meta.get("periodeData"), "periode_data"),
        "filedata_updated_at": rilis,
        "portal_url": f"{SATUDATA_PORTAL}/{page_url}",
        "api": f"{SATUDATA_API}/detail",
    }
    return kolom, baris, info


def unduh_geoportal(
    session: requests.Session,
    service: str,
    layer: int,
    kolom: list[str],
    timeout: float,
) -> tuple[list[str], list[dict], dict[str, Any]]:
    url = f"{GEOPORTAL_API}/{service}/FeatureServer/{layer}/query"
    info_hitung = _get(
        session, url, {"where": "1=1", "returnCountOnly": "true", "f": "json"}, timeout
    )
    total = int(info_hitung["count"])
    baris: list[dict] = []
    offset = 0

    while True:
        data = _get(
            session,
            url,
            {
                "where": "1=1",
                "outFields": ",".join(kolom),
                "returnGeometry": "false",
                "f": "json",
                "orderByFields": "OBJECTID",
                "resultOffset": offset,
            },
            timeout,
        )
        features = data.get("features") or []
        if not features:
            break
        baris.extend(f["attributes"] for f in features)
        offset += len(features)
        if not data.get("exceededTransferLimit"):
            break
        time.sleep(JEDA_DETIK)

    if len(baris) != total:
        raise RuntimeError(f"jumlah baris {len(baris)} tidak sama dengan total {total}")

    # Atribut X/Y sudah lon/lat WGS84; geometry layer ini EPSG:32748 (meter), jadi jangan dipakai.
    info = {
        "title": f"{service} layer {layer}",
        "service": service,
        "layer": layer,
        "api": url,
        "portal_url": f"{GEOPORTAL_API}/{service}/FeatureServer/{layer}",
    }
    return kolom, baris, info


def tulis_csv(path: Path, kolom: list[str], baris: list[dict]) -> None:
    tmp = path.parent / f"{path.name}.tmp"
    # utf-8-sig supaya cocok dengan encoding="utf-8-sig" di read_raw.py
    with tmp.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=kolom, extrasaction="ignore")
        writer.writeheader()
        for baris_ in baris:
            writer.writerow({k: baris_.get(k) for k in kolom})
    tmp.replace(path)


def tulis_meta(path: Path, isi: dict[str, Any]) -> None:
    tmp = path.parent / f"{path.name}.tmp"
    with tmp.open("w", encoding="utf-8") as fh:
        json.dump(isi, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    tmp.replace(path)


def _nama_file(nama: str) -> str:
    return nama if nama.endswith(".csv") else f"{nama}.csv"


def _pilih_dataset(sumber: str, pilihan: list[str] | None) -> list[tuple[str, str]]:
    daftar = [
        *(("satudata", k) for k in SATUDATA_DATASETS),
        *(("geoportal", k) for k in GEOPORTAL_DATASETS),
    ]
    if sumber != "all":
        daftar = [d for d in daftar if d[0] == sumber]
    if pilihan:
        sah = {k for _, k in daftar}
        tidak_ada = [k for k in pilihan if k not in sah]
        if tidak_ada:
            raise SystemExit(
                f"dataset tidak dikenal: {', '.join(tidak_ada)}"
                f"\npilihan: {', '.join(sorted(sah))}"
            )
        daftar = [d for d in daftar if d[1] in pilihan]
    return daftar


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--source",
        choices=("all", "satudata", "geoportal"),
        default="all",
        help="sumber yang diunduh; default semua",
    )
    parser.add_argument(
        "--dataset",
        action="append",
        dest="datasets",
        metavar="KEY",
        help="unduh hanya key ini; boleh diulang",
    )
    parser.add_argument("--page-url", help="slug dataset Satu Data ad-hoc; butuh --output")
    parser.add_argument("--output", help="nama file keluaran untuk --page-url")
    parser.add_argument("--timeout", type=float, default=60.0, help="timeout per request (detik)")
    args = parser.parse_args()

    if bool(args.page_url) != bool(args.output):
        parser.error("--page-url dan --output harus diisi berduaan")

    if args.page_url:
        tugas = [("satudata", Path(args.output).stem)]
        page_url_adhoc = args.page_url
    else:
        try:
            tugas = _pilih_dataset(args.source, args.datasets)
        except SystemExit as exc:
            print(exc, file=sys.stderr)
            return 2
        page_url_adhoc = None

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    session = _session()
    gagal: list[str] = []

    for sumber, key in tugas:
        keluaran = RAW_DIR / _nama_file(key)
        try:
            if sumber == "satudata":
                page_url = page_url_adhoc or SATUDATA_DATASETS[key]
                kolom, baris, info = unduh_satudata(session, page_url, args.timeout)
            else:
                cfg = GEOPORTAL_DATASETS[key]
                kolom, baris, info = unduh_geoportal(
                    session, cfg["service"], cfg["layer"], cfg["kolom"], args.timeout
                )
            tulis_csv(keluaran, kolom, baris)
            meta = {
                "dataset": key,
                "sumber": sumber,
                "downloaded_at": datetime.now(WIB).isoformat(timespec="seconds"),
                "total_rows": len(baris),
                "columns": kolom,
                **info,
            }
            if sumber == "satudata":
                meta["page_url"] = page_url_adhoc or SATUDATA_DATASETS[key]
            tulis_meta(keluaran.with_suffix(".meta.json"), meta)
            rilis = info.get("filedata_updated_at")
            print(
                f"{key:<34} {len(baris):>5} baris  {len(kolom)} kolom"
                + (f"  rilis {rilis}" if rilis else "")
                + f"  -> data/raw/{keluaran.name}"
            )
        except Exception as exc:  # lanjut ke dataset berikutnya, lalu laporkan di akhir
            print(f"{key:<34} GAGAL: {exc}", file=sys.stderr)
            gagal.append(key)

    if gagal:
        print(f"\n{len(gagal)} dataset gagal: {', '.join(gagal)}", file=sys.stderr)
        return 1
    print(f"\nselesai, {len(tugas)} dataset ditulis ke data/raw/")
    return 0


if __name__ == "__main__":
    sys.exit(main())

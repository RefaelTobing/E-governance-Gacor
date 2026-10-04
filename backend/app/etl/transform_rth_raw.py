"""Transform hasil extract (BE-14) menjadi file seed + file kandidat.

Sumber di `data/raw/`:
- geoportal_rth_koordinat.csv   baris RTH: nama, jenis, alamat, koordinat
- geoportal_rptra_koordinat.csv koordinat + alamat RPTRA
- satudata_rptra.csv            kecamatan/kelurahan/wilayah RPTRA

Master `data/processed/ruang_publik.csv` (1200 baris, hasil pembersihan manual)
jadi acuan: jumlah baris, id, nama, alamat, wilayah, dan verified tidak pernah
berubah di sini. Hanya latitude, longitude, tipe, dan kategori_id yang disegarkan
untuk baris yang ketemu di sumber. Hasil segar itu baru menyinggung database saat
BE-16 (jalur update) selesai, karena seed_db sekarang melewatkan id yang sudah ada.

Keluaran:
- ruang_publik_terbaru.csv            1200 baris, id identik dengan master
- kandidat/ruang_publik_kandidat.csv  baris baru, belum direview, ditolak seed_db
- categories.json (+ .csv), transform_laporan.json

Baris sumber di luar 4 kategori final dibuang sesuai jobdesk BE-15, begitu juga
baris tanpa koordinat, koordinat di luar rentang DKI, dan baris duplikat.
"""
from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import pandas as pd

from app.etl.kategori import KATEGORI_TIPE, kategori_id_dari_tipe
from app.etl.read_raw import read_raw_csv

ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"
KANDIDAT_DIR = PROCESSED_DIR / "kandidat"

MASTER = PROCESSED_DIR / "ruang_publik.csv"
GEO_RTH = RAW_DIR / "geoportal_rth_koordinat.csv"
GEO_RPTRA = RAW_DIR / "geoportal_rptra_koordinat.csv"
SAT_RPTRA = RAW_DIR / "satudata_rptra.csv"

JENIS_TIPE = ("Taman Lingkungan", "Taman Interaktif", "Taman Kota")
WILAYAH_PREFIX = ("Kota Adm. ", "Kab. Adm. ")
VERIFIKASI_YA = {"Y", "SUDAH"}

# Rentang DKI Jakarta dengan penjagaan; di luar ini titik dianggap salah kolom.
BATAS = {"lat_min": -6.5, "lat_max": -5.5, "lng_min": 106.5, "lng_max": 107.2}
WIB = timezone(timedelta(hours=7))

KOLOM = [
    "id", "nama", "kategori_id", "wilayah", "alamat", "latitude", "longitude",
    "deskripsi", "jam_operasional", "tiket_masuk", "akses_disabilitas",
    "ramah_hewan", "verified", "status_general", "image_url", "kecamatan",
    "kelurahan", "tipe",
]
KOLOM_KOSONG = KOLOM[7:12] + KOLOM[13:15]


def _teks(value) -> str:
    if value is None or (isinstance(value, str) and not value.strip()):
        return ""
    try:
        if pd.isna(value):
            return ""
    except (TypeError, ValueError):
        pass
    return re.sub(r"\s+", " ", str(value)).strip()


def _tanpa_prefix(teks: str, prefix: str) -> str:
    cocok = re.match(rf"^{re.escape(prefix)}\s+", teks, flags=re.I)
    return teks[cocok.end():] if cocok else teks


def _nama_rth(value) -> str:
    # Sumber geoportal menulis "RTH RPTRA Betawi Ngumpul"; master membuang awalan itu.
    return _tanpa_prefix(_teks(value), "RTH")


def _nama_rptra(value) -> str:
    # Layer RPTRA menulis nama tanpa awalan ("Tanjong Timor"), master memakai "RPTRA ...".
    return "RPTRA " + _tanpa_prefix(_nama_rth(value), "RPTRA").strip()


def _basename_rptra(value) -> str:
    return _tanpa_prefix(_nama_rth(value), "RPTRA").strip()


def _kunci(nama, kecamatan, kelurahan) -> str:
    return "|".join(_teks(v).upper() for v in (nama, kecamatan, kelurahan))


def _stable_id(nama, kecamatan, kelurahan) -> str:
    return "rth-" + hashlib.sha1(_kunci(nama, kecamatan, kelurahan).encode()).hexdigest()[:12]


def _wilayah(value) -> Optional[str]:
    teks = _teks(value)
    if not teks:
        return None
    for prefix in WILAYAH_PREFIX:
        teks = _tanpa_prefix(teks, prefix.rstrip())
    return teks.title()


def _koordinat(x, y) -> tuple[Optional[float], Optional[float], str]:
    if not _teks(x) or not _teks(y):
        return None, None, "tanpa_koordinat"
    try:
        lng, lat = float(x), float(y)
    except (TypeError, ValueError):
        return None, None, "koordinat_tidak_valid"
    if not (BATAS["lat_min"] <= lat <= BATAS["lat_max"]):
        return None, None, "koordinat_tidak_valid"
    if not (BATAS["lng_min"] <= lng <= BATAS["lng_max"]):
        return None, None, "koordinat_tidak_valid"
    return lat, lng, "ok"


def _tipe(nama: str, jenis: str) -> Optional[str]:
    if nama.upper().startswith("RPTRA"):
        return "RPTRA"
    return jenis if jenis in JENIS_TIPE else None


def _kumpul_rth(df: pd.DataFrame, buang: dict, verifikasi: dict) -> list[dict]:
    rows = []
    for r in df.to_dict("records"):
        nama = _nama_rth(r.get("NAMA_OBJEK"))
        if not nama:
            buang["tanpa_nama"] = buang.get("tanpa_nama", 0) + 1
            continue
        tipe = _tipe(nama, _teks(r.get("JENIS_OBJEK")))
        if not tipe:
            buang["bukan_4_kategori"] = buang.get("bukan_4_kategori", 0) + 1
            continue
        lat, lng, status = _koordinat(r.get("X"), r.get("Y"))
        if status != "ok":
            buang[status] = buang.get(status, 0) + 1
            continue
        tanda = _teks(r.get("VERIFIKASI")).upper() or "kosong"
        verifikasi[tanda] = verifikasi.get(tanda, 0) + 1
        rows.append({
            "key": _kunci(nama, r.get("KECAMATAN"), r.get("KELURAHAN")),
            "nama": nama,
            "tipe": tipe,
            "wilayah": _wilayah(r.get("KOTA")),
            "alamat": _teks(r.get("ALAMAT_OBJEK")) or None,
            "latitude": lat,
            "longitude": lng,
            "kecamatan": _teks(r.get("KECAMATAN")),
            "kelurahan": _teks(r.get("KELURAHAN")),
        })
    return rows


def _kumpul_rptra(df_geo: pd.DataFrame, df_sat: pd.DataFrame, buang: dict) -> tuple[list[dict], int]:
    geo: dict[str, dict] = {}
    for r in df_geo.to_dict("records"):
        nama = _nama_rptra(r.get("NAMA_RPTRA"))
        if not _basename_rptra(r.get("NAMA_RPTRA")):
            buang["tanpa_nama"] = buang.get("tanpa_nama", 0) + 1
            continue
        lat, lng, status = _koordinat(r.get("X"), r.get("Y"))
        if status != "ok":
            buang[status] = buang.get(status, 0) + 1
            continue
        kecamatan, kelurahan = _teks(r.get("WADMKC")), _teks(r.get("WADMKD"))
        key = _kunci(nama, kecamatan, kelurahan)
        if key in geo:
            buang["duplikat"] = buang.get("duplikat", 0) + 1
            continue
        geo[key] = {
            "key": key,
            "nama": nama,
            "tipe": "RPTRA",
            "wilayah": _wilayah(r.get("WADMKK")),
            "alamat": _teks(r.get("ALAMAT")) or None,
            "latitude": lat,
            "longitude": lng,
            "kecamatan": kecamatan,
            "kelurahan": kelurahan,
        }

    cocok = 0
    for r in df_sat.to_dict("records"):
        nama = _nama_rptra(r.get("nama_rptra"))
        key = _kunci(nama, r.get("kecamatan"), r.get("kelurahan"))
        baris = geo.get(key)
        if baris:
            cocok += 1
            if not baris["wilayah"]:
                baris["wilayah"] = _wilayah(r.get("wilayah"))
        else:
            # Satu Data tidak punya koordinat, jadi barisnya tak bisa dipakai sendirian.
            buang["rptra_tanpa_koordinat"] = buang.get("rptra_tanpa_koordinat", 0) + 1
    return list(geo.values()), cocok


def _gabung_rpra(sumber: list[dict], rptra: list[dict]) -> tuple[list[dict], int]:
    index = {r["key"]: r for r in sumber}
    gabung = 0
    for rec in rptra:
        ada = index.get(rec["key"])
        if ada:
            gabung += 1
            if not ada["alamat"]:
                ada["alamat"] = rec["alamat"]
        else:
            index[rec["key"]] = rec
    return list(index.values()), gabung


def _luar_rentang(latitude, longitude) -> bool:
    if pd.isna(latitude) or pd.isna(longitude):
        return True
    return not (
        BATAS["lat_min"] <= float(latitude) <= BATAS["lat_max"]
        and BATAS["lng_min"] <= float(longitude) <= BATAS["lng_max"]
    )


def _segarkan_master(master: pd.DataFrame, index: dict[str, dict]):
    disegarkan, tipe_berubah, kategori_dinormalisasi = 0, 0, 0
    tanpa_pasangan, luar_rentang = [], []
    for i, r in master.iterrows():
        sumber = index.get(_kunci(r["nama"], r["kecamatan"], r["kelurahan"]))
        if sumber is None:
            tanpa_pasangan.append(_teks(r["nama"]))
            if _luar_rentang(r["latitude"], r["longitude"]):
                luar_rentang.append(_teks(r["nama"]))
        else:
            master.at[i, "latitude"] = sumber["latitude"]
            master.at[i, "longitude"] = sumber["longitude"]
            if sumber["tipe"] != _teks(r["tipe"]):
                tipe_berubah += 1
            master.at[i, "tipe"] = sumber["tipe"]
        # kategori_id diturunkan dari tipe untuk semua baris: master punya beberapa
        # nilai sisa ("taman") yang tidak ada di master kategori.
        kategori_baru = kategori_id_dari_tipe(_teks(r["tipe"]) or None)
        if _teks(master.at[i, "kategori_id"]) != _teks(kategori_baru):
            kategori_dinormalisasi += 1
        master.at[i, "kategori_id"] = kategori_baru
        disegarkan += sumber is not None
    return {
        "disegarkan": disegarkan,
        "tipe_berubah": tipe_berubah,
        "kategori_id_dinormalisasi": kategori_dinormalisasi,
        "tanpa_pasangan": tanpa_pasangan,
        "koordinat_luar_rentang": luar_rentang,
    }


def _baris_kandidat(kandidat: list[dict]) -> list[dict]:
    rows = []
    for rec in kandidat:
        baris = {
            "id": _stable_id(rec["nama"], rec["kecamatan"], rec["kelurahan"]),
            "nama": rec["nama"],
            "kategori_id": kategori_id_dari_tipe(rec["tipe"]),
            "wilayah": rec["wilayah"],
            "alamat": rec["alamat"],
            "latitude": rec["latitude"],
            "longitude": rec["longitude"],
            # Belum direview pemilik proyek, jadi tetap False apa pun VERIFIKASI di sumber.
            "verified": False,
            "kecamatan": rec["kecamatan"],
            "kelurahan": rec["kelurahan"],
            "tipe": rec["tipe"],
        }
        for kolom in KOLOM_KOSONG:
            baris.setdefault(kolom, None)
        rows.append({k: baris.get(k) for k in KOLOM})
    return rows


def main() -> None:
    if not MASTER.exists():
        raise SystemExit(f"master tidak ditemukan: {MASTER}")
    for path in (GEO_RTH, GEO_RPTRA, SAT_RPTRA):
        if not path.exists():
            raise SystemExit(f"sumber tidak ditemukan: {path.name} (jalankan extract_satudata dulu)")

    buang: dict[str, int] = {}
    verifikasi: dict[str, int] = {}
    df_rth, df_geo_rptra, df_sat_rptra = (read_raw_csv(p) for p in (GEO_RTH, GEO_RPTRA, SAT_RPTRA))
    rth = _kumpul_rth(df_rth, buang, verifikasi)
    rptra, rptra_cocok = _kumpul_rptra(df_geo_rptra, df_sat_rptra, buang)
    sumber, digabung = _gabung_rpra(rth, rptra)

    master = pd.read_csv(MASTER)
    kolom_kurang = set(KOLOM) - set(master.columns)
    if kolom_kurang:
        raise SystemExit(f"{MASTER.name} tidak punya kolom: {', '.join(sorted(kolom_kurang))}")
    master_keys = {_kunci(r["nama"], r["kecamatan"], r["kelurahan"]) for r in master.to_dict("records")}
    index = {r["key"]: r for r in sumber}
    segar = _segarkan_master(master, index)
    kandidat = [r for k, r in index.items() if k not in master_keys]

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    KANDIDAT_DIR.mkdir(parents=True, exist_ok=True)
    master[KOLOM].to_csv(PROCESSED_DIR / "ruang_publik_terbaru.csv", index=False, encoding="utf-8")
    pd.DataFrame(_baris_kandidat(kandidat)).reindex(columns=KOLOM).to_csv(
        KANDIDAT_DIR / "ruang_publik_kandidat.csv", index=False, encoding="utf-8"
    )
    with open(PROCESSED_DIR / "categories.json", "w", encoding="utf-8") as fh:
        json.dump(KATEGORI_TIPE, fh, ensure_ascii=False, indent=2)
    pd.DataFrame(KATEGORI_TIPE).to_csv(PROCESSED_DIR / "categories.csv", index=False, encoding="utf-8")

    per_tipe: dict[str, int] = {}
    for rec in kandidat:
        per_tipe[rec["tipe"]] = per_tipe.get(rec["tipe"], 0) + 1
    laporan = {
        "generated_at": datetime.now(WIB).isoformat(timespec="seconds"),
        "sumber_baris": {
            "geoportal_rth_koordinat": len(df_rth),
            "geoportal_rptra_koordinat": len(df_geo_rptra),
            "satudata_rptra": len(df_sat_rptra),
        },
        "dibuang": buang,
        "verifikasi_sumber_rth": verifikasi,
        "sumber_disimpan": {"rth": len(rth), "rptra": len(rptra), "digabung_rpra": digabung, "rptra_cocok_satudata": rptra_cocok},
        "master": {
            "total": len(master),
            "disegarkan": segar["disegarkan"],
            "tipe_berubah": segar["tipe_berubah"],
            "kategori_id_dinormalisasi": segar["kategori_id_dinormalisasi"],
            "tanpa_pasangan_sumber": len(segar["tanpa_pasangan"]),
            "daftar_tanpa_pasangan": segar["tanpa_pasangan"],
            "koordinat_luar_rentang": segar["koordinat_luar_rentang"],
        },
        "kandidat": {
            "total": len(kandidat),
            "per_tipe": per_tipe,
            "tanpa_alamat": sum(1 for r in kandidat if not r["alamat"]),
            "catatan": "verified dipaksa False; file ini ditolak seed_db tanpa --pakai-kandidat",
        },
    }
    with open(PROCESSED_DIR / "transform_laporan.json", "w", encoding="utf-8") as fh:
        json.dump(laporan, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    print(f"sumber     : {len(rth)} RTH + {len(rptra)} RPTRA ({digabung} menyatu dengan baris RTH)")
    if buang:
        print("dibuang    : " + ", ".join(f"{k} {v}" for k, v in sorted(buang.items(), key=lambda x: -x[1])))
    print(
        f"master     : {len(master)} baris | disegarkan {segar['disegarkan']}"
        f" | tipe berubah {segar['tipe_berubah']}"
        f" | kategori dinormalisasi {segar['kategori_id_dinormalisasi']}"
        f" | tanpa pasangan {len(segar['tanpa_pasangan'])}"
    )
    print(f"kandidat   : {len(kandidat)} baris -> data/processed/kandidat/ruang_publik_kandidat.csv")
    print("keluaran   : ruang_publik_terbaru.csv, categories.json, transform_laporan.json")
    if segar["koordinat_luar_rentang"]:
        print("koordinat master di luar rentang DKI, dipertahankan apa adanya:")
        for nama in segar["koordinat_luar_rentang"]:
            print(f"  - {nama}")
    if segar["tanpa_pasangan"]:
        contoh = ", ".join(segar["tanpa_pasangan"][:5])
        print(
            f"{len(segar['tanpa_pasangan'])} baris tanpa pasangan di sumber, nilai lama dipertahankan "
            f"(daftar lengkap di transform_laporan.json, contoh: {contoh})"
        )


if __name__ == "__main__":
    main()

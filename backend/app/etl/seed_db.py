"""Isi tabel categories dan ruang_publik dari hasil olah di data/processed.

Sumber bawaan adalah `ruang_publik_terbaru.csv` (hasil transform BE-15) bila
file itu ada, `ruang_publik.csv` (master) jadi cadangan. File lain tetap bisa
dipakai lewat `--file`:

    python -m app.etl.seed_db                                   # data terbaru
    python -m app.etl.seed_db --reset                           # ganti total isi tabel
    python -m app.etl.seed_db --file ../data/processed/ruang_publik.csv
    python -m app.etl.seed_db --file ../data/processed/kandidat/ruang_publik_kandidat.csv \
        --pakai-kandidat                                        # kandidat hasil transform, baru boleh setelah review

Baris yang sudah ada dicocokkan by id, lalu by natural key
(nama|kecamatan|kelurahan), lalu by nama. Baris cocok tidak pernah ditimpa
utuh: hanya kolom `ETL_OWNED` yang disegarkan, dan hanya bila belum tercatat
di `field_source` (edit manual admin, task BE-05). Aturan merge FEAT-012:
docs/features/data-master-service.md bagian 4.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.etl.kategori import slug_tipe
from app.etl.kunci import kunci_alami, kunci_nama
from app.models.category import Category
from app.models.fasilitas import Fasilitas
from app.models.laporan import Laporan
from app.models.ruang_publik import RuangPublik

PROCESSED_DIR = Path(__file__).resolve().parents[3] / "data" / "processed"
SUMBER_BAWAAN = PROCESSED_DIR / "ruang_publik.csv"
# Default memakai hasil transform supaya jalur update tidak menulis ulang
# nilai master lama di atas koordinat/kategori yang baru disegarkan BE-15.
SUMBER_TERBARU = PROCESSED_DIR / "ruang_publik_terbaru.csv"

# Hanya kolom ini yang boleh dibawa dari file sumber. Kolom `tipe` tidak ada
# di tabel (dipakai turun ke kategori_id lalu dibuang); `field_source` penanda
# edit manual yang ditulis mark_fields_edited(), bukan data sumber.
KOLOM_RUANG_PUBLIK = {
    nama for nama in RuangPublik.__table__.columns.keys()
    if nama not in {"created_at", "updated_at", "field_source"}
}

# Pemetaan merge FEAT-012 (docs/features/data-master-service.md bagian 4).
# ETL_OWNED: milik sumber resmi, boleh disegarkan tiap sinkronisasi.
# KOLOM_ADMIN: milik admin, tidak pernah ditulis ETL berapa pun isinya.
ETL_OWNED = {
    "nama", "kecamatan", "kelurahan", "wilayah", "alamat",
    "latitude", "longitude", "kategori_id",
}
KOLOM_ADMIN = {
    "deskripsi", "jam_operasional", "tiket_masuk", "akses_disabilitas",
    "ramah_hewan", "verified", "status_general", "image_url",
}
KOLOM_SISTEM = {"id", "field_source", "created_at", "updated_at"}
KOLOM_KOORDINAT = {"latitude", "longitude"}


def _cari_file(arg: str | None) -> Path:
    if arg:
        kandidat = [Path(arg), PROCESSED_DIR / arg]
        for path in kandidat:
            if path.exists():
                return path
        raise SystemExit(f"file sumber tidak ditemukan: {arg}")

    if SUMBER_TERBARU.exists():
        return SUMBER_TERBARU
    if SUMBER_BAWAAN.exists():
        return SUMBER_BAWAAN
    for path in (PROCESSED_DIR / "ruang_publik_lainnya.csv", PROCESSED_DIR / "ruang_publik_rth_generik.csv"):
        if path.exists():
            return path
    raise SystemExit(f"tidak ada file sumber di {PROCESSED_DIR}")


def _baca_kategori() -> pd.DataFrame:
    json_path = PROCESSED_DIR / "categories.json"
    if json_path.exists():
        return pd.DataFrame(json.load(open(json_path, encoding="utf-8")))
    return pd.read_csv(PROCESSED_DIR / "categories.csv", encoding="utf-8-sig")


def _baca_ruang_publik(path: Path) -> pd.DataFrame:
    if path.suffix == ".json":
        return pd.DataFrame(json.load(open(path, encoding="utf-8")))
    return pd.read_csv(path, encoding="utf-8-sig")


def _kategori_id(tipe, id_kategori: set[str]):
    """Kategori baris diturunkan dari kolom `tipe`; tipe di luar master -> None."""
    if tipe is None or pd.isna(tipe):
        return None
    slug = slug_tipe(tipe)
    return slug if slug in id_kategori else None


def _ke_bool(value) -> bool:
    # MySQL mengubah string 'True' menjadi 0, jadi konversi dilakukan di sini.
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "y", "ya"}
    if value is None or pd.isna(value):
        return False
    return bool(value)


def _bersihkan_nilai(value):
    if value is None:
        return None
    if isinstance(value, str):
        teks = value.strip()
        return teks or None
    if pd.isna(value):
        return None
    return value


def _siapkan(df: pd.DataFrame, path: Path) -> pd.DataFrame:
    """Samakan skema file sumber dengan kolom tabel ruang_publik."""
    id_kategori = set(_baca_kategori()["id"])

    if "tipe" in df.columns:
        df = df.assign(
            kategori_id=[_kategori_id(t, id_kategori) for t in df["tipe"]]
        )

    df = df[[kolom for kolom in df.columns if kolom in KOLOM_RUANG_PUBLIK]]

    if "verified" in df.columns:
        df = df.assign(verified=[_ke_bool(v) for v in df["verified"]])

    masalah: list[str] = []
    for wajib in ("id", "nama"):
        if wajib not in df.columns:
            masalah.append(f"kolom {wajib} tidak ada")
    if masalah:
        raise SystemExit(f"{path.name} tidak layak di-seed: " + "; ".join(masalah))

    if df["id"].isna().any():
        masalah.append(f"{int(df['id'].isna().sum())} baris tanpa id")
    if df["id"].duplicated().any():
        duplikat = df.loc[df["id"].duplicated(), "id"].head(5).tolist()
        masalah.append(f"id duplikat {duplikat}")
    if df["nama"].isna().any():
        masalah.append(f"{int(df['nama'].isna().sum())} baris tanpa nama")
    if masalah:
        raise SystemExit(f"{path.name} tidak layak di-seed: " + "; ".join(masalah))

    if "latitude" in df.columns:
        tanpa_koordinat = int((df["latitude"].isna() | df["longitude"].isna()).sum())
        if tanpa_koordinat:
            # Kolom boleh NULL di tabel; pencarian radius membuang baris ini.
            print(f"peringatan  : {tanpa_koordinat} baris tanpa koordinat")

    tanpa_kategori = int(df["kategori_id"].isna().sum()) if "kategori_id" in df.columns else 0
    if tanpa_kategori:
        print(
            f"peringatan  : {tanpa_kategori} baris tanpa kategori "
            "(tipe tidak ada di master categories) -> kategori_id NULL"
        )
    return df


def _bersihkan_nilai_record(record: dict) -> dict:
    return {k: _bersihkan_nilai(v) for k, v in record.items()}


def _cek_pemetaan() -> None:
    """Tolak seed bila ada kolom tabel yang belum masuk pemetaan merge.

    Kolom baru harus diputuskan dulu sebagai milik ETL atau milik admin
    (data-master-service.md bagian 4), bukan diam-diam ikut ditulis ETL.
    """
    belum = set(RuangPublik.__table__.columns.keys()) - ETL_OWNED - KOLOM_ADMIN - KOLOM_SISTEM
    if belum:
        raise SystemExit(
            "kolom ruang_publik belum masuk pemetaan merge: "
            + ", ".join(sorted(belum))
            + " (putuskan di docs/features/data-master-service.md bagian 4)"
        )


def _sama(kolom: str, lama, baru) -> bool:
    if lama is None or baru is None:
        return lama is None and baru is None
    if kolom in KOLOM_KOORDINAT:
        # DECIMAL(10,8) membulatkan nilai tersimpan; tanpa toleransi ini,
        # seed berikutnya menganggap koordinat selalu berbeda.
        try:
            return abs(float(lama) - float(baru)) < 1e-8
        except (TypeError, ValueError):
            return False
    return str(lama).strip() == str(baru).strip()


def _terapkan_etl(target: RuangPublik, record: dict) -> tuple[int, int]:
    """Segarkan kolom ETL_OWNED satu baris. Balikkan (ditulis, ditahan).

    Ditahan = nilai sumber berbeda tetapi kolom sudah jadi milik admin lewat
    `field_source`, jadi ETL tidak boleh menimpanya (FEAT-012).
    """
    penanda = target.field_source or {}
    ditulis = ditahan = 0
    for kolom in sorted(ETL_OWNED):
        if kolom not in record:
            continue
        nilai = _bersihkan_nilai(record[kolom])
        if nilai is None:
            # Sumber kosong bukan perintah menghapus; nilai terisi dipertahankan.
            continue
        if kolom in penanda:
            if not _sama(kolom, getattr(target, kolom), nilai):
                ditahan += 1
            continue
        if _sama(kolom, getattr(target, kolom), nilai):
            continue
        setattr(target, kolom, nilai)
        ditulis += 1
    return ditulis, ditahan


def seed_categories(db: Session, df: pd.DataFrame) -> int:
    baru = 0
    for row in df.itertuples():
        if db.get(Category, row.id) is None:
            db.add(Category(id=row.id, label=row.label, icon_name=_bersihkan_nilai(row.icon_name)))
            baru += 1
    return baru


def seed_ruang_publik(db: Session, df: pd.DataFrame) -> dict:
    """Insert baris baru, segarkan kolom ETL_OWNED baris yang sudah ada.

    Pencocokan bertingkat: id dulu (id `ruang_publik_terbaru.csv` identik
    master), lalu natural key nama|kecamatan|kelurahan, lalu nama saja.
    Nama yang sama di lebih dari satu baris tidak ditebak, barisnya ditahan
    supaya review manual, bukan masuk sebagai duplikat.
    """
    _cek_pemetaan()
    baris = list(db.scalars(select(RuangPublik)).all())
    by_id = {r.id: r for r in baris}
    by_kunci: dict[str, list[RuangPublik]] = {}
    by_nama: dict[str, list[RuangPublik]] = {}
    for r in baris:
        by_kunci.setdefault(kunci_alami(r.nama, r.kecamatan, r.kelurahan), []).append(r)
        by_nama.setdefault(kunci_nama(r.nama), []).append(r)

    hasil = {
        "baru": 0, "diupdate": 0, "tanpa_perubahan": 0, "ditahan": 0,
        "cocok_id": 0, "cocok_kunci": 0, "cocok_nama": 0, "nama_ambigu": 0,
    }

    def daftarkan(baru: RuangPublik) -> None:
        by_id[baru.id] = baru
        by_kunci.setdefault(kunci_alami(baru.nama, baru.kecamatan, baru.kelurahan), []).append(baru)
        by_nama.setdefault(kunci_nama(baru.nama), []).append(baru)

    for record in (_bersihkan_nilai_record(r) for r in df.to_dict("records")):
        target = by_id.get(record["id"])
        if target is not None:
            hasil["cocok_id"] += 1
        else:
            pasangan = by_kunci.get(kunci_alami(record.get("nama"), record.get("kecamatan"), record.get("kelurahan"))) or []
            if pasangan:
                target = pasangan[0]
                hasil["cocok_kunci"] += 1
            else:
                se_nama = by_nama.get(kunci_nama(record.get("nama"))) or []
                if len(se_nama) == 1:
                    target = se_nama[0]
                    hasil["cocok_nama"] += 1
                elif len(se_nama) > 1:
                    hasil["nama_ambigu"] += 1
                    continue

        if target is None:
            baru = RuangPublik(**record)
            db.add(baru)
            hasil["baru"] += 1
            daftarkan(baru)
            continue

        ditulis, ditahan = _terapkan_etl(target, record)
        hasil["ditahan"] += ditahan
        if ditulis:
            hasil["diupdate"] += 1
        else:
            hasil["tanpa_perubahan"] += 1
    return hasil


def reset(db: Session) -> None:
    """Kosongkan categories + ruang_publik sebelum diisi ulang.

    Menolak berjalan bila masih ada laporan/fasilitas yang menempel, karena
    baris itu milik data transaksi, bukan milik seed.
    """
    n_laporan = db.query(Laporan).count()
    n_fasilitas = db.query(Fasilitas).count()
    if n_laporan or n_fasilitas:
        raise SystemExit(
            f"--reset menolak: masih ada {n_laporan} laporan dan "
            f"{n_fasilitas} fasilitas yang menempel di ruang_publik. "
            "Hapus/pindahkan dulu sebelum mengganti total data."
        )

    n_rp = db.query(RuangPublik).count()
    n_kat = db.query(Category).count()
    db.query(RuangPublik).delete()
    db.query(Category).delete()
    db.commit()
    print(f"reset       : {n_rp} ruang_publik & {n_kat} categories dihapus")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--file", help="file sumber ruang publik (csv/json); default data terbaru")
    parser.add_argument("--reset", action="store_true", help="kosongkan tabel dulu sebelum seed")
    parser.add_argument(
        "--pakai-kandidat",
        action="store_true",
        help="izinkan seed dari file kandidat (hasil transform yang belum direview)",
    )
    args = parser.parse_args()

    path_ruang = _cari_file(args.file)
    if "kandidat" in path_ruang.parts and not args.pakai_kandidat:
        raise SystemExit(
            f"{path_ruang} ditolak: file kandidat belum direview, jangan masuk ke database. "
            "Review dulu isinya, lalu jalankan ulang dengan --pakai-kandidat bila sudah disetujui."
        )
    df_kategori = _baca_kategori()
    df_ruang = _siapkan(_baca_ruang_publik(path_ruang), path_ruang)

    with SessionLocal() as db:
        if args.reset:
            reset(db)
        n_cat = seed_categories(db, df_kategori)
        hasil = seed_ruang_publik(db, df_ruang)
        db.commit()

        per_kategori = (
            db.query(RuangPublik.kategori_id, func.count(RuangPublik.id))
            .group_by(RuangPublik.kategori_id)
            .all()
        )
        print(f"sumber      : {path_ruang.name} ({len(df_ruang)} baris)")
        print(f"categories  : {n_cat} baru (total {db.query(Category).count()})")
        print(
            f"ruang_publik: {hasil['baru']} baru, {hasil['diupdate']} diupdate, "
            f"{hasil['tanpa_perubahan']} tanpa perubahan (total {db.query(RuangPublik).count()})"
        )
        if hasil["ditahan"]:
            print(f"  edit manual: {hasil['ditahan']} kolom ditahan dari disegarkan ETL")
        if hasil["cocok_kunci"] or hasil["cocok_nama"] or hasil["nama_ambigu"]:
            print(
                f"  tanpa id   : {hasil['cocok_kunci']} natural key, {hasil['cocok_nama']} nama, "
                f"{hasil['nama_ambigu']} nama ambigu dilewati"
            )
        for kategori, jumlah in sorted(per_kategori, key=lambda x: -(x[1] or 0)):
            print(f"  {kategori or '(tanpa kategori)':20s} {jumlah}")

        hitung_akhir = {**hasil, "categories_baru": n_cat, "sumber_baris": len(df_ruang)}
        print(f"ETL_HITUNG {json.dumps(hitung_akhir, default=str)}")


if __name__ == "__main__":
    main()

"""Susun jam operasional ringkas per hari dari berkas jam buka ruang publik.

Sumber `data/raw/jam_buka_ruang_publik_jakarta.xlsx` (sheet `jam_buka`) memuat
jam buka hasil pengambilan Google Maps. Nilai paling andal ada di kolom per hari
(`jam_senin`..`jam_minggu`); teks bebas di `jam_operasional (Google Maps)` dipakai
sebagai cadangan.

Keluaran satu string ringkas: hari berurutan yang jamnya sama digabung menjadi
rentang (`Senin-Jumat 07.00-18.00`), hari lain dipisah `; `. Karena tiap hari
hanya punya satu slot, satu hari mustahil muncul dua kali - tidak ada tumpang
tindih. Hari tanpa jam (kosong atau nilai tak terbaca) dihilangkan, bukan
ditebak.
"""
from __future__ import annotations

import re

HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

# "07.00-18.00" atau "07.00 hingga 22.00" atau "07:00-18:00" -> "07.00-18.00"
_RENTANG = re.compile(r"(\d{1,2}[.:]\d{2})\s*(?:-|s\.?d\.?|hingga|sampai|–|—)\s*(\d{1,2}[.:]\d{2})", re.I)
# Dua shift menempel tanpa pemisah: "00.00-16.0021.00-00.00".
_SHIFT_MENEMPEL = re.compile(r"(\d{1,2}[.:]\d{2}-\d{1,2}[.:]\d{2})(?=\d{1,2}[.:]\d{2}-)")

NILAI_KHUSUS = {"buka 24 jam", "24 jam", "tutup", "tutup 24 jam", "libur"}


def _normalisasi_jam(teks: str) -> str:
    return teks.replace(":", ".")


def _rapikan_nilai(value) -> str | None:
    """Ubah satu nilai jam satu hari menjadi bentuk kanonik, atau None bila tak terbaca."""
    if value is None:
        return None
    teks = re.sub(r"\s+", " ", str(value)).strip()
    if not teks:
        return None
    if teks.lower() in NILAI_KHUSUS:
        return "Buka 24 jam" if "24" in teks else "Tutup"

    # Nilai bisa memuat lebih dari satu shift; pecah atas koma/titik-koma dulu,
    # lalu pada shift yang masih menempel karena pemisahnya hilang.
    potongan = re.split(r"[;,]", teks)
    hasil: list[str] = []
    for bagian in potongan:
        bagian = bagian.strip()
        if not bagian:
            continue
        bagian = _SHIFT_MENEMPEL.sub(r"\1;", bagian)
        for sub in bagian.split(";"):
            cocok = _RENTANG.search(sub)
            if cocok:
                mulai = _normalisasi_jam(cocok.group(1))
                selesai = _normalisasi_jam(cocok.group(2))
                hasil.append(f"{mulai}-{selesai}")
    if not hasil:
        # Teks seperti tanggal ("29 Oktober hingga Jumat, 30 Oktober") bukan jadwal.
        return None
    return "; ".join(hasil)


def _format_ringkas(per_hari: dict[str, str | None]) -> str | None:
    """Gabung hari berurutan yang nilainya sama; hari kosong dilewati."""
    if not any(per_hari.get(h) for h in HARI):
        return None

    # Kelompokkan hari berurutan bernilai sama menjadi blok. Hari kosong
    # memutus blok supaya rentang tidak menjembatani hari tanpa jam.
    blok: list[tuple[str, str, str]] = []
    sebelumnya: str | None = None
    for hari in HARI:
        nilai = per_hari.get(hari)
        if not nilai:
            sebelumnya = None
            continue
        if blok and sebelumnya == nilai and blok[-1][2] == nilai:
            mulai, _, _ = blok[-1]
            blok[-1] = (mulai, hari, nilai)
        else:
            blok.append((hari, hari, nilai))
        sebelumnya = nilai

    bagian: list[str] = []
    for mulai, selesai, nilai in blok:
        hari_label = mulai if mulai == selesai else f"{mulai}-{selesai}"
        bagian.append(f"{hari_label} {nilai}")
    return "; ".join(bagian)


def format_jam_per_hari(nilai_hari: list[str | None]) -> str | None:
    """Terima 7 nilai berurutan Senin..Minggu, balikkan string ringkas atau None."""
    per_hari = {hari: _rapikan_nilai(v) for hari, v in zip(HARI, nilai_hari)}
    return _format_ringkas(per_hari)


def parse_dari_teks(teks) -> str | None:
    """Cadangan: baca satu teks bebas, petakan hari yang disebut, lalu ringkas."""
    if teks is None:
        return None
    sumber = re.sub(r"\s+", " ", str(teks)).strip()
    if not sumber or sumber.lower() == "nan":
        return None

    per_hari: dict[str, str | None] = {h: None for h in HARI}
    for bagian in sumber.split(";"):
        bagian = bagian.strip()
        if not bagian:
            continue
        hari = _hari_disebut(bagian)
        if not hari:
            continue
        cocok = _RENTANG.search(bagian)
        if cocok:
            jam = f"{_normalisasi_jam(cocok.group(1))}-{_normalisasi_jam(cocok.group(2))}"
        else:
            # Bagian tanpa rentang waktu tetap bermakna bila memuat kata kunci.
            jam = next(
                (k for k in ("Buka 24 jam", "Tutup") if k.lower() in bagian.lower()),
                None,
            )
        if not jam:
            continue
        for h in hari:
            per_hari[h] = jam
    return _format_ringkas(per_hari)


def _hari_untuk(token: str) -> str | None:
    token = token.strip().lower()
    if not token:
        return None
    for hari in HARI:
        if hari.lower().startswith(token):
            return hari
    # Singkatan 3 huruf yang sama di beberapa hari tetap dipetakan ke yang pertama.
    for hari in HARI:
        if hari.lower()[:3] == token[:3]:
            return hari
    return None


def _hari_disebut(teks: str) -> list[str]:
    """Ambil daftar hari dari teks, mendukung rentang ('Minggu-Kamis', 'Jumat & Sabtu').

    Rentang dapat memutar pekan ('Minggu-Kamis' = Minggu, Senin, ..., Kamis).
    """
    # Buang bagian jam supaya angka "07.00" tidak ikut terbaca sebagai hari.
    teks = _RENTANG.sub(" ", teks)
    teks = teks.replace("&", " dan ").replace("hingga", "-")
    hasil: set[str] = set()
    for potongan in re.split(r",|\bdan\b", teks, flags=re.I):
        potongan = potongan.strip()
        if not potongan:
            continue
        if "-" in potongan:
            kiri, kanan = (p.strip() for p in potongan.split("-", 1))
            awal, akhir = _hari_untuk(kiri), _hari_untuk(kanan)
            if awal and akhir:
                i, j = HARI.index(awal), HARI.index(akhir)
                if i <= j:
                    hasil.update(HARI[i:j + 1])
                else:  # rentang memutar pekan
                    hasil.update(HARI[i:] + HARI[:j + 1])
                continue
        hari = _hari_untuk(potongan)
        if hari:
            hasil.add(hari)
    # Susun ulang sesuai urutan pekan, bukan urutan tulis.
    return [h for h in HARI if h in hasil]


def ambil_jam(row) -> str | None:
    """Utamakan kolom per hari; bila kosong, jatuh ke teks `jam_operasional (Google Maps)`."""
    nilai_hari = [row.get(f"jam_{h.lower()}") for h in HARI]
    ringkas = format_jam_per_hari(nilai_hari)
    if ringkas:
        return ringkas
    return parse_dari_teks(row.get("jam_operasional (Google Maps)"))

# 02 — Arsitektur Sistem Backend

Peta besar cara kerja backend: layer kode, posisi ETL sebagai worker terpisah, permukaan API per peran pengguna, dan batas frontend ↔ backend.

---

## 1. Peta Sistem

```
┌─────────────────────────────────────────────────────────────┐
│ apps/web/ (React + Vite, port 5173)                         │
│   services/*.js  ── memanggil HTTP ──┐                      │
└──────────────────────────────────────┼──────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│ backend/app (FastAPI, port 8000)                            │
│                                                             │
│  main.py ── CORS (origin FE) ── mount /uploads (static)     │
│     │                                                       │
│     └── api/v1/api.py (prefix /api/v1)                      │
│            ├── auth.py        → login/register/me           │
│            ├── categories.py  → kategori ruang publik       │
│            ├── fasilitas.py   → opsi filter fasilitas       │
│            ├── ruang_publik.py→ daftar/detail/stats/laporan │
│            ├── reports(laporan.py)→ laporan + statistik      │
│            ├── users.py       → kelola petugas (admin)      │
│            └── statistics.py  → ringkasan homepage          │
│                    │  Depends(get_db / get_current_*)       │
│                    ▼                                        │
│  app/services/*  (logika bisnis: search, CRUD, statistik)   │
│                    ▼                                        │
│  app/models/*    (SQLAlchemy)  ←→  MySQL (raku-db)          │
│                                                             │
│  app/core/  config · database · security · file_upload      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ETL WORKER (terpisah, script batch — TIDAK jalan di server) │
│   python -m app.etl.read_raw / transform_rth_raw / seed_db  │
│   python -m app.etl.seed_admin                              │
│   data/raw/ → data/processed/ → MySQL                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Layer Kode (wajib diikuti)

Panggilan selalu mengalir ke bawah; **jangan melompati layer**:

| Layer | Lokasi | Tugas | Boleh |
|---|---|---|---|
| Router | `app/api/v1/*.py` | Definisi endpoint, validasi HTTP (Query/Pydantic), `Depends` | Tipis — hanya orkestrasi |
| Dependency | `app/api/deps.py` | `get_db`, `get_current_user`, `get_current_active_user`, `get_current_admin`, `oauth2_scheme` | Dikonsolidasikan, tidak diduplikasi |
| Service | `app/services/*.py` | Logika bisnis: pencarian, CRUD, agregasi statistik, aturan status | Tidak tahu soal HTTP |
| Model | `app/models/*.py` | Pemetaan tabel + relationship + properti turunan | Tidak ada logika bisnis berat |
| Schema | `app/schemas/*.py` | Kontrak request/response Pydantic | Response pakai `from_attributes=True` |

**Contoh alur nyata** `POST /api/v1/reports`:
`laporan.py (router)` → `create_report(service)` → validasi mode identitas → `models/laporan.py` insert + `laporan_timeline` → commit → response `LaporanResponse`.

---

## 3. ETL Worker Terpisah

ETL **bukan bagian dari proses server** — sengaja dipisah karena:

- Sumber data (Satu Data Jakarta) tersedia sebagai **unduhan berkala**, bukan API real-time (PRD §6.3) → sinkronisasi memang periodik, bukan terus-menerus.
- Server tidak boleh mati/hang karena proses transformasi data berat (pandas).
- Seed bisa diulang dengan aman (idempoten) tanpa menyentuh proses yang sedang melayani request.

```
data/raw/*.xls|csv  →  app/etl/read_raw.py
                    →  app/etl/transform_rth_raw.py   (bersih + koordinat X/Y)
                    →  data/processed/ruang_publik.json + categories.json
                    →  app/etl/seed_db.py  (insert ke MySQL, skip ID sudah ada)
```

Detail & urutan kerja: [`features/etl-worker.md`](features/etl-worker.md).

> **Belum ada scheduler otomatis** (cron/celery sengaja tidak dipakai — lihat larangan di `01-tech-stack.md`). Sinkronisasi dijalankan manual. Bila dijadwalkan nanti, cukup dengan OS cron memanggil script yang sama.

---

## 4. Permukaan API per Peran

| Peran | Akses | Contoh |
|---|---|---|
| **Tamu** (tanpa token) | Baca publik + submit laporan anonim | `GET /public-spaces`, `POST /reports` (mode anonim) |
| **Warga** (token role `warga`) | Tamu + laporan atas nama + riwayat sendiri* | `POST /reports` mode `tampilkan_nama`, `GET /auth/me` |
| **Admin** (token role `admin`, `is_active=true`) | Semua baca + moderasi + kelola petugas + statistik | `PATCH /reports/{id}/status`, `GET/POST /users` |

\*filter riwayat per-pengguna = FEAT-013, **belum ada** — lihat `features/report-service.md`.

Jaga permukaan ini lewat dependency `deps.py` — **bukan** pengecekan role manual di dalam router.

---

## 5. Batas Frontend ↔ Backend

| Backend MENYEDIAKAN | Backend TIDAK MENYENTUH |
|---|---|
| REST API `/api/v1/*` | File apa pun di `apps/web/` |
| Static file `/uploads/*` (foto tersimpan) | Logika rendering/peta/OSRM (urusan FE) |
| Skema & enum status yang sudah disepakati | Penentuan tampilan label (FE `StatusBadge`) |
| Migrasi, seed, ETL | State auth di localStorage (FE `AuthContext`) |

**Aturan perubahan kontrak:** jika endpoint/field harus berubah, (1) cek dulu apakah `apps/web/src/services/*.js` memakainya, (2) ubah backend + tulis migrasi jika skema, (3) perbarui `docs/API.md`, (4) catat bahwa FE perlu penyesuaian. Jangan mengubah response field yang dipakai FE secara diam-diam.

---

## 6. Struktur Folder Referensi

```
backend/
├── app/
│   ├── main.py              # bootstrap: CORS, /uploads, health, mount router
│   ├── core/                # config · database · security · file_upload
│   ├── api/
│   │   ├── deps.py          # dependency auth & DB bersama
│   │   └── v1/              # api.py (registrasi) + satu file per topik
│   ├── services/            # logika bisnis (CRUD/search/stats)
│   ├── models/              # SQLAlchemy (Base di base.py)
│   ├── schemas/             # kontrak Pydantic
│   └── etl/                 # worker batch: read_raw, transform, seed
├── alembic/ + alembic.ini   # migrasi (versions/ = 2 revisi saat ini)
├── storage/                 # upload: laporan/ & ruang-publik/ (gitignored)
├── docs/                    # dokumen ini
├── requirements.txt
└── .env / .env.example
```

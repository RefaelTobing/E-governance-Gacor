# 00 — Overview Backend RuangTerbuka

> Dokumen kerja final untuk melanjutkan pengerjaan backend **sesuai PRD**.
> Semua isinya diverifikasi langsung ke kode di `backend/app/` per terakhir ditulis.
> Baca file ini dulu, lalu buka file fitur yang relevan.

---

## 1. Ringkasan Proyek

**RuangTerbuka** adalah platform informasi ruang publik DKI Jakarta: warga menemukan ruang publik (taman, RTH, RPTRA), memeriksa kondisi fasilitasnya, dan melaporkan kerusakan fasilitas yang terikat langsung ke titik lokasi. Pemerintah/petugas memantau dan memoderasi laporan tersebut.

**Stack backend:** Python 3.13 · FastAPI · SQLAlchemy 2 · MySQL 8 (Docker) · Alembic · JWT (PyJWT).

**Bentuk penggunaan dokumen ini:**

```
PRD (definisi fitur & kriteria)
  ↓
File fitur di docs/features/ (status implementasi + langkah kerja)
  ↓
04-api-endpoints.md (kontrak API)
  ↓
Kode di backend/app/ (kebenaran akhir bila konflik dengan dokumen lama)
```

**PRD lengkap (sumber definisi FEAT):** [`../../docs/PRD.md`](../../docs/PRD.md)

---

## 2. Dokumen di Folder Ini

| File | Isi |
|---|---|
| [`01-tech-stack.md`](01-tech-stack.md) | Teknologi & library yang dipakai + alasannya |
| [`02-architecture.md`](02-architecture.md) | Arsitektur sistem: layer, ETL worker terpisah, batas FE↔BE |
| [`03-database-schema.md`](03-database-schema.md) | Skema tabel MySQL, relasi, enum status, strategi merge |
| [`04-api-endpoints.md`](04-api-endpoints.md) | Daftar endpoint (method, path, auth, request/response) |
| [`05-environment-setup.md`](05-environment-setup.md) | Variabel `.env` + cara menjalankan project lokal |
| [`features/public-space-service.md`](features/public-space-service.md) | FEAT-001 s/d 007 |
| [`features/report-service.md`](features/report-service.md) | FEAT-008, 009, 010, 013 |
| [`features/moderation-service.md`](features/moderation-service.md) | FEAT-011 |
| [`features/data-master-service.md`](features/data-master-service.md) | FEAT-012 |
| [`features/admin-auth.md`](features/admin-auth.md) | FEAT-014 |
| [`features/etl-worker.md`](features/etl-worker.md) | Sinkronisasi data Satu Data Jakarta |
| [`06-testing-strategy.md`](06-testing-strategy.md) | Strategi pengujian: pytest, black-box, Postman, concurrent |
| [`GIT_WORKFLOW.md`](GIT_WORKFLOW.md) | Aturan branch & commit |

---

## 3. Peta FEAT → File

| FEAT | Judul | File | Status ringkas* |
|---|---|---|---|
| 001 | Peta Interaktif & Radius | `features/public-space-service.md` | Sebagian (backend siap, koordinat terisi) |
| 002 | Daftar (List View) Ruang Publik | `features/public-space-service.md` | Sebagian (fitur Terdekat: lihat gap unit radius FE↔BE) |
| 003 | Petunjuk Arah (Direction) | `features/public-space-service.md` | Luar lingkup backend (FE + OSRM) |
| 004 | Filter Kategori | `features/public-space-service.md` | Ada |
| 005 | Filter Fasilitas | `features/public-space-service.md` | Ada |
| 006 | Halaman Detail Ruang Publik | `features/public-space-service.md` | Ada |
| 007 | Galeri Foto | `features/public-space-service.md` | Sebagian (foto resmi; foto laporan belum) |
| 008 | Form Lapor Fasilitas | `features/report-service.md` | Sebagian (endpoint create ada; upload foto belum) |
| 009 | Mode Identitas Laporan | `features/report-service.md` | Ada |
| 010 | Visibilitas & Status Laporan | `features/report-service.md` | Sebagian (filter tayang per-ruang publik rusak — lihat gap) |
| 011 | Moderasi Laporan (Admin) | `features/moderation-service.md` | Sebagian (update status ada; validasi enum belum) |
| 012 | Manajemen Data Master | `features/data-master-service.md` | Sebagian (merge ETL jalan, BE-16; endpoint edit admin `PATCH` = BE-33 belum) |
| 013 | Riwayat "Laporan Saya" | `features/report-service.md` | Belum (filter per-pengguna belum ada) |
| 014 | Autentikasi & Otorisasi Admin | `features/admin-auth.md` | Ada (gap: `POST /categories` belum terproteksi) |
| — | Sinkronisasi Satu Data Jakarta | `features/etl-worker.md` | Sebagian (Extract + Transform + Load + penjadwalan BE-14/15/16/17 + trigger admin BE-18 + log hasil run ke DB BE-19 ada; 687 kandidat menunggu review) |

\*Status ringkas per terakhir dokumen dibuat; detail & langkah perbaikan ada di file masing-masing.

---

## 4. Aturan Main Singkat

1. **Kode adalah kebenaran utama.** `docs/API.md` dan `docs/Structure.md` lama sebagian sudah kedaluwarsa — jangan dijadikan acuan tanpa dicek ke kode.
2. **Jangan sentuh `apps/web/`** dari pekerjaan backend. Kebutuhan FE dibaca dari `apps/web/src/services/*.js` (baca saja).
3. **Setiap endpoint admin wajib `Depends(get_current_admin)`** — audit ini sebelum menyatakan selesai.
4. **Setiap perubahan skema = migrasi Alembic baru**, jangan edit migrasi lama.
5. **Sinkronkan `docs/API.md`** setiap kali kontrak endpoint berubah.
6. **Enum status laporan jangan diganti** tanpa koordinasi FE (lihat `03-database-schema.md` §4).

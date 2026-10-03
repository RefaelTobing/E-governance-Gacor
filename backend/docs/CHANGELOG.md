# Changelog Backend

Riwayat pengerjaan task backend. Entri terbaru di atas.
Tanggal memakai format `YYYY-MM-DD`.

Changelog ini ditulis **bersamaan** dengan saat task dicentang di
[TASK_GUIDE_BACKEND.md](TASK_GUIDE_BACKEND.md) - jangan ditunda ke sesi lain.

---

## Aturan Entri

- Satu blok per tanggal: `## YYYY-MM-DD`, urut terbaru di atas.
- Task yang berubah jadi `[x]` wajib punya entri, format:

  ```
  - **[BE-xx]** judul singkat - apa yang berubah (1 baris); verifikasi: hasil singkat
  ```

- Task **Parsial** atau **belum** tidak masuk changelog (statusnya sudah terlihat di task guide).
- Pekerjaan yang bukan task kode (dokumen, konfigurasi) memakai label **Dokumen** / **Chore**.
- Isi ringkas: satu baris per task. Detail teknis cukup di task guide dan commit message.

---

## 2026-10-04

- **Chore** seed fasilitas - `app/etl/seed_fasilitas.py` baru: isi `fasilitas` dengan data contoh per
  ruang publik (id stabil `seed-<hash>-<n>`, dilewati bila lokasi sudah punya fasilitas, `--reset` hanya
  menghapus baris prefix `seed-` dan menolak bila ada laporan menunjuknya); 5428 baris, sebelumnya 0;
  verifikasi: seed dua kali -> `0 baru`, `--reset` + seed ulang -> jumlah sama, fasilitas buatan admin
  tidak tersentuh, `GET /facilities` kini 13 opsi.
- **[BE-53]** CRUD fasilitas admin - endpoint `/api/v1/admin/facilities` (`GET`/`POST`/`PATCH`/`DELETE`
  + `POST /import` CSV multipart) di `app/api/v1/fasilitas.py`, service + validasi status di
  `services/ruang_publik.py`, semua `get_current_admin`, hapus ditolak `409` bila masih dirujuk laporan;
  keputusan path (namespace admin, bukan nested) dicatat di `features/data-master-service.md` §2.2;
  verifikasi: skrip black-box `TestClient` 29 pemeriksaan lolos, tanpa warning SQLAlchemy.
- **Frontend** halaman Kelola Fasilitas tersambung API - `KelolaFasilitasPage.jsx` ditulis ulang
  (daftar + cari + Tambah/Edit/Hapus + impor CSV) memakai `services/fasilitasService.js`;
  `config/api.js` kini menyalin `error.detail` ke `error.message`; kolom "X Terdata" di
  `DataMasterPage.jsx` dihitung dari API (dulu selalu `0`); verifikasi: `npm run build` sukses.
- **[FE-23]** sesi login pemerintah bertahan saat refresh - `AuthContext` hydrate `token`/`user` dari `localStorage`
  lewat lazy initializer `useState(readStoredAuth)` (dulu di `useEffect`, `RequireAuth` sudah Navigate ke
  `/login-pemerintah` sebelum state terisi); `role` diturunkan dari `user`, keluar tetap hanya lewat tombol logout;
  verifikasi: `npm run build` sukses.

## 2026-10-03

- **Dokumen** - buat `TASK_GUIDE_BACKEND.md` (audit 56 task BE-01 s/d BE-56: 9 selesai,
  12 parsial, 35 belum) dari jobdesk induk + hasil audit kode `backend/app/`.
- **Dokumen** - buat `CHANGELOG.md` ini beserta aturan pencatatan, dan pasang aturannya di
  `TASK_GUIDE_BACKEND.md` (Cara Baca + Definition of Done) serta `GIT_WORKFLOW.md` (bagian 7).
- **[BE-05]** penanda field-level merge FEAT-012 - tambah kolom `ruang_publik.field_source` (JSON, NULL = belum
  pernah diedit) + migrasi `c1f4a9d2e073` + helper `mark_fields_edited()` / `is_edited_manually()` / `edited_fields()`
  di `services/ruang_publik.py`, ikut di response detail; verifikasi: `alembic current` = head, penanda tertulis &
  terbaca lintas sesi di MySQL, kolom tak dikenal/kolom sistem ditolak, `python -m app.etl.seed_db` (1200 baris)
  tidak menimpa edit manual; docs disesuaikan (`03-database-schema.md`, `04-api-endpoints.md`,
  `features/data-master-service.md`, `docs/schema.sql`).

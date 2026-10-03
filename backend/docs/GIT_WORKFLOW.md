# GIT_WORKFLOW — Panduan Git Backend

Aturan kerja Git untuk `backend/**` (berlaku untuk seluruh backend docs & kode).

---

## 1. Kerangka Repo

| Fakta | Nilai |
|---|---|
| Remote | `https://github.com/RefaelTobing/E-governance-Gacor.git` |
| Branch utama rilis | `main` (berisi kode yang dideploy/di-demo) |
| Branch kerja | `development` (gabung fitur → menuju `main`) |
| Branch fitur | `feature/<topik>` dari `development`, kembali ke `development` |
| Kondisi HEAD saat ini | `origin` menunjuk ke `main`; branch kerja harian = `dev` lokal (cek dengan `git branch --show-current` sebelum mulai) |
| Repo milik | Multi-role (`RefaelTobing` + kontributor) — **jangan force-push** ke `main`/`development` |

> **Selalu pastikan branch dulu sebelum menulis file:**
> ```powershell
> git branch --show-current      # harus dev / development / feature/..., BUKAN main
> git status                     # periksa file ter-stage sebelum commit
> ```

---

## 2. Conventional Commits (gaya yang sudah terpakai di history)

History repo memakai Conventional Commits campur (`feat:`, `fix(scope):`, `chore:`, `docs:`). Pakai pola yang sama:

```
<type>(<scope>): <subject singkat, bahasa Indonesia tanpa titik>

<body opsional — perubahan signifikan>
```

| Type | Untuk |
|---|---|
| `feat` | Endpoint/layanan baru, gap FEAT yang ditutup |
| `fix` | Perbaikan bug (mis. `fix(moderasi): filter tayang per-ruang publik`) |
| `docs` | `backend/docs/**`, `docs/API.md`, komentar API |
| `chore` | Dependensi, `.gitignore`, konfigurasi, bersih-bersih |
| `refactor` | Pindah kode tanpa ubah perilaku |
| `test` | Menambah/menyesuaikan test |
| `build` / `ci` | `requirements.txt`, workflow CI, Docker |

**Contoh nyata sesuai pekerjaan kita:**

```
feat(reports): tambah filter mine=true untuk riwayat laporan warga
fix(public-space): ganti filter tayang menjadi status yang valid
feat(auth): proteksi POST /categories dengan get_current_admin
docs(backend): tambah 14 dokumen final di backend/docs
```

Aturan subject:
- Bahasa Indonesia, huruf kecil di awal, **tanpa titik di akhir**
- ≤ 72 karakter; body menjelaskan *mengapa*, bukan *apa* (apa sudah terlihat dari diff)

---

## 3. Alur Kerja Fitur

```powershell
# 0. siapkan branch dari development
git fetch origin
git switch development            # atau git switch -c feature/fitur-013 development
git pull

# 1. kerja — commit kecil & sering, satu topik per commit
git add backend/app/api/v1/laporan.py backend/tests/unit/test_laporan.py
git commit -m "feat(reports): tambah filter mine=true untuk riwayat laporan warga"

# 2. verifikasi sebelum push (lihat §4)
..\.venv\Scripts\python.exe -m pytest tests\unit -q
..\.venv\Scripts\python.exe -m ruff check app        # bila ruff tersedia

# 3. push branch fitur
git push -u origin feature/fitur-013

# 4. PR → development (bukan langsung main)
```

Gabung ke `development`:
- PR dari `feature/...` → `development`, review minimal 1 orang
- **Squash atau merge biasa** — ikuti kebiasaan repo; jangan `rebase` branch orang lain
- Setelah merge: `git switch development && git pull`

Rilis `development` → `main`: terpisah, hanya saat siap demo/deploy (dibahas tim, bukan otomatis).

---

## 4. Checklist Sebelum Setiap Commit

- [ ] `git branch --show-current` — bukan `main`
- [ ] `git diff` / `git status` — **tidak ada file tak sengaja** (terutama `.env`, `*.log`, `storage/uploads/**`)
- [ ] Test relevan hijau (`pytest tests\unit -q`)
- [ ] Tidak ada rahasia: `SECRET_KEY`, password, token — hanya nama variabel `.env` yang boleh tertulis di dokumen
- [ ] Satu commit = satu topik; jangan campur kode + format ulang + dokumen besar dalam satu commit
- [ ] Docs ikut di-commit bila mengubah perilaku API (`docs/API.md` sinkron)

---

## 5. Hal yang DILARANG

| Dilarang | Alasan |
|---|---|
| `git push --force` ke `main` / `development` | Menimpa kerja orang lain |
| Commit `.env` atau file isi secret | Cek `git status` sebelum stage; `.env` sudah di-`.gitignore` |
| Commit file test yang di-ignore (`pytest.ini`, `tests/conftest.py`, `tests/unit/test_*.py`) | Sengaja di-ignore — test lokal per-orang; collection Postman **boleh** di-commit |
| Commit file besar mentah `data/raw/*` (xls/csv raksasa) | Pastikan tetap ter-ignore; bila belum, tambahkan |
| Merge tanpa verifikasi API | Minimal jalankan smoke test §4 |
| Mengubah `requirements.txt` tanpa alasan & versi pin | Reviewer harus bisa memahami tiap dependency baru |

---

## 6. Penanganan Konflik (umum di repo multi-role)

```powershell
git switch development && git pull
git switch feature/xxx
git merge development            # atau rebase lokal, sesuai selera tim
# konflik → buka file, cari <<<<<<< HEAD, selesaikan manual
git add <file>
git commit -m "merge: sinkronkan development ke feature/xxx"
```

Prioritas saat konflik di `app/api/v1/api.py` (semua daftarkan endpoint di sini): **gabungkan kedua registrasi endpoint** — jangan ada endpoint yang hilang.

---

## 7. Dokumen yang Wajib Diperbarui Bersama Perubahan API

| Perubahan | File yang disentuh |
|---|---|
| Endpoint baru/ubah | `backend/docs/04-api-endpoints.md`, `docs/API.md` |
| Kolom/tabel baru | `backend/docs/03-database-schema.md` + migrasi Alembic |
| Gap FEAT ditutup | file `backend/docs/features/...` — centang checklist & catat verifikasi |
| Dependency baru | `backend/docs/01-tech-stack.md` (alasan), `requirements.txt` (versi) |
| Task guide dicentang (task selesai) | `backend/docs/TASK_GUIDE_BACKEND.md` + entri bertanggal di `backend/docs/CHANGELOG.md` |
| Perubahan workflow / strategi | file ini (`GIT_WORKFLOW.md`) bila prosesnya berubah |

---

## 8. Perintah Cepat (PowerShell, dari root repo)

```powershell
git status
git log --oneline -10            # gaya history referensi
git fetch origin; git switch development; git pull

# backend (path berspasi — gunakan tanda kutip)
Set-Location "D:\Ruka Jakarta\backend"
..\.venv\Scripts\python.exe -m pytest tests\unit -q
```

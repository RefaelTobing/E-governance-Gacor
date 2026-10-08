# 06 — Strategi Pengujian Backend

Empat lapis pengujian sesuai PRD §8: **unit (pytest) · black-box (API) · Postman · concurrent/load**. Setiap lapis punya perintah jalankan yang bisa ditempel langsung.

> **Fakta kondisi:** folder `backend/tests/` saat ini **tidak ada** (terhapus pada commit lama `chore: ... remove test directories`) dan file test **sengaja di-`.gitignore`** (`backend/pytest.ini`, `backend/tests/conftest.py`, `backend/tests/unit/test_*.py`). Karena itu bagian §3 = panduan **membuat ulang** lokal, bukan menjalankan yang sudah ada.

---

## 1. Peta Pengujian → PRD

| Lapis | PRD | Tujuan | Tool |
|---|---|---|---|
| Unit | §8 "Unit testing" | Logika pencarian radius, filter kategori, alur submit laporan | pytest + SQLite in-memory |
| Black-box | §8 + NFR-002 | Kontrak endpoint: status code, validasi, otorisasi | Swagger `/docs` + curl |
| Postman | `Structure.md` → `tests/postman/` | Koleksi request terdokumentasi untuk QA/tim | Postman / collection JSON |
| Concurrent/load | §8 "Load/stress testing dasar" + NFR-001 | Peta/ratusan–ribuan marker tetap responsif, query radius tidak meledak | k6 / ab / script sederhana (pilihan §5) |
| Validasi data | §8 "Validasi data" | Akurasi koordinat & atribut hasil ETL vs sumber | spot-check (lihat `features/etl-worker.md` §4) |
| UAT | §8 | Alur end-to-end: cari → detail → lapor → tayang | manual bersama pengguna/pembimbing |

---

## 2. Prasyarat

- Semua perintah **wajib `.venv`** (Python global punya httpx/starlette tak kompatibel → `TypeError: Client.__init__() got an unexpected keyword argument 'app'`).
- Dari folder `backend/`.
- Unit test **tidak menyentuh MySQL** — memakai SQLite in-memory (pola yang dipakai test lama sebelum folder terhapus).
- `pytest.ini` harus ada di `backend/` (isi minimal di §3.1) walau di-gitignore — tetap dibuat lokal.

---

## 3. Unit Test (pytest)

### 3.1 Setup lokal

```
backend/
├── pytest.ini          # [pytest]  testpaths = tests   ·  pythonpath = .
├── tests/
│   ├── conftest.py     # fixture: app + SQLite in-memory + TestClient
│   └── unit/
│       ├── test_public_space.py
│       ├── test_laporan.py
│       └── test_admin_auth.py
```

`conftest.py` (kerangka — sesuaikan import dengan kode nyata):

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db
from app.models.base import Base

engine = create_engine(
    "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
)
TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)

@pytest.fixture()
def db_session(monkeypatch):
    Base.metadata.create_all(engine)
    with TestingSession() as s:
        yield s
    Base.metadata.drop_all(engine)

@pytest.fixture()
def client(db_session):
    def _override():
        yield db_session
    app.dependency_overrides[get_db] = _override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

Jalankan:

```powershell
cd "d:\Ruka Jakarta\backend"
..\.venv\Scripts\python.exe -m pytest tests\unit -q
```

### 3.2 Test minimum (ikat ke FEAT — peta di `00-overview.md` §3)

| Test file | Kasus wajib (gabungan dari test-regresi di file fitur) |
|---|---|
| `test_public_space.py` | radius menyaring (kecil vs besar) · `jarak_km` terisi saat lat/long · filter `category` · filter `facilities` AND · detail 200/404 · `/stats` punya 3 key |
| `test_laporan.py` | create anonim 201 `nama_pelapor None` · `tampilkan_nama` tanpa token 400 · `tampilkan_nama` + token → nama dari user · status awal + timeline · **mine=true isolasi antar-user** · **filter tayang: `menunggu_verifikasi` tidak muncul, `diverifikasi` muncul** · PATCH status sah 200 / ngawur 4xx (setelah validasi enum) · upload: JPEG ok, `.txt` 400, >5MB 400 · **status endpoint: pemilik 200, pihak lain 403, anonim id-sebagai-bukti 200** · **flag: 201 + `flag_count`, dobel 409, pelapor sendiri 403, belum tayang 400, tanpa token 401** |
| `test_admin_auth.py` | register role `admin` ditolak 400 · warga → `/users` 403 · admin aktif terakhir `DELETE` 409 · akun sendiri 400 · nonaktif → login 403 · activate → login ok · `POST /categories` tanpa token 401 (setelah gap ditutup) |
| `test_rate_limit.py` | 11x `POST /reports` → 429 + `Retry-After` · lewat jendela 10 menit → normal · token berbeda di IP sama tidak saling jerat · `POST /uploads` ikut kena · endpoint/method lain 11x tetap lolos · `RATE_LIMIT_ENABLED=false` lolos semua (BE-26) |

Prinsip: **tulis test bersamaan saat menutup gap** di file fitur (tiap gap punya checklist "test regresi wajib" — tempelkan ke file test yang sesuai).

### 3.3 Histori Hasil Uji Unit Test

| Tanggal | Target Task | Suite | Hasil | Catatan |
|---|---|---|---|---|
| 2026-10-04 | BE-18 | `tests/unit/test_admin_sync.py` | 6 passed | Trigger manual sync ETL, status code & lock |
| 2026-10-05 | BE-19 | `tests/unit/test_etl_run_log.py` | 12 passed | Logging riwayat run ETL ke DB & pembacaan API |
| 2026-10-05 | BE-20, BE-46, BE-49 | `tests/unit/test_laporan.py` | 23 passed | 11 test laporan baru (upload, MIME, koordinat, anti-spoofing) + 12 test lama |
| 2026-10-08 | BE-24, BE-25 | `tests/unit/test_laporan.py` | 77 passed | 14 test baru: endpoint status (pemilik/pihak lain/admin/anonim/404/nonaktif) + flag (201/409/403/400/401/404) |
| 2026-10-08 | BE-26 | `tests/unit/test_rate_limit.py` | 83 passed | 6 test rate limit baru: ambang 429 + `Retry-After`, jendela terlewat, kunci hybrid per token, `/uploads` kena, endpoint lain lolos, toggle `RATE_LIMIT_ENABLED` |

---

## 4. Black-Box Testing (kontrak API)

Tujuan: memastikan **status code + payload** sesuai `04-api-endpoints.md` tanpa peduli implementasi dalam.

**Alat utama: Swagger** <http://localhost:8000/docs> (Try it out) dan **curl**.

Rute minimum yang selalu dijalankan sebelum menyatakan selesai:

| # | Skenario | Ekspektasi |
|---|---|---|
| 1 | `GET /health` | 200 (ingat: ≠ DB siap) |
| 2 | Login admin valid / salah / nonaktif | 200 / 400 / 403 |
| 3 | `GET /public-spaces` + radius 0.01 vs 50 | jumlah hasil berbeda (radius bekerja) |
| 4 | `GET /public-spaces/{id}` valid / palsu | 200 / 404 |
| 5 | `POST /reports` anonim / `tampilkan_nama` tanpa token | 201 / 400 |
| 6 | `GET /reports?mine=true` tanpa token / dengan token | 401 / hanya milik pemanggil |
| 7 | `PATCH /reports/{id}/status` warga / admin valid / status ngawur | 403 / 200 / 4xx |
| 8 | Semua `/users*` dengan token warga | 403 |
| 9 | `POST /categories` tanpa token (setelah gap) | 401 |
| 10 | Upload: jpg ok · txt · >5MB | 2xx / 400 / 400 |

Simpan transkrip curl penting ke collection Postman (§5) agar tidak hilang.

---

## 5. Postman

- Struktur repo mengharapkan `backend/tests/postman/` (lihat `docs/Structure.md`) — buat folder + `ruangterbuka.postman_collection.json` (di-gitignore? **tidak** — hanya `pytest.ini`/`conftest`/`test_*.py` yang di-ignore, jadi collection **boleh & sebaiknya di-commit** sebagai dokumentasi).
- Isi minimal per folder: **Auth** (login admin/warga, me) · **Public Space** (list+radius, stats, detail, 404) · **Laporan** (create anonim/login, mine, detail, PATCH status) · **Admin Users** (CRUD + guard 403/409) · **Upload**.
- Variabel environment: `base_url=http://localhost:8000`, `admin_token`, `warga_token` (isi lewat login request, bukan hardcode sandi di collection selain akun seed dev).

---

## 6. Concurrent / Load Testing Dasar (NFR-001, PRD §8)

**Tujuan:** (a) query radius & list tetap responsif pada skala ribuan baris; (b) server tidak sekarat saat banyak request bersamaan; (c) FEAT-001 "marker tetap responsif untuk skala ratusan–ribuan titik" — sisi backend = response time list.

**Skenario minimum:**

1. **Burst list:** 100 request paralel `GET /public-spaces?lat=...&long=...&radius=5` → ukur p50/p95 < ambang (mis. p95 < 1.5 detik di mesin dev). Bila lambat, cek: Haversine ter-index? (opsional: index pada `latitude`/`longitude` — hanya bila bukti lambat, jangan preemptif.)
2. **Banyak titik:** set seed penuh (5542 baris) → list `limit=500` tanpa N+1 (sudah `joinedload` — verifikasi dengan log query SQLAlchemy saat debug).
3. **Endpoint berat relatif:** `GET /reports/stats/dashboard` (4 query count) 50x paralel.

**Tool (pilih satu, tanpa dependency permanen):**

```powershell
# opsi ringan: PowerShell job paralel (sekali jalan)
1..100 | ForEach-Object -Parallel {
  (Invoke-WebRequest "http://localhost:8000/api/v1/public-spaces?lat=-6.1754&long=106.8272&radius=5&limit=100" -SkipHttpErrorCheck).StatusCode
} -ThrottleLimit 20
```

Atau `k6` / `ab` bila terpasang — **jangan** menambahkannya ke `requirements.txt` (alat QA mesin dev, bukan dependensi aplikasi).

**Catatan jujur (batas MVP):** pengujian end-to-end performa **peta** (clustering ribuan marker) berada di sisi FE (Leaflet) — di sini hanya dibuktikan API-nya sanggup menyediakan datanya.

---

## 7. Cakupan Berdasarkan PRD §8 (checklist QA akhir proyek)

- [ ] **Validasi data:** spot-check sampel koordinat & atribut hasil ETL vs file sumber (`features/etl-worker.md` §4)
- [ ] **Unit testing:** `pytest tests\unit -q` hijau (dengan `.venv`)
- [ ] **Black-box:** tabel §4 dijalankan, semua sesuai
- [ ] **Postman:** collection terisi & bisa di-run tanpa hand-edit
- [ ] **Load dasar:** skenario §6 dijalankan, hasil dicatat
- [ ] **Usability testing** (PRD §8): sesi dengan calon warga — cari ruang publik, isi lapor, pahami mode anonim (sesi manusia, di luar skrip otomatis)
- [ ] **UAT** (PRD §8): alur lengkap cari → detail → lapor → lolos moderasi → tayang → Laporan Saya, bersama pembimbing

---

## 8. Aturan

1. Test **tidak boleh gagal karena MySQL mati** — unit pakai SQLite; pengujian yang butuh DB dijalankan terpisah dan diberi label jelas.
2. Jangan menulis test yang meng-assert nilai hardcode rapuh (mis. jumlah total baris seed) — assert relasi/aturan (radius menyaring, status benar).
3. Test baru = file baru di `tests/unit/`, jangan menumpuk satu file raksasa.
4. Setelah menutup gap di file fitur → **tambahkan test-nya di sesi yang sama** (definisi selesai).
5. `pytest.ini` lokal minimal:
   ```ini
   [pytest]
   testpaths = tests
   pythonpath = .
   ```

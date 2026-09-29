# Raku Jakarta (Ruang Terbuka Jakarta)

Sistem Informasi Ruang Publik dan Pelaporan Fasilitas Berbasis Web di Kota Jakarta.
## Mulai Cepat

Butuh 3 terminal: database, backend, frontend.

```bash
# 1. Database (Docker Desktop harus jalan dulu)
docker compose up -d
cd "d:\Ruka Jakarta\backend" && ..\.venv\Scripts\python.exe -m alembic upgrade head

# 2. Backend  -> http://localhost:8000/docs
cd "d:\Ruka Jakarta\backend" && ..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload

# 3. Frontend -> http://localhost:5173
cd "d:\Ruka Jakarta\apps\web" && npm run dev
```

Detail lengkap, termasuk setup pertama kali, seeding, dan troubleshooting:
**[docs/RUNNING.md](docs/RUNNING.md)**

Daftar semua endpoint API: **[docs/API.md](docs/API.md)**

## Dokumentasi

| File | Isi |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Apa yang harus dibangun |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | Aturan menulis kode frontend |
| [docs/Structure.md](docs/Structure.md) | Struktur folder |
| [docs/API.md](docs/API.md) | Daftar endpoint backend |
| [docs/RUNNING.md](docs/RUNNING.md) | Cara menjalankan semua service |
| [docs/schema.sql](docs/schema.sql) | Skema database |
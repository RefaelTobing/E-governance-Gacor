# features — Admin Auth (FEAT-014)

> **Scope file ini HANYA FEAT-014 (Autentikasi & Otorisasi Admin)** — sesuai PRD [`../../../docs/PRD.md`](../../../docs/PRD.md).
> Login/register warga sebagai alur produk & laporan → `report-service.md`; hanya lapisan keamanan/otorisasi di sini.

Kode terkait:
- Router: `app/api/v1/auth.py` (login/register/me), `app/api/v1/users.py` (kelola petugas)
- Dependency: `app/api/deps.py` — `oauth2_scheme`, `get_current_user`, `get_current_active_user`, `get_current_admin`
- Keamanan: `app/core/security.py` (hash bcrypt, JWT HS256)
- Schema: `app/schemas/user.py` — `ROLE_WARGA`, `ROLE_ADMIN`, `ROLE_PUBLIK`, `AdminCreate`, `AdminUpdate`
- Service: `app/services/user.py`
- Seed: `app/etl/seed_admin.py`

---

## Status Ringkas

| Aspek FEAT-014 (PRD, baru ditambahkan) | Status |
|---|---|
| Login terpisah untuk petugas (role admin) | **Selesai** — `POST /admin/login` menolak non-admin `403` sebelum issue token (BE-34) |
| Register publik hanya `warga` | **Selesai** (role dipaksa di dua lapis) |
| Endpoint admin ditolak untuk non-admin & akun nonaktif | **Selesai** (`get_current_admin`) |
| Sesi JWT masa berlaku terbatas | **Selesai** (7 hari) |
| Tambah/ubah/nonaktifkan/aktifkan petugas | **Selesai** (endpoint `/users`) |
| Admin aktif terakhir tidak bisa dinonaktifkan | **Selesai** (guard `409`) |
| Proteksi seluruh endpoint admin termasuk `POST /categories` | **Sebagian** — semua `/admin/*` terverifikasi `get_current_admin` (BE-35); `POST /categories` masih bocor → BE-54 |
| Refresh / revoke token | **Selesai** — `POST /auth/logout` + blacklist `jti` (BE-55, Opsi A) |

---

## 1. Arsitektur Keamanan (yang sudah ada — pertahankan)

### 1.1 Token (JWT)

| Aspek | Nilai |
|---|---|
| Algoritma | HS256, kunci `SECRET_KEY` (`config.py`) |
| Claim | `sub` = `user.id`, `exp` = +`ACCESS_TOKEN_EXPIRE_MINUTES` (default **7 hari**) |
| Buat | `create_access_token(subject)` — dipanggil saat login |
| Baca | `verify_token(token)` → dict / `None` (gagal → None, bukan exception bocor) |
| Format header | `Authorization: Bearer <token>` |
| Login form | `application/x-www-form-urlencoded`, field **`username` = email** (standar OAuth2 password flow) |

### 1.2 Rantai Dependency (`deps.py`) — SATU-SATUNYA gerbang role

```
oauth2_scheme          → ambil token dari header (401 bila hilang)
  └ get_current_user   → verify_token → load User (401 bila token/user tak ada)
      └ get_current_active_user → cek is_active (403 "Akun dinonaktifkan")
          └ get_current_admin    → cek role == "admin" (403 "Hanya admin...")
```

**Aturan:** endpoint admin WAJIB memakai `Depends(get_current_admin)`. **Jangan** pernah:
- cek `role` manual di dalam body router,
- memanggil `get_current_user` saja untuk endpoint admin (melewati cek active),
- mempercayai field role dari body request.

### 1.3 Password

- Hash: passlib `CryptContext(schemes=["bcrypt"])` → `get_password_hash` / `verify_password`.
- **bcrypt di-pin `4.2.1`** — jangan diupgrade (warning `error reading bcrypt version` di log = kosmetik, lihat `01-tech-stack.md`).
- Minimal 8 karakter — divalidasi Pydantic (`_validasi_sandi`), berlaku register publik, tambah petugas, reset sandi.

### 1.4 Pertahanan role di register (sudah berlapis 2 — jangan dilepas)

1. `auth.py::register` → `if user_in.role not in ROLE_PUBLIK: 400` (hanya `warga` diizinkan)
2. Service dipanggil dengan `role=ROLE_WARGA` **hardcode** — nilai body tidak pernah diteruskan

Hasil: **mustahil** membuat akun admin lewat endpoint publik. Admin hanya lahir dari `POST /users` (sesi admin) atau `seed_admin`.

### 1.5 Login petugas terpisah (`POST /admin/login`, BE-34)

- Endpoint: `admin_router` di `app/api/v1/auth.py`, didaftarkan `api.py` → `POST /api/v1/admin/login`.
- Kredensial diverifikasi helper bersama `_autentikasi()` (dipakai juga `/auth/login`): user + sandi → `400`, akun nonaktif → `403`.
- **Beda kunci:** `role != admin` → `403 "Endpoint ini khusus petugas"`, jadi warga dengan sandi benar tetap ditolak di jalur petugas.
- Body = OAuth2 form-urlencoded (`username`=email), response `Token` sama seperti publik.
- **Keputusan:** `/auth/login` lama **tetap** menerima semua role untuk FE publik & warga; endpoint ini **menambah** jalur petugas, bukan mengganti. Pengetatan proteksi endpoint admin yang masih bocor tetap tugas BE-35/BE-52/BE-54.
- **FE:** `LoginPemerintahPage` saat ini masih memanggil `/auth/login`; mengarahkannya ke `/admin/login` adalah sesi FE (opsional, tidak menahan BE-34).

---

## 2. Endpoint Kelola Petugas (`/api/v1/users`) — semuanya admin

| Method | Path | Body / Query | Perilaku & guard |
|---|---|---|---|
| `GET` | `/users` | `?include_inactive=true` | Daftar petugas (default hanya aktif), urut nama |
| `POST` | `/users` | `{ name, email, password }` | Buat petugas; **role dipaksa `admin`** (schema `AdminCreate` tanpa field role); `400` email terpakai; `422` sandi <8 / email invalid |
| `PATCH` | `/users/{user_id}` | `{ name?, password? }` | Ubah nama / reset sandi. Email **tidak bisa** diganti. Boleh ubah akun sendiri (termasuk sandi aktif) |
| `DELETE` | `/users/{user_id}` | — | **Nonaktifkan** (`is_active=false`), bukan hapus — laporan petugas harus tetap punya pemilik |
| `POST` | `/users/{user_id}/activate` | — | Kembalikan akses |

**Urutan guard `DELETE` (sudah benar di kode — pertahankan):**

1. `404` — id bukan admin yang ada (helper `_ambil_admin` menolak non-admin)
2. **`409` — admin aktif terakhir** (dicek dulu: jalan keluar = tambah admin lain)
3. `400` — mencoba menonaktifkan akun yang sedang dipakai sendiri
4. `200` → `is_active=false`

> Pesan 409 sengaja lebih dulu karena jalan keluar sama → UI tidak menampilkan pesan "tidak bisa ubah akun sendiri" yang menyesatkan.

**Mengapa soft-delete:** baris `laporan.user_id` FK → hard delete akan kehilangan pemilik riwayat laporan (FEAT-013).

---

## 3. Seed Admin Pertama

```powershell
cd "d:\Ruka Jakarta\backend"
..\.venv\Scripts\python.exe -m app.etl.seed_admin
```

- Nilai dari `.env`: `ADMIN_SEED_NAME`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`
- **Idempoten**: email sudah ada → keluar tanpa perubahan
- Aman dijalankan berulang; setelah halaman Kelola Admin dipakai, baris env ini boleh dihapus (lihat komentar di `.env.example`)

---

## 4. Gap & Langkah

### Gap 1 — `POST /api/v1/categories` belum terproteksi (wajib)

Saat ini `create_category` **tanpa `Depends(get_current_admin)`** → siapa pun tanpa login bisa membuat kategori (data master bisa dirusak publik).

**Langkah:**
- [ ] Tambahkan `_: User = Depends(get_current_admin)` ke `create_category` (ikuti pola `users.py`)
- [ ] Test: tanpa token → `401`; token warga → `403`; token admin → `201`
- [ ] Catat perubahan di `04-api-endpoints.md` (tabel sudah ditandai ⚠) dan `docs/API.md`

**Verifikasi:**
```bash
curl -X POST http://localhost:8000/api/v1/categories -H "Content-Type: application/json" \
  -d '{"id":"tes","label":"Tes"}'                        # → 401
curl ... -H "Authorization: Bearer $WARGA_TOKEN"         # → 403
curl ... -H "Authorization: Bearer $ADMIN_TOKEN"         # → 201
```

### Gap 2 — Refresh / revoke token (opsional, keputusan eksplisit)

Token stateless 7 hari, **tidak bisa dicabut** selain mengganti `SECRET_KEY` (semua sesi hangus) atau menonaktifkan akun (cek `is_active` dilakukan setiap request lewat `get_current_active_user` — akun nonaktif langsung ditolak meski token masih hidup ✅).

**Keputusan yang harus ditulis di sini:**
- [ ] **Opsi A (cukup untuk MVP — disarankan):** tanpa refresh endpoint; andalkan cek `is_active` + masa 7 hari. Cukup dokumentasikan.
- [x] **Opsi B (dipilih — versi minimal, BE-55):** `POST /auth/logout` menyimpan blacklist; tanpa endpoint refresh terpisah.

**Keputusan (2026-10-08, BE-55):** Opsi B versi minimal. `POST /auth/logout` menyimpan `jti` token ke tabel `token_blacklist` (`jti` PK + `expires_at`); token yang sudah logout ditolak `401` di semua endpoint terproteksi lewat helper `services/token.py::user_dari_token()`, dipakai `deps.get_current_user` **dan** titik otorisasi laporan (`laporan.py`) supaya pencabutan benar-benar berlaku. **Tidak** ada endpoint refresh terpisah (masa berlaku tetap 7 hari): baris blacklist kedaluwarsa dibuang oportunistik saat logout, dan cek `is_active` tetap jadi lapisan kedua. Sesi lain milik user yang sama tidak ikut tercabut (`jti` per-token).

### Gap 3 — Audit proteksi admin (checklist, bukan pengembangan baru)

> **Hasil audit (2026-10-08, BE-35):** seluruh endpoint `/api/v1/admin/*` memakai `get_current_admin`, kecuali `POST /admin/login`. Endpoint admin yang hidup di prefix publik (`/users*`, `/reports/stats/*`, `PATCH /reports/{id}/status`) juga sudah dijaga `get_current_admin`; pathnya sengaja dibiarkan agar kontrak FE tidak putus. Konvensi `/admin/*` dikunci test `tests/unit/test_admin_guard.py`. Sisa bocor: `POST /categories` (Gap 1 / BE-54).

- [x] Grep seluruh `app/api/v1/*.py`: setiap endpoint yang menulis data admin/moderasi punya `get_current_admin`
  ```powershell
  Select-String -Path "app\api\v1\*.py" -Pattern "@router\.(post|patch|put|delete)"
  ```
  untuk tiap temuan, pastikan fungsi terkait memuat `Depends(get_current_admin)` — kecuali `POST /auth/register`, `POST /reports`, dan endpoint upload yang memang publik/opsional.
- [x] `GET /users*` (semua method) terproteksi
- [x] CORS: `allow_origins` hanya `FRONTEND_PUBLIC_URL` + `FRONTEND_ADMIN_URL` (+ localhost dev), bukan `*` (`main.py`)
- [ ] `SECRET_KEY` di `.env` produksi **bukan** nilai default `.env.example`

---

## 5. Test Regresi Wajib

- [ ] Login admin valid → 200 + token; sandi salah → 400; akun nonaktif → 403
- [ ] `GET /auth/me` dengan token valid → profil; tanpa token → 401
- [ ] Register role `admin` di body → 400; role `warga` → 201 dengan role `warga`
- [ ] Register email sama → 400; sandi 7 karakter → 422; email kapitalisasi beda → ditolak/diseragamkan (tidak dobel)
- [ ] Warga memanggil semua `/users*` → 403
- [ ] Nonaktifkan admin terakhir → 409; akun sendiri → 400; admin lain → 200 lalu login-nya → 403
- [ ] Activate → bisa login lagi
- [ ] `POST /categories` tanpa token → 401 (setelah Gap 1)
- [ ] Token kadaluarsa → 401 (uji dengan `ACCESS_TOKEN_EXPIRE_MINUTES` kecil sementara di test)

---

## 6. Verifikasi Akhir File Ini

- [ ] Hanya membahas FEAT-014
- [ ] Gap 1 (proteksi kategori) tertutup **atau** tercatat sebagai pekerjaan tersisa dengan verifikasi siap jalankan
- [ ] Keputusan Gap 2 (opsi A/B) ditulis eksplisit
- [ ] Audit Gap 3 dijalankan minimal sekali dan hasilnya dicatat
- [ ] `04-api-endpoints.md` & `docs/API.md` sinkron

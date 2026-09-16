# Product Requirement Document (PRD)
# Raku Jakarta (Ruang Terbuka Jakarta)
### Sistem Informasi Ruang Publik dan Pelaporan Fasilitas Berbasis Web di Kota Jakarta

---

## 1. Ringkasan Produk

Raku Jakarta adalah platform web yang memetakan ruang publik (taman kota, RTH, RPTRA, dan kategori ruang terbuka lain) di DKI Jakarta sekaligus menyediakan kanal pelaporan kondisi fasilitas pada tiap ruang publik tersebut secara terbuka. Pengguna dapat menemukan ruang publik terdekat, melihat detail fasilitas dan jam operasional, mendapatkan arah menuju lokasi, serta melaporkan kerusakan atau kondisi fasilitas yang terikat langsung pada titik lokasi bersangkutan — dengan pilihan identitas anonim atau tampilkan nama.

**Stack teknologi:** ReactJS (frontend), Python FastAPI (backend/REST API), MySQL (database).

---

## 2. Latar Belakang

Pemprov DKI Jakarta melalui Jakarta Smart City telah mengoperasikan JAKI, super-app yang memuat fitur peta ruang publik (taman, RPTRA, area parkir) dan fitur pelaporan warga bernama **JakLapor**. JakLapor memungkinkan laporan bersifat publik atau privat/rahasia, dan tindak lanjutnya bisa dipantau lewat fitur JakRespons atau crm.jakarta.go.id.

Namun berdasarkan pengamatan terhadap cara kerja fitur peta ruang publik di JAKI, ada celah yang bisa diisi:

- Fitur "ruang publik" dan fitur "lapor" di JAKI berjalan sebagai dua modul terpisah — JakLapor adalah kanal pengaduan umum kota (semua jenis masalah pelayanan publik), bukan modul yang menempel langsung pada tiap entri direktori ruang publik.
- Foto pada listing ruang publik di JAKI masih berupa foto dummy/generik, belum representatif terhadap kondisi aktual tiap lokasi.
- Belum ada tampilan riwayat laporan fasilitas yang terikat ke satu titik ruang publik spesifik dan dapat dibaca publik sebagai referensi sebelum berkunjung.

Raku Jakarta diposisikan untuk mengisi celah ini: direktori ruang publik yang setiap entrinya punya "wall" pelaporan fasilitas sendiri, terbuka dibaca semua orang, dengan opsi privasi identitas pelapor.

---

## 3. Tujuan & Target Pengguna

### Tujuan
1. Menyediakan direktori ruang publik Jakarta yang mudah dicari berdasarkan lokasi dan kategori.
2. Menyediakan kanal pelaporan kondisi fasilitas yang terikat langsung ke titik ruang publik, transparan, dan dapat menjadi referensi warga lain.
3. Memanfaatkan data terbuka resmi (Satu Data Jakarta) sebagai basis data ruang publik, dilengkapi data partisipatif dari pengguna.

### Target Pengguna
- **Warga umum Jakarta** — mencari ruang publik terdekat sesuai kebutuhan (misal ruang ramah anak, taman untuk olahraga).
- **Komunitas/relawan kota** — memantau dan melaporkan kondisi fasilitas publik secara berkala.
- **Wisatawan domestik** — mencari ruang terbuka publik saat berkunjung ke Jakarta.
- (Tidak langsung) **OPD terkait** (misal Dinas Pertamanan dan Hutan Kota, Dinas Perumahan Rakyat dan Kawasan Permukiman) sebagai pihak yang berpotensi memanfaatkan data laporan di tahap pengembangan lanjutan.

---

## 4. Fitur Utama & Requirement

### 4.1 Functional Requirements

| ID | Fitur | Deskripsi | Requirement / Kriteria Penerimaan |
|---|---|---|---|
| FEAT-001 | Peta Interaktif & Radius | Menampilkan titik ruang publik di peta berdasarkan lokasi pengguna | Radius pencarian dapat diatur pengguna (default mengikuti pola JAKI: ±10 km); marker ter-cluster saat kepadatan tinggi |
| FEAT-002 | Daftar (List View) Ruang Publik | Menampilkan ruang publik dalam radius dalam bentuk list | Dapat diurutkan berdasarkan jarak terdekat; sinkron dengan hasil di peta |
| FEAT-003 | Petunjuk Arah (Direction) | Menampilkan rute dari lokasi pengguna ke ruang publik terpilih | Terintegrasi dengan layanan routing (lihat bagian 6.4); menampilkan estimasi jarak/waktu tempuh |
| FEAT-004 | Filter Kategori Ruang Publik | Menyaring hasil pencarian berdasarkan kategori (RTH/taman kota, RPTRA, hutan kota, dll.) | Filter dapat dikombinasikan dengan filter fasilitas (FEAT-005) |
| FEAT-005 | Filter Berdasarkan Fasilitas | Menyaring ruang publik berdasarkan fasilitas yang tersedia (area bermain anak, jalur lari, toilet umum, area parkir, dll.) | Daftar fasilitas bersumber dari data master, dapat bertambah tanpa migrasi besar |
| FEAT-006 | Halaman Detail Ruang Publik | Menampilkan nama, kategori, alamat/kelurahan, koordinat, jam operasional, deskripsi, dan daftar fasilitas | Field yang tidak tersedia pada sumber data ditandai eksplisit "data tidak tersedia", bukan dikosongkan begitu saja |
| FEAT-007 | Galeri Foto | Menampilkan foto ruang publik, gabungan dari sumber data resmi dan unggahan pengguna | Foto hasil laporan pengguna (FEAT-008) otomatis masuk ke galeri setelah lolos moderasi |
| FEAT-008 | Form Lapor Fasilitas | Formulir pelaporan yang terikat ke satu titik ruang publik: foto, deskripsi, kategori masalah (fasilitas rusak, kebersihan, keamanan, penerangan, dll.) | Wajib memilih kategori masalah dan mengisi deskripsi; foto opsional atau wajib (ditentukan saat desain detail) |
| FEAT-009 | Mode Identitas Laporan | Pengguna memilih tampil **anonim** atau **tampilkan nama** saat submit laporan | Pilihan wajib dipilih sebelum submit; default disarankan ke anonim |
| FEAT-010 | Visibilitas & Status Laporan | Laporan yang lolos moderasi tayang publik dan dapat dibaca semua pengguna, terikat ke entri ruang publik terkait | Status laporan (baru/ditinjau/terverifikasi/ditolak) terlihat oleh pelapor |
| FEAT-011 | Moderasi Laporan (Admin) | Panel admin untuk meninjau laporan sebelum/​sesudah tayang, mencegah spam atau konten tidak relevan | Minimal mendukung aksi setujui/tolak laporan; dapat ditambah mekanisme flag oleh pengguna lain |
| FEAT-012 | Manajemen Data Master Ruang Publik | Admin dapat mengimpor/memperbarui data ruang publik dari Satu Data Jakarta, serta mengedit manual bila perlu | Perubahan manual tidak hilang saat sinkronisasi ETL berikutnya (perlu strategi merge) |

### 4.2 Non-Functional Requirements

| ID | Aspek | Requirement / Kriteria Penerimaan |
|---|---|---|
| NFR-001 | Kinerja | Peta tetap responsif untuk skala ratusan–ribuan titik (marker clustering) |
| NFR-002 | Keamanan | Validasi upload foto (tipe & ukuran file), rate-limiting pada endpoint lapor untuk mencegah spam, penyimpanan kredensial pengguna terdaftar yang aman (hashing) |
| NFR-003 | Aksesibilitas & Responsivitas | Web dapat diakses dengan baik di desktop maupun mobile browser |
| NFR-004 | Skalabilitas Data | Struktur database mendukung penambahan kategori ruang publik dan kategori fasilitas baru tanpa migrasi besar |

---

## 5. Alur Sistem

**Alur pengguna (pencarian & pelaporan):**
1. Pengguna membuka Raku Jakarta → sistem meminta/menggunakan lokasi pengguna (atau input manual).
2. Sistem menampilkan peta + daftar ruang publik dalam radius, dengan opsi filter kategori/fasilitas.
3. Pengguna memilih satu ruang publik → sistem menampilkan halaman detail (fasilitas, jam operasional, foto, riwayat laporan).
4. Pengguna dapat meminta arah (direction) ke lokasi, atau mengirim laporan fasilitas dari halaman detail tersebut.
5. Saat mengirim laporan: pengguna mengisi kategori masalah, deskripsi, foto, dan memilih mode identitas (anonim/tampilkan nama) → laporan masuk ke antrian moderasi.
6. Setelah lolos moderasi, laporan tayang publik dan terikat ke entri ruang publik terkait, dapat dibaca pengguna lain.

**Alur data (ETL data resmi):**
1. Proses berkala (cron job/scheduled task di backend FastAPI) mengambil/mengunduh dataset terkait ruang publik dari Satu Data Jakarta.
2. Data dibersihkan dan dinormalisasi (standardisasi kategori, koordinat) lalu disimpan/diperbarui ke tabel master di MySQL.
3. Data partisipatif (laporan, foto pengguna) disimpan terpisah namun direlasikan ke ID ruang publik yang sama.

---

## 6. Sumber Data & Teknologi

### 6.1 Data Resmi
- **Satu Data Jakarta** (satudata.jakarta.go.id) — portal data terbuka resmi Pemprov DKI Jakarta di bawah amanat Peraturan Gubernur DKI Jakarta No. 37 Tahun 2022, menyediakan ribuan dataset publik termasuk kategori ruang publik seperti Data Ruang Terbuka Hijau (RTH) yang dikelola Dinas Pertamanan dan Hutan Kota, dan Data Ruang Publik Terpadu Ramah Anak (RPTRA).
- **Jakarta Satu Geoportal** (jakartasatu.jakarta.go.id) — portal integrasi peta dan data spasial Pemprov DKI Jakarta di bawah program "Satu Peta, Satu Data, Satu Kebijakan", menyediakan layer peta dasar (mis. peta jalan) berbasis ArcGIS REST/MapServer yang dapat dipakai sebagai referensi koordinat/basemap.

### 6.2 Data Partisipatif
- Laporan kondisi fasilitas dari pengguna (foto, deskripsi, kategori masalah, mode identitas).
- Foto tambahan ruang publik yang diunggah pengguna, untuk melengkapi/menggantikan foto dummy pada data resmi.

### 6.3 Info Keterbatasan Data
- Sebagian dataset di Satu Data Jakarta tersedia dalam bentuk unduhan (CSV/Excel) melalui portal, bukan selalu sebagai REST API real-time, sehingga sinkronisasi data resmi ke sistem Raku perlu dilakukan lewat proses ETL berkala, bukan pemanggilan API langsung yang selalu real-time.
- Kelengkapan atribut (jam operasional, daftar fasilitas rinci, foto) antar dataset/kategori ruang publik kemungkinan tidak seragam — sebagian ruang publik mungkin hanya punya data lokasi tanpa deskripsi lengkap, sehingga field tersebut perlu ditandai "tidak tersedia" atau dilengkapi bertahap lewat data partisipatif.

### 6.4 Teknologi & Tech Stack
| Layer | Teknologi | Catatan |
|---|---|---|
| Frontend | ReactJS | UI peta, direktori, form lapor |
| Peta interaktif | Leaflet / Mapbox GL JS (pustaka open-source, terpisah dari tech stack inti) | Menampilkan marker + clustering |
| Routing/Direction | OpenRouteService atau OSRM (open-source) sebagai alternatif non-berbayar, atau Google Maps Directions API bila anggaran/kuota memungkinkan | Perlu dipilih & diverifikasi kuota/lisensinya sebelum implementasi |
| Backend | Python FastAPI | REST API untuk direktori, laporan, autentikasi |
| Database | MySQL | Termasuk kolom koordinat (lat/long) untuk query lokasi; evaluasi kebutuhan fungsi spasial MySQL (ST_Distance_Sphere dsb.) untuk pencarian radius |
| Penyimpanan foto | Object storage (mis. lokal/self-hosted atau layanan S3-compatible) | Untuk foto laporan & foto ruang publik |
| Autentikasi | JWT-based auth | Untuk membedakan pengguna terdaftar vs anonim saat lapor |

---

## 7. Ruang Lingkup & Batasan

**Dalam ruang lingkup:**
- Cakupan wilayah: seluruh DKI Jakarta (5 kota administrasi + 1 kabupaten administrasi).
- Kategori ruang publik awal: RTH/taman kota, RPTRA, dan kategori lain yang datanya tersedia di Satu Data Jakarta.
- Fitur pelaporan terbatas pada kondisi fasilitas fisik ruang publik (bukan pengaduan pelayanan pemerintah secara umum — itu ranah JakLapor/LAPOR).

**Batasan:**
- Versi awal berbentuk website (bukan aplikasi mobile native), sesuai tech stack yang ditentukan.
- Laporan pada tahap awal bersifat crowd-sourced/informasi bagi warga, **belum terintegrasi resmi** dengan sistem tindak lanjut Pemprov DKI (mis. CRM Jakarta) — sehingga tidak dijanjikan ditindaklanjuti oleh OPD, kecuali dikembangkan lebih lanjut sebagai kerja sama resmi.
- Tidak ada verifikasi lapangan otomatis atas kebenaran laporan; verifikasi mengandalkan moderasi manual dan/atau validasi komunitas.
- Cakupan ruang publik terbatas pada apa yang tersedia di dataset resmi yang berhasil diakses; ruang publik yang belum terdata di Satu Data Jakarta tidak otomatis muncul di direktori.

---

## 8. Validasi dan Metode Testing

- **Validasi data:** spot-check sampel data ruang publik hasil ETL terhadap sumber aslinya di Satu Data Jakarta/Jakarta Satu untuk memastikan akurasi koordinat dan atribut sebelum go-live.
- **Unit testing:** pengujian endpoint FastAPI (mis. dengan pytest) untuk logika pencarian radius, filter kategori, dan alur submit laporan.
- **Usability testing:** sesi uji coba dengan sejumlah calon pengguna (mahasiswa/warga) untuk menguji kemudahan pencarian ruang publik dan alur pengisian laporan (termasuk pemahaman pilihan mode anonim/tampilkan nama).
- **User Acceptance Testing (UAT):** skenario end-to-end (cari ruang publik → lihat detail → kirim laporan → laporan tayang) diuji bersama pembimbing/pengguna representatif sebelum dianggap selesai.
- **Load/stress testing dasar:** pengujian performa peta saat menampilkan jumlah marker dalam skala besar, untuk memastikan clustering dan query database tetap responsif.

---

## 9. Risiko Pengembangan

| Risiko | Dampak | Mitigasi Awal |
|---|---|---|
| Data resmi tidak tersedia sebagai API real-time, hanya unduhan berkala | Data ruang publik bisa usang antar sinkronisasi | Jadwalkan ETL berkala, catat versi/tanggal data di UI |
| Foto & atribut pada dataset resmi tidak lengkap/dummy | Kualitas informasi rendah di awal peluncuran | Andalkan foto & data partisipatif untuk melengkapi bertahap |
| Potensi penyalahgunaan fitur lapor (spam, laporan palsu, konten tidak pantas) | Menurunkan kredibilitas platform | Moderasi sebelum tayang dan/atau mekanisme flag oleh komunitas |
| Risiko privasi pada mode "tampilkan nama" | Pengguna bisa ragu memakai identitas asli | Default ke mode anonim, edukasi konsekuensi privasi di form lapor |
| Ekspektasi pengguna bahwa laporan akan ditindaklanjuti pemerintah, padahal belum terintegrasi resmi | Menurunkan kepercayaan pengguna | Nyatakan status "belum terintegrasi resmi dengan OPD" secara eksplisit di UI |
| Ketergantungan pada layanan pihak ketiga (routing/direction API) yang berbayar atau berkuota | Fitur direction bisa berhenti berfungsi jika kuota habis | Pilih layanan open-source (OSRM/OpenRouteService) sebagai default, evaluasi biaya sebelum scale-up |
| Skema database MySQL untuk data spasial kurang optimal dibanding database khusus GIS (mis. PostgreSQL/PostGIS) | Query radius/geospasial bisa lebih lambat pada skala besar | Uji performa awal, pertimbangkan indexing spasial MySQL atau migrasi bertahap bila diperlukan |

---

## Referensi
- Satu Data Jakarta — https://satudata.jakarta.go.id/ dan https://www.jakarta.go.id/satu-data
- Dataset Data Ruang Terbuka Hijau (RTH) — https://satudata.jakarta.go.id/open-data/detail/data-ruang-terbuka-hijau-rth
- Dataset Data RPTRA Yang Belum Diresmikan — https://satudata.jakarta.go.id/open-data/detail/data-ruang-publik-terbuka-ramah-anak-rptra-yang-belum-diresmikan-di-dki-jakarta
- Jakarta Satu Geoportal — https://jakartasatu.jakarta.go.id/geoportal/
- Aplikasi JAKI — https://www.jakarta.go.id/index.php/aplikasi-jaki
- Fitur JakLapor — https://jaki.jakarta.go.id/id/help/jak-lapor/ dan https://jaki.jakarta.go.id/id/feature/report/
- Berita "Portal Satu Data Jakarta" akan diluncurkan Oktober 2025 — ANTARA News, https://www.antaranews.com/berita/5141389/portal-satu-data-jakarta-akan-diluncurkan-oktober-2025
- Definisi & tipologi RTH — https://lindungihutan.com/blog/pengertian-ruang-terbuka-hijau-atau-rth/
- Definisi RPTRA — https://dprkp.jakarta.go.id/product-rptra/

FOTO RUANG PUBLIK JAKARTA - paket hasil scraping
=================================================

Isi:
  images/               foto tempat (lebar 600 px, JPEG q78)
  output.csv            data CSV dengan kolom image_url, image_urls, image_status
  images_manifest.csv   rincian tiap foto + skor kecocokan nama

File turunan (hasil skrip ETL backend):
  images_index.csv      peta ruang_publik_id -> daftar berkas foto, dipakai importer
  import_photos_log.csv log per berkas saat impor ke database (untuk --resume)

Cara mengisi galeri ruang publik dari foto ini
-----------------------------------------------
1. Bangun indeks (dari images_manifest.csv, divalidasi ke disk & master DB):

     cd backend
     ..\.venv\Scripts\python.exe -m app.etl.build_images_index

   Menghasilkan data/Images/images_index.csv. Hanya berkas yang ada di disk
   dan id-nya ada di data/processed/ruang_publik.csv yang ikut.

2. Impor ke database lewat endpoint admin (backend harus jalan & ada akun admin):

     ..\.venv\Scripts\python.exe -m app.etl.import_photos ^
         --email petugas@jakarta.go.id --password <sandi> --workers 8

   Sekali jalan. Untuk menjalankan ulang tanpa menggandakan foto, pakai
   --skip-existing (melewati RP yang sudah punya foto) atau --resume (menambal
   yang belum sukses lewat log). Lihat docstring app/etl/import_photos.py.

Catatan data:
  - image_status 'ok' (728 id) yang punya berkas; 'mismatch'/'needs_review'/
    'nophoto' tidak punya berkas di disk.
  - 569 id dari manifest cocok dengan master ruang_publik.csv; 159 id lainnya
    (kandidat di luar DB) dilewati otomatis saat build indeks.

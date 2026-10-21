-- Skema database Ruka Jakarta (Postgres / Supabase).
-- Digenerate dari migration Alembic (initial postgres schema).
-- Arsitektur & alur: backend/docs/03-database-schema.md.

CREATE TABLE categories (
   id VARCHAR(50) PRIMARY KEY,
   label VARCHAR(100) NOT NULL,
   icon_name VARCHAR(50)
);

CREATE TABLE etl_run (
   id SERIAL PRIMARY KEY,
   pemicu VARCHAR(20) NOT NULL,
   status VARCHAR(20) NOT NULL,
   mulai TIMESTAMP NOT NULL,
   selesai TIMESTAMP,
   tahap_gagal VARCHAR(50),
   hitung JSON,
   tahap JSON
);

CREATE TABLE users (
   id VARCHAR(36) PRIMARY KEY,
   name VARCHAR(255) NOT NULL,
   email VARCHAR(255) NOT NULL UNIQUE,
   password_hash VARCHAR(255) NOT NULL,
   role VARCHAR(20) DEFAULT 'warga',
   is_active BOOLEAN NOT NULL DEFAULT TRUE,
   created_at TIMESTAMP,
   updated_at TIMESTAMP
);

CREATE TABLE token_blacklist (
   jti VARCHAR(36) PRIMARY KEY,
   expires_at TIMESTAMP NOT NULL,
   created_at TIMESTAMP
);

CREATE TABLE ruang_publik (
   id VARCHAR(50) PRIMARY KEY,
   nama VARCHAR(255) NOT NULL,
   kategori_id VARCHAR(50) REFERENCES categories(id),
   wilayah VARCHAR(100),
   kecamatan VARCHAR(100),
   kelurahan VARCHAR(100),
   alamat TEXT,
   latitude NUMERIC(10,8),
   longitude NUMERIC(11,8),
   deskripsi TEXT,
   jam_operasional VARCHAR(255),
   tiket_masuk VARCHAR(255),
   akses_disabilitas VARCHAR(255),
   ramah_hewan VARCHAR(255),
   verified BOOLEAN,
   status_general VARCHAR(50),
   image_url TEXT,
   field_source JSON,
   created_at TIMESTAMP,
   updated_at TIMESTAMP
);

CREATE TABLE fasilitas (
   id VARCHAR(50) PRIMARY KEY,
   ruang_publik_id VARCHAR(50) NOT NULL REFERENCES ruang_publik(id),
   nama VARCHAR(255) NOT NULL,
   kategori VARCHAR(100),
   status VARCHAR(50),
   deskripsi TEXT,
   created_at TIMESTAMP,
   updated_at TIMESTAMP
);

CREATE TABLE ruang_publik_foto (
   id VARCHAR(50) PRIMARY KEY,
   ruang_publik_id VARCHAR(50) NOT NULL REFERENCES ruang_publik(id),
   foto_url TEXT NOT NULL,
   created_at TIMESTAMP,
   updated_at TIMESTAMP
);

CREATE TABLE laporan (
   id VARCHAR(50) PRIMARY KEY,
   user_id VARCHAR(36) REFERENCES users(id),
   ruang_publik_id VARCHAR(50) NOT NULL REFERENCES ruang_publik(id),
   fasilitas_id VARCHAR(50) REFERENCES fasilitas(id),
   jenis_masalah VARCHAR(100),
   deskripsi TEXT NOT NULL,
   mode_identitas VARCHAR(50),
   nama_pelapor VARCHAR(255),
   status VARCHAR(50),
   alasan_penolakan TEXT,
   foto_url TEXT,
   lat_user DOUBLE PRECISION,
   long_user DOUBLE PRECISION,
   lat_lokasi_pilihan DOUBLE PRECISION,
   long_lokasi_pilihan DOUBLE PRECISION,
   lat_exif DOUBLE PRECISION,
   long_exif DOUBLE PRECISION,
   jarak_browser_rp DOUBLE PRECISION,
   jarak_exif_rp DOUBLE PRECISION,
   created_at TIMESTAMP,
   updated_at TIMESTAMP
);

CREATE TABLE laporan_timeline (
   id SERIAL PRIMARY KEY,
   laporan_id VARCHAR(50) NOT NULL REFERENCES laporan(id),
   status VARCHAR(50) NOT NULL,
   title VARCHAR(255) NOT NULL,
   description TEXT,
   created_at TIMESTAMP
);

CREATE TABLE laporan_flag (
   id VARCHAR(50) PRIMARY KEY,
   laporan_id VARCHAR(50) NOT NULL REFERENCES laporan(id),
   user_id VARCHAR(36) NOT NULL REFERENCES users(id),
   created_at TIMESTAMP,
   UNIQUE (laporan_id, user_id)
);

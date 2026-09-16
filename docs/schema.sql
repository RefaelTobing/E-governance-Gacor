CREATE TABLE categories (
   id VARCHAR(50) PRIMARY KEY,
   label VARCHAR(100) NOT NULL,
   icon_name VARCHAR(50)
);

CREATE TABLE users (
   id VARCHAR(36) PRIMARY KEY,
   name VARCHAR(255) NOT NULL,
   email VARCHAR(255) NOT NULL,
   password_hash VARCHAR(255) NOT NULL,
   role VARCHAR(20) DEFAULT 'warga',
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ruang_publik (
   id VARCHAR(50) PRIMARY KEY,
   nama VARCHAR(255) NOT NULL,
   kategori_id VARCHAR(50),
   wilayah VARCHAR(100),
   alamat TEXT,
   latitude DECIMAL(10, 8),
   longitude DECIMAL(11, 8),
   deskripsi TEXT,
   jam_operasional VARCHAR(255),
   tiket_masuk VARCHAR(255),
   akses_disabilitas VARCHAR(255),
   ramah_hewan VARCHAR(255),
   verified BOOLEAN DEFAULT FALSE,
   status_general VARCHAR(50),
   image_url TEXT,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (kategori_id) REFERENCES categories(id)
);

CREATE TABLE fasilitas (
   id VARCHAR(50) PRIMARY KEY,
   ruang_publik_id VARCHAR(50) NOT NULL,
   nama VARCHAR(255) NOT NULL,
   kategori VARCHAR(100),
   status VARCHAR(50) DEFAULT 'baik',
   lokasi_spesifik VARCHAR(255),
   deskripsi TEXT,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (ruang_publik_id) REFERENCES ruang_publik(id)
);

CREATE TABLE laporan (
   id VARCHAR(50) PRIMARY KEY,
   user_id VARCHAR(36),
   ruang_publik_id VARCHAR(50) NOT NULL,
   fasilitas_id VARCHAR(50),
   jenis_masalah VARCHAR(100),
   deskripsi TEXT NOT NULL,
   mode_identitas VARCHAR(50) DEFAULT 'tampilkan_nama',
   nama_pelapor VARCHAR(255),
   status VARCHAR(50) DEFAULT 'menunggu_verifikasi',
   foto_url TEXT,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (user_id) REFERENCES users(id),
   FOREIGN KEY (ruang_publik_id) REFERENCES ruang_publik(id),
   FOREIGN KEY (fasilitas_id) REFERENCES fasilitas(id)
);

CREATE TABLE laporan_timeline (
   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
   laporan_id VARCHAR(50) NOT NULL,
   status VARCHAR(50) NOT NULL,
   title VARCHAR(255) NOT NULL,
   description TEXT,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (laporan_id) REFERENCES laporan(id)
);

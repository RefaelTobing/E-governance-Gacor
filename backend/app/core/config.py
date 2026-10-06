import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Ruka Jakarta"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # CORS Origins (FE Publik dan FE Admin)
    FRONTEND_PUBLIC_URL: str = "http://localhost:5173"
    FRONTEND_ADMIN_URL: str = "http://localhost:5174"
    
    # File Uploads
    UPLOAD_DIR: str = "storage"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024 # 5 MB
    
    # Seed admin pertama, hanya dibaca `python -m app.etl.seed_admin`. Kosongkan
    # atau hapus setelah admin pertama dibuat.
    ADMIN_SEED_NAME: str = ""
    ADMIN_SEED_EMAIL: str = ""
    ADMIN_SEED_PASSWORD: str = ""

    # Ambang validasi lokasi anti fake-GPS (BE-23), dalam meter. Laporan hanya
    # auto-tayang bila kedua jarak (browser & EXIF ke ruang publik) <= nilai ini.
    # Nilai sama dengan VITE_FAKE_GPS_THRESHOLD_M di FE (hanya untuk teks bantuan UI).
    FAKE_GPS_THRESHOLD_M: int = 100

    # Jadwal pipeline ETL (cron 5 field, zona WIB), hanya dibaca
    # `python -m app.etl.scheduler`. Default "0 2 * * *" = tiap hari 02:00 WIB.
    ETL_JADWAL: str = "0 2 * * *"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()

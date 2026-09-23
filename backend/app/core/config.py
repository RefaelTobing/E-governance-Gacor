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
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()

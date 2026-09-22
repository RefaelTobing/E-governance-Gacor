import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

# Pastikan folder penyimpanan ada
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "laporan"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "ruang-publik"), exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Mount direktori upload untuk diserve sebagai static file di path /uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_PUBLIC_URL, settings.FRONTEND_ADMIN_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

app.include_router(api_router, prefix=settings.API_V1_STR)

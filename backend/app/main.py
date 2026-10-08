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
_origins = [
    settings.FRONTEND_PUBLIC_URL,
    settings.FRONTEND_ADMIN_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import logging
    from fastapi.responses import JSONResponse
    logging.exception("Unhandled error pada %s %s: %s", request.method, request.url, exc)
    response = JSONResponse(
        status_code=500,
        content={"detail": f"Terjadi kesalahan di server: {str(exc)}"},
    )
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

app.include_router(api_router, prefix=settings.API_V1_STR)


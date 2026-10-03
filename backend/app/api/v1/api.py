from fastapi import APIRouter

from app.api.v1 import categories, auth, fasilitas, ruang_publik, users, laporan, statistics

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(fasilitas.router, prefix="/facilities", tags=["facilities"])
api_router.include_router(fasilitas.admin_router, prefix="/admin/facilities", tags=["admin-facilities"])
api_router.include_router(ruang_publik.router, prefix="/public-spaces", tags=["public-spaces"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(laporan.router, prefix="/reports", tags=["reports"])
api_router.include_router(statistics.router, prefix="/statistics", tags=["statistics"])

from fastapi import APIRouter

from app.api.v1 import categories, auth
# from app.api.v1 import users, ruang_publik, laporan # uncomment bila router ini diimplementasi

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
# api_router.include_router(users.router, prefix="/users", tags=["users"])

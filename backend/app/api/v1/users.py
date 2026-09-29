"""Kelola petugas/admin. Semua endpoint di sini dijaga get_current_admin."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import ROLE_ADMIN, AdminCreate, AdminUpdate, UserResponse
from app.services import user as crud_user

router = APIRouter()


@router.get("", response_model=List[UserResponse])
def list_admin(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Daftar petugas aktif. `include_inactive=true` ikut menampilkan yang
    sudah dinonaktifkan, untuk halaman yang butuh tombol 'Aktifkan lagi'."""
    return crud_user.list_admins(db, include_inactive=include_inactive)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_admin(
    admin_in: AdminCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Tambah petugas baru. Role dipaksa 'admin' di sini, bukan diambil dari
    body request, jadi tidak ada jalur yang bisa membuat role lain diam-diam."""
    if crud_user.get_user_by_email(db, admin_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar",
        )

    return crud_user.create_user(
        db,
        name=admin_in.name,
        email=admin_in.email,
        password=admin_in.password,
        role=ROLE_ADMIN,
    )


@router.patch("/{user_id}", response_model=UserResponse)
def update_admin(
    user_id: str,
    payload: AdminUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Ubah nama atau reset kata sandi petugas. Admin boleh mengubah akunnya
    sendiri, termasuk mengganti sandi yang sedang dipakai."""
    target = _ambil_admin(db, user_id)

    if payload.name is not None:
        target.name = payload.name.strip()
    if payload.password is not None:
        target.password_hash = get_password_hash(payload.password)

    db.commit()
    db.refresh(target)
    return target


@router.delete("/{user_id}", response_model=UserResponse)
def deactivate_admin(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Nonaktifkan petugas, bukan hapus: laporan yang sudah pernah ia buat
    harus tetap punya pemiliknya.

    Admin aktif terakhir tidak boleh dinonaktifkan, supaya tidak ada keadaan
    tanpa satu pun yang bisa masuk ke dashboard. Syarat itu dicek lebih dulu
    karena jalan keluarnya sama saja: tambah admin lain.
    """
    target = _ambil_admin(db, user_id)

    if target.is_active and crud_user.count_active_admins(db) <= 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ini admin aktif terakhir. Tambah admin lain sebelum menonaktifkan.",
        )

    if target.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak bisa menonaktifkan akun yang sedang dipakai",
        )

    target.is_active = False
    db.commit()
    db.refresh(target)
    return target


@router.post("/{user_id}/activate", response_model=UserResponse)
def activate_admin(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Kembalikan akses untuk petugas yang sebelumnya dinonaktifkan."""
    target = _ambil_admin(db, user_id)
    target.is_active = True
    db.commit()
    db.refresh(target)
    return target


def _ambil_admin(db: Session, user_id: str) -> User:
    target = crud_user.get_user_by_id(db, user_id)
    if target is None or target.role != ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Petugas tidak ditemukan",
        )
    return target

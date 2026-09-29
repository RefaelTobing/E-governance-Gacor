"""Membuat satu akun admin pertama dari environment variable.

Dipakai sekali, supaya ada jalan masuk ke dashboard sebelum halaman 'Kelola
Admin' ada. Setelah halaman itu ada, akun baru cukup dibuat lewat API dan
script ini tidak perlu dijalankan lagi.

    python -m app.etl.seed_admin

Nilai diambil dari .env, tidak ditulis langsung di file ini supaya tidak ikut
ter-commit ke repo:

    ADMIN_SEED_NAME=Petugas RTH
    ADMIN_SEED_EMAIL=petugas@jakarta.go.id
    ADMIN_SEED_PASSWORD=<minimal 8 karakter>
"""

import sys

from app.core.config import settings
from app.core.database import SessionLocal
from app.schemas.user import MIN_PASSWORD_LENGTH, ROLE_ADMIN
from app.services import user as crud_user

KUNCI_LINGKUNGAN = ("ADMIN_SEED_NAME", "ADMIN_SEED_EMAIL", "ADMIN_SEED_PASSWORD")


def main() -> int:
    kurang = [k for k in KUNCI_LINGKUNGAN if not getattr(settings, k)]
    if kurang:
        print("Lengkapi dulu di .env:", ", ".join(kurang), file=sys.stderr)
        return 1

    email = settings.ADMIN_SEED_EMAIL.strip().lower()
    password = settings.ADMIN_SEED_PASSWORD

    if len(password) < MIN_PASSWORD_LENGTH:
        print(
            f"ADMIN_SEED_PASSWORD minimal {MIN_PASSWORD_LENGTH} karakter.",
            file=sys.stderr,
        )
        return 1

    db = SessionLocal()
    try:
        if crud_user.get_user_by_email(db, email):
            print(f"Admin dengan email {email} sudah ada. Tidak ada yang diubah.")
            return 0

        admin = crud_user.create_user(
            db,
            name=settings.ADMIN_SEED_NAME,
            email=email,
            password=password,
            role=ROLE_ADMIN,
        )
        print(f"Admin dibuat: {admin.name} <{admin.email}> (id={admin.id})")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())

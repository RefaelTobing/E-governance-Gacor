from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import ROLE_ADMIN, ROLE_PUBLIK, ROLE_WARGA, UserCreate, UserResponse
from app.services import user as crud_user

router = APIRouter()
admin_router = APIRouter()


def _autentikasi(db: Session, username: str, password: str) -> User:
    """Verifikasi kredensial bersama login publik & admin.

    Email tak dikenal dan sandi salah sengaja dibalas sama (`400`) supaya tidak
    membocorkan email mana yang terdaftar. Akun nonaktif dibalas `403`.
    """
    user = crud_user.get_user_by_email(db, username)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun dinonaktifkan. Hubungi admin.",
        )
    return user


def _token(user: User) -> dict:
    return {
        "access_token": create_access_token(subject=user.id),
        "token_type": "bearer",
    }


@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    return _token(_autentikasi(db, form_data.username, form_data.password))


@admin_router.post("/login", response_model=Token)
def admin_login(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    """Login khusus petugas; role diperiksa sebelum token diterbitkan.

    Berbeda dari `/auth/login` yang menerima semua role, di sini akun `warga`
    dengan kredensial benar tetap ditolak `403` supaya pemisahan jalur login
    petugas nyata, bukan hanya proteksi di dependency endpoint.
    """
    user = _autentikasi(db, form_data.username, form_data.password)
    if user.role != ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Endpoint ini khusus petugas",
        )
    return _token(user)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Create new user.
    """
    # Role dari body diabaikan sepenuhnya dan dipaksa 'warga'. Kalau
    # user_in.role ikut dibaca di sini, siapa pun bisa mendaftar dengan
    # role=admin lewat endpoint publik ini.
    if user_in.role not in ROLE_PUBLIK:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role tidak valid untuk pendaftaran publik",
        )

    if crud_user.get_user_by_email(db, user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    return crud_user.create_user(
        db,
        name=user_in.name,
        email=user_in.email,
        password=user_in.password,
        role=ROLE_WARGA,
    )

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    """
    Get current user.
    """
    return current_user

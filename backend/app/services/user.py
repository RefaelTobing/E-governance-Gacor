"""Operasi user yang dipakai bersama oleh router auth dan users."""

from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import ROLE_ADMIN


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.scalars(select(User).where(User.email == email.strip().lower())).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.scalars(select(User).where(User.id == user_id)).first()


def create_user(
    db: Session,
    *,
    name: str,
    email: str,
    password: str,
    role: str,
) -> User:
    user = User(
        name=name.strip(),
        email=email.strip().lower(),
        password_hash=get_password_hash(password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_admins(db: Session, *, include_inactive: bool = False) -> list[User]:
    stmt = select(User).where(User.role == ROLE_ADMIN)
    if not include_inactive:
        stmt = stmt.where(User.is_active.is_(True))
    return list(db.scalars(stmt.order_by(User.name)).all())


def count_active_admins(db: Session) -> int:
    return int(
        db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.role == ROLE_ADMIN, User.is_active.is_(True))
        )
        or 0
    )

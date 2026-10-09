from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryResponse, CategoryCreate
from app.services import category as crud_category

router = APIRouter()

@router.get("", response_model=List[CategoryResponse])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve categories.
    """
    categories = crud_category.get_categories(db, skip=skip, limit=limit)
    return categories

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    categoryIn: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """
    Create new category.
    """
    # Cek lebih dulu supaya id bentrok dibalas 400 yang jelas, bukan IntegrityError 500.
    if db.get(Category, categoryIn.id) is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kategori dengan id ini sudah ada",
        )
    return crud_category.create_category(db=db, category=categoryIn)

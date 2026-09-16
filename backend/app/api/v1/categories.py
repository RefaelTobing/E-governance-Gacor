from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.category import CategoryResponse, CategoryCreate
from app.services import category as crud_category

router = APIRouter()

@router.get("/", response_model=List[CategoryResponse])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve categories.
    """
    categories = crud_category.get_categories(db, skip=skip, limit=limit)
    return categories

@router.post("/", response_model=CategoryResponse)
def create_category(categoryIn: CategoryCreate, db: Session = Depends(get_db)):
    """
    Create new category.
    """
    return crud_category.create_category(db=db, category=categoryIn)

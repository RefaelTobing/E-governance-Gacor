from pydantic import BaseModel, ConfigDict
from typing import Optional

class CategoryBase(BaseModel):
    label: str
    icon_name: Optional[str] = None

class CategoryCreate(CategoryBase):
    id: str

class CategoryUpdate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

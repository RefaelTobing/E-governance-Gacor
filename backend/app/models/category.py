from sqlalchemy import Column, String
from app.models.base import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(50), primary_key=True)
    label = Column(String(100), nullable=False)
    icon_name = Column(String(50), nullable=True)

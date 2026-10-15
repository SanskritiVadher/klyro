from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

CategoryTypeEnum = Literal["expense", "income", "transfer"]


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Groceries & Essentials"])
    category_type: CategoryTypeEnum = Field(..., examples=["expense"])
    parent_category_id: Optional[int] = Field(None)
    icon_key: str = Field(default="tag", max_length=50, examples=["shopping-cart"])
    color_token: str = Field(default="neutral", max_length=50, examples=["sage"])



class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    parent_category_id: Optional[int] = None
    icon_key: Optional[str] = None
    color_token: Optional[str] = None
    is_archived: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: int
    user_id: Optional[int]
    is_archived: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

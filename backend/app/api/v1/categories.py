from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Category, User
from backend.app.schemas import CategoryCreate, CategoryUpdate, CategoryResponse
from backend.app.api.v1.auth import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryResponse])
def list_categories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all categories available to the user (including shared system categories)."""
    categories = db.query(Category).filter(
        (Category.user_id == current_user.id) | (Category.user_id == None)
    ).all()
    return categories


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new custom category."""
    cat = Category(
        user_id=current_user.id,
        name=payload.name,
        category_type=payload.category_type,
        parent_category_id=payload.parent_category_id,
        icon_key=payload.icon_key,
        color_token=payload.color_token,
        is_archived=False,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update or archive a category."""
    cat = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CATEGORY_NOT_FOUND", "message": "Category not found"}
        )

    if payload.name is not None:
        cat.name = payload.name
    if payload.parent_category_id is not None:
        cat.parent_category_id = payload.parent_category_id
    if payload.icon_key is not None:
        cat.icon_key = payload.icon_key
    if payload.color_token is not None:
        cat.color_token = payload.color_token
    if payload.is_archived is not None:
        cat.is_archived = payload.is_archived

    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft-archive or delete a category."""
    cat = db.query(Category).filter(Category.id == category_id, Category.user_id == current_user.id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CATEGORY_NOT_FOUND", "message": "Category not found"}
        )
    cat.is_archived = True
    db.commit()
    return None

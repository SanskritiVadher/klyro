from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Budget, BudgetAllocation, User, Category
from backend.app.schemas import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetAllocationResponse,
    BudgetPerformanceResponse,
)
from backend.app.api.v1.auth import get_current_user
from backend.app.services.calculation_engine import calculate_budget_performance

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("", response_model=List[BudgetResponse])
def list_budgets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all budgets for current user."""
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    results = []
    for b in budgets:
        resp = BudgetResponse.model_validate(b)
        results.append(resp)
    return results


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    payload: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new budget period with category allocations."""
    budget = Budget(
        user_id=current_user.id,
        name=payload.name,
        period_type=payload.period_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        total_limit_minor=payload.total_limit_minor,
        rollover_enabled=payload.rollover_enabled,
    )
    db.add(budget)
    db.flush()

    for alloc in payload.allocations:
        cat = db.query(Category).filter(
            Category.id == alloc.category_id,
            (Category.user_id == current_user.id) | (Category.user_id == None)
        ).first()
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "CATEGORY_NOT_FOUND", "message": f"Category {alloc.category_id} not found"}
            )
        db.add(BudgetAllocation(
            budget_id=budget.id,
            category_id=alloc.category_id,
            allocated_amount_minor=alloc.allocated_amount_minor,
        ))

    db.commit()
    db.refresh(budget)
    return budget


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(budget_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get single budget and its allocations."""
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "BUDGET_NOT_FOUND", "message": "Budget not found"}
        )
    return budget


@router.get("/{budget_id}/performance", response_model=BudgetPerformanceResponse)
def get_budget_performance_report(
    budget_id: int,
    as_of_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get detailed performance: allocated vs actual spent and pace warnings."""
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "BUDGET_NOT_FOUND", "message": "Budget not found"}
        )

    perf = calculate_budget_performance(db, budget.id, as_of_date=as_of_date)
    return perf


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(budget_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a budget and its allocations."""
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "BUDGET_NOT_FOUND", "message": "Budget not found"}
        )
    db.delete(budget)
    db.commit()
    return None

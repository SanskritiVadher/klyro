from typing import List, Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import RecurringRule, User, Account, Category
from backend.app.schemas import (
    RecurringRuleCreate,
    RecurringRuleUpdate,
    RecurringRuleResponse,
    UpcomingCommitmentResponse,
)
from backend.app.api.v1.auth import get_current_user

router = APIRouter(prefix="", tags=["Recurring & Calendar"])


@router.get("/recurring-rules", response_model=List[RecurringRuleResponse])
def list_recurring_rules(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List recurring rules (EMIs, salary, subscriptions)."""
    rules = db.query(RecurringRule).filter(RecurringRule.user_id == current_user.id).all()
    results = []
    for r in rules:
        resp = RecurringRuleResponse.model_validate(r)
        resp.account_name = r.account.name if r.account else None
        resp.category_name = r.category.name if r.category else None
        results.append(resp)
    return results


@router.post("/recurring-rules", response_model=RecurringRuleResponse, status_code=status.HTTP_201_CREATED)
def create_recurring_rule(
    payload: RecurringRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new recurring commitment rule."""
    acc = db.query(Account).filter(Account.id == payload.account_id, Account.user_id == current_user.id).first()
    if not acc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ACCOUNT_NOT_FOUND", "message": "Target account not found"}
        )

    if payload.category_id:
        cat = db.query(Category).filter(
            Category.id == payload.category_id,
            (Category.user_id == current_user.id) | (Category.user_id == None)
        ).first()
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "CATEGORY_NOT_FOUND", "message": "Target category not found"}
            )

    rule = RecurringRule(
        user_id=current_user.id,
        account_id=payload.account_id,
        category_id=payload.category_id,
        name=payload.name,
        rule_type=payload.rule_type,
        expected_amount_minor=payload.expected_amount_minor,
        frequency=payload.frequency,
        start_date=payload.start_date,
        next_due_date=payload.next_due_date,
        end_date=payload.end_date,
        status=payload.status,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    resp = RecurringRuleResponse.model_validate(rule)
    resp.account_name = rule.account.name if rule.account else None
    resp.category_name = rule.category.name if rule.category else None
    return resp


@router.patch("/recurring-rules/{rule_id}", response_model=RecurringRuleResponse)
def update_recurring_rule(
    rule_id: int,
    payload: RecurringRuleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update recurring rule."""
    rule = db.query(RecurringRule).filter(RecurringRule.id == rule_id, RecurringRule.user_id == current_user.id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RULE_NOT_FOUND", "message": "Recurring rule not found"}
        )

    if payload.name is not None:
        rule.name = payload.name
    if payload.expected_amount_minor is not None:
        rule.expected_amount_minor = payload.expected_amount_minor
    if payload.frequency is not None:
        rule.frequency = payload.frequency
    if payload.next_due_date is not None:
        rule.next_due_date = payload.next_due_date
    if payload.status is not None:
        rule.status = payload.status

    db.commit()
    db.refresh(rule)
    resp = RecurringRuleResponse.model_validate(rule)
    resp.account_name = rule.account.name if rule.account else None
    resp.category_name = rule.category.name if rule.category else None
    return resp


@router.delete("/recurring-rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a recurring rule."""
    rule = db.query(RecurringRule).filter(RecurringRule.id == rule_id, RecurringRule.user_id == current_user.id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RULE_NOT_FOUND", "message": "Recurring rule not found"}
        )
    db.delete(rule)
    db.commit()
    return None


@router.get("/calendar/upcoming", response_model=List[UpcomingCommitmentResponse])
def get_upcoming_commitments(
    days: int = Query(30, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upcoming financial timeline commitments radar for the specified horizon."""
    today = date.today()
    horizon = today + timedelta(days=days)

    rules = (
        db.query(RecurringRule)
        .filter(
            RecurringRule.user_id == current_user.id,
            RecurringRule.status == "active",
            RecurringRule.next_due_date <= horizon,
        )
        .order_by(RecurringRule.next_due_date.asc())
        .all()
    )

    results = []
    for r in rules:
        days_until = (r.next_due_date - today).days
        results.append(
            UpcomingCommitmentResponse(
                rule_id=r.id,
                name=r.name,
                rule_type=r.rule_type,
                expected_amount_minor=r.expected_amount_minor,
                due_date=r.next_due_date,
                days_until_due=days_until,
                is_overdue=days_until < 0,
                account_id=r.account_id,
                account_name=r.account.name if r.account else None,
                category_name=r.category.name if r.category else None,
            )
        )
    return results

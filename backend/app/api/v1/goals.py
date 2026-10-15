from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Goal, GoalContribution, User
from backend.app.schemas import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    GoalContributionCreate,
    GoalContributionResponse,
)
from backend.app.api.v1.auth import get_current_user
from backend.app.services.calculation_engine import calculate_goal_projection

router = APIRouter(prefix="/goals", tags=["Goals"])


@router.get("", response_model=List[GoalResponse])
def list_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List financial goals with momentum and completion date projections."""
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    results = []
    for g in goals:
        resp = GoalResponse.model_validate(g)
        # Average monthly pace estimate based on past contributions
        contrib_sum = sum(c.amount_minor for c in g.contributions if c.contribution_type == "deposit")
        avg_pace = 1000000 if contrib_sum == 0 else contrib_sum // max(1, len(g.contributions))

        pct, proj_date = calculate_goal_projection(
            target_amount_minor=g.target_amount_minor,
            current_amount_minor=g.current_amount_minor,
            average_monthly_pace_minor=avg_pace,
        )
        resp.percent_achieved = pct
        resp.projected_completion_date = proj_date
        results.append(resp)
    return results


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new savings or milestone goal."""
    goal = Goal(
        user_id=current_user.id,
        name=payload.name,
        target_amount_minor=payload.target_amount_minor,
        current_amount_minor=payload.initial_amount_minor,
        target_date=payload.target_date,
        priority=payload.priority,
        linked_account_id=payload.linked_account_id,
        status=payload.status,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    resp = GoalResponse.model_validate(goal)
    resp.percent_achieved = round((goal.current_amount_minor / goal.target_amount_minor) * 100, 1)
    return resp


@router.post("/{goal_id}/contributions", response_model=GoalContributionResponse, status_code=status.HTTP_201_CREATED)
def add_goal_contribution(
    goal_id: int,
    payload: GoalContributionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record a contribution towards a goal, updating current progress."""
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "GOAL_NOT_FOUND", "message": "Goal not found"}
        )

    contrib = GoalContribution(
        goal_id=goal.id,
        transaction_id=payload.transaction_id,
        amount_minor=payload.amount_minor,
        contribution_date=payload.contribution_date,
        contribution_type=payload.contribution_type,
        notes=payload.notes,
    )
    db.add(contrib)

    if payload.contribution_type == "deposit":
        goal.current_amount_minor += payload.amount_minor
    elif payload.contribution_type == "withdrawal":
        goal.current_amount_minor = max(0, goal.current_amount_minor - payload.amount_minor)

    if goal.current_amount_minor >= goal.target_amount_minor:
        goal.status = "achieved"

    db.commit()
    db.refresh(contrib)
    return contrib

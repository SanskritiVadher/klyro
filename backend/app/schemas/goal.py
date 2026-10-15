from datetime import date, datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict

PriorityEnum = Literal["low", "medium", "high"]
GoalStatusEnum = Literal["in_progress", "achieved", "paused"]
ContributionTypeEnum = Literal["deposit", "withdrawal"]


class GoalContributionBase(BaseModel):
    amount_minor: int = Field(..., gt=0, description="Contribution amount in paise (> 0)")
    contribution_date: date = Field(..., examples=["2026-10-15"])
    contribution_type: ContributionTypeEnum = Field(default="deposit", examples=["deposit"])
    notes: Optional[str] = Field(None, max_length=255)


class GoalContributionCreate(GoalContributionBase):
    transaction_id: Optional[int] = None


class GoalContributionResponse(GoalContributionBase):
    id: int
    goal_id: int
    transaction_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class GoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Emergency Fund (6 Months)"])
    target_amount_minor: int = Field(..., gt=0, description="Target goal amount in paise (> 0)")
    target_date: Optional[date] = Field(None, examples=["2026-12-31"])
    priority: PriorityEnum = Field(default="medium", examples=["high"])
    linked_account_id: Optional[int] = Field(None, description="Linked Account ID")
    status: GoalStatusEnum = Field(default="in_progress", examples=["in_progress"])



class GoalCreate(GoalBase):
    initial_amount_minor: int = Field(default=0, ge=0)


class GoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    target_amount_minor: Optional[int] = Field(None, gt=0)
    target_date: Optional[date] = None
    priority: Optional[PriorityEnum] = None
    linked_account_id: Optional[int] = None
    status: Optional[GoalStatusEnum] = None


class GoalResponse(GoalBase):
    id: int
    user_id: int
    current_amount_minor: int
    percent_achieved: float = Field(0.0, description="Percentage of goal target reached")
    projected_completion_date: Optional[date] = Field(None, description="Formula-backed projection based on velocity")
    contributions: List[GoalContributionResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

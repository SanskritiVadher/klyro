from datetime import date, datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

FrequencyEnum = Literal["daily", "weekly", "monthly", "quarterly", "yearly"]
RuleTypeEnum = Literal["expense", "income", "transfer"]
StatusEnum = Literal["active", "paused", "cancelled"]


class RecurringRuleBase(BaseModel):
    account_id: int = Field(..., description="Target Account ID")
    category_id: Optional[int] = Field(None, description="Category ID")
    name: str = Field(..., min_length=1, max_length=100, examples=["HDFC Home Loan EMI"])
    rule_type: RuleTypeEnum = Field(default="expense", examples=["expense"])
    expected_amount_minor: int = Field(..., gt=0, description="Expected amount in paise (> 0)")
    frequency: FrequencyEnum = Field(default="monthly", examples=["monthly"])
    start_date: date = Field(..., examples=["2026-01-01"])
    next_due_date: date = Field(..., examples=["2026-10-20"])
    end_date: Optional[date] = None
    status: StatusEnum = Field(default="active", examples=["active"])



class RecurringRuleCreate(RecurringRuleBase):
    pass


class RecurringRuleUpdate(BaseModel):
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    expected_amount_minor: Optional[int] = Field(None, gt=0)
    frequency: Optional[FrequencyEnum] = None
    next_due_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[StatusEnum] = None


class RecurringRuleResponse(RecurringRuleBase):
    id: int
    user_id: int
    account_name: Optional[str] = None
    category_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UpcomingCommitmentResponse(BaseModel):
    rule_id: int
    name: str
    rule_type: RuleTypeEnum
    expected_amount_minor: int
    due_date: date
    days_until_due: int
    is_overdue: bool
    account_id: int
    account_name: Optional[str] = None
    category_name: Optional[str] = None

from datetime import date, datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict, model_validator

PeriodTypeEnum = Literal["monthly", "custom"]


class BudgetAllocationBase(BaseModel):
    category_id: int = Field(..., description="Target Category ID")
    allocated_amount_minor: int = Field(..., ge=0, description="Allocated amount in paise (>= 0)")


class BudgetAllocationCreate(BudgetAllocationBase):
    pass


class BudgetAllocationResponse(BudgetAllocationBase):
    id: int
    budget_id: int
    category_name: Optional[str] = None
    category_color: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BudgetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["October 2026 Master Budget"])
    period_type: PeriodTypeEnum = Field(default="monthly", examples=["monthly"])
    start_date: date = Field(..., examples=["2026-10-01"])
    end_date: date = Field(..., examples=["2026-10-31"])
    total_limit_minor: Optional[int] = Field(None, ge=0, description="Optional overall budget spending cap in paise")
    rollover_enabled: bool = Field(default=False)


    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be greater than or equal to start_date")
        return self


class BudgetCreate(BudgetBase):
    allocations: List[BudgetAllocationCreate] = Field(default_factory=list)


class BudgetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    total_limit_minor: Optional[int] = Field(None, ge=0)
    rollover_enabled: Optional[bool] = None
    allocations: Optional[List[BudgetAllocationCreate]] = None


class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    allocations: List[BudgetAllocationResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CategoryPerformance(BaseModel):
    category_id: int
    category_name: str
    color_token: str
    allocated_minor: int
    spent_minor: int
    remaining_minor: int
    percent_spent: float
    projected_spend_minor: int
    pace_status: Literal["comfortable", "tightening", "exceeded"]


class BudgetPerformanceResponse(BaseModel):
    budget_id: int
    budget_name: str
    start_date: date
    end_date: date
    total_budget_minor: int
    total_spent_minor: int
    total_remaining_minor: int
    percent_spent: float
    categories: List[CategoryPerformance]

from datetime import date
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field

from backend.app.schemas.transaction import TransactionResponse
from backend.app.schemas.recurring import UpcomingCommitmentResponse
from backend.app.schemas.budget import CategoryPerformance

WeatherStatusEnum = Literal["comfortable", "tightening", "at_risk"]


class MoneyWeatherResponse(BaseModel):
    status: WeatherStatusEnum
    headline: str
    explanation: str
    safe_to_spend_minor: int
    safe_to_spend_daily_minor: int
    days_remaining: int
    current_liquidity_minor: int
    expected_inflows_minor: int
    upcoming_outflows_minor: int
    projected_end_balance_minor: int
    buffer_reserved_minor: int
    period_start: date
    period_end: date


class SpendingByCategoryItem(BaseModel):
    category_id: int
    category_name: str
    color_token: str
    total_spent_minor: int
    percentage: float
    transaction_count: int


class SpendingByCategoryResponse(BaseModel):
    period_start: date
    period_end: date
    total_expense_minor: int
    categories: List[SpendingByCategoryItem]


class CashFlowPeriodItem(BaseModel):
    period_label: str
    income_minor: int
    expense_minor: int
    net_savings_minor: int
    savings_rate_pct: float


class CashFlowAnalyticsResponse(BaseModel):
    summary: Dict[str, Any]
    timeline: List[CashFlowPeriodItem]


class SpendingDNAInsight(BaseModel):
    id: str
    title: str
    explanation: str
    severity: Literal["positive", "neutral", "attention", "warning"]
    supporting_data: Dict[str, Any]
    action_route: Optional[str] = None


class DashboardSummaryResponse(BaseModel):
    money_weather: MoneyWeatherResponse
    current_liquidity_minor: int
    period_income_minor: int
    period_expense_minor: int
    period_savings_minor: int
    savings_rate_pct: float
    budget_pulse: List[CategoryPerformance]
    what_changed: List[str]
    recent_transactions: List[TransactionResponse]
    upcoming_commitments: List[UpcomingCommitmentResponse]

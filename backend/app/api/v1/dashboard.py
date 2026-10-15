from typing import Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import User, Transaction, Budget
from backend.app.schemas import (
    DashboardSummaryResponse,
    MoneyWeatherResponse,
    TransactionResponse,
)
from backend.app.api.v1.auth import get_current_user
from backend.app.api.v1.recurring import get_upcoming_commitments
from backend.app.services.calculation_engine import (
    calculate_liquid_assets,
    calculate_net_cash_flow,
    calculate_savings_rate,
    calculate_budget_performance,
)
from backend.app.services.money_weather import evaluate_money_weather
from backend.app.services.insights_engine import generate_what_changed_summary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    period: Optional[str] = Query(None, description="Format YYYY-MM, defaults to current month"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Main decision-making dashboard aggregating Money Weather, liquidity,
    cash flows, budget pulse, What Changed?, and recent ledger entries.
    """
    today = date.today()
    if period:
        year, month = map(int, period.split("-"))
    else:
        year, month = today.year, today.month

    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year, 12, 31)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)

    # 1. Money Weather
    weather = evaluate_money_weather(db, current_user.id, start_date, end_date)

    # 2. Liquidity & Cash Flow
    liquidity = calculate_liquid_assets(db, current_user.id)
    income, expense, savings = calculate_net_cash_flow(db, current_user.id, start_date, end_date)
    savings_rate = calculate_savings_rate(income, expense)

    # For the month in progress, show the PROJECTED full-month position, not the
    # mid-month snapshot (which looks great only because bills haven't hit yet).
    if start_date <= today <= end_date:
        projected_discretionary = (
            weather.current_liquidity_minor
            + weather.expected_inflows_minor
            - weather.upcoming_outflows_minor
            - weather.projected_end_balance_minor
        )
        projected_income = income + weather.expected_inflows_minor
        projected_expense = expense + weather.upcoming_outflows_minor + projected_discretionary
        savings = projected_income - projected_expense
        savings_rate = calculate_savings_rate(projected_income, projected_expense)

    # 3. Budget Pulse (active budget for period)
    budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.start_date <= end_date,
        Budget.end_date >= start_date
    ).first()

    budget_pulse = []
    if budget:
        perf = calculate_budget_performance(db, budget.id, as_of_date=today)
        if perf:
            budget_pulse = perf["categories"]

    # 4. What Changed?
    what_changed = generate_what_changed_summary(db, current_user.id, start_date)

    # 5. Recent 5 Transactions
    recent_txs = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.transaction_date.desc(), Transaction.id.desc())
        .limit(5)
        .all()
    )
    recent_list = []
    for tx in recent_txs:
        r = TransactionResponse.model_validate(tx)
        r.category_name = tx.category.name if tx.category else None
        r.account_name = tx.account.name if tx.account else None
        recent_list.append(r)

    # 6. Upcoming Commitments (next 14 days)
    upcoming = get_upcoming_commitments(days=14, current_user=current_user, db=db)

    return DashboardSummaryResponse(
        money_weather=weather,
        current_liquidity_minor=liquidity,
        period_income_minor=income,
        period_expense_minor=expense,
        period_savings_minor=savings,
        savings_rate_pct=savings_rate,
        budget_pulse=budget_pulse,
        what_changed=what_changed,
        recent_transactions=recent_list,
        upcoming_commitments=upcoming,
    )


@router.get("/money-weather", response_model=MoneyWeatherResponse)
def get_money_weather(
    start_date: date,
    end_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve isolated Money Weather forecast calculation."""
    return evaluate_money_weather(db, current_user.id, start_date, end_date)

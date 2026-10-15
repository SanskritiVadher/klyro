"""
KLYRO — Signature Feature: Money Weather Engine
Combines recorded account balances, upcoming commitments, remaining budget cushion,
and planned savings into an intuitive financial forecast.
"""

from datetime import date
from typing import Optional, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.models import RecurringRule, Budget, Transaction
from backend.app.schemas.analytics import MoneyWeatherResponse
from backend.app.services.calculation_engine import (
    calculate_liquid_assets,
    calculate_safe_to_spend,
    calculate_budget_performance,
)


def _discretionary_position(
    db: Session, user_id: int, period_start: date, ref_date: date
) -> Tuple[int, Optional[int]]:
    """
    Returns (discretionary_spent_so_far_minor, budget_remaining_minor or None).
    Uses the active budget's categories as 'everyday spending' when a budget exists;
    otherwise falls back to expenses not linked to a recurring rule.
    """
    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.start_date <= ref_date,
        Budget.end_date >= ref_date,
    ).first()

    if budget:
        perf = calculate_budget_performance(db, budget.id, as_of_date=ref_date)
        if perf:
            return perf["total_spent_minor"], perf["total_remaining_minor"]

    spent = (
        db.query(func.coalesce(func.sum(Transaction.amount_minor), 0))
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "expense",
            Transaction.recurring_rule_id.is_(None),
            Transaction.transaction_date >= period_start,
            Transaction.transaction_date <= ref_date,
        )
        .scalar()
    )
    return int(spent), None


def evaluate_money_weather(
    db: Session,
    user_id: int,
    period_start: date,
    period_end: date,
    as_of_date: date = None
) -> MoneyWeatherResponse:
    ref_date = as_of_date or date.today()
    days_remaining = max(1, (period_end - ref_date).days + 1)
    days_elapsed = max(1, (ref_date - period_start).days + 1)

    # 1. Real-time Liquid Assets
    current_liquidity = calculate_liquid_assets(db, user_id)

    # 2. Upcoming Inflows & Mandatory Outflows between ref_date and period_end
    upcoming_rules = db.query(RecurringRule).filter(
        RecurringRule.user_id == user_id,
        RecurringRule.status == "active",
        RecurringRule.next_due_date >= ref_date,
        RecurringRule.next_due_date <= period_end
    ).all()

    expected_inflows = 0
    upcoming_outflows = 0
    for rule in upcoming_rules:
        if rule.rule_type == "income":
            expected_inflows += rule.expected_amount_minor
        elif rule.rule_type == "expense":
            upcoming_outflows += rule.expected_amount_minor

    # 3. Cash pool after bills and buffer (used for risk status)
    buffer_pct = 10.0
    spend_calc = calculate_safe_to_spend(
        liquid_funds_minor=current_liquidity,
        expected_inflows_minor=expected_inflows,
        upcoming_outflows_minor=upcoming_outflows,
        buffer_percentage=buffer_pct,
        days_horizon=days_remaining
    )
    cash_pool = spend_calc["safe_to_spend_minor"]
    buffer_reserved = spend_calc["buffer_reserved_minor"]

    # 4. Safe-to-Spend = cash pool, capped by what's left in this month's budget.
    #    Savings sitting in the bank are not "spendable this month".
    discretionary_spent, budget_remaining = _discretionary_position(
        db, user_id, period_start, ref_date
    )
    safe_to_spend = cash_pool if budget_remaining is None else min(cash_pool, budget_remaining)
    daily_safe_to_spend = safe_to_spend // days_remaining

    # 5. Projected End Balance includes everyday spending at the current pace
    daily_burn = discretionary_spent // days_elapsed
    projected_discretionary = daily_burn * max(0, days_remaining - 1)
    projected_end_balance = (
        current_liquidity + expected_inflows - upcoming_outflows - projected_discretionary
    )

    # 6. Weather Status & Narrative
    if projected_end_balance < 0 or (cash_pool == 0 and upcoming_outflows > current_liquidity):
        status = "at_risk"
        headline = "Financial Weather: Storm Warning / At Risk"
        explanation = (
            f"Upcoming commitments (₹{upcoming_outflows / 100:,.2f}) plus everyday spending at your "
            "current pace exceed available liquidity. Prioritise EMIs and pause discretionary "
            "spending until the next inflow."
        )
    elif daily_safe_to_spend < 50000 or cash_pool < (current_liquidity * 0.15):  # < ₹500/day
        status = "tightening"
        headline = "Financial Weather: Tightening Skies"
        explanation = (
            f"You can safely spend about ₹{daily_safe_to_spend / 100:,.2f} per day. "
            f"₹{upcoming_outflows / 100:,.2f} in bills is still due before the month closes."
        )
    else:
        status = "comfortable"
        headline = "Financial Weather: Clear & Comfortable"
        explanation = (
            f"After ₹{upcoming_outflows / 100:,.2f} in scheduled bills and about "
            f"₹{projected_discretionary / 100:,.0f} of everyday spending at your current pace, "
            f"you are on track to end the month with ₹{projected_end_balance / 100:,.0f}."
        )

    return MoneyWeatherResponse(
        status=status,
        headline=headline,
        explanation=explanation,
        safe_to_spend_minor=safe_to_spend,
        safe_to_spend_daily_minor=daily_safe_to_spend,
        days_remaining=days_remaining,
        current_liquidity_minor=current_liquidity,
        expected_inflows_minor=expected_inflows,
        upcoming_outflows_minor=upcoming_outflows,
        projected_end_balance_minor=projected_end_balance,
        buffer_reserved_minor=buffer_reserved,
        period_start=period_start,
        period_end=period_end,
    )

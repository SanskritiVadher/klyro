from typing import List, Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models import Transaction, Category, User
from backend.app.schemas import (
    SpendingByCategoryResponse,
    SpendingByCategoryItem,
    CashFlowAnalyticsResponse,
    CashFlowPeriodItem,
    SpendingDNAInsight,
)
from backend.app.api.v1.auth import get_current_user
from backend.app.services.calculation_engine import calculate_net_cash_flow, calculate_savings_rate
from backend.app.services.insights_engine import generate_spending_dna_insights

router = APIRouter(prefix="/analytics", tags=["Analytics & Insights"])


@router.get("/spending-by-category", response_model=SpendingByCategoryResponse)
def get_spending_by_category(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Spending breakdown by category for the period."""
    today = date.today()
    s_date = start_date or date(today.year, today.month, 1)
    if end_date:
        e_date = end_date
    else:
        if today.month == 12:
            e_date = date(today.year, 12, 31)
        else:
            e_date = date(today.year, today.month + 1, 1) - timedelta(days=1)

    # Sum expenses grouped by category
    query = (
        db.query(
            Category.id,
            Category.name,
            Category.color_token,
            func.coalesce(func.sum(Transaction.amount_minor), 0).label("total_spent"),
            func.count(Transaction.id).label("tx_count"),
        )
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == "expense",
            Transaction.transaction_date >= s_date,
            Transaction.transaction_date <= e_date,
        )
        .group_by(Category.id)
        .all()
    )

    total_expense = sum(row.total_spent for row in query)
    items = []
    for row in query:
        pct = round((row.total_spent / total_expense * 100) if total_expense > 0 else 0.0, 1)
        items.append(
            SpendingByCategoryItem(
                category_id=row.id,
                category_name=row.name,
                color_token=row.color_token,
                total_spent_minor=row.total_spent,
                percentage=pct,
                transaction_count=row.tx_count,
            )
        )

    return SpendingByCategoryResponse(
        period_start=s_date,
        period_end=e_date,
        total_expense_minor=total_expense,
        categories=items,
    )


@router.get("/cash-flow", response_model=CashFlowAnalyticsResponse)
def get_cash_flow_timeline(
    months: int = Query(6, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Historical month-over-month cash flows and net savings rates."""
    today = date.today()
    timeline = []

    for i in range(months - 1, -1, -1):
        # Calculate year and month
        y = today.year
        m = today.month - i
        while m <= 0:
            m += 12
            y -= 1

        m_start = date(y, m, 1)
        if m == 12:
            m_end = date(y, 12, 31)
        else:
            m_end = date(y, m + 1, 1) - timedelta(days=1)

        income, expense, savings = calculate_net_cash_flow(db, current_user.id, m_start, m_end)
        rate = calculate_savings_rate(income, expense)
        label = m_start.strftime("%b %Y")

        timeline.append(
            CashFlowPeriodItem(
                period_label=label,
                income_minor=income,
                expense_minor=expense,
                net_savings_minor=savings,
                savings_rate_pct=rate,
            )
        )

    return CashFlowAnalyticsResponse(
        summary={
            "months_analyzed": months,
            "average_savings_rate": round(sum(t.savings_rate_pct for t in timeline) / max(1, len(timeline)), 1),
        },
        timeline=timeline,
    )


@router.get("/insights", response_model=List[SpendingDNAInsight])
def get_spending_dna(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Spending DNA pattern detections, pace alerts, and behavioral insights."""
    return generate_spending_dna_insights(db, current_user.id)

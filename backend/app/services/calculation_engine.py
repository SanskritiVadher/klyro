"""
KLYRO — Financial Calculation Engine
Dedicated, independently testable financial calculation module.
All calculations use integer minor units (paise) to maintain exact mathematical precision.
"""

from datetime import date, timedelta
from typing import List, Dict, Optional, Tuple, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from backend.app.models import (
    Transaction,
    Account,
    Budget,
    BudgetAllocation,
    Category,
    RecurringRule,
    Goal,
)


def calculate_account_balance(db: Session, account_id: int) -> int:
    """
    Calculate real-time account balance in paise:
    Balance = Opening Balance
            + Sum(Income Inflows)
            + Sum(Transfer Inflows)
            - Sum(Expense Outflows)
            - Sum(Transfer Outflows)
            + Sum(Refunds received on this account)
    """
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        return 0

    balance = account.opening_balance_minor

    # Credit/Debit transactions for this account
    txs = db.query(Transaction).filter(Transaction.account_id == account_id).all()
    for tx in txs:
        if tx.transaction_type == "income":
            balance += tx.amount_minor
        elif tx.transaction_type == "expense":
            balance -= tx.amount_minor
        elif tx.transaction_type == "refund":
            balance += tx.amount_minor
        elif tx.transaction_type == "transfer":
            # Deterministic transfer direction:
            # Credit leg (inflow) if tagged with transfer_in, or merchant/description indicates 'from'
            is_inflow = (
                (tx.notes and "transfer_in" in tx.notes.lower())
                or (tx.merchant and "from" in tx.merchant.lower())
                or (tx.description and "from" in tx.description.lower())
            )
            if is_inflow:
                balance += tx.amount_minor
            else:
                balance -= tx.amount_minor


    return balance


def calculate_liquid_assets(db: Session, user_id: int) -> int:
    """
    Calculate total liquid assets (positive balances of bank, wallet, cash accounts).
    Excludes credit card liabilities and reserve / emergency funds.
    """
    liquid_accounts = db.query(Account).filter(
        Account.user_id == user_id,
        Account.is_active == True,
        Account.is_reserve == False,
        Account.account_type.in_(["bank", "wallet", "cash"])
    ).all()

    total_liquidity = 0
    for acc in liquid_accounts:
        bal = calculate_account_balance(db, acc.id)
        if bal > 0:
            total_liquidity += bal

    return total_liquidity


def calculate_credit_card_liabilities(db: Session, user_id: int) -> int:
    """
    Calculate outstanding credit card liabilities (strictly positive debt representation in paise).
    """
    card_accounts = db.query(Account).filter(
        Account.user_id == user_id,
        Account.is_active == True,
        Account.account_type == "credit_card"
    ).all()

    total_liability = 0
    for acc in card_accounts:
        bal = calculate_account_balance(db, acc.id)
        # If balance is negative, liability is abs(balance)
        if bal < 0:
            total_liability += abs(bal)

    return total_liability


def calculate_net_cash_flow(
    db: Session,
    user_id: int,
    start_date: date,
    end_date: date
) -> Tuple[int, int, int]:
    """
    Calculate (total_income, total_expense, net_savings) during the period in paise.
    CRITICAL: Internal transfers are explicitly excluded to prevent double-counting.
    Refunds reduce expenses or increase income consistently.
    """
    txs = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.transaction_type.in_(["income", "expense", "refund"])
    ).all()

    total_income = 0
    total_expense = 0

    for tx in txs:
        if tx.transaction_type == "income":
            total_income += tx.amount_minor
        elif tx.transaction_type == "expense":
            total_expense += tx.amount_minor
        elif tx.transaction_type == "refund":
            # Refund reduces overall consumption expense
            total_expense = max(0, total_expense - tx.amount_minor)

    net_savings = total_income - total_expense
    return total_income, total_expense, net_savings


def calculate_savings_rate(total_income_minor: int, total_expense_minor: int) -> float:
    """
    Calculate savings rate percentage: (Net Savings / Income) * 100.
    Documented policy: If income <= 0, return 0.0%.
    """
    if total_income_minor <= 0:
        return 0.0
    net_savings = total_income_minor - total_expense_minor
    if net_savings <= 0:
        return 0.0
    rate = (net_savings / total_income_minor) * 100
    return round(rate, 2)


def calculate_safe_to_spend(
    liquid_funds_minor: int,
    expected_inflows_minor: int,
    upcoming_outflows_minor: int,
    buffer_percentage: float = 10.0,
    days_horizon: int = 16
) -> Dict[str, int]:
    """
    Safe-to-Spend formula:
    Available Discretionary Pool = Liquid Funds + Inflows - Mandatory Outflows - Buffer Reserve.
    Returns:
      - safe_to_spend_minor: Total safe allowance until horizon
      - daily_safe_to_spend_minor: Daily discretionary spending rate
      - buffer_reserved_minor: Safety cushion reserved
    """
    buffer_reserved = int(liquid_funds_minor * (buffer_percentage / 100.0))
    discretionary_pool = (
        liquid_funds_minor + expected_inflows_minor - upcoming_outflows_minor - buffer_reserved
    )
    safe_to_spend = max(0, discretionary_pool)
    daily = safe_to_spend // max(1, days_horizon)

    return {
        "safe_to_spend_minor": safe_to_spend,
        "daily_safe_to_spend_minor": daily,
        "buffer_reserved_minor": buffer_reserved,
    }


def calculate_budget_performance(
    db: Session,
    budget_id: int,
    as_of_date: Optional[date] = None
) -> Optional[Dict[str, Any]]:
    """
    Calculates allocated vs actual qualifying expenses for a budget.
    Includes pace status ('comfortable', 'tightening', 'exceeded') and projected end-of-period spend.
    """
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        return None

    ref_date = as_of_date or date.today()
    total_days = max(1, (budget.end_date - budget.start_date).days + 1)
    days_elapsed = max(1, min(total_days, (ref_date - budget.start_date).days + 1))

    total_allocated = 0
    total_spent = 0
    categories_perf = []

    for alloc in budget.allocations:
        cat = alloc.category
        allocated = alloc.allocated_amount_minor
        total_allocated += allocated

        # Query qualifying expense transactions in this category within budget dates
        spent = (
            db.query(func.coalesce(func.sum(Transaction.amount_minor), 0))
            .filter(
                Transaction.category_id == alloc.category_id,
                Transaction.transaction_date >= budget.start_date,
                Transaction.transaction_date <= budget.end_date,
                Transaction.transaction_type == "expense"
            )
            .scalar()
        )
        total_spent += spent

        remaining = max(0, allocated - spent)
        pct_spent = round((spent / allocated * 100) if allocated > 0 else 0.0, 1)

        # Spending projection based on daily run rate
        daily_run_rate = spent / days_elapsed
        projected_spend = int(daily_run_rate * total_days)

        if spent > allocated:
            pace_status = "exceeded"
        elif (projected_spend > allocated) or (pct_spent > 80 and days_elapsed < total_days * 0.7):
            pace_status = "tightening"
        else:
            pace_status = "comfortable"

        categories_perf.append({
            "category_id": cat.id if cat else alloc.category_id,
            "category_name": cat.name if cat else "Unknown",
            "color_token": cat.color_token if cat else "neutral",
            "allocated_minor": allocated,
            "spent_minor": spent,
            "remaining_minor": remaining,
            "percent_spent": pct_spent,
            "projected_spend_minor": projected_spend,
            "pace_status": pace_status,
        })

    # Overall budget cap
    overall_cap = budget.total_limit_minor or total_allocated
    overall_remaining = max(0, overall_cap - total_spent)
    overall_pct = round((total_spent / overall_cap * 100) if overall_cap > 0 else 0.0, 1)

    return {
        "budget_id": budget.id,
        "budget_name": budget.name,
        "start_date": budget.start_date,
        "end_date": budget.end_date,
        "total_budget_minor": overall_cap,
        "total_spent_minor": total_spent,
        "total_remaining_minor": overall_remaining,
        "percent_spent": overall_pct,
        "categories": categories_perf,
    }


def calculate_goal_projection(
    target_amount_minor: int,
    current_amount_minor: int,
    average_monthly_pace_minor: int
) -> Tuple[float, Optional[date]]:
    """
    Calculates goal achievement percentage and projected completion date based on contribution pace.
    """
    if target_amount_minor <= 0:
        return 100.0, date.today()

    percent = round(min(100.0, (current_amount_minor / target_amount_minor) * 100), 1)
    remaining_minor = max(0, target_amount_minor - current_amount_minor)

    if remaining_minor == 0:
        return 100.0, date.today()

    if average_monthly_pace_minor <= 0:
        return percent, None

    months_needed = remaining_minor / average_monthly_pace_minor
    days_needed = int(months_needed * 30.4375)  # Average days in calendar month
    projected_date = date.today() + timedelta(days=days_needed)

    return percent, projected_date

import pytest
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models import User, Account, Category, Transaction, Budget, BudgetAllocation
from backend.app.services.calculation_engine import (
    calculate_account_balance,
    calculate_liquid_assets,
    calculate_net_cash_flow,
    calculate_savings_rate,
    calculate_safe_to_spend,
    calculate_budget_performance,
    calculate_goal_projection,
)


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_calculate_account_balance_with_transactions(test_db):
    """Test real-time balance computation from opening balance, income, expenses, and refunds."""
    user = User(name="Test User", email="calc@test.com", password_hash="hash")
    test_db.add(user)
    test_db.commit()

    # Account with opening balance ₹10,000.00 (1000000 paise)
    acc = Account(user_id=user.id, name="Checking", account_type="bank", opening_balance_minor=1000000)
    test_db.add(acc)
    test_db.commit()

    # + Income ₹5,000.00
    tx1 = Transaction(
        user_id=user.id, account_id=acc.id, transaction_type="income",
        amount_minor=500000, transaction_date=date(2026, 10, 1)
    )
    # - Expense ₹2,000.00
    tx2 = Transaction(
        user_id=user.id, account_id=acc.id, transaction_type="expense",
        amount_minor=200000, transaction_date=date(2026, 10, 5)
    )
    # + Refund ₹500.00
    tx3 = Transaction(
        user_id=user.id, account_id=acc.id, transaction_type="refund",
        amount_minor=50000, transaction_date=date(2026, 10, 8)
    )
    test_db.add_all([tx1, tx2, tx3])
    test_db.commit()

    # Expected: 10,000 + 5,000 - 2,000 + 500 = ₹13,500.00 (1350000 paise)
    bal = calculate_account_balance(test_db, acc.id)
    assert bal == 1350000


def test_calculate_net_cash_flow_excludes_transfers(test_db):
    """Verify that internal transfers are strictly excluded from net cash flow to prevent double-counting."""
    user = User(name="Test User", email="transfers@test.com", password_hash="hash")
    test_db.add(user)
    test_db.commit()

    acc1 = Account(user_id=user.id, name="Checking", account_type="bank", opening_balance_minor=1000000)
    acc2 = Account(user_id=user.id, name="Savings", account_type="bank", opening_balance_minor=500000)
    test_db.add_all([acc1, acc2])
    test_db.commit()

    # Income ₹50,000
    tx_inc = Transaction(user_id=user.id, account_id=acc1.id, transaction_type="income", amount_minor=5000000, transaction_date=date(2026, 10, 1))
    # Expense ₹20,000
    tx_exp = Transaction(user_id=user.id, account_id=acc1.id, transaction_type="expense", amount_minor=2000000, transaction_date=date(2026, 10, 5))
    # Internal Transfer ₹15,000 from Checking to Savings
    tx_tr1 = Transaction(user_id=user.id, account_id=acc1.id, transaction_type="transfer", amount_minor=1500000, transaction_date=date(2026, 10, 6), transfer_group_id="tr-123")
    tx_tr2 = Transaction(user_id=user.id, account_id=acc2.id, transaction_type="transfer", amount_minor=1500000, transaction_date=date(2026, 10, 6), transfer_group_id="tr-123", description="Transfer from Checking")

    test_db.add_all([tx_inc, tx_exp, tx_tr1, tx_tr2])
    test_db.commit()

    income, expense, savings = calculate_net_cash_flow(test_db, user.id, date(2026, 10, 1), date(2026, 10, 31))
    # Transfers must NOT be counted as income or expense!
    assert income == 5000000
    assert expense == 2000000
    assert savings == 3000000


def test_calculate_savings_rate():
    """Verify savings rate percentage calculation and edge case handling."""
    # Income ₹1,00,000, Expense ₹60,000 -> 40%
    assert calculate_savings_rate(10000000, 6000000) == 40.0
    # Zero income -> 0.0%
    assert calculate_savings_rate(0, 1000000) == 0.0
    # Expenses exceed income -> 0.0%
    assert calculate_savings_rate(5000000, 7000000) == 0.0


def test_calculate_safe_to_spend():
    """Verify Safe-to-Spend formula and safety buffer reserve."""
    # Liquid funds = ₹50,000 (5000000 paise)
    # Expected Inflows = ₹0
    # Mandatory Outflows = ₹20,000 (2000000 paise)
    # Buffer = 10% of 50,000 = ₹5,000 (500000 paise)
    # Safe-to-Spend = 50,000 - 20,000 - 5,000 = ₹25,000 (2500000 paise)
    # Over 10 days = ₹2,500/day (250000 paise)
    res = calculate_safe_to_spend(
        liquid_funds_minor=5000000,
        expected_inflows_minor=0,
        upcoming_outflows_minor=2000000,
        buffer_percentage=10.0,
        days_horizon=10
    )
    assert res["safe_to_spend_minor"] == 2500000
    assert res["daily_safe_to_spend_minor"] == 250000
    assert res["buffer_reserved_minor"] == 500000


def test_calculate_goal_projection():
    """Verify velocity-based goal completion date projection."""
    # Target ₹1,00,000 (10000000 paise), Current ₹40,000 (4000000 paise), Pace ₹20,000/mo (2000000 paise)
    pct, proj_date = calculate_goal_projection(10000000, 4000000, 2000000)
    assert pct == 40.0
    assert proj_date is not None
    # 60,000 remaining / 20,000 per month = 3 months
    days_diff = (proj_date - date.today()).days
    assert 85 <= days_diff <= 95


def test_calculate_safe_to_spend_extreme_outflows_clamps_to_zero():
    """Verify Safe-to-Spend formula gracefully clamps negative discretionary pools to ₹0."""
    # Liquid funds = ₹10,000, Inflows = 0, Outflows = ₹50,000
    res = calculate_safe_to_spend(
        liquid_funds_minor=1000000,
        expected_inflows_minor=0,
        upcoming_outflows_minor=5000000,
        buffer_percentage=10.0,
        days_horizon=0  # Zero days horizon should not divide by zero!
    )
    assert res["safe_to_spend_minor"] == 0
    assert res["daily_safe_to_spend_minor"] == 0
    assert res["buffer_reserved_minor"] == 100000


def test_calculate_goal_projection_edge_cases():
    """Verify goal projections when velocity is zero, target is reached, or target is zero."""
    # 1. Zero velocity -> Cannot project date
    pct1, proj_date1 = calculate_goal_projection(10000000, 2000000, 0)
    assert pct1 == 20.0
    assert proj_date1 is None

    # 2. Target reached -> 100%, projected date is today
    pct2, proj_date2 = calculate_goal_projection(10000000, 12000000, 2000000)
    assert pct2 == 100.0
    assert proj_date2 == date.today()

    # 3. Target zero -> 100% without division error
    pct3, proj_date3 = calculate_goal_projection(0, 0, 50000)
    assert pct3 == 100.0


def test_calculate_budget_performance_overbudget(test_db):
    """Verify that spending exceeding allocation triggers pace_status 'exceeded'."""
    user = User(name="Test User", email="budget_perf@test.com", password_hash="hash")
    test_db.add(user)
    test_db.commit()

    cat = Category(user_id=user.id, name="Dining", category_type="expense")
    acc = Account(user_id=user.id, name="Checking", account_type="bank", opening_balance_minor=10000000)
    test_db.add_all([cat, acc])
    test_db.commit()

    budget = Budget(
        user_id=user.id,
        name="October 2026 Test",
        period_type="monthly",
        start_date=date(2026, 10, 1),
        end_date=date(2026, 10, 31),
        total_limit_minor=1000000,  # ₹10,000 cap
    )
    test_db.add(budget)
    test_db.commit()

    alloc = BudgetAllocation(
        budget_id=budget.id,
        category_id=cat.id,
        allocated_amount_minor=500000,  # ₹5,000 allocated
    )
    test_db.add(alloc)
    test_db.commit()

    # Spent ₹8,000 (exceeds ₹5,000 allocated)
    tx = Transaction(
        user_id=user.id,
        account_id=acc.id,
        category_id=cat.id,
        transaction_type="expense",
        amount_minor=800000,
        transaction_date=date(2026, 10, 10),
    )
    test_db.add(tx)
    test_db.commit()

    perf = calculate_budget_performance(test_db, budget.id, as_of_date=date(2026, 10, 15))
    assert perf is not None
    assert perf["total_spent_minor"] == 800000
    assert len(perf["categories"]) == 1
    cat_perf = perf["categories"][0]
    assert cat_perf["spent_minor"] == 800000
    assert cat_perf["percent_spent"] == 160.0
    assert cat_perf["remaining_minor"] == 0
    assert cat_perf["pace_status"] == "exceeded"


def test_calculate_liquid_assets_excludes_reserve_account(test_db):
    """Prove that reserve accounts (e.g. SBI Emergency Savings) are strictly excluded from calculate_liquid_assets."""
    user = User(name="Reserve User", email="reserve@test.com", password_hash="hash")
    test_db.add(user)
    test_db.commit()

    # Spendable Checking account with ₹50,000 (5000000 paise)
    checking = Account(
        user_id=user.id,
        name="HDFC Salary Bank",
        account_type="bank",
        opening_balance_minor=5000000,
        is_active=True,
        is_reserve=False,
    )
    # Emergency Reserve account with ₹2,00,000 (20000000 paise)
    emergency_reserve = Account(
        user_id=user.id,
        name="SBI Emergency Savings",
        account_type="bank",
        opening_balance_minor=20000000,
        is_active=True,
        is_reserve=True,
    )
    # Wallet account with ₹5,000 (500000 paise)
    wallet = Account(
        user_id=user.id,
        name="UPI Wallet",
        account_type="wallet",
        opening_balance_minor=500000,
        is_active=True,
        is_reserve=False,
    )

    test_db.add_all([checking, emergency_reserve, wallet])
    test_db.commit()

    # Liquid assets must include checking (5000000) and wallet (500000), but EXCLUDE emergency_reserve (20000000)
    liquid = calculate_liquid_assets(test_db, user.id)
    assert liquid == 5500000
    assert liquid != 25500000



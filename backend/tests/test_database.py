import pytest
from datetime import date, datetime, timezone
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from backend.app.database import Base
from backend.app.models import (
    User,
    Account,
    Category,
    Transaction,
    Budget,
    BudgetAllocation,
    RecurringRule,
    Goal,
    GoalContribution,
    AppSetting,
)
from backend.app.utils.security import get_password_hash

# Use in-memory SQLite database with enforced foreign keys for fast, isolated tests
TEST_DB_URL = "sqlite:///:memory:"


@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL, echo=False)
    
    # Enable SQLite foreign keys
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_user_creation_and_unique_constraint(db_session):
    """Test user creation and unique email constraint enforcement."""
    user1 = User(
        name="Aarav Sharma",
        email="aarav@example.com",
        password_hash=get_password_hash("Secret123"),
        default_currency="INR",
    )
    db_session.add(user1)
    db_session.commit()
    assert user1.id is not None

    # Duplicate email should fail
    user2 = User(
        name="Aarav Duplicate",
        email="aarav@example.com",
        password_hash=get_password_hash("Secret123"),
        default_currency="INR",
    )
    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_account_creation_and_types(db_session):
    """Test account creation with valid and invalid types and integer paise balances."""
    user = User(name="User", email="user@example.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    # Valid bank account with ₹50,000.00 (5000000 paise)
    acc_bank = Account(
        user_id=user.id,
        name="HDFC Salary",
        account_type="bank",
        opening_balance_minor=5000000,
    )
    # Valid credit card with negative opening balance -₹12,000.00 (-1200000 paise)
    acc_card = Account(
        user_id=user.id,
        name="ICICI Coral Card",
        account_type="credit_card",
        opening_balance_minor=-1200000,
    )
    db_session.add_all([acc_bank, acc_card])
    db_session.commit()

    assert acc_bank.id is not None
    assert acc_card.id is not None
    assert acc_bank.opening_balance_minor == 5000000
    assert acc_card.opening_balance_minor == -1200000

    # Invalid account type should fail CheckConstraint
    invalid_acc = Account(
        user_id=user.id,
        name="Invalid",
        account_type="crypto_token",
        opening_balance_minor=1000,
    )
    db_session.add(invalid_acc)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_transaction_constraints_and_foreign_keys(db_session):
    """Test transaction insertion, positive amount constraint, and foreign key integrity."""
    user = User(name="User", email="user@example.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    acc = Account(user_id=user.id, name="Cash", account_type="cash", opening_balance_minor=100000)
    cat = Category(user_id=user.id, name="Food", category_type="expense")
    db_session.add_all([acc, cat])
    db_session.commit()

    # Valid transaction
    tx = Transaction(
        user_id=user.id,
        account_id=acc.id,
        category_id=cat.id,
        transaction_type="expense",
        amount_minor=25000,  # ₹250.00
        merchant="Cafe Coffee Day",
        transaction_date=date(2026, 10, 15),
        payment_method="upi",
    )
    db_session.add(tx)
    db_session.commit()
    assert tx.id is not None

    # Amount minor <= 0 must fail CheckConstraint
    invalid_tx = Transaction(
        user_id=user.id,
        account_id=acc.id,
        category_id=cat.id,
        transaction_type="expense",
        amount_minor=0,
        transaction_date=date(2026, 10, 15),
    )
    db_session.add(invalid_tx)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Foreign key to nonexistent account must fail
    nonexistent_acc_tx = Transaction(
        user_id=user.id,
        account_id=9999,
        category_id=cat.id,
        transaction_type="expense",
        amount_minor=1000,
        transaction_date=date(2026, 10, 15),
    )
    db_session.add(nonexistent_acc_tx)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_internal_transfers_modeling(db_session):
    """Verify internal transfers using transfer_group_id without double-counting."""
    user = User(name="User", email="transfer@example.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    acc1 = Account(user_id=user.id, name="Checking", account_type="bank", opening_balance_minor=1000000)
    acc2 = Account(user_id=user.id, name="Savings", account_type="bank", opening_balance_minor=500000)
    db_session.add_all([acc1, acc2])
    db_session.commit()

    transfer_id = str(uuid.uuid4())
    # Leg 1: Outflow from Checking
    leg1 = Transaction(
        user_id=user.id,
        account_id=acc1.id,
        transaction_type="transfer",
        amount_minor=200000,  # ₹2,000.00
        transaction_date=date(2026, 10, 15),
        transfer_group_id=transfer_id,
        description="Transfer to Savings",
    )
    # Leg 2: Inflow to Savings
    leg2 = Transaction(
        user_id=user.id,
        account_id=acc2.id,
        transaction_type="transfer",
        amount_minor=200000,
        transaction_date=date(2026, 10, 15),
        transfer_group_id=transfer_id,
        description="Transfer from Checking",
    )
    db_session.add_all([leg1, leg2])
    db_session.commit()

    transfers = db_session.query(Transaction).filter_by(transfer_group_id=transfer_id).all()
    assert len(transfers) == 2
    assert {t.account_id for t in transfers} == {acc1.id, acc2.id}
    assert transfers[0].amount_minor == transfers[1].amount_minor


def test_budget_allocations_unique_constraint(db_session):
    """Verify that a category can only be allocated once per budget."""
    user = User(name="User", email="budget@example.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    cat = Category(user_id=user.id, name="Groceries", category_type="expense")
    db_session.add(cat)
    db_session.commit()

    budget = Budget(
        user_id=user.id,
        name="Oct Budget",
        period_type="monthly",
        start_date=date(2026, 10, 1),
        end_date=date(2026, 10, 31),
    )
    db_session.add(budget)
    db_session.commit()

    alloc1 = BudgetAllocation(budget_id=budget.id, category_id=cat.id, allocated_amount_minor=1000000)
    db_session.add(alloc1)
    db_session.commit()

    # Second allocation for same category in same budget must fail UniqueConstraint
    alloc2 = BudgetAllocation(budget_id=budget.id, category_id=cat.id, allocated_amount_minor=500000)
    db_session.add(alloc2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_cascade_delete(db_session):
    """Verify that deleting a user cascades to accounts, categories, and transactions."""
    user = User(name="Ephemeral", email="del@example.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    acc = Account(user_id=user.id, name="Cash", account_type="cash", opening_balance_minor=100)
    cat = Category(user_id=user.id, name="Misc", category_type="expense")
    db_session.add_all([acc, cat])
    db_session.commit()

    tx = Transaction(
        user_id=user.id,
        account_id=acc.id,
        category_id=cat.id,
        transaction_type="expense",
        amount_minor=50,
        transaction_date=date(2026, 10, 15),
    )
    db_session.add(tx)
    db_session.commit()

    # Delete user
    db_session.delete(user)
    db_session.commit()

    # Verify children are deleted
    assert db_session.query(Account).filter_by(user_id=user.id).count() == 0
    assert db_session.query(Category).filter_by(user_id=user.id).count() == 0
    assert db_session.query(Transaction).filter_by(user_id=user.id).count() == 0

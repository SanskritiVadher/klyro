from datetime import date
import pytest
from pydantic import ValidationError

from backend.app.schemas import (
    TransactionCreate,
    BudgetBase,
    AccountCreate,
    MoneyWeatherResponse,
    ErrorResponse,
    ErrorDetail,
)


def test_transaction_schema_positive_amount():
    """Verify that transaction amounts must be strictly positive."""
    valid_tx = TransactionCreate(
        account_id=1,
        transaction_type="expense",
        amount_minor=150000,
        transaction_date=date(2026, 10, 15),
    )
    assert valid_tx.amount_minor == 150000

    # Negative amount should fail validation
    with pytest.raises(ValidationError):
        TransactionCreate(
            account_id=1,
            transaction_type="expense",
            amount_minor=-500,
            transaction_date=date(2026, 10, 15),
        )

    # Zero amount should fail validation
    with pytest.raises(ValidationError):
        TransactionCreate(
            account_id=1,
            transaction_type="expense",
            amount_minor=0,
            transaction_date=date(2026, 10, 15),
        )


def test_budget_schema_date_order():
    """Verify that end_date cannot be earlier than start_date."""
    # Valid date range
    valid_budget = BudgetBase(
        name="Valid Budget",
        start_date=date(2026, 10, 1),
        end_date=date(2026, 10, 31),
    )
    assert valid_budget.start_date <= valid_budget.end_date

    # Inverted date range must raise ValidationError
    with pytest.raises(ValidationError):
        BudgetBase(
            name="Inverted Budget",
            start_date=date(2026, 10, 31),
            end_date=date(2026, 10, 1),
        )


def test_account_type_validation():
    """Verify that account types strictly conform to allowed literals."""
    acc = AccountCreate(
        name="HDFC Bank",
        account_type="bank",
        opening_balance_minor=100000,
    )
    assert acc.account_type == "bank"

    with pytest.raises(ValidationError):
        AccountCreate(
            name="Unknown",
            account_type="hedge_fund",  # Not in Literal
            opening_balance_minor=100000,
        )


def test_error_response_serialization():
    """Verify unified error response schema structure."""
    err = ErrorResponse(
        error=ErrorDetail(
            code="VALIDATION_ERROR",
            message="Amount must be positive",
            details={"field": "amount_minor"}
        )
    )
    data = err.model_dump()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert data["error"]["details"]["field"] == "amount_minor"


def test_money_weather_schema():
    """Verify Money Weather response schema validation."""
    weather = MoneyWeatherResponse(
        status="comfortable",
        headline="Finances are in comfortable territory",
        explanation="Cushion exists for remaining days.",
        safe_to_spend_minor=1842000,
        safe_to_spend_daily_minor=115000,
        days_remaining=16,
        current_liquidity_minor=5215000,
        expected_inflows_minor=0,
        upcoming_outflows_minor=2432800,
        projected_end_balance_minor=4825000,
        buffer_reserved_minor=521500,
        period_start=date(2026, 10, 1),
        period_end=date(2026, 10, 31),
    )
    assert weather.status == "comfortable"
    assert weather.safe_to_spend_daily_minor == 115000

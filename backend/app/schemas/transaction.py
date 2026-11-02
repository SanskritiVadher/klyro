from datetime import date, datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict, field_validator

TransactionTypeEnum = Literal["expense", "income", "transfer", "refund"]
PaymentMethodEnum = Literal["upi", "debit_card", "credit_card", "net_banking", "cash", "other"]

MAX_TRANSACTION_AMOUNT_MINOR = 10_000_000_000  # ₹10 Crore / 100,000,000 INR cap prevents arithmetic overflow


class TransactionBase(BaseModel):
    account_id: int = Field(..., description="Target account ID")
    category_id: Optional[int] = Field(None, description="Category ID (optional for transfers)")
    transaction_type: TransactionTypeEnum = Field(..., examples=["expense"])
    amount_minor: int = Field(
        ...,
        gt=0,
        le=MAX_TRANSACTION_AMOUNT_MINOR,
        description="Transaction amount in paise, strictly positive and within valid ceiling"
    )
    currency: str = Field(default="INR", max_length=3, examples=["INR"])
    merchant: Optional[str] = Field(None, max_length=150, examples=["Swiggy"])
    description: Optional[str] = Field(None, max_length=255, examples=["Team dinner"])
    transaction_date: date = Field(..., examples=["2026-10-15"])
    payment_method: PaymentMethodEnum = Field(default="upi", examples=["upi"])
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("transaction_date")
    @classmethod
    def validate_realistic_date(cls, v: date) -> date:
        if v.year < 2000 or v.year > 2099:
            raise ValueError("Transaction date year must be between 2000 and 2099")
        return v


class TransactionCreate(TransactionBase):
    transfer_group_id: Optional[str] = None
    linked_transaction_id: Optional[int] = None
    recurring_rule_id: Optional[int] = None


class TransferCreate(BaseModel):
    from_account_id: int = Field(..., description="Source account to debit")
    to_account_id: int = Field(..., description="Destination account to credit")
    amount_minor: int = Field(
        ...,
        gt=0,
        le=MAX_TRANSACTION_AMOUNT_MINOR,
        description="Transfer amount in paise, strictly positive"
    )
    transaction_date: date = Field(..., examples=["2026-10-15"])
    description: Optional[str] = Field(default="Internal Account Transfer")
    notes: Optional[str] = None
    transfer_group_id: Optional[str] = Field(None, description="Client idempotency key to prevent duplicated transfers")

    @field_validator("transaction_date")
    @classmethod
    def validate_realistic_date(cls, v: date) -> date:
        if v.year < 2000 or v.year > 2099:
            raise ValueError("Transfer date year must be between 2000 and 2099")
        return v


class TransactionUpdate(BaseModel):
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    transaction_type: Optional[TransactionTypeEnum] = None
    amount_minor: Optional[int] = Field(None, gt=0, le=MAX_TRANSACTION_AMOUNT_MINOR)
    merchant: Optional[str] = None
    description: Optional[str] = None
    transaction_date: Optional[date] = None
    payment_method: Optional[PaymentMethodEnum] = None
    notes: Optional[str] = None

    @field_validator("transaction_date")
    @classmethod
    def validate_realistic_date(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and (v.year < 2000 or v.year > 2099):
            raise ValueError("Transaction date year must be between 2000 and 2099")
        return v


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    transfer_group_id: Optional[str] = None
    linked_transaction_id: Optional[int] = None
    recurring_rule_id: Optional[int] = None
    category_name: Optional[str] = None
    account_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

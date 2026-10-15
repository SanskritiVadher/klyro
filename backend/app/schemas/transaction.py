from datetime import date, datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

TransactionTypeEnum = Literal["expense", "income", "transfer", "refund"]
PaymentMethodEnum = Literal["upi", "debit_card", "credit_card", "net_banking", "cash", "other"]


class TransactionBase(BaseModel):
    account_id: int = Field(..., description="Target account ID")
    category_id: Optional[int] = Field(None, description="Category ID (optional for transfers)")
    transaction_type: TransactionTypeEnum = Field(..., examples=["expense"])
    amount_minor: int = Field(..., gt=0, description="Transaction amount in paise, strictly positive")
    currency: str = Field(default="INR", max_length=3, examples=["INR"])
    merchant: Optional[str] = Field(None, max_length=150, examples=["Swiggy"])
    description: Optional[str] = Field(None, max_length=255, examples=["Team dinner"])
    transaction_date: date = Field(..., examples=["2026-10-15"])
    payment_method: PaymentMethodEnum = Field(default="upi", examples=["upi"])
    notes: Optional[str] = Field(None, max_length=500)


class TransactionCreate(TransactionBase):
    transfer_group_id: Optional[str] = None
    linked_transaction_id: Optional[int] = None
    recurring_rule_id: Optional[int] = None


class TransferCreate(BaseModel):
    from_account_id: int = Field(..., description="Source account to debit")
    to_account_id: int = Field(..., description="Destination account to credit")
    amount_minor: int = Field(..., gt=0, description="Transfer amount in paise")
    transaction_date: date = Field(..., examples=["2026-10-15"])
    description: Optional[str] = Field(default="Internal Account Transfer")
    notes: Optional[str] = None



class TransactionUpdate(BaseModel):
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    transaction_type: Optional[TransactionTypeEnum] = None
    amount_minor: Optional[int] = Field(None, gt=0)
    merchant: Optional[str] = None
    description: Optional[str] = None
    transaction_date: Optional[date] = None
    payment_method: Optional[PaymentMethodEnum] = None
    notes: Optional[str] = None


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

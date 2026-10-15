from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

AccountTypeEnum = Literal["bank", "cash", "wallet", "credit_card"]


class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["HDFC Salary Bank"])
    account_type: AccountTypeEnum = Field(..., examples=["bank"])
    currency: str = Field(default="INR", max_length=3, examples=["INR"])
    institution_name: Optional[str] = Field(None, max_length=100, examples=["HDFC Bank"])
    is_active: bool = Field(default=True)
    is_reserve: bool = Field(default=False, description="Reserve / emergency fund (not counted as spendable)")


class AccountCreate(AccountBase):
    opening_balance_minor: int = Field(default=0, description="Opening balance in paise (can be negative for credit card debt)")


class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    institution_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_reserve: Optional[bool] = None


class AccountAdjustmentCreate(BaseModel):
    new_balance_minor: int = Field(..., description="Target corrected balance in paise")
    notes: Optional[str] = Field(None, description="Reason for balance reconciliation adjustment")


class AccountResponse(AccountBase):
    id: int
    user_id: int
    opening_balance_minor: int
    current_balance_minor: Optional[int] = Field(None, description="Computed real-time balance in paise")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

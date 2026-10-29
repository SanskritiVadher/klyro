from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["Sanskriti Vadher"])
    email: EmailStr = Field(..., examples=["sanskriti@klyro.finance"])
    default_currency: str = Field(default="INR", max_length=3, examples=["INR"])
    timezone: str = Field(default="Asia/Kolkata", examples=["Asia/Kolkata"])


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128, description="Plaintext password, hashed before storage")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in v) and not any(not char.isalnum() for char in v):
            raise ValueError("Password must contain at least one digit or special character.")
        return v


class UserLogin(BaseModel):
    email: EmailStr = Field(..., examples=["sanskriti@klyro.finance"])
    password: str = Field(...)


class PasswordChange(BaseModel):
    current_password: str = Field(..., description="Existing plaintext password for verification")
    new_password: str = Field(..., min_length=8, max_length=128, description="New strong password")

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("New password must be at least 8 characters long.")
        if not any(char.isdigit() for char in v) and not any(not char.isalnum() for char in v):
            raise ValueError("New password must contain at least one digit or special character.")
        return v



class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    default_currency: Optional[str] = Field(None, max_length=3)
    timezone: Optional[str] = Field(None)


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None

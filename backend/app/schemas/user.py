from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["Sanskriti Vadher"])
    email: EmailStr = Field(..., examples=["sanskriti@klyro.finance"])
    default_currency: str = Field(default="INR", max_length=3, examples=["INR"])
    timezone: str = Field(default="Asia/Kolkata", examples=["Asia/Kolkata"])


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128, description="Plaintext password, hashed before storage")


class UserLogin(BaseModel):
    email: EmailStr = Field(..., examples=["sanskriti@klyro.finance"])
    password: str = Field(...)



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

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship

from backend.app.database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    account_type = Column(String(30), nullable=False)  # 'bank', 'cash', 'wallet', 'credit_card'
    currency = Column(String(3), default="INR", nullable=False)
    opening_balance_minor = Column(Integer, default=0, nullable=False)  # In paise (can be negative for credit cards)
    institution_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_reserve = Column(Boolean, default=False, nullable=False, server_default="0")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint(
            "account_type IN ('bank', 'cash', 'wallet', 'credit_card')",
            name="check_account_type"
        ),
    )

    # Relationships
    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")
    recurring_rules = relationship("RecurringRule", back_populates="account")
    goals = relationship("Goal", back_populates="linked_account")

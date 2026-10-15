from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, String, Date, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship

from backend.app.database import Base


class RecurringRule(Base):
    __tablename__ = "recurring_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(100), nullable=False)
    rule_type = Column(String(20), nullable=False)  # 'expense', 'income', 'transfer'
    expected_amount_minor = Column(BigInteger, nullable=False)  # in paise
    frequency = Column(String(20), default="monthly", nullable=False)  # 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    start_date = Column(Date, nullable=False)
    next_due_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=True)
    status = Column(String(20), default="active", nullable=False)  # 'active', 'paused', 'cancelled'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint(
            "rule_type IN ('expense', 'income', 'transfer')",
            name="check_recurring_rule_type"
        ),
        CheckConstraint(
            "frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')",
            name="check_recurring_frequency"
        ),
        CheckConstraint(
            "status IN ('active', 'paused', 'cancelled')",
            name="check_recurring_status"
        ),
        CheckConstraint("expected_amount_minor > 0", name="check_positive_recurring_amount"),
    )

    # Relationships
    user = relationship("User", back_populates="recurring_rules")
    account = relationship("Account", back_populates="recurring_rules")
    category = relationship("Category", back_populates="recurring_rules")
    transactions = relationship("Transaction", back_populates="recurring_rule")

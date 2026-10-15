from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, String, Boolean, Date, DateTime, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship

from backend.app.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    period_type = Column(String(20), default="monthly", nullable=False)  # 'monthly', 'custom'
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    total_limit_minor = Column(BigInteger, nullable=True)  # in paise
    rollover_enabled = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint(
            "period_type IN ('monthly', 'custom')",
            name="check_budget_period_type"
        ),
        CheckConstraint("end_date >= start_date", name="check_budget_date_range"),
    )

    # Relationships
    user = relationship("User", back_populates="budgets")
    allocations = relationship("BudgetAllocation", back_populates="budget", cascade="all, delete-orphan")


class BudgetAllocation(Base):
    __tablename__ = "budget_allocations"

    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    allocated_amount_minor = Column(BigInteger, nullable=False)  # in paise (>= 0)

    __table_args__ = (
        CheckConstraint("allocated_amount_minor >= 0", name="check_non_negative_allocation"),
        UniqueConstraint("budget_id", "category_id", name="uq_budget_category"),
    )

    # Relationships
    budget = relationship("Budget", back_populates="allocations")
    category = relationship("Category", back_populates="budget_allocations")

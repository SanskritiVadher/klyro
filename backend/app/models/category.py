from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship

from backend.app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    category_type = Column(String(20), nullable=False)  # 'expense', 'income', 'transfer'
    parent_category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    icon_key = Column(String(50), default="tag", nullable=False)
    color_token = Column(String(50), default="neutral", nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint(
            "category_type IN ('expense', 'income', 'transfer')",
            name="check_category_type"
        ),
    )

    # Relationships
    user = relationship("User", back_populates="categories")
    parent = relationship("Category", remote_side=[id], backref="subcategories")
    transactions = relationship("Transaction", back_populates="category")
    budget_allocations = relationship("BudgetAllocation", back_populates="category", cascade="all, delete-orphan")
    recurring_rules = relationship("RecurringRule", back_populates="category")

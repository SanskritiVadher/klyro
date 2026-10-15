from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, String, Date, DateTime, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import relationship

from backend.app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    transaction_type = Column(String(20), nullable=False)  # 'expense', 'income', 'transfer', 'refund'
    amount_minor = Column(BigInteger, nullable=False)  # always strictly positive in paise (> 0)
    currency = Column(String(3), default="INR", nullable=False)
    merchant = Column(String(150), nullable=True, index=True)
    description = Column(String(255), nullable=True)
    transaction_date = Column(Date, nullable=False, index=True)
    payment_method = Column(String(30), default="upi", nullable=False)  # 'upi', 'debit_card', 'credit_card', 'net_banking', 'cash', 'other'
    transfer_group_id = Column(String(64), nullable=True, index=True)
    linked_transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    recurring_rule_id = Column(Integer, ForeignKey("recurring_rules.id", ondelete="SET NULL"), nullable=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint(
            "transaction_type IN ('expense', 'income', 'transfer', 'refund')",
            name="check_transaction_type"
        ),
        CheckConstraint(
            "payment_method IN ('upi', 'debit_card', 'credit_card', 'net_banking', 'cash', 'other')",
            name="check_payment_method"
        ),
        CheckConstraint("amount_minor > 0", name="check_positive_amount"),
        Index("idx_user_tx_date", "user_id", "transaction_date"),
        Index("idx_user_category", "user_id", "category_id"),
    )

    # Relationships
    user = relationship("User", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    recurring_rule = relationship("RecurringRule", back_populates="transactions")
    linked_transaction = relationship("Transaction", remote_side=[id], backref="linked_transactions")
    goal_contributions = relationship("GoalContribution", back_populates="transaction")

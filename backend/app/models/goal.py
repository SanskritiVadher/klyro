from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, String, Date, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship

from backend.app.database import Base


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    target_amount_minor = Column(BigInteger, nullable=False)  # in paise (> 0)
    current_amount_minor = Column(BigInteger, default=0, nullable=False)  # in paise (>= 0)
    target_date = Column(Date, nullable=True)
    priority = Column(String(20), default="medium", nullable=False)  # 'low', 'medium', 'high'
    linked_account_id = Column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), default="in_progress", nullable=False)  # 'in_progress', 'achieved', 'paused'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint("target_amount_minor > 0", name="check_positive_goal_target"),
        CheckConstraint("current_amount_minor >= 0", name="check_non_negative_goal_current"),
        CheckConstraint(
            "priority IN ('low', 'medium', 'high')",
            name="check_goal_priority"
        ),
        CheckConstraint(
            "status IN ('in_progress', 'achieved', 'paused')",
            name="check_goal_status"
        ),
    )

    # Relationships
    user = relationship("User", back_populates="goals")
    linked_account = relationship("Account", back_populates="goals")
    contributions = relationship("GoalContribution", back_populates="goal", cascade="all, delete-orphan")


class GoalContribution(Base):
    __tablename__ = "goal_contributions"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    amount_minor = Column(BigInteger, nullable=False)  # strictly positive paise
    contribution_date = Column(Date, nullable=False, index=True)
    contribution_type = Column(String(20), default="deposit", nullable=False)  # 'deposit', 'withdrawal'
    notes = Column(String(255), nullable=True)

    __table_args__ = (
        CheckConstraint("amount_minor > 0", name="check_positive_contribution_amount"),
        CheckConstraint(
            "contribution_type IN ('deposit', 'withdrawal')",
            name="check_contribution_type"
        ),
    )

    # Relationships
    goal = relationship("Goal", back_populates="contributions")
    transaction = relationship("Transaction", back_populates="goal_contributions")

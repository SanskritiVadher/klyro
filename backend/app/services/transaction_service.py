"""
KLYRO — Transaction & Transfer Service
Handles transaction CRUD, validation, and atomic two-legged account transfers.
"""

import uuid
from typing import Tuple, List, Optional
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.models import Transaction, Account, Category
from backend.app.schemas.transaction import TransactionCreate, TransferCreate, TransactionUpdate


def create_transaction_entry(db: Session, user_id: int, payload: TransactionCreate) -> Transaction:
    """Create a single expense, income, or refund transaction."""
    # Verify account ownership
    account = db.query(Account).filter(Account.id == payload.account_id, Account.user_id == user_id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ACCOUNT_NOT_FOUND", "message": "Target account does not exist or access denied"}
        )

    # Verify category if provided
    if payload.category_id:
        category = db.query(Category).filter(Category.id == payload.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "CATEGORY_NOT_FOUND", "message": "Selected category does not exist"}
            )

    tx = Transaction(
        user_id=user_id,
        account_id=payload.account_id,
        category_id=payload.category_id,
        transaction_type=payload.transaction_type,
        amount_minor=payload.amount_minor,
        currency=payload.currency,
        merchant=payload.merchant,
        description=payload.description,
        transaction_date=payload.transaction_date,
        payment_method=payload.payment_method,
        transfer_group_id=payload.transfer_group_id,
        linked_transaction_id=payload.linked_transaction_id,
        recurring_rule_id=payload.recurring_rule_id,
        notes=payload.notes,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def execute_atomic_transfer(
    db: Session,
    user_id: int,
    payload: TransferCreate
) -> Tuple[Transaction, Transaction]:
    """
    Execute a two-legged account transfer atomically:
    Leg 1: Outflow debit from source account
    Leg 2: Inflow credit into destination account
    Both share an identical transfer_group_id and do NOT count as economic consumption or income.
    """
    if payload.from_account_id == payload.to_account_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "IDENTICAL_ACCOUNTS", "message": "Source and destination accounts must be different"}
        )

    from_acc = db.query(Account).filter(Account.id == payload.from_account_id, Account.user_id == user_id).first()
    to_acc = db.query(Account).filter(Account.id == payload.to_account_id, Account.user_id == user_id).first()

    if not from_acc or not to_acc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ACCOUNT_NOT_FOUND", "message": "One or both transfer accounts not found"}
        )

    transfer_uuid = str(uuid.uuid4())

    leg1 = Transaction(
        user_id=user_id,
        account_id=from_acc.id,
        transaction_type="transfer",
        amount_minor=payload.amount_minor,
        currency=from_acc.currency,
        merchant=f"Transfer to {to_acc.name}",
        description=f"Transfer to {to_acc.name}" + (f": {payload.description}" if payload.description else ""),
        transaction_date=payload.transaction_date,
        payment_method="net_banking",
        transfer_group_id=transfer_uuid,
        notes="transfer_out" + (f" | {payload.notes}" if payload.notes else ""),
    )

    leg2 = Transaction(
        user_id=user_id,
        account_id=to_acc.id,
        transaction_type="transfer",
        amount_minor=payload.amount_minor,
        currency=to_acc.currency,
        merchant=f"Transfer from {from_acc.name}",
        description=f"Transfer from {from_acc.name}" + (f": {payload.description}" if payload.description else ""),
        transaction_date=payload.transaction_date,
        payment_method="net_banking",
        transfer_group_id=transfer_uuid,
        notes="transfer_in" + (f" | {payload.notes}" if payload.notes else ""),
    )


    db.add_all([leg1, leg2])
    db.commit()
    db.refresh(leg1)
    db.refresh(leg2)
    return leg1, leg2

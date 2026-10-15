from typing import Optional, List
from datetime import date
from math import ceil
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.database import get_db
from backend.app.models import Transaction, User, Account, Category
from backend.app.schemas import (
    TransactionCreate,
    TransactionUpdate,
    TransferCreate,
    TransactionResponse,
    PaginatedResponse,
    PaginationMeta,
)
from backend.app.api.v1.auth import get_current_user
from backend.app.services.transaction_service import (
    create_transaction_entry,
    execute_atomic_transfer,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("", response_model=PaginatedResponse[TransactionResponse])
def list_transactions(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    account_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("transaction_date"),
    sort_order: str = Query("desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List transactions with advanced filtering, full text search, sorting, and pagination."""
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Transaction.merchant.ilike(search_filter),
                Transaction.description.ilike(search_filter),
                Transaction.notes.ilike(search_filter),
            )
        )

    # Sorting
    sort_attr = getattr(Transaction, sort_by, Transaction.transaction_date)
    if sort_order.lower() == "asc":
        query = query.order_by(sort_attr.asc(), Transaction.id.asc())
    else:
        query = query.order_by(sort_attr.desc(), Transaction.id.desc())

    total_records = query.count()
    total_pages = ceil(total_records / limit) if total_records > 0 else 1
    offset = (page - 1) * limit

    items = query.offset(offset).limit(limit).all()

    # Hydrate category_name & account_name
    results = []
    for tx in items:
        resp = TransactionResponse.model_validate(tx)
        resp.category_name = tx.category.name if tx.category else None
        resp.account_name = tx.account.name if tx.account else None
        results.append(resp)

    return PaginatedResponse(
        items=results,
        pagination=PaginationMeta(
            total_records=total_records,
            page=page,
            limit=limit,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        ),
    )


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new income, expense, or refund transaction."""
    tx = create_transaction_entry(db, current_user.id, payload)
    resp = TransactionResponse.model_validate(tx)
    resp.category_name = tx.category.name if tx.category else None
    resp.account_name = tx.account.name if tx.account else None
    return resp


@router.post("/transfers", response_model=List[TransactionResponse], status_code=status.HTTP_201_CREATED)
def create_transfer(
    payload: TransferCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atomically record a transfer between two internal accounts."""
    leg1, leg2 = execute_atomic_transfer(db, current_user.id, payload)
    resps = []
    for leg in [leg1, leg2]:
        r = TransactionResponse.model_validate(leg)
        r.account_name = leg.account.name if leg.account else None
        resps.append(r)
    return resps


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get single transaction details."""
    tx = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TRANSACTION_NOT_FOUND", "message": "Transaction not found"}
        )
    resp = TransactionResponse.model_validate(tx)
    resp.category_name = tx.category.name if tx.category else None
    resp.account_name = tx.account.name if tx.account else None
    return resp


@router.patch("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update transaction fields."""
    tx = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TRANSACTION_NOT_FOUND", "message": "Transaction not found"}
        )

    if payload.account_id is not None:
        tx.account_id = payload.account_id
    if payload.category_id is not None:
        tx.category_id = payload.category_id
    if payload.transaction_type is not None:
        tx.transaction_type = payload.transaction_type
    if payload.amount_minor is not None:
        tx.amount_minor = payload.amount_minor
    if payload.merchant is not None:
        tx.merchant = payload.merchant
    if payload.description is not None:
        tx.description = payload.description
    if payload.transaction_date is not None:
        tx.transaction_date = payload.transaction_date
    if payload.payment_method is not None:
        tx.payment_method = payload.payment_method
    if payload.notes is not None:
        tx.notes = payload.notes

    db.commit()
    db.refresh(tx)
    resp = TransactionResponse.model_validate(tx)
    resp.category_name = tx.category.name if tx.category else None
    resp.account_name = tx.account.name if tx.account else None
    return resp


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a transaction."""
    tx = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TRANSACTION_NOT_FOUND", "message": "Transaction not found"}
        )
    # If this transaction is part of a transfer group, delete the companion leg as well
    if tx.transfer_group_id:
        db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.transfer_group_id == tx.transfer_group_id
        ).delete()
    else:
        db.delete(tx)

    db.commit()
    return None

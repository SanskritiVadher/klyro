from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Account, User, Transaction
from backend.app.schemas import AccountCreate, AccountUpdate, AccountAdjustmentCreate, AccountResponse
from backend.app.api.v1.auth import get_current_user
from backend.app.services.calculation_engine import calculate_account_balance
from datetime import date

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("", response_model=List[AccountResponse])
def list_accounts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all accounts for the user with computed real-time balances in paise."""
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    results = []
    for acc in accounts:
        resp = AccountResponse.model_validate(acc)
        resp.current_balance_minor = calculate_account_balance(db, acc.id)
        results.append(resp)
    return results


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    payload: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new asset or liability account."""
    acc = Account(
        user_id=current_user.id,
        name=payload.name,
        account_type=payload.account_type,
        currency=payload.currency,
        opening_balance_minor=payload.opening_balance_minor,
        institution_name=payload.institution_name,
        is_active=payload.is_active,
        is_reserve=payload.is_reserve,
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)
    resp = AccountResponse.model_validate(acc)
    resp.current_balance_minor = payload.opening_balance_minor
    return resp


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(account_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve details and real-time balance for a single account."""
    acc = db.query(Account).filter(Account.id == account_id, Account.user_id == current_user.id).first()
    if not acc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ACCOUNT_NOT_FOUND", "message": "Account not found"}
        )
    resp = AccountResponse.model_validate(acc)
    resp.current_balance_minor = calculate_account_balance(db, acc.id)
    return resp


@router.patch("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: int,
    payload: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update account attributes."""
    acc = db.query(Account).filter(Account.id == account_id, Account.user_id == current_user.id).first()
    if not acc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ACCOUNT_NOT_FOUND", "message": "Account not found"}
        )
    if payload.name is not None:
        acc.name = payload.name
    if payload.institution_name is not None:
        acc.institution_name = payload.institution_name
    if payload.is_active is not None:
        acc.is_active = payload.is_active
    if payload.is_reserve is not None:
        acc.is_reserve = payload.is_reserve

    db.commit()
    db.refresh(acc)
    resp = AccountResponse.model_validate(acc)
    resp.current_balance_minor = calculate_account_balance(db, acc.id)
    return resp


@router.post("/{account_id}/adjustments", response_model=AccountResponse)
def adjust_account_balance(
    account_id: int,
    payload: AccountAdjustmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Adjust account balance to match real-world statement via a balancing transaction entry.
    """
    acc = db.query(Account).filter(Account.id == account_id, Account.user_id == current_user.id).first()
    if not acc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ACCOUNT_NOT_FOUND", "message": "Account not found"}
        )

    current_bal = calculate_account_balance(db, acc.id)
    diff = payload.new_balance_minor - current_bal

    if diff != 0:
        # Create an adjustment transaction
        tx_type = "income" if diff > 0 else "expense"
        adj_tx = Transaction(
            user_id=current_user.id,
            account_id=acc.id,
            transaction_type=tx_type,
            amount_minor=abs(diff),
            currency=acc.currency,
            merchant="Balance Reconciliation Adjustment",
            description=payload.notes or "Account balance adjustment entry",
            transaction_date=date.today(),
            payment_method="other",
        )
        db.add(adj_tx)
        db.commit()

    resp = AccountResponse.model_validate(acc)
    resp.current_balance_minor = payload.new_balance_minor
    return resp

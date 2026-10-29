import csv
import io
import json
from datetime import date, datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, Response, Body, status, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db, SessionLocal
from backend.app.models import (
    Transaction,
    Account,
    Category,
    Budget,
    BudgetAllocation,
    RecurringRule,
    Goal,
    GoalContribution,
    AppSetting,
    User,
)
from backend.app.api.v1.auth import get_current_user
from backend.app.seed import seed_demo_data

router = APIRouter(tags=["Data Management"])


@router.get("/export/transactions")
def export_transactions_csv(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export the user's complete transaction history as a clean CSV file."""
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.transaction_date.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Date", "Type", "Amount (INR)", "Amount (Paise)",
        "Merchant / Payee", "Category", "Account", "Payment Method", "Description", "Notes"
    ])

    for tx in transactions:
        writer.writerow([
            str(tx.transaction_date),
            tx.transaction_type,
            f"{tx.amount_minor / 100:.2f}",
            tx.amount_minor,
            tx.merchant or "",
            tx.category.name if tx.category else "",
            tx.account.name if tx.account else "",
            tx.payment_method,
            tx.description or "",
            tx.notes or "",
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="klyro_transactions_export.csv"'},
    )


@router.get("/export/backup")
def export_full_backup_json(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export complete user dataset as a structured JSON backup archive."""
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    categories = db.query(Category).filter(
        (Category.user_id == current_user.id) | (Category.user_id.is_(None))
    ).all()
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    recurring_rules = db.query(RecurringRule).filter(RecurringRule.user_id == current_user.id).all()
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    settings_records = db.query(AppSetting).filter(AppSetting.user_id == current_user.id).all()

    backup = {
        "metadata": {
            "app": "Klyro Personal Financial Intelligence Workspace",
            "tagline": "Clarity you can act on.",
            "version": "1.0.0",
            "exported_at": datetime.now().isoformat(),
            "user_email": current_user.email,
            "user_name": current_user.name,
        },
        "accounts": [
            {
                "id": a.id,
                "name": a.name,
                "account_type": a.account_type,
                "currency": a.currency,
                "opening_balance_minor": a.opening_balance_minor,
                "institution_name": a.institution_name,
                "is_active": a.is_active,
            }
            for a in accounts
        ],
        "categories": [
            {
                "id": c.id,
                "name": c.name,
                "category_type": c.category_type,
                "icon": c.icon_key,
                "color": c.color_token,
                "is_system": c.user_id is None,
            }
            for c in categories
        ],
        "transactions": [
            {
                "id": t.id,
                "account_id": t.account_id,
                "category_id": t.category_id,
                "transaction_type": t.transaction_type,
                "amount_minor": t.amount_minor,
                "currency": t.currency,
                "merchant": t.merchant,
                "description": t.description,
                "transaction_date": str(t.transaction_date),
                "payment_method": t.payment_method,
                "transfer_group_id": t.transfer_group_id,
                "notes": t.notes,
            }
            for t in transactions
        ],
        "budgets": [
            {
                "id": b.id,
                "name": b.name,
                "period_type": b.period_type,
                "start_date": str(b.start_date),
                "end_date": str(b.end_date),
                "allocations": [
                    {
                        "category_id": alloc.category_id,
                        "allocated_amount_minor": alloc.allocated_amount_minor,
                    }
                    for alloc in b.allocations
                ],
            }
            for b in budgets
        ],
        "recurring_rules": [
            {
                "id": r.id,
                "name": r.name,
                "rule_type": r.rule_type,
                "expected_amount_minor": r.expected_amount_minor,
                "frequency": r.frequency,
                "next_due_date": str(r.next_due_date),
                "status": r.status,
            }
            for r in recurring_rules
        ],
        "goals": [
            {
                "id": g.id,
                "name": g.name,
                "target_amount_minor": g.target_amount_minor,
                "current_amount_minor": g.current_amount_minor,
                "target_date": str(g.target_date) if g.target_date else None,
                "status": g.status,
            }
            for g in goals
        ],
        "settings": {s.setting_key: s.setting_value for s in settings_records},
    }

    json_str = json.dumps(backup, indent=2, default=str)
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="klyro_backup_export.json"'},
    )


@router.get("/settings")
def get_user_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch all user configuration settings."""
    records = db.query(AppSetting).filter(AppSetting.user_id == current_user.id).all()
    defaults = {
        "default_currency": current_user.default_currency or "INR",
        "financial_year_start": "4",
        "safe_to_spend_buffer_pct": "10",
        "timezone": current_user.timezone or "Asia/Kolkata",
    }
    for r in records:
        defaults[r.setting_key] = r.setting_value
    return defaults


@router.put("/settings")
def update_user_settings(
    settings_payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update or upsert user configuration settings."""
    for key, val in settings_payload.items():
        val_str = str(val)
        existing = (
            db.query(AppSetting)
            .filter(AppSetting.user_id == current_user.id, AppSetting.setting_key == key)
            .first()
        )
        if existing:
            existing.setting_value = val_str
        else:
            db.add(AppSetting(user_id=current_user.id, setting_key=key, setting_value=val_str))

    db.commit()

    records = db.query(AppSetting).filter(AppSetting.user_id == current_user.id).all()
    return {r.setting_key: r.setting_value for r in records}


@router.post("/management/reseed")
def reseed_demo_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Reset and reseed demo data for the application (Restricted to workspace owner)."""
    if current_user.email != "sanskriti@klyro.finance":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Only the demonstration workspace owner can trigger a global demo reset."}
        )
    # Commit any pending queries and close connection before reseeding
    db.close()
    seed_demo_data(reset=True)
    return {"status": "success", "message": "Demo data successfully re-seeded."}

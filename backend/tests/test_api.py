import os
from datetime import timedelta
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database import get_db, Base
from backend.app.seed import seed_demo_data
from backend.app.utils.security import create_access_token

TEST_DB_FILE = "./test_api_isolated.db"
TEST_DB_URL = f"sqlite:///{TEST_DB_FILE}"

test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})

@event.listens_for(test_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)
# Default client authenticates as Sanskriti (User 1)
client.headers["Authorization"] = f"Bearer {create_access_token(subject=1)}"


@pytest.fixture(scope="module", autouse=True)
def setup_seed_db():
    """Seed the isolated test database before running API tests."""
    db = TestingSessionLocal()
    try:
        seed_demo_data(db=db, reset=True)
    finally:
        db.close()
    yield
    test_engine.dispose()
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass


def test_api_dashboard_summary():
    """Verify GET /api/v1/dashboard returns Money Weather and financial pillars."""
    response = client.get("/api/v1/dashboard?period=2026-10")
    assert response.status_code == 200
    data = response.json()
    assert "money_weather" in data
    assert data["money_weather"]["status"] in ["comfortable", "tightening", "at_risk"]
    assert "current_liquidity_minor" in data
    assert data["current_liquidity_minor"] > 0
    assert "what_changed" in data
    assert len(data["recent_transactions"]) > 0


def test_api_money_weather_forecast():
    """Verify GET /api/v1/dashboard/money-weather standalone forecast."""
    response = client.get("/api/v1/dashboard/money-weather?start_date=2026-10-01&end_date=2026-10-31")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["comfortable", "tightening", "at_risk"]
    assert data["safe_to_spend_minor"] >= 0
    assert data["days_remaining"] > 0


def test_api_list_accounts():
    """Verify GET /api/v1/accounts returns accounts with computed balances."""
    response = client.get("/api/v1/accounts")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    # Verify HDFC Salary Bank has current_balance_minor
    hdfc = next(a for a in data if "HDFC" in a["name"])
    assert hdfc["current_balance_minor"] is not None


def test_api_create_transaction_and_balance_update():
    """Verify POST /api/v1/transactions updates database and account balance."""
    # 1. Get initial balance of Cash account
    accounts_res = client.get("/api/v1/accounts")
    cash_acc = next(a for a in accounts_res.json() if a["account_type"] == "cash")
    init_balance = cash_acc["current_balance_minor"]

    # 2. Record ₹500.00 cash expense (50000 paise)
    payload = {
        "account_id": cash_acc["id"],
        "category_id": 1,
        "transaction_type": "expense",
        "amount_minor": 50000,
        "currency": "INR",
        "merchant": "Local Bakery",
        "description": "Snacks and coffee",
        "transaction_date": "2026-10-15",
        "payment_method": "cash",
    }
    tx_res = client.post("/api/v1/transactions", json=payload)
    assert tx_res.status_code == 201
    created_tx = tx_res.json()
    assert created_tx["amount_minor"] == 50000

    # 3. Verify updated balance
    acc_res_after = client.get(f"/api/v1/accounts/{cash_acc['id']}")
    assert acc_res_after.status_code == 200
    assert acc_res_after.json()["current_balance_minor"] == init_balance - 50000


def test_api_atomic_transfer():
    """Verify POST /api/v1/transactions/transfers executes atomic two-legged debit and credit."""
    accounts_res = client.get("/api/v1/accounts")
    accounts = accounts_res.json()
    bank_acc = next(a for a in accounts if a["account_type"] == "bank")
    wallet_acc = next(a for a in accounts if a["account_type"] == "wallet")

    init_bank = bank_acc["current_balance_minor"]
    init_wallet = wallet_acc["current_balance_minor"]
    transfer_amount = 100000  # ₹1,000.00 (100000 paise)

    payload = {
        "from_account_id": bank_acc["id"],
        "to_account_id": wallet_acc["id"],
        "amount_minor": transfer_amount,
        "transaction_date": "2026-10-15",
        "description": "UPI Wallet Top-Up",
    }
    res = client.post("/api/v1/transactions/transfers", json=payload)
    assert res.status_code == 201
    legs = res.json()
    assert len(legs) == 2
    assert legs[0]["transfer_group_id"] == legs[1]["transfer_group_id"]

    # Verify both account balances updated atomically
    bank_after = client.get(f"/api/v1/accounts/{bank_acc['id']}").json()["current_balance_minor"]
    wallet_after = client.get(f"/api/v1/accounts/{wallet_acc['id']}").json()["current_balance_minor"]
    assert bank_after == init_bank - transfer_amount
    assert wallet_after == init_wallet + transfer_amount


def test_api_validation_error_format():
    """Verify that invalid payloads return the unified error format with VALIDATION_ERROR code."""
    payload = {
        "account_id": 1,
        "transaction_type": "expense",
        "amount_minor": -100,  # Negative amount rejected
        "transaction_date": "2026-10-15",
    }
    response = client.post("/api/v1/transactions", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "details" in data["error"]


def test_api_export_transactions_csv():
    """Verify GET /api/v1/export/transactions returns valid CSV."""
    response = client.get("/api/v1/export/transactions")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert "Date,Type,Amount (INR)" in response.text


def test_api_export_full_backup_json():
    """Verify GET /api/v1/export/backup returns valid structured JSON backup."""
    response = client.get("/api/v1/export/backup")
    assert response.status_code == 200
    assert "application/json" in response.headers.get("content-type", "")
    data = response.json()
    assert "metadata" in data
    assert "accounts" in data
    assert "transactions" in data
    assert "budgets" in data
    assert "recurring_rules" in data
    assert "goals" in data
    assert "settings" in data


def test_api_get_and_update_settings():
    """Verify GET /api/v1/settings and PUT /api/v1/settings."""
    # 1. Fetch defaults
    res = client.get("/api/v1/settings")
    assert res.status_code == 200
    settings_data = res.json()
    assert "default_currency" in settings_data

    # 2. Update settings
    update_res = client.put("/api/v1/settings", json={"safe_to_spend_buffer_pct": "15", "financial_year_start": "4"})
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["safe_to_spend_buffer_pct"] == "15"


def test_api_recurring_rules_crud_and_calendar():
    """Verify recurring rules listing, creation, upcoming calendar, and deletion."""
    # List existing rules
    rules_res = client.get("/api/v1/recurring-rules")
    assert rules_res.status_code == 200
    init_count = len(rules_res.json())

    # Get valid account
    accs = client.get("/api/v1/accounts").json()
    assert len(accs) > 0
    target_acc_id = accs[0]["id"]

    # Create new rule
    new_rule_payload = {
        "account_id": target_acc_id,
        "name": "Cloud Storage Subscription",
        "rule_type": "expense",
        "expected_amount_minor": 13000,  # ₹130.00
        "frequency": "monthly",
        "start_date": "2026-10-15",
        "next_due_date": "2026-10-28",
        "status": "active",
    }
    create_res = client.post("/api/v1/recurring-rules", json=new_rule_payload)
    assert create_res.status_code == 201
    created_rule = create_res.json()
    assert created_rule["name"] == "Cloud Storage Subscription"
    rule_id = created_rule["id"]

    # Verify in upcoming calendar
    calendar_res = client.get("/api/v1/calendar/upcoming?days=30")
    assert calendar_res.status_code == 200
    events = calendar_res.json()
    assert any(e["rule_id"] == rule_id for e in events)

    # Delete rule
    del_res = client.delete(f"/api/v1/recurring-rules/{rule_id}")
    assert del_res.status_code == 204

    # Verify count decremented back
    after_rules = client.get("/api/v1/recurring-rules").json()
    assert len(after_rules) == init_count


def test_api_openapi_json_schema():
    """Verify that OpenAPI 3.x schema generation is valid and accessible."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "openapi" in schema
    assert "paths" in schema
    assert "components" in schema
    # Verify core routes exist in openapi spec
    assert "/api/v1/dashboard" in schema["paths"]
    assert "/api/v1/transactions" in schema["paths"]
    assert "/api/v1/transactions/transfers" in schema["paths"]
    assert "/api/v1/budgets" in schema["paths"]
    assert "/api/v1/goals" in schema["paths"]
    assert "/api/v1/export/transactions" in schema["paths"]
    assert "/api/v1/export/backup" in schema["paths"]


def test_api_transfer_same_account_rejected():
    """Verify that attempting to transfer to the same account is rejected with 400 IDENTICAL_ACCOUNTS."""
    accs = client.get("/api/v1/accounts").json()
    acc_id = accs[0]["id"]
    payload = {
        "from_account_id": acc_id,
        "to_account_id": acc_id,
        "amount_minor": 100000,
        "transaction_date": "2026-10-15",
    }
    response = client.post("/api/v1/transactions/transfers", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "IDENTICAL_ACCOUNTS"
    assert "Source and destination accounts must be different" in data["error"]["message"]


def test_api_account_not_found_404():
    """Verify that querying a non-existent account returns 404 with unified error format."""
    response = client.get("/api/v1/accounts/999999")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "ACCOUNT_NOT_FOUND"
    assert "message" in data["error"]


def test_api_update_transaction():
    """Verify PATCH /api/v1/transactions/{id} modifies transaction and updates fields."""
    accs = client.get("/api/v1/accounts").json()
    acc_id = accs[0]["id"]
    # 1. Create a transaction
    tx_res = client.post("/api/v1/transactions", json={
        "account_id": acc_id,
        "transaction_type": "expense",
        "amount_minor": 15000,
        "merchant": "Original Store",
        "transaction_date": "2026-10-15",
    })
    assert tx_res.status_code == 201
    tx_id = tx_res.json()["id"]

    # 2. Update merchant and notes
    patch_res = client.patch(f"/api/v1/transactions/{tx_id}", json={
        "merchant": "Updated Store",
        "notes": "Updated Receipt Notes",
    })
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["merchant"] == "Updated Store"
    assert updated["notes"] == "Updated Receipt Notes"


def test_api_delete_account():
    """Verify DELETE /api/v1/accounts/{id} deletes account."""
    create_res = client.post("/api/v1/accounts", json={
        "name": "Temporary Account for Deletion",
        "account_type": "bank",
        "opening_balance_minor": 100000,
    })
    assert create_res.status_code == 201
    acc_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/accounts/{acc_id}")
    assert del_res.status_code == 204

    # Verify not found
    get_res = client.get(f"/api/v1/accounts/{acc_id}")
    assert get_res.status_code == 404


def test_api_delete_goal():
    """Verify DELETE /api/v1/goals/{id} deletes goal."""
    create_res = client.post("/api/v1/goals", json={
        "name": "Temporary Goal",
        "target_amount_minor": 5000000,
        "initial_amount_minor": 100000,
    })
    assert create_res.status_code == 201
    goal_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/goals/{goal_id}")
    assert del_res.status_code == 204


def test_api_unauthenticated_request_rejected():
    """Verify protected endpoints reject unauthenticated requests with 401 UNAUTHORIZED."""
    anon_client = TestClient(app)
    endpoints = [
        "/api/v1/auth/me",
        "/api/v1/dashboard",
        "/api/v1/accounts",
        "/api/v1/transactions",
        "/api/v1/budgets",
        "/api/v1/goals",
        "/api/v1/recurring-rules",
    ]
    for ep in endpoints:
        res = anon_client.get(ep)
        assert res.status_code == 401
        assert res.json()["error"]["code"] == "UNAUTHORIZED"


def test_api_forged_and_expired_tokens_rejected():
    """Verify forged and expired bearer tokens are strictly rejected."""
    # Forged signature
    res_forged = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer forged.header.signature"})
    assert res_forged.status_code == 401
    assert res_forged.json()["error"]["code"] == "INVALID_TOKEN"

    # Expired token
    expired_token = create_access_token(subject=1, expires_delta=timedelta(seconds=-60))
    res_expired = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res_expired.status_code == 401
    assert res_expired.json()["error"]["code"] == "TOKEN_EXPIRED"


def test_api_user_registration_and_password_validation():
    """Verify registration input validation, password complexity rules, and auto category seeding."""
    anon_client = TestClient(app)

    # 1. Password too short (< 8 chars)
    weak_res = anon_client.post("/api/v1/auth/register", json={
        "name": "Short Pass User",
        "email": "short@klyro.finance",
        "password": "short",
    })
    assert weak_res.status_code == 422

    # 2. Valid registration
    reg_res = anon_client.post("/api/v1/auth/register", json={
        "name": "New Registered User",
        "email": "fresh.user@klyro.finance",
        "password": "SecurePassword123!",
    })
    assert reg_res.status_code == 201
    new_user = reg_res.json()
    new_user_id = new_user["id"]

    # 3. Duplicate email registration rejected
    dup_res = anon_client.post("/api/v1/auth/register", json={
        "name": "Duplicate User",
        "email": "fresh.user@klyro.finance",
        "password": "SecurePassword123!",
    })
    assert dup_res.status_code == 409
    assert dup_res.json()["error"]["code"] == "EMAIL_EXISTS"

    # 4. Verify default categories were seeded for this new user
    new_token = create_access_token(subject=new_user_id)
    cat_res = anon_client.get("/api/v1/categories", headers={"Authorization": f"Bearer {new_token}"})
    assert cat_res.status_code == 200
    categories = cat_res.json()
    assert len(categories) >= 11
    assert any(c["name"] == "Groceries & Essentials" for c in categories)


def test_api_password_change_flow():
    """Verify password update flow with existing credential validation."""
    anon_client = TestClient(app)
    # Register test user
    reg = anon_client.post("/api/v1/auth/register", json={
        "name": "Pass Change User",
        "email": "passchange@klyro.finance",
        "password": "InitialPassword123!",
    })
    user_id = reg.json()["id"]
    token = create_access_token(subject=user_id)
    user_headers = {"Authorization": f"Bearer {token}"}

    # Wrong current password
    bad_change = anon_client.post("/api/v1/auth/change-password", headers=user_headers, json={
        "current_password": "WrongPassword!",
        "new_password": "NewSecretPassword456!",
    })
    assert bad_change.status_code == 400
    assert bad_change.json()["error"]["code"] == "INVALID_PASSWORD"

    # Correct current password
    good_change = anon_client.post("/api/v1/auth/change-password", headers=user_headers, json={
        "current_password": "InitialPassword123!",
        "new_password": "NewSecretPassword456!",
    })
    assert good_change.status_code == 200

    # Old password fails login
    old_login = anon_client.post("/api/v1/auth/login", json={
        "email": "passchange@klyro.finance",
        "password": "InitialPassword123!",
    })
    assert old_login.status_code == 401

    # New password succeeds login
    new_login = anon_client.post("/api/v1/auth/login", json={
        "email": "passchange@klyro.finance",
        "password": "NewSecretPassword456!",
    })
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()


def test_api_multi_user_strict_data_isolation():
    """
    MANDATORY ISOLATION TEST:
    Verify that User Alice and User Bob have 100% segregated financial data.
    Neither user can read, mutate, transfer from, or delete the other user's resources.
    """
    anon_client = TestClient(app)

    # 1. Register Alice and Bob
    alice_reg = anon_client.post("/api/v1/auth/register", json={
        "name": "Alice User",
        "email": "alice@klyro.finance",
        "password": "AlicePassword123!",
    })
    bob_reg = anon_client.post("/api/v1/auth/register", json={
        "name": "Bob User",
        "email": "bob@klyro.finance",
        "password": "BobPassword123!",
    })

    alice_id = alice_reg.json()["id"]
    bob_id = bob_reg.json()["id"]

    alice_token = create_access_token(subject=alice_id)
    bob_token = create_access_token(subject=bob_id)

    alice_h = {"Authorization": f"Bearer {alice_token}"}
    bob_h = {"Authorization": f"Bearer {bob_token}"}

    # 2. Alice creates Account and Transaction
    alice_acc_res = anon_client.post("/api/v1/accounts", headers=alice_h, json={
        "name": "Alice Private Vault",
        "account_type": "bank",
        "opening_balance_minor": 8000000,
    })
    alice_acc_id = alice_acc_res.json()["id"]

    alice_tx_res = anon_client.post("/api/v1/transactions", headers=alice_h, json={
        "account_id": alice_acc_id,
        "transaction_type": "expense",
        "amount_minor": 150000,
        "merchant": "Alice Merchant",
        "transaction_date": "2026-10-15",
    })
    alice_tx_id = alice_tx_res.json()["id"]

    # Alice creates a Budget
    alice_cat_res = anon_client.get("/api/v1/categories", headers=alice_h)
    alice_cat_id = alice_cat_res.json()[0]["id"]
    alice_budget_res = anon_client.post("/api/v1/budgets", headers=alice_h, json={
        "name": "Alice Monthly Plan",
        "period_type": "monthly",
        "start_date": "2026-10-01",
        "end_date": "2026-10-31",
        "total_limit_minor": 5000000,
        "allocations": [{"category_id": alice_cat_id, "allocated_amount_minor": 2000000}]
    })
    alice_budget_id = alice_budget_res.json()["id"]

    # Alice creates a Goal
    alice_goal_res = anon_client.post("/api/v1/goals", headers=alice_h, json={
        "name": "Alice Secret Goal",
        "target_amount_minor": 10000000,
        "initial_amount_minor": 500000,
    })
    alice_goal_id = alice_goal_res.json()["id"]

    # 3. Bob attempts to access Alice's resources -> MUST BE REJECTED (404)
    # A. Bob gets Alice's account by ID
    bob_get_acc = anon_client.get(f"/api/v1/accounts/{alice_acc_id}", headers=bob_h)
    assert bob_get_acc.status_code == 404

    # B. Bob attempts to mutate Alice's account
    bob_patch_acc = anon_client.patch(f"/api/v1/accounts/{alice_acc_id}", headers=bob_h, json={"name": "Hacked Account"})
    assert bob_patch_acc.status_code == 404

    # C. Bob attempts to delete Alice's account
    bob_del_acc = anon_client.delete(f"/api/v1/accounts/{alice_acc_id}", headers=bob_h)
    assert bob_del_acc.status_code == 404

    # D. Bob gets Alice's transaction by ID
    bob_get_tx = anon_client.get(f"/api/v1/transactions/{alice_tx_id}", headers=bob_h)
    assert bob_get_tx.status_code == 404

    # E. Bob attempts to mutate Alice's transaction
    bob_patch_tx = anon_client.patch(f"/api/v1/transactions/{alice_tx_id}", headers=bob_h, json={"merchant": "Hacked"})
    assert bob_patch_tx.status_code == 404

    # F. Bob attempts to delete Alice's transaction
    bob_del_tx = anon_client.delete(f"/api/v1/transactions/{alice_tx_id}", headers=bob_h)
    assert bob_del_tx.status_code == 404

    # G. Bob creates his own account and attempts to transfer FROM Alice's account
    bob_acc_res = anon_client.post("/api/v1/accounts", headers=bob_h, json={
        "name": "Bob Checking",
        "account_type": "bank",
        "opening_balance_minor": 100000,
    })
    bob_acc_id = bob_acc_res.json()["id"]

    bob_steal_transfer = anon_client.post("/api/v1/transactions/transfers", headers=bob_h, json={
        "from_account_id": alice_acc_id,
        "to_account_id": bob_acc_id,
        "amount_minor": 500000,
        "transaction_date": "2026-10-15",
    })
    assert bob_steal_transfer.status_code == 404

    # H. Bob attempts to view Alice's budget or performance
    bob_get_budget = anon_client.get(f"/api/v1/budgets/{alice_budget_id}", headers=bob_h)
    assert bob_get_budget.status_code == 404
    bob_perf_budget = anon_client.get(f"/api/v1/budgets/{alice_budget_id}/performance", headers=bob_h)
    assert bob_perf_budget.status_code == 404

    # I. Bob attempts to delete Alice's budget
    bob_del_budget = anon_client.delete(f"/api/v1/budgets/{alice_budget_id}", headers=bob_h)
    assert bob_del_budget.status_code == 404

    # J. Bob attempts to delete or contribute to Alice's goal
    bob_del_goal = anon_client.delete(f"/api/v1/goals/{alice_goal_id}", headers=bob_h)
    assert bob_del_goal.status_code == 404

    # K. Bob lists his accounts and transactions -> MUST NOT contain Alice's records
    bob_accounts = anon_client.get("/api/v1/accounts", headers=bob_h).json()
    assert all(a["id"] != alice_acc_id for a in bob_accounts)

    bob_transactions = anon_client.get("/api/v1/transactions", headers=bob_h).json()
    assert all(t["id"] != alice_tx_id for t in bob_transactions["items"])

    # L. Bob's dashboard shows zero contamination from Alice
    bob_dash = anon_client.get("/api/v1/dashboard", headers=bob_h).json()
    assert bob_dash["current_liquidity_minor"] == 100000  # only Bob's 100000 paise opening balance


def test_transaction_recording_account_selection_and_transfers_e2e():
    """
    End-to-end verification of transaction recording, account selection, and transfers:
    1. Create two eligible accounts for test user.
    2. Record expense from Account 1 -> verify ledger & balance decrease.
    3. Record income deposited to Account 2 -> verify ledger & balance increase.
    4. Transfer money from Account 1 to Account 2 -> verify atomic debit & credit.
    5. Verify transfer is NOT counted as income or expense in cash flow.
    6. Verify persistence across requests.
    7. Verify validation failure when account is missing.
    8. Verify rejection when transferring between identical accounts.
    9. Verify cross-user account submission is rejected (404).
    10. Verify login, session token, and logout flow.
    """
    client = TestClient(app)

    # 1. Register test user "Karan"
    reg_res = client.post("/api/v1/auth/register", json={
        "name": "Karan Singhal",
        "email": "karan.singhal@klyro.finance",
        "password": "KaranPassword123!",
    })
    assert reg_res.status_code == 201
    user_id = reg_res.json()["id"]

    login_res = client.post("/api/v1/auth/login", json={
        "email": "karan.singhal@klyro.finance",
        "password": "KaranPassword123!",
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # Step 1: Create two eligible accounts
    acc1_res = client.post("/api/v1/accounts", headers=auth_headers, json={
        "name": "HDFC Salary Bank",
        "account_type": "bank",
        "opening_balance_minor": 5000000,  # ₹50,000.00
    })
    assert acc1_res.status_code == 201
    acc1_id = acc1_res.json()["id"]

    acc2_res = client.post("/api/v1/accounts", headers=auth_headers, json={
        "name": "Paytm Wallet",
        "account_type": "wallet",
        "opening_balance_minor": 1000000,  # ₹10,000.00
    })
    assert acc2_res.status_code == 201
    acc2_id = acc2_res.json()["id"]

    # Verify initial balances
    acc1_get = client.get(f"/api/v1/accounts/{acc1_id}", headers=auth_headers).json()
    acc2_get = client.get(f"/api/v1/accounts/{acc2_id}", headers=auth_headers).json()
    assert acc1_get["current_balance_minor"] == 5000000
    assert acc2_get["current_balance_minor"] == 1000000

    # Get a category for expense
    cats = client.get("/api/v1/categories", headers=auth_headers).json()
    groceries_cat = next((c for c in cats if "grocer" in c["name"].lower()), cats[0])
    salary_cat = next((c for c in cats if "salary" in c["name"].lower()), cats[1])

    # Step 2 & 3: Record an expense from Account 1
    exp_res = client.post("/api/v1/transactions", headers=auth_headers, json={
        "account_id": acc1_id,
        "category_id": groceries_cat["id"],
        "transaction_type": "expense",
        "amount_minor": 500000,  # ₹5,000.00
        "merchant": "Nature's Basket",
        "transaction_date": "2026-10-16",
        "payment_method": "debit_card",
        "notes": "Weekly household essentials",
    })
    assert exp_res.status_code == 201
    exp_data = exp_res.json()
    assert exp_data["account_id"] == acc1_id
    assert exp_data["amount_minor"] == 500000

    # Verify Account 1 balance decreased by ₹5,000 (from ₹50,000 to ₹45,000)
    acc1_after_exp = client.get(f"/api/v1/accounts/{acc1_id}", headers=auth_headers).json()
    assert acc1_after_exp["current_balance_minor"] == 4500000

    # Step 4 & 5: Record income deposited into Account 2
    inc_res = client.post("/api/v1/transactions", headers=auth_headers, json={
        "account_id": acc2_id,
        "category_id": salary_cat["id"],
        "transaction_type": "income",
        "amount_minor": 2000000,  # ₹20,000.00
        "merchant": "Consulting Payout",
        "transaction_date": "2026-10-18",
        "payment_method": "upi",
        "notes": "Client project milestone",
    })
    assert inc_res.status_code == 201
    inc_data = inc_res.json()
    assert inc_data["account_id"] == acc2_id
    assert inc_data["amount_minor"] == 2000000

    # Verify Account 2 balance increased by ₹20,000 (from ₹10,000 to ₹30,000)
    acc2_after_inc = client.get(f"/api/v1/accounts/{acc2_id}", headers=auth_headers).json()
    assert acc2_after_inc["current_balance_minor"] == 3000000

    # Step 6 & 7: Transfer ₹15,000 from Account 2 to Account 1
    transfer_res = client.post("/api/v1/transactions/transfers", headers=auth_headers, json={
        "from_account_id": acc2_id,
        "to_account_id": acc1_id,
        "amount_minor": 1500000,  # ₹15,000.00
        "transaction_date": "2026-10-20",
        "description": "Wallet to Bank Sweep",
        "notes": "Surplus transfer",
    })
    assert transfer_res.status_code == 201
    legs = transfer_res.json()
    assert len(legs) == 2
    assert legs[0]["transfer_group_id"] == legs[1]["transfer_group_id"]

    # Verify balances after transfer:
    # Account 1: ₹45,000 + ₹15,000 = ₹60,000 (6,000,000 paise)
    # Account 2: ₹30,000 - ₹15,000 = ₹15,000 (1,500,000 paise)
    acc1_after_transfer = client.get(f"/api/v1/accounts/{acc1_id}", headers=auth_headers).json()
    acc2_after_transfer = client.get(f"/api/v1/accounts/{acc2_id}", headers=auth_headers).json()
    assert acc1_after_transfer["current_balance_minor"] == 6000000
    assert acc2_after_transfer["current_balance_minor"] == 1500000

    # Step 7 (continued): Verify transfer is NOT counted as income or expense in dashboard cash flow
    dash_res = client.get("/api/v1/dashboard?period=2026-10", headers=auth_headers).json()
    # Income should strictly be ₹20,000 (not contaminated by the ₹15,000 transfer)
    assert dash_res["period_income_minor"] == 2000000
    # Expense should strictly be ₹5,000 (not contaminated by the ₹15,000 transfer)
    assert dash_res["period_expense_minor"] == 500000
    # Total liquidity = ₹60,000 + ₹15,000 = ₹75,000
    assert dash_res["current_liquidity_minor"] == 7500000

    # Step 8: Persistence across fresh query
    ledger = client.get("/api/v1/transactions", headers=auth_headers).json()
    assert ledger["pagination"]["total_records"] >= 4  # 1 exp + 1 inc + 2 transfer legs

    # Step 9: Rejection when account is missing
    bad_tx_no_acc = client.post("/api/v1/transactions", headers=auth_headers, json={
        "category_id": groceries_cat["id"],
        "transaction_type": "expense",
        "amount_minor": 10000,
        "transaction_date": "2026-10-21",
    })
    assert bad_tx_no_acc.status_code == 422  # validation error (missing account_id)

    # Step 10: Rejection when transferring between identical accounts
    bad_transfer_same = client.post("/api/v1/transactions/transfers", headers=auth_headers, json={
        "from_account_id": acc1_id,
        "to_account_id": acc1_id,
        "amount_minor": 50000,
        "transaction_date": "2026-10-21",
    })
    assert bad_transfer_same.status_code == 400
    assert bad_transfer_same.json()["error"]["code"] == "IDENTICAL_ACCOUNTS"

    # Step 11: User cannot submit transaction or transfer with another user's account ID
    # Register "Sneha"
    sneha_reg = client.post("/api/v1/auth/register", json={
        "name": "Sneha Roy",
        "email": "sneha.roy@klyro.finance",
        "password": "SnehaPassword123!",
    })
    sneha_token = create_access_token(subject=sneha_reg.json()["id"])
    sneha_headers = {"Authorization": f"Bearer {sneha_token}"}

    # Sneha attempts to record transaction on Karan's account -> 404
    sneha_tamper_tx = client.post("/api/v1/transactions", headers=sneha_headers, json={
        "account_id": acc1_id,
        "transaction_type": "expense",
        "amount_minor": 10000,
        "transaction_date": "2026-10-21",
    })
    assert sneha_tamper_tx.status_code == 404
    assert sneha_tamper_tx.json()["error"]["code"] == "ACCOUNT_NOT_FOUND"

    # Sneha attempts transfer from Karan's account -> 404
    sneha_acc = client.post("/api/v1/accounts", headers=sneha_headers, json={
        "name": "Sneha Savings",
        "account_type": "bank",
        "opening_balance_minor": 50000,
    }).json()

    sneha_steal = client.post("/api/v1/transactions/transfers", headers=sneha_headers, json={
        "from_account_id": acc1_id,
        "to_account_id": sneha_acc["id"],
        "amount_minor": 100000,
        "transaction_date": "2026-10-21",
    })
    assert sneha_steal.status_code == 404
    assert sneha_steal.json()["error"]["code"] == "ACCOUNT_NOT_FOUND"

    # Step 12: Logout terminates session
    logout_res = client.post("/api/v1/auth/logout", headers=auth_headers)
    assert logout_res.status_code == 200





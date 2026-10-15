import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.seed import seed_demo_data

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_seed_db():
    """Seed the database with isolated demo data before running API tests."""
    seed_demo_data(reset=True)


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



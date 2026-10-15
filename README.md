# Klyro — Personal Financial Intelligence Workspace

> **"Clarity you can act on."**

**Klyro** is an intelligent personal financial intelligence workspace built for students, salaried professionals, and first-time budgeters. It helps users understand where their money goes, forecast their financial month, and know exactly how much they can safely spend.

Rather than reproducing generic blue-purple fintech cards or cold spreadsheet tables, Klyro introduces a distinctive visual identity — inspired by tactile warm ivory surfaces, charcoal/espresso typography, burnt coral action accents, and restrained muted tones — backed by an exact Python FastAPI arithmetic engine.

---

## 1. Brand Identity & Product Philosophy

- **Official Brand Name:** Klyro
- **Official Tagline:** “Clarity you can act on.”
- **Brand Personality:** Intelligent, futuristic, precise, calm, and approachable.
- **Product Positioning:** A personal financial intelligence workspace that combines deep financial reasoning with consumer clarity.

---

## 2. Signature Financial Intelligence Features

### ⛅ Money Weather
An intuitive visual forecast communicating whether your financial month is **Comfortable**, **Tightening**, or **At Risk** based on actual liquid balances, expected income, upcoming bills, planned savings, and remaining budget pacing.

### 🛡️ Safe-to-Spend
A transparent, explainable estimate of discretionary money available until your next expected income date:
$$\text{Safe-to-Spend} = \max\left(0, \text{Liquid Funds} + \text{Expected Inflows} - \text{Mandatory Outflows} - \text{Buffer Reserve}\right)$$
Includes an adjustable safety cushion (5%–20%) reserved to prevent lifestyle inflation or unexpected deficits.

### 💓 Budget Pulse & Pacing Radar
Real-time pacing tracks showing whether spending categories are progressing normally, accelerating too quickly, or projected to exceed limits by month's end based on daily run rates.

### 🧬 Spending DNA & Behavioral Insights
Plain-language pattern detection revealing recurring spending habits, merchant concentration, dining trends, and actionable anomalies.

### ⏳ Financial Timeline Radar
A 30-day forward-looking radar unifying salary credits, EMI payments, SIP investments, rent auto-debits, and subscription renewals with relative urgency tags (`Due today`, `Due tomorrow`, `In X days`).

### 🎯 Goal Momentum & Velocity Forecasting
Tracks milestones for emergency funds, travel, and investments, projecting exact completion dates based on historical 3-month savings velocity.

### 🔄 What Changed?
Concise, evidence-based narrative explanations comparing the current month's liquidity and savings position against previous cycles.

### ⚡ Quick Capture (`Q` Keyboard Shortcut)
A persistent, keyboard-first modal for logging transactions or atomic internal account transfers in seconds, complete with smart merchant keyword categorization (Swiggy, Uber, Amazon, Nature's Basket, etc.).

---

## 3. Indian Financial Context by Design

- **Integer Paise Arithmetic:** All monetary values are strictly modeled and stored as 64-bit integer minor units (paise; ₹1 = 100 paise) to mathematically eliminate binary floating-point rounding errors.
- **Indian Number System:** Numbers formatted natively in Lakhs and Crores (e.g., ₹1,50,000.00 instead of 150,000.00).
- **Indian Financial Year:** Full support for the April 1 – March 31 financial year cycle alongside standard calendar years.
- **Indian Payment Methods:** Native tracking for UPI (Google Pay, PhonePe, Paytm), Debit Cards, Credit Cards, Net Banking, and Cash.
- **Indian Financial Commitments:** Dedicated support for loan EMIs (Home loan, car loan), SIPs (Systematic Investment Plans for mutual funds), rent auto-debits, and utility bills.
- **Atomic Two-Legged Transfers:** Moving money between accounts (e.g., HDFC Salary Bank → Zerodha Trading Account) creates linked ledger legs sharing a UUID `transfer_group_id` that never artificially inflate income or expense metrics.

---

## 4. Technology Stack & Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │               CLIENT LAYER (Browser)                   │
                    │  HTML5 + Tailwind CSS + Vanilla ES Modules + Chart.js  │
                    │  Klyro Palette (Ivory, Charcoal, Burnt Coral, Sage)    │
                    └──────────────────────────┬─────────────────────────────┘
                                               │ Fetch API (JSON / REST)
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │               FASTAPI REST API LAYER                   │
                    │  /api/v1 (Dashboard, Transactions, Accounts, Budgets)  │
                    │  Unified Error Envelopes • Pydantic v2 Models          │
                    └──────────────────────────┬─────────────────────────────┘
                                               │
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │              FINANCIAL CALCULATION ENGINE              │
                    │  Exact Paise Arithmetic • Money Weather • Safe-to-Spend│
                    │  Spending DNA • Atomic Two-Legged Transfer Service     │
                    └──────────────────────────┬─────────────────────────────┘
                                               │ SQLAlchemy 2.0 ORM
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │               PERSISTENCE LAYER (SQLite)               │
                    │  PRAGMA foreign_keys = ON; • Normalized Schema         │
                    │  Alembic Migrations • PostgreSQL Migration-Ready       │
                    └────────────────────────────────────────────────────────┘
```

---

## 5. Directory Structure

```text
kosh-budget/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/                  # REST API routers (dashboard, accounts, transactions, etc.)
│   │   ├── models/                  # SQLAlchemy ORM models (User, Account, Category, Transaction, etc.)
│   │   ├── schemas/                 # Pydantic v2 request/response models & unified ErrorResponse
│   │   ├── services/                # Exact calculation engine, Money Weather, Spending DNA, Transfers
│   │   ├── utils/                   # Security (JWT, bcrypt), formatters, currency helpers
│   │   ├── config.py                # Environment configuration settings
│   │   ├── database.py              # Engine setup & SQLite PRAGMA hook
│   │   ├── seed.py                  # Isolated realistic Indian demo dataset generator
│   │   └── main.py                  # FastAPI application entrypoint & static frontend mounting
│   ├── alembic/                     # Alembic migration scripts
│   └── tests/                       # Pytest test suites (35 unit & integration tests)
├── frontend/
│   ├── css/
│   │   └── editorial-theme.css      # Design system styling, color variables, paper cards
│   ├── js/
│   │   ├── components/              # Quick-capture modal, command palette, toasts
│   │   ├── views/                   # Views: home, transactions, accounts, budgets, insights, goals, recurring, settings
│   │   ├── utils/                   # Indian currency formatter, date helpers, chart renderers
│   │   ├── api.js                   # Typed REST client
│   │   ├── router.js                # Hash router (#home, #transactions, #budgets, etc.)
│   │   ├── state.js                 # Reactive state store
│   │   └── app.js                   # Main application initialization
│   └── index.html                   # Single-Page Application shell with Klyro brandmark
├── postman/
│   └── Kosh_Budget_API.postman_collection.json  # Comprehensive Postman test collection
├── pytest.ini                       # Test configuration
├── requirements.txt                 # Backend dependencies
└── README.md                        # Documentation
```

---

## 6. Quick Start Guide

### Step 1: Environment Setup

Clone or navigate into the project directory:

```powershell
cd "c:\Users\Sanskriti Vadher\OneDrive\Desktop\HSB\T2\kosh-budget"
```

Activate the virtual environment:

```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1
```

*(If creating a fresh virtual environment: `python -m venv venv` followed by `pip install -r requirements.txt`)*

### Step 2: Seed Demonstration Database

Initialize the database with an authentic Indian personal finance demo portfolio:

```powershell
python -m backend.app.seed
```

This seeds:
- **Demo User:** Sanskriti Vadher (`sanskriti@klyro.finance` / `DemoPassword123!`)
- **Accounts:** HDFC Salary Bank, ICICI Coral Credit Card, Paytm Wallet, Cash Reserve, Zerodha Equity.
- **Categories:** Groceries, Dining & Food Delivery, Utilities, Transportation, Rent, Subscriptions, EMIs.
- **Transactions:** Swiggy, Nature's Basket, Bescom Electricity, BPCL Fuel, ACME Corp Salary, Internal UPI transfers.
- **Budgets & Goals:** October 2026 Budget, Emergency Reserve Fund, Bali Holiday Goal.
- **Recurring Commitments:** HDFC Home Loan EMI, Netflix, Salary, House Rent.

### Step 3: Run the Application Server

Start the FastAPI application with auto-reload:

```powershell
uvicorn backend.app.main:app --reload --port 8081
```

Open your browser and navigate to:
- **Application UI:** [http://127.0.0.1:8081/](http://127.0.0.1:8081/)
- **Interactive Swagger Docs:** [http://127.0.0.1:8081/docs](http://127.0.0.1:8081/docs)
- **ReDoc Documentation:** [http://127.0.0.1:8081/redoc](http://127.0.0.1:8081/redoc)
- **OpenAPI 3.x Schema:** [http://127.0.0.1:8081/openapi.json](http://127.0.0.1:8081/openapi.json)

---

## 7. Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Q</kbd> | **Quick Capture** | Opens instant transaction logging modal from any screen |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | **Command Palette** | Global navigation and transaction search |
| <kbd>Esc</kbd> | **Close Modal** | Dismisses any active modal dialog |

---

## 8. Automated Testing Suite

Klyro includes an extensive test suite verifying calculations, schema serialization, database integrity, and REST endpoints:

```powershell
pytest -v
```

### Test Coverage Highlights (35/35 Tests Passing):
1. **Mathematical Accuracy:** Paise minor unit precision, savings rates, Safe-to-Spend clamping, goal completion projections, and budget pacing status.
2. **Transfer Integrity:** Atomic two-legged balance reconciliation, transfer exclusion from cash flow, and identical account rejection.
3. **Database Constraints:** SQLite foreign key cascade deletion, unique constraints on user emails and budget allocations.
4. **API Endpoints:** Authentication, Money Weather forecasts, CSV transaction export, JSON backup dumps, settings persistence, and error envelope formatting.

---

## 9. Postman Collection

The Postman collection is located at [`postman/Kosh_Budget_API.postman_collection.json`](file:///c:/Users/Sanskriti%20Vadher/OneDrive/Desktop/HSB/T2/kosh-budget/postman/Kosh_Budget_API.postman_collection.json) and contains ready-to-execute requests across 10 functional groups:
1. `System & Health`
2. `Authentication`
3. `Dashboard & Money Weather`
4. `Transactions`
5. `Accounts`
6. `Budgets`
7. `Goals`
8. `Recurring & Calendar`
9. `Analytics & Insights`
10. `Data Management & Settings`

To use:
1. Open Postman.
2. Click **Import** → select `postman/Kosh_Budget_API.postman_collection.json`.
3. Set `baseUrl` to `http://127.0.0.1:8081`.

---

## 10. Data Ownership & Portability

- **CSV Export:** Download complete ledger history (`GET /api/v1/export/transactions` → `klyro_transactions_export.csv`).
- **JSON Backup:** Download complete structured database archive (`GET /api/v1/export/backup` → `klyro_backup_export.json`).
- **Local Isolation:** All data resides on your local machine; zero external telemetry or tracking.
- **One-Click Re-seed:** Easily restore sample data anytime via the Studio Settings view or `POST /api/v1/management/reseed`.

---

## 11. Vercel & Neon PostgreSQL Production Deployment

Klyro supports dual-engine deployment: zero-config SQLite for local development and Neon Serverless PostgreSQL for production hosting on Vercel.

### Step 1: Create a Free Neon PostgreSQL Database
1. Go to [Neon.tech](https://neon.tech) and sign up / log in.
2. Create a new project (e.g. `klyro-db`).
3. Under the **Dashboard** / **Connection Details**, copy the pooled Connection String:
   `postgresql://[user]:[password]@[endpoint]-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`

### Step 2: Initialize Schema & Seed Demo Data
Run the automated initialization script from your local machine:
```powershell
python scripts/setup_neon.py "postgresql://[user]:[password]@[endpoint]-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
```
*(Or run `python scripts/setup_neon.py` with no arguments to be prompted for the URL).*
This runs `alembic upgrade head` and seeds all demo Indian financial data (accounts, transactions, budgets, goals, recurring commitments) directly into your Neon database.

### Step 3: Configure Environment Variables in Vercel
In your Vercel Project Settings → **Environment Variables**, set:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Neon PostgreSQL pooled connection string |
| `SECRET_KEY` | *(Generate a 32+ char random string)* | Cryptographic JWT signing key for production |
| `APP_ENV` | `production` | Production environment flag |
| `DEBUG` | `false` | Disable debug logs & stack traces |
| `CORS_ORIGINS` | `https://*.vercel.app,https://your-custom-domain.com` | Allowed CORS origins |

### Step 4: Deploy to Vercel
1. Push your repository to GitHub / GitLab / Bitbucket.
2. In Vercel, click **Add New** → **Project** and import `klyro`.
3. Root Directory: `./` (Vercel automatically detects `vercel.json` and `api/index.py`).
4. Click **Deploy**.
5. Once deployment completes, visit your live Vercel URL!

---

*Klyro — Clarity you can act on.*

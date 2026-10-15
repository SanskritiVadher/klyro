# 🔌 API Specification & HTTP Methods

[[02_Database_ER_and_Tables|← 02. Database ER & Tables]] | [[00_Home_Index|Index]] | [[04_Client_to_Server_Data_Flow|04. Data Flow →]]

## 1. What is an API? (In Plain Words)

An **API (Application Programming Interface)** is like a **waiter in a restaurant**:
- The **Client (Browser UI)** is the customer looking at the menu.
- The **Backend (FastAPI)** is the kitchen preparing the food.
- The **API** is the waiter who takes your order (Request), delivers it to the kitchen, and brings back your food (JSON Response).

---

## 2. HTTP Method Overview (42 Total Endpoints)

Klyro exposes **42 RESTful API endpoints** adhering to strict HTTP semantics:

| HTTP Method | Count | Semantic Purpose in Klyro | Example |
| :--- | :--- | :--- | :--- |
| **`GET`** | **21** | Fetch or read data without modifying anything. | `GET /api/v1/dashboard` (Retrieve KPI numbers) |
| **`POST`** | **12** | Create a brand-new resource or trigger an action. | `POST /api/v1/transactions` (Log an expense) |
| **`PATCH`** | **4** | Partially update specific fields on an existing item. | `PATCH /api/v1/accounts/{id}` (Rename an account) |
| **`DELETE`** | **4** | Permanently remove a resource. | `DELETE /api/v1/transactions/{id}` (Delete an expense) |
| **`PUT`** | **1** | Fully replace an existing resource. | `PUT /api/v1/settings` (Save user preferences) |

---

## 3. Complete API Endpoint Inventory

### 🟢 System & Health (1)
| Method | Path | Summary | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health Check | Verifies server readiness, environment name, and uptime. |

### 🔐 Authentication (3)
| Method | Path | Summary | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register User | Creates a new user profile with hashed password. |
| `POST` | `/api/v1/auth/login` | Login | Exchanges email/password for a signed JWT Bearer token. |
| `GET` | `/api/v1/auth/me` | Current User | Returns the authenticated user's active session profile. |

### 📊 Dashboard & Intelligence (2)
| Method | Path | Summary | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard` | Dashboard Summary | Calculates Safe-to-Spend, net cash flow, savings rate, and recent activity. |
| `GET` | `/api/v1/dashboard/money-weather` | Money Weather | Evaluates liquidity runway to return Comfortable / Tightening / At Risk. |

### 🏦 Accounts (5)
| Method | Path | Summary | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/accounts` | List Accounts | Returns all active accounts, calculated balances, and reserve flags. |
| `POST` | `/api/v1/accounts` | Create Account | Creates a new bank account, wallet, or reserve fund. |
| `GET` | `/api/v1/accounts/{id}` | Get Account | Detailed metadata and transaction history for a single account. |
| `PATCH` | `/api/v1/accounts/{id}` | Update Account | Edit account name, type, active status, or reserve status. |
| `POST` | `/api/v1/accounts/{id}/adjustments`| Adjust Balance | Logs a reconciliation adjustment entry to fix balance drift. |

### 🏷️ Categories (4)
| Method | Path | Summary | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | List Categories | Returns tree of income, expense, and transfer categories. |
| `POST` | `/api/v1/categories` | Create Category | Creates a new custom category with icon and color token. |
| `PATCH` | `/api/v1/categories/{id}` | Update Category | Edits category name, icon, color, or parent category. |
| `DELETE` | `/api/v1/categories/{id}` | Delete Category | Archives category (blocked if active transactions exist). |

### 💸 Transactions & Transfers (6)
| Method | Path | Summary | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/transactions` | List Transactions | Paginated ledger with filters (date range, type, category, account). |
| `POST` | `/api/v1/transactions` | Create Transaction | Logs an income or expense transaction with merchant & payment method. |
| `POST` | `/api/v1/transactions/transfers` | Create Transfer | Executes an **atomic two-legged transfer** between two accounts. |
| `GET` | `/api/v1/transactions/{id}` | Get Transaction | Fetches single transaction details and linked transfer legs. |
| `PATCH` | `/api/v1/transactions/{id}` | Update Transaction | Modifies amount, date, notes, or category of an existing entry. |
| `DELETE` | `/api/v1/transactions/{id}` | Delete Transaction | Deletes transaction (and atomically reverses transfer leg if linked). |

### 🎯 Budgets (5)
| Method | Path | Summary | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/budgets` | List Budgets | Returns monthly or custom expenditure envelopes. |
| `POST` | `/api/v1/budgets` | Create Budget | Defines category allocations and total expenditure limits. |
| `GET` | `/api/v1/budgets/{id}` | Get Budget | Detailed view of allocations for a specific period. |
| `DELETE` | `/api/v1/budgets/{id}` | Delete Budget | Removes budget envelope. |
| `GET` | `/api/v1/budgets/{id}/performance` | Performance Report | Computes real-time run rate, daily pace, and over-budget warnings. |

### 🏝️ Goals & Milestones (3)
| Method | Path | Summary | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/goals` | List Goals | Returns targets, milestones, completion %, and savings velocity. |
| `POST` | `/api/v1/goals` | Create Goal | Defines a new savings goal with target date and target paise. |
| `POST` | `/api/v1/goals/{id}/contributions` | Add Contribution | Logs a savings contribution towards a goal milestone. |

### ⏰ Recurring & Calendar Radar (5)
| Method | Path | Summary | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/recurring-rules` | List Rules | Returns EMIs, SIPs, salary credits, and subscriptions. |
| `POST` | `/api/v1/recurring-rules` | Create Rule | Creates a recurring scheduled obligation. |
| `PATCH` | `/api/v1/recurring-rules/{id}` | Update Rule | Modifies frequency, expected amount, or due date. |
| `DELETE` | `/api/v1/recurring-rules/{id}` | Delete Rule | Deactivates recurring rule. |
| `GET` | `/api/v1/calendar/upcoming` | 30-Day Radar | Returns upcoming debits/credits due in the next 30 days. |

### 📈 Analytics & Behavioral Insights (3)
| Method | Path | Summary | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/spending-by-category`| Category Split | Grouped spending with percentages for donut charts. |
| `GET` | `/api/v1/analytics/cash-flow` | Cash Flow Timeline | Inflows vs Outflows timeline for bar/line charts. |
| `GET` | `/api/v1/analytics/insights` | Spending DNA | Plain-English behavioral insights and anomaly detection. |

### 💾 Data Management, Export & Settings (5)
| Method | Path | Summary | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/export/transactions` | Export CSV | In-memory streaming download of full ledger as CSV. |
| `GET` | `/api/v1/export/backup` | Export JSON | In-memory complete database archive dump. |
| `GET` | `/api/v1/settings` | Get Settings | Returns user preferences and buffer reserve %. |
| `PUT` | `/api/v1/settings` | Update Settings | Replaces user preferences and configuration. |
| `POST` | `/api/v1/management/reseed` | Reseed Demo | Restores fresh sample accounts, transactions, and budgets. |

---

## 4. Standard Response & Error Envelopes

### Success Envelope
```json
{
  "data": {
    "id": 14,
    "amount_minor": 50000,
    "merchant": "Swiggy",
    "transaction_type": "expense"
  }
}
```

### Error Envelope
Whenever an error occurs (such as identical accounts in transfer or validation failures), Klyro returns a unified error envelope:
```json
{
  "error": {
    "code": "IDENTICAL_ACCOUNTS",
    "message": "Source and destination accounts for a transfer cannot be identical.",
    "details": {
      "field": "to_account_id"
    }
  }
}
```

---

[[04_Client_to_Server_Data_Flow|Next: 04. Client-to-Server Data Movement Lifecycle →]]

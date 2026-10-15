# 🖥️ The 8 Application Views & Dashboards

[[04_Client_to_Server_Data_Flow|← 04. Data Flow]] | [[00_Home_Index|Index]] | [[06_Financial_Calculation_Engine|06. Calculation Engine →]]

Klyro provides **8 dedicated dashboards and operational workspaces**, each built with vanilla ES modules:

---

## 1. ⛅ Home View (`frontend/js/views/home.js`)
*The Executive Cockpit for daily clarity.*

- **Money Weather Hero Card:**
  - Displays dynamic weather states: **Comfortable** (spinning sun with rays), **Tightening** (drifting clouds), or **At Risk** (rain + lightning flicker).
  - Explains in plain English *why* your month feels comfortable or tight.
- **Safe-to-Spend Ring:**
  - Circular animated SVG progress gauge showing discretionary money available until your next payday.
  - Centered daily spend allowance (e.g. ₹1,240 / day remaining).
- **Executive KPI Cards:**
  - Inflows, Outflows, Net Savings Rate, and Projected End-of-Month Balance.
  - Numbers count up smoothly from 0 on page load (~600ms ease-out).
- **Budget Pulse Radar:**
  - Mini pacing bars for top categories with "today" markers showing whether you are ahead or behind your expected pace.
- **Upcoming Bills Mini-Radar:**
  - Immediate view of commitments due within 7 days with pulsing indicator dots for bills due $\le$ 3 days.

---

## 2. 🧾 Transactions View (`frontend/js/views/transactions.js`)
*The complete searchable, filterable financial ledger.*

- **Multi-Filter Engine:**
  - Filter by Account, Category, Transaction Type (Income / Expense / Transfer), Date Range, and Search Query.
- **Visual Ledger Rows:**
  - Colored category icons, payment badges (UPI, Credit Card, Cash), and merchant names.
- **Atomic Two-Legged Transfer Indicator:**
  - Transfer entries display bidirectional account links (e.g., `HDFC Salary → Zerodha Trading`) with a unified transfer chain icon.
- **Actions:**
  - Inline row editing and safe deletion with instant balance recalculation.

---

## 3. 🏦 Accounts View (`frontend/js/views/accounts.js`)
*Asset management & emergency reserve tracking.*

- **Reserves Separation:**
  - Distinctly splits **Liquid Spendable Assets** from **Locked Emergency Reserves** (e.g. "SBI Emergency Savings").
  - Clear "Reserve" badge ensures you never accidentally spend emergency funds.
- **Account Types:**
  - Bank accounts, Digital Wallets (Paytm, PhonePe), Cash, Credit Cards, and Investment Accounts.
- **Reconciliation Modal:**
  - "Adjust Balance" logs an automatic correction adjustment without falsifying past transaction records.

---

## 4. 💓 Budgets View (`frontend/js/views/budgets.js`)
*Real-time run-rate monitoring and pacing radar.*

- **Category Budget Pulse Bars:**
  - Visual bars animate from 0% to filled with a subtle shimmer sweep.
- **"Where You Should Be Today" Marker:**
  - A thin vertical cursor mark positioned at:
    $$\text{Marker Position} = \frac{\text{Days Elapsed in Month}}{\text{Total Days in Month}} \times 100\%$$
- **Over-Pace Warning:**
  - If spending crosses the pacing marker, the bar shifts to burnt coral with an alert badge to curb discretionary spending early in the cycle.

---

## 5. 🎯 Goals View (`frontend/js/views/goals.js`)
*Savings momentum and target milestone projection.*

- **Milestone Circular Gauges:**
  - Displays progress percentages toward long-term goals (e.g., 🏝️ Bali Vacation, 🛡️ Emergency Fund, 💻 New Laptop).
- **Velocity Forecasting:**
  - Calculates average 3-month savings velocity to project the **exact expected completion date**.
- **Delight:**
  - Hitting 100% on any goal triggers a full-screen celebratory confetti burst!

---

## 6. 📅 Recurring View (`frontend/js/views/recurring.js`)
*30-day forward-looking commitments radar.*

- **Timeline Radar:**
  - Unifies SIP mutual fund debits, Home/Car loan EMIs, rent auto-debits, and OTT subscriptions.
- **Urgency Tags:**
  - Colored relative badges: `Due today`, `Due tomorrow`, `In 3 days`, `In 12 days`.
- **Cash Outflow Impact:**
  - Summarizes the total mandatory outflows locked in for the remainder of the active month.

---

## 7. 🧬 Insights View (`frontend/js/views/insights.js`)
*Behavioral spending DNA and pattern analysis.*

- **Spending DNA:**
  - Plain-language narrative analysis (e.g., *"Dining accounts for 34% of your discretionary spending this month, primarily concentrated on Swiggy and Zomato during weekends"*).
- **Interactive Visualizations (Chart.js):**
  - Donut chart of spending distribution by category.
  - Cash flow trendline comparing daily inflows vs daily outflows.
- **Anomaly Detection:**
  - Identifies irregular or abnormally high charges compared to 3-month rolling baselines.

---

## 8. ⚙️ Settings View (`frontend/js/views/settings.js`)
*Data portability, privacy & system controls.*

- **In-Memory CSV Export:**
  - One-click instant download of your complete ledger (`GET /api/v1/export/transactions`).
- **Complete JSON Backup:**
  - Full structured database backup export for complete user data sovereignty.
- **Safety Cushion Slider:**
  - Adjust Safe-to-Spend buffer between 5% and 20% (defaults to 10%).
- **Demo Re-seed Button:**
  - Instantly resets and restores the complete Indian sample data set anytime.

---

[[06_Financial_Calculation_Engine|Next: 06. Financial Intelligence & Calculation Engine →]]

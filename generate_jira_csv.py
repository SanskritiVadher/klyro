"""
Generate exactly 70 textbook user stories for Klyro in Jira-ready CSV format.
"""
import csv
import os

stories = [
    # ----------------------------------------------------
    # COMPONENT 1: Authentication & Session Security (Stories 1 - 5)
    # ----------------------------------------------------
    {
        "Summary": "Register New User Account with Secure Password Policy",
        "Persona": "new Klyro user",
        "Action": "register using my email address and a strong password",
        "Benefit": "I can establish a secure, private personal finance workspace",
        "Criteria": [
            "Given a visitor with a unique email address and a password meeting minimum complexity rules (>= 8 chars), when submitting registration, an account is created and an encrypted record is stored in the database.",
            "Given an existing registered email address, when attempting duplicate registration, the system rejects it with an explicit 409 Conflict error.",
            "Given a password that fails complexity requirements, the system returns descriptive client-side validation errors before form submission."
        ],
        "Priority": "Highest",
        "Component": "Authentication",
        "Labels": "auth security backend frontend"
    },
    {
        "Summary": "User Authentication via JWT Bearer Token",
        "Persona": "registered user",
        "Action": "authenticate with my credentials and receive a signed JWT bearer token",
        "Benefit": "my client session can authorize subsequent API requests securely without sending credentials repeatedly",
        "Criteria": [
            "Given valid user credentials, when posting to /api/auth/token, the server returns an access token with a configured expiration window and token_type 'bearer'.",
            "Given invalid password or non-existent email, the server returns 401 Unauthorized with a generic failure message to prevent user enumeration.",
            "Given a valid bearer token in the Authorization header, protected API routes resolve the user context."
        ],
        "Priority": "Highest",
        "Component": "Authentication",
        "Labels": "auth jwt security api"
    },
    {
        "Summary": "Automatic Session Expiration and Interceptor Redirection",
        "Persona": "authenticated user",
        "Action": "have my expired session intercepted gracefully",
        "Benefit": "unauthorized access is prevented on shared devices and I am prompted to log in again without data corruption",
        "Criteria": [
            "Given an expired JWT token, when an API request is initiated, the response status is 401 Unauthorized.",
            "Given a 401 response from any protected endpoint, the frontend HTTP client clears local session storage and transitions to the login screen.",
            "Given session termination, the application preserves the attempted route to redirect the user back upon successful re-authentication."
        ],
        "Priority": "High",
        "Component": "Authentication",
        "Labels": "auth session frontend security"
    },
    {
        "Summary": "Cryptographic Password Hashing with Bcrypt Salt",
        "Persona": "system security auditor",
        "Action": "enforce industry-standard bcrypt hashing for all stored user passwords",
        "Benefit": "compromised database snapshots cannot expose plaintext user credentials",
        "Criteria": [
            "Given a plaintext user password during registration or reset, the backend hashes the secret with bcrypt and an adaptive work factor before database insertion.",
            "Given a database dump, no plaintext or reversibly encrypted password strings are present.",
            "Given login verification, the system uses constant-time hash comparison to prevent timing attacks."
        ],
        "Priority": "Highest",
        "Component": "Authentication",
        "Labels": "security backend encryption"
    },
    {
        "Summary": "Fetch Authenticated User Profile Context",
        "Persona": "authenticated user",
        "Action": "retrieve my user profile and account configuration upon application launch",
        "Benefit": "the interface personalizes the workspace with my name, email, and preferred settings",
        "Criteria": [
            "Given an active bearer token, when calling GET /api/auth/me, the response returns the user ID, email, full name, and creation timestamp.",
            "Given the user payload, sensitive attributes including password hashes and salt parameters are strictly omitted from the serialization schema.",
            "Given network reconnection, the application re-validates the profile context against the server."
        ],
        "Priority": "Medium",
        "Component": "Authentication",
        "Labels": "auth user-profile api frontend"
    },

    # ----------------------------------------------------
    # COMPONENT 2: Account Management & Multi-Currency (Stories 6 - 11)
    # ----------------------------------------------------
    {
        "Summary": "Create Multiple Financial Accounts Across Categories",
        "Persona": "budget manager",
        "Action": "create distinct financial accounts categorized as Bank, Credit Card, Digital Wallet, or Cash",
        "Benefit": "I can mirror all my real-world financial instruments in a single dashboard",
        "Criteria": [
            "Given a valid account name, account type, initial balance in minor units, and currency code, when submitting the creation form, a new account record is persisted.",
            "Given an invalid or unsupported account type, the API rejects the request with a 422 Unprocessable Entity validation error.",
            "Given account creation with an opening balance, an initial balancing entry is logged to preserve auditability."
        ],
        "Priority": "High",
        "Component": "Accounts",
        "Labels": "accounts ledger onboarding"
    },
    {
        "Summary": "Real-Time Aggregated Account Balances Overview",
        "Persona": "financial planner",
        "Action": "view the real-time balance of every account alongside an aggregated net worth calculation",
        "Benefit": "I have immediate visibility into my consolidated financial position",
        "Criteria": [
            "Given multiple active accounts, when opening the accounts dashboard, each account displays its current calculated balance in formatted local currency.",
            "Given credit accounts with negative balances (liabilities), the net liquidity summary correctly offsets them against positive depository assets.",
            "Given any ledger update, the account card balances refresh immediately without full page reloads."
        ],
        "Priority": "High",
        "Component": "Accounts",
        "Labels": "accounts dashboard balance ui"
    },
    {
        "Summary": "Update Account Metadata and Masked Identifiers",
        "Persona": "user managing multiple accounts at one institution",
        "Action": "update an account's display name, institution name, and masked account suffix (e.g. '••4092')",
        "Benefit": "I can easily differentiate between duplicate bank accounts",
        "Criteria": [
            "Given an existing account, when editing metadata fields through PUT /api/accounts/{id}, the updated attributes persist immediately.",
            "Given an update payload, attempts to manually alter the ledger-derived balance directly through metadata endpoints are rejected.",
            "Given account renaming, all linked ledger views, filters, and transaction badges immediately reflect the updated title."
        ],
        "Priority": "Medium",
        "Component": "Accounts",
        "Labels": "accounts metadata crud"
    },
    {
        "Summary": "Soft-Archive Inactive or Closed Accounts",
        "Persona": "user who closed a credit card or bank account",
        "Action": "archive the account rather than permanently deleting it",
        "Benefit": "historical ledger transactions remain intact for audit while hiding the account from active selection lists",
        "Criteria": [
            "Given an active account, when toggling the 'archive' status, the account's is_active flag is set to false.",
            "Given an archived account, it is excluded by default from the transaction account-picker and Safe-to-Spend calculations.",
            "Given historical ledger searches, transactions belonging to the archived account remain viewable and filterable."
        ],
        "Priority": "Medium",
        "Component": "Accounts",
        "Labels": "accounts archive soft-delete"
    },
    {
        "Summary": "Balance Reconciliation and Drift Adjustment Entry",
        "Persona": "meticulous budgeter",
        "Action": "enter a verified actual bank balance to auto-generate a balancing adjustment entry",
        "Benefit": "I can reconcile unrecorded cash outflows or minor discrepancies without corrupting ledger integrity",
        "Criteria": [
            "Given an account whose calculated balance differs from physical bank statement, when entering the statement balance, the system calculates the exact difference in paise.",
            "Given a positive or negative drift, the system generates an audit-tagged 'Reconciliation Adjustment' transaction with the matching category.",
            "Given adjustment creation, the account's new calculated balance matches the statement figure exactly."
        ],
        "Priority": "Medium",
        "Component": "Accounts",
        "Labels": "accounts reconciliation audit"
    },
    {
        "Summary": "Configure Workspace Primary Currency and Locale Formatting",
        "Persona": "international or Indian user",
        "Action": "configure my preferred currency code and numbering system (e.g. INR Lakhs/Crores vs USD Thousands/Millions)",
        "Benefit": "monetary values are rendered in intuitive cultural formats across the entire application",
        "Criteria": [
            "Given a user setting currency to INR, numbers format using the Indian numbering system (e.g. ₹1,50,000.00).",
            "Given a user setting currency to USD/EUR, numbers format using Western grouping (e.g. $150,000.00).",
            "Given currency switching, underlying stored minor-unit integers (paise/cents) remain unaltered."
        ],
        "Priority": "Low",
        "Component": "Accounts",
        "Labels": "i18n currency formatting settings"
    },

    # ----------------------------------------------------
    # COMPONENT 3: Emergency Reserves Shielding (Stories 12 - 16)
    # ----------------------------------------------------
    {
        "Summary": "Flag Specific Accounts as Untouchable Emergency Reserves",
        "Persona": "disciplined saver",
        "Action": "designate an account with the 'is_reserve' flag",
        "Benefit": "funds dedicated to life emergencies are structurally ring-fenced from daily operational funds",
        "Criteria": [
            "Given an account creation or update form, when checking the 'Emergency Reserve' toggle, the boolean field is_reserve is saved as true.",
            "Given a designated reserve account, the UI decorates the account card with a distinct Shield icon and protective styling.",
            "Given an account marked as reserve, it is clearly segregated from operational checking/cash pools in summaries."
        ],
        "Priority": "High",
        "Component": "Reserves",
        "Labels": "reserves emergency-fund accounts"
    },
    {
        "Summary": "Exclude Emergency Reserves from Liquid Spendable Calculation",
        "Persona": "user calculating spendable income",
        "Action": "have the engine automatically exclude accounts marked as 'is_reserve' from the liquid assets total",
        "Benefit": "I am never misled into thinking emergency savings can be spent on discretionary items",
        "Criteria": [
            "Given 3 operational accounts totaling ₹1,00,000 and 1 reserve account with ₹3,00,000, when computing liquid assets for Safe-to-Spend, the result is strictly ₹1,00,000.",
            "Given a database query on liquid balances, the SQL where clause enforces 'WHERE is_reserve = FALSE AND is_active = TRUE'.",
            "Given an account is toggled from reserve to non-reserve, the Safe-to-Spend metric recalculates immediately."
        ],
        "Priority": "Highest",
        "Component": "Reserves",
        "Labels": "reserves safe-to-spend algorithm backend"
    },
    {
        "Summary": "Emergency Reserve Visual Protection Badge and Warnings",
        "Persona": "user logging an expense",
        "Action": "see a visual warning indicator if I select an emergency reserve account as payment source",
        "Benefit": "I am deterred from accidentally tapping emergency funds for routine consumption",
        "Criteria": [
            "Given the transaction entry form, when selecting an account with is_reserve=True, a prominent warning alert is rendered.",
            "Given the confirmation action, the user must explicitly acknowledge spending from reserves.",
            "Given completed transactions against a reserve account, they are tagged with a reserve-drawdown indicator in the ledger."
        ],
        "Priority": "Medium",
        "Component": "Reserves",
        "Labels": "reserves ux validation transactions"
    },
    {
        "Summary": "Calculate Emergency Runway Survival Months",
        "Persona": "forward-thinking individual",
        "Action": "view my emergency runway expressed as months of living expenses covered by reserves",
        "Benefit": "I know exactly how many months my household could survive without income",
        "Criteria": [
            "Given total reserve account balances and a 3-month trailing average of essential living costs, the system computes: Runway Months = Reserves / Average Monthly Essentials.",
            "Given zero historical expense history, the system displays an informative fallback state prompting data logging.",
            "Given an increase in emergency reserves, the metric increases proportionately in real time."
        ],
        "Priority": "Medium",
        "Component": "Reserves",
        "Labels": "reserves runway metrics analytics"
    },
    {
        "Summary": "Segregated Total Reserve Balance Summary Tile",
        "Persona": "user viewing dashboard summary",
        "Action": "view a dedicated 'Emergency Shield' card displaying aggregate reserve balance separated from spendable cash",
        "Benefit": "I experience psychological peace of mind seeing my safety net without conflating it with spending money",
        "Criteria": [
            "Given active reserve accounts, the dashboard renders a standalone 'Emergency Reserves' card showing total shielded capital.",
            "Given zero designated reserve accounts, the card provides an actionable prompt explaining the benefits of creating an emergency cushion.",
            "Given multi-currency accounts, balances are converted to the primary currency using configured rates."
        ],
        "Priority": "Low",
        "Component": "Reserves",
        "Labels": "reserves dashboard ui"
    },

    # ----------------------------------------------------
    # COMPONENT 4: Category Taxonomy & Hierarchies (Stories 17 - 21)
    # ----------------------------------------------------
    {
        "Summary": "Create Custom Categories with Visual Tokens",
        "Persona": "customizing user",
        "Action": "create custom expense and income categories with custom name, icon, and hex color token",
        "Benefit": "transactions can be classified according to my specific spending taxonomy",
        "Criteria": [
            "Given a category name, type ('expense' or 'income'), icon identifier, and color code, when submitted, a new category row is created.",
            "Given an attempt to create a category with a duplicate name under the same parent/type, the system returns a validation error.",
            "Given a created category, it becomes immediately selectable in transaction dropdowns with its icon and color."
        ],
        "Priority": "Medium",
        "Component": "Categories",
        "Labels": "categories customization crud"
    },
    {
        "Summary": "Manage Nested Parent-Child Subcategory Hierarchies",
        "Persona": "detailed expense tracker",
        "Action": "nest subcategories beneath a parent category (e.g. 'Groceries' under 'Food & Dining')",
        "Benefit": "I can analyze high-level trends while preserving granular drill-down classification",
        "Criteria": [
            "Given an existing parent category, when creating a child subcategory, parent_id is assigned to the parent's UUID.",
            "Given a parent category deletion or archive attempt, child categories must either be reparented or cascaded safely.",
            "Given analytical reporting, spending under child categories rolls up into the parent category total."
        ],
        "Priority": "Medium",
        "Component": "Categories",
        "Labels": "categories hierarchy taxonomy"
    },
    {
        "Summary": "Seed Standard Default Financial Categories on Onboarding",
        "Persona": "newly registered user",
        "Action": "have my account pre-populated with standard default categories (Housing, Utilities, Groceries, Dining, Salary)",
        "Benefit": "I can immediately log transactions without manually building a taxonomy from scratch",
        "Criteria": [
            "Given a new user registration, the system automatically executes a database seeder inserting standard top-level categories and subcategories.",
            "Given seeded categories, users retain full permission to edit names, change icons, or disable unwanted presets.",
            "Given default category seeding, each category is scoped strictly to the new user's user_id."
        ],
        "Priority": "High",
        "Component": "Categories",
        "Labels": "categories onboarding seeding"
    },
    {
        "Summary": "Soft-Archive Unused Categories",
        "Persona": "user reorganizing budgets",
        "Action": "archive obsolete categories so they no longer clutter selection menus",
        "Benefit": "historical records stay linked while simplifying day-to-day transaction input",
        "Criteria": [
            "Given a category marked as archived (is_active=False), it is hidden from the transaction category selector.",
            "Given historical transactions classified under the archived category, their category badges remain visible in the ledger.",
            "Given filtering by archived categories in reports, historical data remains accessible."
        ],
        "Priority": "Low",
        "Component": "Categories",
        "Labels": "categories archive soft-delete"
    },
    {
        "Summary": "Referential Integrity Protection on Category Deletion",
        "Persona": "data integrity officer",
        "Action": "prevent hard-deletion of any category that is currently linked to existing transactions or budget envelopes",
        "Benefit": "orphaned transactions and corrupted analytics are impossible",
        "Criteria": [
            "Given a category with >= 1 linked transactions or budget allocations, when calling DELETE /api/categories/{id}, the API returns 409 Conflict.",
            "Given a rejection, the API error message indicates how many transactions depend on the category and suggests archiving instead.",
            "Given a category with zero references, hard deletion executes cleanly."
        ],
        "Priority": "High",
        "Component": "Categories",
        "Labels": "categories integrity database safety"
    },

    # ----------------------------------------------------
    # COMPONENT 5: Ledger Transactions & Minor-Unit Precision (Stories 22 - 28)
    # ----------------------------------------------------
    {
        "Summary": "Log Expense Transaction with Minor-Unit Integer Precision",
        "Persona": "active shopper",
        "Action": "record an expense transaction specifying date, amount, account, category, merchant, and notes",
        "Benefit": "my ledger stays accurate down to the exact paise with zero floating-point rounding errors",
        "Criteria": [
            "Given an expense input of ₹450.75, the backend receives and stores the amount as 45075 integer paise (minor units).",
            "Given successful creation, the linked account's balance is decremented by exactly 45075 paise.",
            "Given ledger retrieval, the UI formats 45075 paise into ₹450.75 seamlessly."
        ],
        "Priority": "Highest",
        "Component": "Transactions",
        "Labels": "transactions ledger precision arithmetic"
    },
    {
        "Summary": "Record Income Inflow Transaction with Payor Tracking",
        "Persona": "salaried individual or freelancer",
        "Action": "record an income transaction specifying date, amount in paise, receiving account, and payor source",
        "Benefit": "my liquid assets increase and the inflow is tracked for monthly cash flow analysis",
        "Criteria": [
            "Given an income input of ₹85,000.00, the system stores 8500000 paise with transaction_type='income'.",
            "Given the transaction, the destination account balance increments by 8500000 paise.",
            "Given cash flow calculation for the period, the inflow registers under total earned income."
        ],
        "Priority": "Highest",
        "Component": "Transactions",
        "Labels": "transactions income cashflow"
    },
    {
        "Summary": "Enforce Positive Amount Boundary Constraint on Transaction Inputs",
        "Persona": "system validator",
        "Action": "strictly reject zero or negative transaction amounts at the API validation boundary",
        "Benefit": "accidental negative entries cannot invert financial accounting logic or bypass balance controls",
        "Criteria": [
            "Given an API payload with amount <= 0, the Pydantic schema validation returns 422 Unprocessable Entity with error 'Amount must be greater than zero'.",
            "Given SQL schema constraints, a CHECK constraint (amount > 0) guarantees database-level integrity.",
            "Given frontend input, the amount field prevents typing negative signs or zero values."
        ],
        "Priority": "High",
        "Component": "Transactions",
        "Labels": "transactions validation security"
    },
    {
        "Summary": "Multi-Dimensional Transaction Search and Filter Engine",
        "Persona": "auditing user",
        "Action": "filter the transaction ledger simultaneously by date range, account, category, type, and keyword search",
        "Benefit": "I can instantly locate specific historical purchases or investigate spending anomalies",
        "Criteria": [
            "Given filter parameters (start_date, end_date, category_id, account_id, search_query), the API returns matching transactions.",
            "Given a text search query, the search performs case-insensitive matching against merchant and notes fields.",
            "Given no matching transactions, the UI displays a clean 'No transactions found' empty state with filter reset button."
        ],
        "Priority": "High",
        "Component": "Transactions",
        "Labels": "transactions search filtering backend"
    },
    {
        "Summary": "Offset-Based Ledger Pagination for High-Performance Queries",
        "Persona": "long-time user with thousands of transactions",
        "Action": "load transactions in paginated increments (e.g. 50 items per page)",
        "Benefit": "the interface remains fast and responsive without downloading megabytes of ledger history at once",
        "Criteria": [
            "Given GET /api/transactions with limit=50 and offset=0, the server returns the first 50 transactions and a total count header.",
            "Given advancing to page 2 (offset=50), the next 50 records are fetched seamlessly.",
            "Given database indexing on (user_id, transaction_date DESC), query execution time remains under 25ms."
        ],
        "Priority": "Medium",
        "Component": "Transactions",
        "Labels": "transactions pagination performance"
    },
    {
        "Summary": "Inline Transaction Editing with Atomic Balance Re-computation",
        "Persona": "user correcting a receipt typo",
        "Action": "modify the amount, category, date, or merchant of an existing transaction",
        "Benefit": "my ledger reflects correct figures while underlying account balances adjust automatically",
        "Criteria": [
            "Given an expense edited from ₹500 to ₹700, the linked account balance is decremented by the delta of ₹200.",
            "Given an account change on a transaction, the old account balance is credited and the new account balance is debited in a single atomic transaction.",
            "Given successful edit, updated values appear immediately in ledger and budget progress bars."
        ],
        "Priority": "High",
        "Component": "Transactions",
        "Labels": "transactions edit atomicity ledger"
    },
    {
        "Summary": "Transaction Deletion with Cascade Balance Reversion",
        "Persona": "user who logged a duplicate expense",
        "Action": "delete a transaction with full reversal of its balance impact",
        "Benefit": "accidental entries can be wiped out completely with guaranteed mathematical consistency",
        "Criteria": [
            "Given an expense transaction of ₹1,200 deleted via DELETE /api/transactions/{id}, the parent account balance increases by ₹1,200.",
            "Given transaction deletion, linked budget consumption for the respective month decrements accordingly.",
            "Given deletion confirmation dialog, the user must explicitly confirm before execution."
        ],
        "Priority": "High",
        "Component": "Transactions",
        "Labels": "transactions delete audit balance"
    },

    # ----------------------------------------------------
    # COMPONENT 6: Atomic Internal Fund Transfers (Stories 29 - 34)
    # ----------------------------------------------------
    {
        "Summary": "Execute Atomic Two-Legged Internal Account Transfer",
        "Persona": "user moving money between accounts",
        "Action": "transfer funds from my checking account to my savings account in a single atomic operation",
        "Benefit": "both accounts update simultaneously without money disappearing or duplicating if an error occurs",
        "Criteria": [
            "Given source account A and destination account B with amount ₹10,000, calling POST /api/transfers creates two ledger entries: debit on A and credit on B.",
            "Given database failure during the second leg, the entire transaction rolls back via database ACID transaction.",
            "Given successful transfer, both account balances reflect the updated balances immediately."
        ],
        "Priority": "Highest",
        "Component": "Transfers",
        "Labels": "transfers acid atomicity backend"
    },
    {
        "Summary": "Reject Transfers with Identical Source and Destination Accounts",
        "Persona": "system validator",
        "Action": "reject transfer requests where the source account ID matches the destination account ID (`IDENTICAL_ACCOUNTS`)",
        "Benefit": "meaningless circular transactions and unnecessary audit noise are prevented",
        "Criteria": [
            "Given from_account_id == to_account_id, the transfer service throws an IDENTICAL_ACCOUNTS domain exception.",
            "Given this exception, the API returns HTTP 400 Bad Request with a clear human-readable error message.",
            "Given frontend form, selecting a source account automatically disables that account in the destination selector."
        ],
        "Priority": "High",
        "Component": "Transfers",
        "Labels": "transfers validation error-handling"
    },
    {
        "Summary": "Bind Paired Transfer Legs via Unified Transfer Group UUID",
        "Persona": "database architect",
        "Action": "bind the source debit transaction and destination credit transaction with a shared `transfer_group_id` UUID",
        "Benefit": "the system always knows the exact counterparty leg for reconciliation and lifecycle management",
        "Criteria": [
            "Given a completed transfer, both transaction rows share the exact same non-null transfer_group_id.",
            "Given a query on either transaction leg, querying by transfer_group_id fetches both sides of the transfer.",
            "Given transfer rows, transaction_type is set to 'transfer_out' and 'transfer_in' respectively."
        ],
        "Priority": "High",
        "Component": "Transfers",
        "Labels": "transfers schema data-integrity"
    },
    {
        "Summary": "Exclude Internal Transfers from Income and Expense Cash Flow Calculations",
        "Persona": "budget analyst",
        "Action": "have the analytics engine ignore internal transfers when calculating total income and total expense metrics",
        "Benefit": "moving money between my own pockets does not falsely inflate my perceived income or spending",
        "Criteria": [
            "Given an internal transfer of ₹50,000 between bank accounts, monthly Total Income and Total Expense figures remain unchanged.",
            "Given cash flow queries, SQL aggregations filter with 'WHERE transaction_type NOT IN ('transfer_out', 'transfer_in')'.",
            "Given budget envelope calculations, transfers are strictly excluded from category spend."
        ],
        "Priority": "Highest",
        "Component": "Transfers",
        "Labels": "transfers analytics cashflow reporting"
    },
    {
        "Summary": "Atomic Cascade Deletion of Paired Transfer Legs",
        "Persona": "user deleting a mistakenly recorded transfer",
        "Action": "delete one leg of a transfer and have the system automatically locate and delete the corresponding counterparty leg",
        "Benefit": "orphan transfer legs cannot exist to create phantom imbalances in the ledger",
        "Criteria": [
            "Given a transaction with a transfer_group_id, when deleting it, the backend finds the twin record by transfer_group_id and deletes both inside a single DB transaction.",
            "Given the deletion, the source account is re-credited and the destination account is re-debited.",
            "Given confirmation, the UI informs the user that both sides of the transfer will be reversed."
        ],
        "Priority": "High",
        "Component": "Transfers",
        "Labels": "transfers delete cascade rollback"
    },
    {
        "Summary": "Display Counterparty Account Indicators in Ledger View",
        "Persona": "user reviewing ledger history",
        "Action": "see clear counterparty indications on transfer rows (e.g. 'Transfer to HDFC Savings' or 'Transfer from Cash')",
        "Benefit": "I can immediately trace where money traveled without cross-referencing multiple screens",
        "Criteria": [
            "Given a transfer_out transaction, the merchant/description column renders 'Transfer to [Destination Account Name]'.",
            "Given a transfer_in transaction, the column renders 'Transfer from [Source Account Name]'.",
            "Given clicking on the transfer row, a modal displays both legs of the transfer."
        ],
        "Priority": "Medium",
        "Component": "Transfers",
        "Labels": "transfers ui ledger ux"
    },

    # ----------------------------------------------------
    # COMPONENT 7: Safe-to-Spend Calculation Engine (Stories 35 - 41)
    # ----------------------------------------------------
    {
        "Summary": "Aggregate Real-Time Liquid Assets Across Operational Accounts",
        "Persona": "Safe-to-Spend calculator",
        "Action": "sum balances across all active, non-reserve, liquid depository accounts in real time",
        "Benefit": "the Safe-to-Spend calculation begins with a 100% accurate baseline of accessible capital",
        "Criteria": [
            "Given accounts A (Active Bank: ₹50,000), B (Active Cash: ₹10,000), C (Reserve: ₹2,00,000), and D (Archived: ₹5,000), the calculated liquid baseline is strictly ₹60,000.",
            "Given an instant transaction on account A, the liquid baseline recalculates dynamically.",
            "Given credit card liabilities, the calculation deducts accrued negative balances."
        ],
        "Priority": "Highest",
        "Component": "Safe-to-Spend",
        "Labels": "safe-to-spend engine liquidity backend"
    },
    {
        "Summary": "Deduct Mandatory 30-Day Recurring Commitments from Liquid Baseline",
        "Persona": "disciplined planner",
        "Action": "have the Safe-to-Spend engine automatically subtract all upcoming recurring bills due within the 30-day horizon",
        "Benefit": "money obligated for rent, EMIs, and utilities is never mistaken for discretionary spend",
        "Criteria": [
            "Given liquid assets of ₹80,000 and 3 active recurring bills totaling ₹35,000 due within 30 days, committed bills are deducted (₹80,000 - ₹35,000 = ₹45,000).",
            "Given a recurring bill whose next due date lies beyond the 30-day window, it is excluded from this deduction cycle.",
            "Given a bill marked as paid during the cycle, its deduction is relieved from the committed total."
        ],
        "Priority": "Highest",
        "Component": "Safe-to-Spend",
        "Labels": "safe-to-spend commitments recurring math"
    },
    {
        "Summary": "Incorporate Confirmed Expected Inflows into Spend Horizon",
        "Persona": "salaried professional",
        "Action": "allow scheduled confirmed inflows (e.g. salary on the 1st) to be credited into the spendable calculation",
        "Benefit": "my daily safe allowance reflects impending income rather than artificially starving my budget",
        "Criteria": [
            "Given an active recurring income rule due within the active horizon, its expected minor-unit amount is added to the spend equation.",
            "Given uncertain or variable income rules, users can toggle 'Include in Safe-to-Spend' per rule.",
            "Given passing of the expected date without logged transaction, the engine alerts the user."
        ],
        "Priority": "High",
        "Component": "Safe-to-Spend",
        "Labels": "safe-to-spend inflows forecast"
    },
    {
        "Summary": "Configurable Safety Buffer Percentage Cushion (5% - 20%)",
        "Persona": "conservative or aggressive budgeter",
        "Action": "adjust a safety buffer slider between 5% and 20% to hold back a portion of liquid funds",
        "Benefit": "I have an automatic financial cushion protecting me from unexpected minor surprises",
        "Criteria": [
            "Given a buffer setting of 10% on ₹50,000 net baseline, ₹5,000 is deducted as an untouchable buffer cushion.",
            "Given user adjustment of the slider in settings, the Safe-to-Spend metric updates in real-time.",
            "Given buffer value changes, the new percentage setting persists in user preferences."
        ],
        "Priority": "High",
        "Component": "Safe-to-Spend",
        "Labels": "safe-to-spend buffer settings ui"
    },
    {
        "Summary": "Enforce Strict Zero-Clamping Guardrail for Deficit States",
        "Persona": "system mathematician",
        "Action": "clamp the Safe-to-Spend result to zero whenever mandatory commitments exceed available liquid funds",
        "Benefit": "the interface never displays misleading negative spendable numbers like '-₹15,000 Safe to Spend'",
        "Criteria": [
            "Given liquid assets of ₹20,000 and mandatory bills of ₹30,000, the formula evaluates: max(0, 20000 - 30000) = 0.",
            "Given a clamped zero result, the UI triggers an urgent deficit banner warning that bills exceed cash.",
            "Given zero-clamped state, daily allowance is also set to ₹0.00."
        ],
        "Priority": "Highest",
        "Component": "Safe-to-Spend",
        "Labels": "safe-to-spend guardrails math safety"
    },
    {
        "Summary": "Compute Daily Spend Allowance Across Remaining Horizon Days",
        "Persona": "daily consumer",
        "Action": "view my Safe-to-Spend figure divided by the number of days remaining in the month (`Safe-to-Spend // Days Left`)",
        "Benefit": "I know my exact daily spending ceiling without needing to do mental math before buying lunch",
        "Criteria": [
            "Given Safe-to-Spend of ₹15,000 and 10 days remaining in the current billing period, daily allowance displays as ₹1,500/day.",
            "Given integer paise arithmetic, minor fractions are rounded conservatively (floor division) so daily spend cannot exceed total pool.",
            "Given the transition to a new day at midnight, the days remaining counter decrements and daily allowance re-indexes."
        ],
        "Priority": "High",
        "Component": "Safe-to-Spend",
        "Labels": "safe-to-spend daily-allowance pacing"
    },
    {
        "Summary": "Render Animated Circular Ring Gauge for Safe-to-Spend Metric",
        "Persona": "visual learner",
        "Action": "see my Safe-to-Spend presented in an animated SVG ring gauge that changes color based on health",
        "Benefit": "I can gauge my financial headroom in less than two seconds upon opening the app",
        "Criteria": [
            "Given a healthy ratio, the ring animates smoothly with an emerald green stroke.",
            "Given a tightening ratio, the stroke transitions to amber yellow; given critical deficit, it glows crimson red.",
            "Given page load, the ring uses CSS stroke-dashoffset transitions with zero layout shift."
        ],
        "Priority": "Medium",
        "Component": "Safe-to-Spend",
        "Labels": "safe-to-spend ui animation dataviz"
    },

    # ----------------------------------------------------
    # COMPONENT 8: Money Weather Forecasting & Pacing (Stories 42 - 47)
    # ----------------------------------------------------
    {
        "Summary": "Compute Cash Runway Health Ratio",
        "Persona": "financial forecast engine",
        "Action": "calculate the Money Weather Runway Ratio as (Liquid Assets + Projected Inflows) / (Mandatory Bills + Prorated Discretionary)",
        "Benefit": "the system has an objective numerical foundation for weather classification",
        "Criteria": [
            "Given all cashflow parameters, the engine computes the ratio with high float precision before categorizing.",
            "Given mandatory commitments of ₹0, the ratio safely defaults to a maximum ceiling (e.g. 99.0) without divide-by-zero errors.",
            "Given the computed ratio, the value feeds into the 3-tier categorization logic."
        ],
        "Priority": "Highest",
        "Component": "Money Weather",
        "Labels": "money-weather algorithm forecast"
    },
    {
        "Summary": "Evaluate Three-Tier Money Weather State Classification",
        "Persona": "app user",
        "Action": "have my financial climate classified as 'Sunny & Calm', 'Breezy & Tightening', or 'Storm Approaching'",
        "Benefit": "complex cashflow ratios are distilled into instant, emotionally intuitive feedback",
        "Criteria": [
            "Given Runway Ratio >= 1.25, the state resolves to 'Comfortable' ('Sunny & Calm').",
            "Given 1.00 <= Runway Ratio < 1.25, the state resolves to 'Tightening' ('Breezy & Tightening').",
            "Given Runway Ratio < 1.00, the state resolves to 'At Risk' ('Storm Approaching')."
        ],
        "Priority": "Highest",
        "Component": "Money Weather",
        "Labels": "money-weather classification logic"
    },
    {
        "Summary": "Generate Plain-Language Narrative Summary for Current Weather",
        "Persona": "user seeking actionable guidance",
        "Action": "read a dynamic plain-language narrative explaining WHY my weather is Sunny, Breezy, or Stormy",
        "Benefit": "I understand the exact levers affecting my financial standing and what action to take",
        "Criteria": [
            "Given a 'Tightening' state, narrative includes: 'Your commitments consume 88% of liquid funds. Avoid discretionary purchases until salary credit.'",
            "Given an 'At Risk' state, narrative highlights: 'Commitments exceed liquid funds by ₹4,200. Consider deferring subscriptions or tapping reserves.'",
            "Given a 'Comfortable' state, narrative celebrates: 'Your runway is healthy with a 25%+ cushion above all upcoming bills.'"
        ],
        "Priority": "High",
        "Component": "Money Weather",
        "Labels": "money-weather narrative nlg ux"
    },
    {
        "Summary": "Render Dynamic SVG Weather Hero Visual",
        "Persona": "visual-first user",
        "Action": "view an animated SVG hero banner corresponding to the current Money Weather state",
        "Benefit": "the dashboard feels inviting and human rather than like a dry accounting spreadsheet",
        "Criteria": [
            "Given 'Sunny & Calm', an animated glowing sun with floating clouds is rendered.",
            "Given 'Breezy & Tightening', wind swirls and drifting clouds appear with amber accents.",
            "Given 'Storm Approaching', rain cloud SVGs with subtle lightning pulse animations display.",
            "Given accessibility preferences (prefers-reduced-motion), complex animations halt gracefully."
        ],
        "Priority": "Medium",
        "Component": "Money Weather",
        "Labels": "money-weather svg frontend animation"
    },
    {
        "Summary": "Interactive Safety Buffer Simulation Slider on Weather",
        "Persona": "user modeling what-if scenarios",
        "Action": "adjust the safety buffer slider on the weather card to see how increasing my cushion changes the forecast",
        "Benefit": "I can test my financial resiliency before making a large purchase or altering savings rates",
        "Criteria": [
            "Given dragging the slider from 10% to 20%, the Money Weather recalculates in memory on the client.",
            "Given a state transition during sliding, the weather visual and narrative cross-fade dynamically.",
            "Given releasing the slider, a 'Save as default buffer' button appears."
        ],
        "Priority": "Low",
        "Component": "Money Weather",
        "Labels": "money-weather simulation interactive"
    },
    {
        "Summary": "Mid-Month Income Shock Scenario Warning",
        "Persona": "freelancer with irregular income",
        "Action": "receive an automatic weather downgrade alert if a projected client payment fails to materialize on schedule",
        "Benefit": "I can quickly cut spending before a missed invoice spirals into an overdraft",
        "Criteria": [
            "Given an expected inflow date that has passed without a matching credit transaction, the system recalculates Money Weather without the inflow.",
            "Given the new ratio falling below 1.0, the weather shifts to 'Storm Approaching' with a dedicated notice.",
            "Given the user re-scheduling or marking the invoice received, the forecast recovers."
        ],
        "Priority": "Medium",
        "Component": "Money Weather",
        "Labels": "money-weather alert cashflow"
    },

    # ----------------------------------------------------
    # COMPONENT 9: Budget Envelopes & Run-Rate Tracking (Stories 48 - 54)
    # ----------------------------------------------------
    {
        "Summary": "Create Monthly Category Budget Envelopes",
        "Persona": "zero-based budgeter",
        "Action": "define a spending ceiling in minor units for a specific category in a designated calendar month",
        "Benefit": "I can set intentional boundaries on spending categories like Dining, Entertainment, or Shopping",
        "Criteria": [
            "Given category_id, period ('YYYY-MM'), and amount in paise, submitting creates a budget envelope.",
            "Given amount <= 0, validation rejects the payload.",
            "Given creation, the envelope appears in the active budget dashboard with 0% initial spend."
        ],
        "Priority": "High",
        "Component": "Budgets",
        "Labels": "budgets envelopes crud"
    },
    {
        "Summary": "Enforce Unique Constraint on Category-Period Budget Allocation",
        "Persona": "database administrator",
        "Action": "prevent duplicate budget envelope entries for the same category within the same calendar month",
        "Benefit": "users cannot accidentally create conflicting or double-allocated budgets",
        "Criteria": [
            "Given an existing budget for Category 'Dining' in '2026-10', submitting another budget for the same category and month returns 409 Conflict.",
            "Given database schema, a UNIQUE constraint on (user_id, category_id, period) enforces integrity.",
            "Given frontend form, categories with existing allocations for the selected month are disabled in the creation picker."
        ],
        "Priority": "High",
        "Component": "Budgets",
        "Labels": "budgets integrity database constraint"
    },
    {
        "Summary": "Real-Time Category Spend Aggregation Against Envelopes",
        "Persona": "budget tracker",
        "Action": "see real-time cumulative spend progress bars against each budget envelope",
        "Benefit": "I can see how much money remains in each category envelope at any point during the month",
        "Criteria": [
            "Given a ₹10,000 Dining budget and ₹4,200 in Dining expenses this month, the envelope displays ₹4,200 spent (42%) and ₹5,800 remaining.",
            "Given a newly logged transaction, the respective budget progress bar updates immediately.",
            "Given expenses exceeding the budget, the bar displays overspend in red (e.g. 115% spent)."
        ],
        "Priority": "High",
        "Component": "Budgets",
        "Labels": "budgets progress aggregation real-time"
    },
    {
        "Summary": "Calculate 'Where You Should Be Today' Mid-Month Pacing Marker",
        "Persona": "pacing-focused saver",
        "Action": "see an indicator marker on the budget progress bar showing the expected burn-rate for today's day of the month",
        "Benefit": "I know if I am burning through my budget too quickly early in the month even if total spend is under 100%",
        "Criteria": [
            "Given Day 15 of a 30-day month, the pacing marker sits at exactly 50.0% along the progress bar.",
            "Given current spend is 65% on Day 15, the visual indicator highlights that spending is running 15% ahead of pace.",
            "Given current spend is 40% on Day 15, the indicator indicates comfortable pacing with green styling."
        ],
        "Priority": "High",
        "Component": "Budgets",
        "Labels": "budgets pacing run-rate algorithm"
    },
    {
        "Summary": "Visual Burn-Rate Acceleration Alert",
        "Persona": "disciplined spender",
        "Action": "receive a highlighted warning badge on envelopes whose burn-rate is > 20% ahead of calendar pace",
        "Benefit": "I can curb spending mid-month before exhausting the category envelope prematurely",
        "Criteria": [
            "Given an envelope where (spent_percentage - calendar_percentage) > 20%, an 'Over Pace' warning badge renders.",
            "Given hovering over the badge, a tooltip explains: 'At this rate, your budget will run out on the 21st.'",
            "Given spending slowing down later in the month, the warning badge clears automatically."
        ],
        "Priority": "Medium",
        "Component": "Budgets",
        "Labels": "budgets alerts run-rate ui"
    },
    {
        "Summary": "Projected Month-End Overrun Forecasting Engine",
        "Persona": "proactive planner",
        "Action": "view projected month-end total spend based on linear extrapolation of current daily run-rate",
        "Benefit": "I can see the financial destination I am heading toward if current habits persist",
        "Criteria": [
            "Given ₹6,000 spent over first 10 days of a 30-day month, daily rate is ₹600/day, projecting ₹18,000 month-end spend.",
            "Given an initial budget of ₹15,000, the system projects a ₹3,000 overrun.",
            "Given days < 5 of the month, the forecast displays an early-cycle indicator acknowledging limited sample size."
        ],
        "Priority": "Medium",
        "Component": "Budgets",
        "Labels": "budgets forecasting analytics run-rate"
    },
    {
        "Summary": "Delete and Re-Allocate Budget Envelopes",
        "Persona": "user adjusting financial priorities",
        "Action": "delete a budget envelope without deleting historical transactions in that category",
        "Benefit": "I can unbind spending limits without losing transaction ledger records",
        "Criteria": [
            "Given an active budget envelope, calling DELETE /api/budgets/{id} removes the envelope record.",
            "Given envelope deletion, all historical and future transactions assigned to that category remain untouched in the ledger.",
            "Given envelope removal, dashboard calculations update to reflect unallocated category status."
        ],
        "Priority": "Low",
        "Component": "Budgets",
        "Labels": "budgets crud delete"
    },

    # ----------------------------------------------------
    # COMPONENT 10: Savings Goals & Velocity Modeling (Stories 55 - 60)
    # ----------------------------------------------------
    {
        "Summary": "Create Target Milestone Savings Goals",
        "Persona": "goal-oriented saver",
        "Action": "create a milestone savings goal with a target title, target amount in paise, target completion date, and linked funding account",
        "Benefit": "I can visualize and systematically fund major life milestones like a home down-payment or vacation",
        "Criteria": [
            "Given valid title, target amount in paise, and future target date, submitting persists a new goal record.",
            "Given a target date in the past, the system rejects creation with a validation error.",
            "Given successful creation, the goal appears in the Goals gallery with a 0% progress meter."
        ],
        "Priority": "High",
        "Component": "Savings Goals",
        "Labels": "goals milestones crud"
    },
    {
        "Summary": "Record Dedicated Goal Contributions with Balance Transfer",
        "Persona": "saver setting aside money",
        "Action": "record a contribution toward a savings goal linked to an operational or reserve account",
        "Benefit": "accumulated goal savings are tracked distinctly toward the target milestone",
        "Criteria": [
            "Given an active goal, entering a contribution of ₹5,000 increments current_amount by 500000 paise.",
            "Given an optional funding account selection, an internal transfer is automatically posted moving funds to the goal's designated vault.",
            "Given contribution, the goal progress bar percentage re-indexes."
        ],
        "Priority": "High",
        "Component": "Savings Goals",
        "Labels": "goals contributions ledger"
    },
    {
        "Summary": "Calculate 3-Month Trailing Savings Velocity",
        "Persona": "data-driven saver",
        "Action": "have the engine compute my average monthly net contribution velocity over the past 3 calendar months",
        "Benefit": "I know my empirical savings pace rather than relying on unrealistic aspirations",
        "Criteria": [
            "Given total contributions of ₹15,000, ₹20,000, and ₹25,000 across the past 3 months, 3-month savings velocity computes to ₹20,000/month.",
            "Given a user with < 3 months of history, the engine computes average velocity across available logged months with an informational note.",
            "Given negative net savings (withdrawals > deposits), velocity registers as 0 with a guidance warning."
        ],
        "Priority": "High",
        "Component": "Savings Goals",
        "Labels": "goals velocity algorithm analytics"
    },
    {
        "Summary": "Forecast Goal Completion Date Based on Empirical Velocity",
        "Persona": "goal planner",
        "Action": "view the mathematically estimated completion date calculated as `Remaining Amount / Monthly Velocity`",
        "Benefit": "I can see whether I am on track to achieve my goal before or after my intended deadline",
        "Criteria": [
            "Given ₹60,000 remaining on a goal and a velocity of ₹10,000/month, the projected completion date is exactly 6 months from today.",
            "Given the projected date is ahead of the target deadline, the goal displays an 'On Track' badge in emerald green.",
            "Given the projected date is after the deadline, the goal displays 'Behind Schedule' along with the required monthly catch-up amount."
        ],
        "Priority": "High",
        "Component": "Savings Goals",
        "Labels": "goals forecasting velocity estimation"
    },
    {
        "Summary": "Visual Progress Fill Bar and Milestone Celebration Badges",
        "Persona": "user seeking positive motivation",
        "Action": "see visual milestones celebrated at 25%, 50%, 75%, and 100% completion marks",
        "Benefit": "I feel motivated to maintain my savings discipline through gamified visual feedback",
        "Criteria": [
            "Given a goal reaching 100%, the UI triggers a celebratory milestone animation and marks the goal as Completed.",
            "Given quarter-milestone crossings (25%, 50%, 75%), milestone badges unlock on the goal card.",
            "Given completed status, the goal is moved to an 'Accomplished Goals' archive."
        ],
        "Priority": "Low",
        "Component": "Savings Goals",
        "Labels": "goals gamification ui animations"
    },
    {
        "Summary": "Goal Withdrawal and Emergency Repurposing",
        "Persona": "user facing unexpected priority shift",
        "Action": "withdraw funds from a goal back into an operational account or delete an aborted goal",
        "Benefit": "savings are not permanently locked and can be redirected when life circumstances change",
        "Criteria": [
            "Given a goal with ₹40,000 saved, logging a withdrawal decrements current_amount and generates a reversal transfer.",
            "Given deleting a goal with remaining funds, the system prompts the user to re-allocate the accumulated balance to an active account.",
            "Given withdrawal, velocity metrics recalculate to reflect the adjusted net position."
        ],
        "Priority": "Medium",
        "Component": "Savings Goals",
        "Labels": "goals withdrawal flexibility"
    },

    # ----------------------------------------------------
    # COMPONENT 11: Recurring Commitments & 30-Day Radar (Stories 61 - 65)
    # ----------------------------------------------------
    {
        "Summary": "Define Recurring Commitment Rules (EMI, SIP, Rent, Subscriptions)",
        "Persona": "subscription organizer",
        "Action": "create a recurring payment rule with merchant, amount, frequency (daily, weekly, monthly, yearly), start date, and category",
        "Benefit": "all my recurring financial obligations are registered for automated tracking and radar scanning",
        "Criteria": [
            "Given recurring details, submitting via POST /api/recurring creates an active recurring rule.",
            "Given frequency selection, the system supports weekly, monthly, quarterly, and annual cadences.",
            "Given creation, the rule immediately feeds into the 30-day forward radar horizon."
        ],
        "Priority": "High",
        "Component": "Recurring Radar",
        "Labels": "recurring subscriptions rules crud"
    },
    {
        "Summary": "Calculate Accurate Next Due Date Engine",
        "Persona": "calendar engine",
        "Action": "automatically compute the exact next calendar due date taking into account variable month lengths and leap years",
        "Benefit": "bills due on the 31st do not disappear in February or 30-day months",
        "Criteria": [
            "Given a monthly rule on the 31st, for February the system clamps the due date to the 28th (or 29th in leap years).",
            "Given payment completion for the current cycle, the next_due_date increments automatically to the subsequent period.",
            "Given past due dates with unrecorded payments, the rule flags as 'Overdue'."
        ],
        "Priority": "Highest",
        "Component": "Recurring Radar",
        "Labels": "recurring dates calendar algorithm"
    },
    {
        "Summary": "30-Day Forward Calendar Radar View",
        "Persona": "forward-looking planner",
        "Action": "view an interactive 30-day chronological radar list showing all upcoming commitments ordered by due date",
        "Benefit": "I can see exactly which bills are landing over the next month and plan liquidity accordingly",
        "Criteria": [
            "Given GET /api/recurring/radar, the API returns all obligations falling between today and today + 30 days.",
            "Given the response, items are strictly ordered in ascending order of due date.",
            "Given the list, the total sum of upcoming commitments is displayed as a header total."
        ],
        "Priority": "High",
        "Component": "Recurring Radar",
        "Labels": "recurring radar dashboard frontend"
    },
    {
        "Summary": "Relative Urgency Highlighting on Radar Items",
        "Persona": "busy professional",
        "Action": "see relative urgency tags on radar cards (e.g. 'Due Today', 'Due in 2 days', 'In 3 weeks')",
        "Benefit": "immediate payment obligations stand out clearly from distant obligations",
        "Criteria": [
            "Given a bill due on current calendar date, a high-priority red pill 'Due Today' displays.",
            "Given a bill due in <= 3 days, an amber badge 'Due in X days' displays.",
            "Given a bill due > 7 days away, a neutral badge displays with the scheduled date."
        ],
        "Priority": "Medium",
        "Component": "Recurring Radar",
        "Labels": "recurring ui badges urgency"
    },
    {
        "Summary": "One-Click Quick Log of Recurring Bill to Transaction Ledger",
        "Persona": "convenience seeker",
        "Action": "click 'Mark as Paid' on any radar item to automatically log the transaction in the ledger",
        "Benefit": "I can clear bills from my radar and update my account balance with a single click without re-typing details",
        "Criteria": [
            "Given clicking 'Mark as Paid' on a ₹2,500 broadband bill, a modal opens pre-filled with the exact amount, merchant, and category.",
            "Given confirmation, an expense transaction is posted, account balance is debited, and the rule's next_due_date advances to next month.",
            "Given quick logging, the bill is immediately removed from the active pending radar list."
        ],
        "Priority": "High",
        "Component": "Recurring Radar",
        "Labels": "recurring workflow automation ledger"
    },

    # ----------------------------------------------------
    # COMPONENT 12: Spending DNA, Data Portability & Settings (Stories 66 - 70)
    # ----------------------------------------------------
    {
        "Summary": "Spending DNA Category Donut Breakdown Visualization",
        "Persona": "visual budgeter",
        "Action": "view an interactive donut chart breaking down total expenses by parent category with percentage shares",
        "Benefit": "I can immediately see which spending categories consume the largest portions of my income",
        "Criteria": [
            "Given expenses across multiple categories in a billing period, the donut chart renders proportionate arc segments matching category color tokens.",
            "Given hovering over an arc segment, a tooltip reveals category name, total amount in paise formatted in currency, and percentage share.",
            "Given clicking a segment, the ledger below filters to display transactions strictly for that category."
        ],
        "Priority": "Medium",
        "Component": "Analytics",
        "Labels": "analytics spending-dna dataviz charts"
    },
    {
        "Summary": "Top Merchant Outflow Pareto Distribution",
        "Persona": "spend auditor",
        "Action": "view a ranked leaderboard of my top 5 merchants by total spend for the selected billing cycle",
        "Benefit": "I can identify specific commercial outlets or service providers where my cash drains fastest",
        "Criteria": [
            "Given transaction data, the backend groups expenses by merchant string and sorts by sum(amount) DESC limit 5.",
            "Given the leaderboard, each row shows merchant name, transaction count, total spent, and percentage of overall expenses.",
            "Given clicking on a merchant row, the view drills down to individual purchases at that vendor."
        ],
        "Priority": "Low",
        "Component": "Analytics",
        "Labels": "analytics merchants pareto insights"
    },
    {
        "Summary": "Stream RFC 4180 In-Memory CSV Transaction Export",
        "Persona": "data portability advocate or tax filer",
        "Action": "export my entire transaction ledger as an RFC 4180 compliant CSV file streamed directly in-memory",
        "Benefit": "I can analyze my financial records in Excel/Python or provide records to my accountant without server disk bloat",
        "Criteria": [
            "Given GET /api/export/transactions/csv, the response streams CSV data using StreamingResponse with Content-Disposition attachment header.",
            "Given fields containing commas, quotes, or newlines, the generator properly escapes them per RFC 4180 standards.",
            "Given amounts in paise, the CSV output provides both minor-unit integer paise and decimal-formatted currency columns."
        ],
        "Priority": "High",
        "Component": "Data Portability",
        "Labels": "export csv streaming portability"
    },
    {
        "Summary": "Export Complete Workspace State as Encrypted JSON Backup",
        "Persona": "privacy-centric self-custody user",
        "Action": "download a full JSON snapshot of all my accounts, categories, transactions, budgets, goals, and recurring rules",
        "Benefit": "I possess complete ownership and portable backups of my personal financial history",
        "Criteria": [
            "Given GET /api/export/backup/json, the API bundles user data into a validated structured JSON schema.",
            "Given sensitive authentication hashes, they are strictly stripped from the backup payload.",
            "Given the download, the filename includes a clear ISO-8601 timestamp (e.g. klyro-backup-2026-10-29.json)."
        ],
        "Priority": "Medium",
        "Component": "Data Portability",
        "Labels": "export json backup data-ownership"
    },
    {
        "Summary": "One-Click Demo Sandbox Re-Seeding Endpoint",
        "Persona": "evaluator or test engineer",
        "Action": "trigger a sandbox re-seeding command to populate the workspace with realistic sample financial data",
        "Benefit": "I can explore all analytical dashboards, weather models, and run-rates immediately without manual data entry",
        "Criteria": [
            "Given calling POST /api/demo/seed, the system populates sample accounts (Bank, Cash, Reserve), categories, 90 days of transactions, budgets, and goals.",
            "Given existing demo data, the endpoint cleanly resets and repopulates the sandbox idempotently.",
            "Given non-demo production accounts, safety guards ensure real user data cannot be overwritten by the seeder."
        ],
        "Priority": "Low",
        "Component": "Data Portability",
        "Labels": "demo testing onboarding seeding"
    }
]

def format_description(persona, action, benefit, criteria):
    crit_text = "\n".join([f"- {c}" for c in criteria])
    desc = (
        f"h3. User Story\n"
        f"*As a* {persona},\n"
        f"*I want to* {action},\n"
        f"*So that* {benefit}.\n\n"
        f"h3. Acceptance Criteria\n"
        f"{crit_text}"
    )
    return desc

def generate_csv(output_path):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        # Jira-compatible headers
        writer.writerow(["Issue Type", "Summary", "Description", "Priority", "Component", "Labels"])
        
        for idx, story in enumerate(stories, start=1):
            issue_type = "Story"
            summary = f"[{story['Component']}] {story['Summary']}"
            description = format_description(
                story["Persona"],
                story["Action"],
                story["Benefit"],
                story["Criteria"]
            )
            priority = story["Priority"]
            component = story["Component"]
            labels = story["Labels"]
            writer.writerow([issue_type, summary, description, priority, component, labels])

if __name__ == "__main__":
    out_file = r"c:\Users\Sanskriti Vadher\OneDrive\Desktop\HSB\T2\kosh-budget\jira_user_stories.csv"
    artifact_file = r"C:\Users\Sanskriti Vadher\.gemini\antigravity\brain\6f08df90-efcd-45ab-8283-d4086b4bb294\jira_user_stories.csv"
    generate_csv(out_file)
    generate_csv(artifact_file)
    print(f"Successfully generated {len(stories)} user stories in:")
    print(f"1. {out_file}")
    print(f"2. {artifact_file}")

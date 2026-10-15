# 🏛️ Klyro Technical Knowledge Base & Obsidian Vault

> **Welcome to the Klyro Engineering & Architecture Vault.**
> This vault documents every layer of **Klyro** (`https://klyro-iota.vercel.app`), an intelligent personal financial workspace.

---

## 🗺️ Map of Content (MOC)

Explore the vault notes using the links below:

1. [[01_Tech_Stack|🛠️ 01. Technical Stack & Architectural Overview]]
   - Frontend stack (Vanilla ES Modules, Tailwind CDN, Chart.js, Canvas Confetti)
   - Backend stack (FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Uvicorn)
   - Database layer (Neon PostgreSQL Serverless + SQLite local dual-engine)
   - Hosting & Serverless Execution (Vercel Python Lambda runtime)

2. [[02_Database_ER_and_Tables|🗄️ 02. Database ER Diagram & Table Schemas]]
   - Complete Mermaid Entity-Relationship (ER) diagram
   - 10 Detailed relational tables with column types, nullability, defaults, and foreign keys
   - Integer paise representation & 64-bit BigInteger precision

3. [[03_API_Specification|🔌 03. API Specification & HTTP Methods]]
   - Complete inventory of all **42 REST endpoints**
   - Method breakdown: **21 GET**, **12 POST**, **4 PATCH**, **4 DELETE**, **1 PUT**
   - Standard unified JSON response envelope & error envelope format

4. [[04_Client_to_Server_Data_Flow|🌊 04. Client-to-Server Data Movement Lifecycle]]
   - End-to-end lifecycle demonstration (Logging a ₹500 Swiggy expense via Quick Capture)
   - Step 1: User DOM Input → Step 2: Data Sanitization → Step 3: HTTP Request
   - Step 4: FastAPI Router & Validation → Step 5: Arithmetic Engine → Step 6: Atomic DB Commit
   - Step 7: JSON Serialization → Step 8: Reactive UI Re-render & Count-up Animation

5. [[05_Dashboards_and_Views|🖥️ 05. The 8 Application Views & Dashboards]]
   - 1. Home Dashboard (Executive Cockpit & Money Weather)
   - 2. Transactions View (Ledger & Filter Engine)
   - 3. Accounts View (Liquid vs Reserve Assets)
   - 4. Budgets View (Pacing Radar & Category Pulse)
   - 5. Goals View (Savings Velocity & Milestones)
   - 6. Recurring View (30-day Calendar Radar & Commitments)
   - 7. Insights View (Spending DNA & Behavioral Anomalies)
   - 8. Settings View (Data Export, Portability & Re-seeding)

6. [[06_Financial_Calculation_Engine|🧮 06. Financial Intelligence & Calculation Engine]]
   - The Safe-to-Spend formula & safety buffer cushion
   - Money Weather status determination logic (Comfortable, Tightening, At Risk)
   - Atomic two-legged account transfer ledger mechanics

---
*Created for Klyro Production Release on Vercel & Neon PostgreSQL.*

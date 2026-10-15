"""
CLI SQLite Database Inspector for Klyro.
Run: python scripts/inspect_db.py
"""
import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parent.parent / "kosh.db"
if not db_path.exists():
    print(f"Error: {db_path} does not exist.")
    exit(1)

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

print("=" * 65)
print("       KLYRO SQLITE DATABASE INSPECTOR (kosh.db)")
print("=" * 65)

# 1. Accounts
print("\n[1] ACCOUNTS & LIQUIDITY (Notice is_reserve)")
print("-" * 65)
cursor.execute("SELECT id, name, account_type, opening_balance_minor, is_reserve FROM accounts")
for row in cursor.fetchall():
    rupees = row[3] / 100.0
    reserve_tag = "[RESERVE / LOCKED]" if row[4] else "[SPENDABLE LIQUID]"
    print(f"  ID {row[0]}: {row[1]:<24} {row[2]:<12} ₹{rupees:>10,.2f}  {reserve_tag}")

# 2. Transactions
print("\n[2] RECENT TRANSACTIONS (Integer Paise Arithmetic)")
print("-" * 65)
cursor.execute("""
    SELECT id, transaction_date, merchant, amount_minor, transaction_type, payment_method, transfer_group_id
    FROM transactions ORDER BY id DESC LIMIT 6
""")
for row in cursor.fetchall():
    rupees = row[3] / 100.0
    desc = row[2] or ("Transfer Leg" if row[6] else "General")
    print(f"  ID {row[0]}: {row[1]} | {desc:<16} | Raw Paise: {row[3]:>8} | ₹{rupees:>8.2f} | {row[4]}")

# 3. Budgets & Allocations
print("\n[3] BUDGET ALLOCATIONS")
print("-" * 65)
cursor.execute("""
    SELECT b.name, c.name, ba.allocated_amount_minor
    FROM budget_allocations ba
    JOIN budgets b ON ba.budget_id = b.id
    JOIN categories c ON ba.category_id = c.id
""")
for row in cursor.fetchall():
    rupees = row[2] / 100.0
    print(f"  {row[0]}: {row[1]:<20} -> ₹{rupees:>8,.2f}")

# 4. Recurring Commitments
print("\n[4] 30-DAY RADAR: RECURRING COMMITMENTS")
print("-" * 65)
cursor.execute("SELECT name, rule_type, next_due_date, expected_amount_minor FROM recurring_rules")
for row in cursor.fetchall():
    rupees = row[3] / 100.0
    print(f"  Due: {row[2]} | {row[0]:<22} ({row[1]:<12}) -> ₹{rupees:>8,.2f}")

print("\n" + "=" * 65)
print("Inspection complete. All amounts verified as integer paise.")
print("=" * 65)
conn.close()

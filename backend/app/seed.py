"""
KLYRO — Isolated Demo Seed Generator
Populates realistic Indian personal finance demo records for testing and presentation.
"""

from datetime import date, datetime, timezone
import uuid
from sqlalchemy.orm import Session

from backend.app.database import engine, Base, SessionLocal
from backend.app.models import (
    User,
    Account,
    Category,
    Transaction,
    Budget,
    BudgetAllocation,
    RecurringRule,
    Goal,
    GoalContribution,
    AppSetting,
)
from backend.app.utils.security import get_password_hash


def seed_demo_data(db: Session = None, reset: bool = True):
    """Seed the database with an authentic, production-grade demonstration portfolio."""
    owns_session = False
    if db is None:
        db = SessionLocal()
        owns_session = True

    try:
        if reset:
            # Drop all and recreate schema cleanly on target database engine
            target_engine = db.get_bind() if db else engine
            Base.metadata.drop_all(bind=target_engine)
            Base.metadata.create_all(bind=target_engine)

        # 1. Demo User (clean up existing demo user if present)
        existing_user = db.query(User).filter_by(email="sanskriti@klyro.finance").first()
        if existing_user:
            db.delete(existing_user)
            db.flush()

        demo_user = User(
            name="Sanskriti Vadher",
            email="sanskriti@klyro.finance",
            password_hash=get_password_hash("DemoPassword123!"),
            default_currency="INR",
            timezone="Asia/Kolkata",
        )
        db.add(demo_user)
        db.flush()

        user_id = demo_user.id

        # 2. Accounts
        acc_hdfc = Account(
            user_id=user_id,
            name="HDFC Salary Bank",
            account_type="bank",
            currency="INR",
            opening_balance_minor=4520000,  # ₹45,200.00
            institution_name="HDFC Bank",
            is_active=True,
        )
        acc_icici = Account(
            user_id=user_id,
            name="ICICI Coral Credit Card",
            account_type="credit_card",
            currency="INR",
            opening_balance_minor=-800000,  # -₹8,000.00 outstanding liability
            institution_name="ICICI Bank",
            is_active=True,
        )
        acc_upi = Account(
            user_id=user_id,
            name="UPI / Google Pay Wallet",
            account_type="wallet",
            currency="INR",
            opening_balance_minor=485000,  # ₹4,850.00
            institution_name="Google Pay / NPCI",
            is_active=True,
        )
        acc_sbi = Account(
            user_id=user_id,
            name="SBI Emergency Savings",
            account_type="bank",
            currency="INR",
            opening_balance_minor=24000000,  # ₹2,40,000.00
            institution_name="State Bank of India",
            is_active=True,
            is_reserve=True,
        )
        acc_cash = Account(
            user_id=user_id,
            name="Cash on Hand",
            account_type="cash",
            currency="INR",
            opening_balance_minor=210000,  # ₹2,100.00
            institution_name="Physical Cash",
            is_active=True,
        )
        db.add_all([acc_hdfc, acc_icici, acc_upi, acc_sbi, acc_cash])
        db.flush()

        # 3. Categories
        cat_groceries = Category(user_id=user_id, name="Groceries & Essentials", category_type="expense", icon_key="shopping-cart", color_token="sage")
        cat_dining = Category(user_id=user_id, name="Dining Out & Delivery", category_type="expense", icon_key="utensils", color_token="coral")
        cat_rent = Category(user_id=user_id, name="Rent & Housing", category_type="expense", icon_key="home", color_token="navy")
        cat_transport = Category(user_id=user_id, name="Transport & Fuel", category_type="expense", icon_key="car", color_token="marigold")
        cat_utilities = Category(user_id=user_id, name="Utilities & Bills", category_type="expense", icon_key="zap", color_token="terracotta")
        cat_shopping = Category(user_id=user_id, name="Shopping & Discretionary", category_type="expense", icon_key="shopping-bag", color_token="coral")
        cat_healthcare = Category(user_id=user_id, name="Healthcare & Medicine", category_type="expense", icon_key="heart", color_token="sage")
        cat_entertainment = Category(user_id=user_id, name="Entertainment & Subscriptions", category_type="expense", icon_key="tv", color_token="marigold")
        
        cat_salary = Category(user_id=user_id, name="Salary", category_type="income", icon_key="briefcase", color_token="sage")
        cat_freelance = Category(user_id=user_id, name="Freelance & Consulting", category_type="income", icon_key="laptop", color_token="sage")
        
        cat_transfer = Category(user_id=user_id, name="Internal Transfers", category_type="transfer", icon_key="arrow-left-right", color_token="neutral")

        categories = [
            cat_groceries, cat_dining, cat_rent, cat_transport, cat_utilities,
            cat_shopping, cat_healthcare, cat_entertainment, cat_salary,
            cat_freelance, cat_transfer
        ]
        db.add_all(categories)
        db.flush()

        # 4. Monthly Budget for October 2026
        oct_budget = Budget(
            user_id=user_id,
            name="October 2026 Master Budget",
            period_type="monthly",
            start_date=date(2026, 10, 1),
            end_date=date(2026, 10, 31),
            total_limit_minor=7000000,  # ₹70,000.00
            rollover_enabled=False,
        )
        db.add(oct_budget)
        db.flush()

        allocations = [
            BudgetAllocation(budget_id=oct_budget.id, category_id=cat_groceries.id, allocated_amount_minor=1400000),  # ₹14,000
            BudgetAllocation(budget_id=oct_budget.id, category_id=cat_dining.id, allocated_amount_minor=750000),       # ₹7,500
            BudgetAllocation(budget_id=oct_budget.id, category_id=cat_transport.id, allocated_amount_minor=500000),   # ₹5,000
            BudgetAllocation(budget_id=oct_budget.id, category_id=cat_utilities.id, allocated_amount_minor=600000),   # ₹6,000
            BudgetAllocation(budget_id=oct_budget.id, category_id=cat_shopping.id, allocated_amount_minor=800000),    # ₹8,000
            BudgetAllocation(budget_id=oct_budget.id, category_id=cat_healthcare.id, allocated_amount_minor=450000),  # ₹4,500
        ]
        db.add_all(allocations)
        db.flush()

        # 5. Recurring Rules
        rule_salary = RecurringRule(
            user_id=user_id,
            account_id=acc_hdfc.id,
            category_id=cat_salary.id,
            name="ACME Corp Monthly Salary",
            rule_type="income",
            expected_amount_minor=8500000,  # ₹85,000.00
            frequency="monthly",
            start_date=date(2026, 1, 1),
            next_due_date=date(2026, 11, 1),
            status="active",
        )
        rule_rent = RecurringRule(
            user_id=user_id,
            account_id=acc_hdfc.id,
            category_id=cat_rent.id,
            name="Apartment House Rent",
            rule_type="expense",
            expected_amount_minor=2500000,  # ₹25,000.00
            frequency="monthly",
            start_date=date(2026, 1, 5),
            next_due_date=date(2026, 11, 5),
            status="active",
        )
        rule_emi = RecurringRule(
            user_id=user_id,
            account_id=acc_hdfc.id,
            category_id=cat_rent.id,
            name="HDFC Home Loan EMI",
            rule_type="expense",
            expected_amount_minor=2250000,  # ₹22,500.00
            frequency="monthly",
            start_date=date(2026, 2, 20),
            next_due_date=date(2026, 10, 20),  # In 5 days!
            status="active",
        )
        rule_netflix = RecurringRule(
            user_id=user_id,
            account_id=acc_icici.id,
            category_id=cat_entertainment.id,
            name="Netflix Premium Subscription",
            rule_type="expense",
            expected_amount_minor=64900,  # ₹649.00
            frequency="monthly",
            start_date=date(2026, 1, 24),
            next_due_date=date(2026, 10, 24),
            status="active",
        )
        rule_broadband = RecurringRule(
            user_id=user_id,
            account_id=acc_hdfc.id,
            category_id=cat_utilities.id,
            name="Airtel Xstream Fiber Broadband",
            rule_type="expense",
            expected_amount_minor=117900,  # ₹1,179.00
            frequency="monthly",
            start_date=date(2026, 1, 28),
            next_due_date=date(2026, 10, 28),
            status="active",
        )
        db.add_all([rule_salary, rule_rent, rule_emi, rule_netflix, rule_broadband])
        db.flush()

        # 6. Goals
        goal_emergency = Goal(
            user_id=user_id,
            name="Emergency Fund (6 Months)",
            target_amount_minor=30000000,  # ₹3,00,000.00
            current_amount_minor=24000000,  # ₹2,40,000.00
            target_date=date(2026, 12, 31),
            priority="high",
            linked_account_id=acc_sbi.id,
            status="in_progress",
        )
        goal_japan = Goal(
            user_id=user_id,
            name="Japan Autumn Vacation 2027",
            target_amount_minor=20000000,  # ₹2,00,000.00
            current_amount_minor=7500000,   # ₹75,000.00
            target_date=date(2027, 10, 15),
            priority="medium",
            linked_account_id=acc_hdfc.id,
            status="in_progress",
        )
        db.add_all([goal_emergency, goal_japan])
        db.flush()

        # Goal Contribution record
        contrib_emergency = GoalContribution(
            goal_id=goal_emergency.id,
            amount_minor=1000000,  # ₹10,000.00
            contribution_date=date(2026, 10, 2),
            contribution_type="deposit",
            notes="Monthly emergency fund automated allocation",
        )
        db.add(contrib_emergency)

        # 7. Recorded Transactions for October 2026
        # A) 01 Oct 2026: Salary deposit (+₹85,000)
        tx_salary = Transaction(
            user_id=user_id,
            account_id=acc_hdfc.id,
            category_id=cat_salary.id,
            transaction_type="income",
            amount_minor=8500000,
            currency="INR",
            merchant="ACME Technologies India Pvt Ltd",
            description="Monthly salary disbursement",
            transaction_date=date(2026, 10, 1),
            payment_method="net_banking",
        )

        # B) 02 Oct 2026: Internal Transfer HDFC -> SBI Savings (₹10,000)
        transfer_uuid = str(uuid.uuid4())
        tx_transfer_out = Transaction(
            user_id=user_id,
            account_id=acc_hdfc.id,
            category_id=cat_transfer.id,
            transaction_type="transfer",
            amount_minor=1000000,
            currency="INR",
            merchant="Transfer to SBI Emergency Savings",
            description="Monthly emergency fund contribution leg 1",
            transaction_date=date(2026, 10, 2),
            payment_method="net_banking",
            transfer_group_id=transfer_uuid,
        )
        tx_transfer_in = Transaction(
            user_id=user_id,
            account_id=acc_sbi.id,
            category_id=cat_transfer.id,
            transaction_type="transfer",
            amount_minor=1000000,
            currency="INR",
            merchant="Transfer from HDFC Salary Bank",
            description="Monthly emergency fund contribution leg 2",
            transaction_date=date(2026, 10, 2),
            payment_method="net_banking",
            transfer_group_id=transfer_uuid,
        )

        # C) 05 Oct 2026: Rent (-₹25,000)
        tx_rent = Transaction(
            user_id=user_id,
            account_id=acc_hdfc.id,
            category_id=cat_rent.id,
            transaction_type="expense",
            amount_minor=2500000,
            currency="INR",
            merchant="Landlord Realty Trust",
            description="October Apartment Rent",
            transaction_date=date(2026, 10, 5),
            payment_method="net_banking",
        )

        # D) 08 Oct 2026: Petrol (-₹2,100)
        tx_petrol = Transaction(
            user_id=user_id,
            account_id=acc_icici.id,
            category_id=cat_transport.id,
            transaction_type="expense",
            amount_minor=210000,
            currency="INR",
            merchant="Indian Oil Corporation",
            description="Vehicle petrol fuel refill",
            transaction_date=date(2026, 10, 8),
            payment_method="credit_card",
        )

        # E) 10 Oct 2026: Groceries (-₹3,450)
        tx_groc1 = Transaction(
            user_id=user_id,
            account_id=acc_hdfc.id,
            category_id=cat_groceries.id,
            transaction_type="expense",
            amount_minor=345000,
            currency="INR",
            merchant="Nature's Basket",
            description="Fortnightly household groceries",
            transaction_date=date(2026, 10, 10),
            payment_method="debit_card",
        )

        # F) 12 Oct 2026: Electricity bill (-₹1,850)
        tx_elec = Transaction(
            user_id=user_id,
            account_id=acc_upi.id,
            category_id=cat_utilities.id,
            transaction_type="expense",
            amount_minor=185000,
            currency="INR",
            merchant="Tata Power / Electricity",
            description="Monthly electricity consumption bill",
            transaction_date=date(2026, 10, 12),
            payment_method="upi",
        )

        # G) 13 Oct 2026: Swiggy (-₹640)
        tx_food = Transaction(
            user_id=user_id,
            account_id=acc_upi.id,
            category_id=cat_dining.id,
            transaction_type="expense",
            amount_minor=64000,
            currency="INR",
            merchant="Swiggy Gourmet",
            description="Team dinner delivery",
            transaction_date=date(2026, 10, 13),
            payment_method="upi",
        )

        # H) 14 Oct 2026: Nature's Basket (-₹2,480)
        tx_groc2 = Transaction(
            user_id=user_id,
            account_id=acc_hdfc.id,
            category_id=cat_groceries.id,
            transaction_type="expense",
            amount_minor=248000,
            currency="INR",
            merchant="Nature's Basket",
            description="Fresh organic produce and dairy",
            transaction_date=date(2026, 10, 14),
            payment_method="debit_card",
        )

        db.add_all([
            tx_salary, tx_transfer_out, tx_transfer_in, tx_rent,
            tx_petrol, tx_groc1, tx_elec, tx_food, tx_groc2
        ])

        # 8. App Settings
        settings_entries = [
            AppSetting(user_id=user_id, setting_key="default_currency", setting_value="INR"),
            AppSetting(user_id=user_id, setting_key="financial_year_start", setting_value="4"),
            AppSetting(user_id=user_id, setting_key="safe_to_spend_buffer_pct", setting_value="10"),
            AppSetting(user_id=user_id, setting_key="timezone", setting_value="Asia/Kolkata"),
        ]
        db.add_all(settings_entries)

        db.commit()
        print("Klyro demo database successfully seeded.")
        return demo_user

    except Exception as e:
        db.rollback()
        print(f"Error seeding demo database: {e}")
        raise
    finally:
        if owns_session:
            db.close()


if __name__ == "__main__":
    seed_demo_data()

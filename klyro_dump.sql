BEGIN TRANSACTION;
CREATE TABLE accounts (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	account_type VARCHAR(30) NOT NULL, 
	currency VARCHAR(3) NOT NULL, 
	opening_balance_minor BIGINT NOT NULL, 
	institution_name VARCHAR(100), 
	is_active BOOLEAN NOT NULL, 
	is_reserve BOOLEAN DEFAULT 0 NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT check_account_type CHECK (account_type IN ('bank', 'cash', 'wallet', 'credit_card')), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
INSERT INTO "accounts" VALUES(1,1,'HDFC Salary Bank','bank','INR',4520000,'HDFC Bank',1,0,'2026-10-15 17:32:53.665565','2026-10-15 17:32:53.665572');
INSERT INTO "accounts" VALUES(2,1,'ICICI Coral Credit Card','credit_card','INR',-800000,'ICICI Bank',1,0,'2026-10-15 17:32:53.665576','2026-10-15 17:32:53.665578');
INSERT INTO "accounts" VALUES(3,1,'UPI / Google Pay Wallet','wallet','INR',485000,'Google Pay / NPCI',1,0,'2026-10-15 17:32:53.665580','2026-10-15 17:32:53.665582');
INSERT INTO "accounts" VALUES(4,1,'SBI Emergency Savings','bank','INR',24000000,'State Bank of India',1,1,'2026-10-15 17:32:53.669063','2026-10-15 17:32:53.669071');
INSERT INTO "accounts" VALUES(5,1,'Cash on Hand','cash','INR',210000,'Physical Cash',1,0,'2026-10-15 17:32:53.670865','2026-10-15 17:32:53.670877');
CREATE TABLE alembic_version (
	version_num VARCHAR(32) NOT NULL, 
	CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
INSERT INTO "alembic_version" VALUES('301a79d2a2de');
CREATE TABLE app_settings (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	setting_key VARCHAR(100) NOT NULL, 
	setting_value TEXT NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_user_setting_key UNIQUE (user_id, setting_key), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
INSERT INTO "app_settings" VALUES(1,1,'default_currency','INR','2026-10-15 17:32:53.705783');
INSERT INTO "app_settings" VALUES(2,1,'financial_year_start','4','2026-10-15 17:32:53.705792');
INSERT INTO "app_settings" VALUES(3,1,'safe_to_spend_buffer_pct','10','2026-10-15 17:32:53.705793');
INSERT INTO "app_settings" VALUES(4,1,'timezone','Asia/Kolkata','2026-10-15 17:32:53.705795');
CREATE TABLE budget_allocations (
	id INTEGER NOT NULL, 
	budget_id INTEGER NOT NULL, 
	category_id INTEGER NOT NULL, 
	allocated_amount_minor BIGINT NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT check_non_negative_allocation CHECK (allocated_amount_minor >= 0), 
	CONSTRAINT uq_budget_category UNIQUE (budget_id, category_id), 
	FOREIGN KEY(budget_id) REFERENCES budgets (id) ON DELETE CASCADE, 
	FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE CASCADE
);
INSERT INTO "budget_allocations" VALUES(1,1,1,1400000);
INSERT INTO "budget_allocations" VALUES(2,1,2,750000);
INSERT INTO "budget_allocations" VALUES(3,1,4,500000);
INSERT INTO "budget_allocations" VALUES(4,1,5,600000);
INSERT INTO "budget_allocations" VALUES(5,1,6,800000);
INSERT INTO "budget_allocations" VALUES(6,1,7,450000);
CREATE TABLE budgets (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	period_type VARCHAR(20) NOT NULL, 
	start_date DATE NOT NULL, 
	end_date DATE NOT NULL, 
	total_limit_minor BIGINT, 
	rollover_enabled BOOLEAN NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT check_budget_period_type CHECK (period_type IN ('monthly', 'custom')), 
	CONSTRAINT check_budget_date_range CHECK (end_date >= start_date), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
INSERT INTO "budgets" VALUES(1,1,'October 2026 Master Budget','monthly','2026-10-01','2026-10-31',7000000,0,'2026-10-15 17:32:53.682243','2026-10-15 17:32:53.682251');
CREATE TABLE categories (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	name VARCHAR(100) NOT NULL, 
	category_type VARCHAR(20) NOT NULL, 
	parent_category_id INTEGER, 
	icon_key VARCHAR(50) NOT NULL, 
	color_token VARCHAR(50) NOT NULL, 
	is_archived BOOLEAN NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT check_category_type CHECK (category_type IN ('expense', 'income', 'transfer')), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(parent_category_id) REFERENCES categories (id) ON DELETE SET NULL
);
INSERT INTO "categories" VALUES(1,1,'Groceries & Essentials','expense',NULL,'shopping-cart','sage',0,'2026-10-15 17:32:53.676468');
INSERT INTO "categories" VALUES(2,1,'Dining Out & Delivery','expense',NULL,'utensils','coral',0,'2026-10-15 17:32:53.676476');
INSERT INTO "categories" VALUES(3,1,'Rent & Housing','expense',NULL,'home','navy',0,'2026-10-15 17:32:53.676478');
INSERT INTO "categories" VALUES(4,1,'Transport & Fuel','expense',NULL,'car','marigold',0,'2026-10-15 17:32:53.676480');
INSERT INTO "categories" VALUES(5,1,'Utilities & Bills','expense',NULL,'zap','terracotta',0,'2026-10-15 17:32:53.676481');
INSERT INTO "categories" VALUES(6,1,'Shopping & Discretionary','expense',NULL,'shopping-bag','coral',0,'2026-10-15 17:32:53.676483');
INSERT INTO "categories" VALUES(7,1,'Healthcare & Medicine','expense',NULL,'heart','sage',0,'2026-10-15 17:32:53.676485');
INSERT INTO "categories" VALUES(8,1,'Entertainment & Subscriptions','expense',NULL,'tv','marigold',0,'2026-10-15 17:32:53.676487');
INSERT INTO "categories" VALUES(9,1,'Salary','income',NULL,'briefcase','sage',0,'2026-10-15 17:32:53.676489');
INSERT INTO "categories" VALUES(10,1,'Freelance & Consulting','income',NULL,'laptop','sage',0,'2026-10-15 17:32:53.676490');
INSERT INTO "categories" VALUES(11,1,'Internal Transfers','transfer',NULL,'arrow-left-right','neutral',0,'2026-10-15 17:32:53.676492');
CREATE TABLE goal_contributions (
	id INTEGER NOT NULL, 
	goal_id INTEGER NOT NULL, 
	transaction_id INTEGER, 
	amount_minor BIGINT NOT NULL, 
	contribution_date DATE NOT NULL, 
	contribution_type VARCHAR(20) NOT NULL, 
	notes VARCHAR(255), 
	PRIMARY KEY (id), 
	CONSTRAINT check_positive_contribution_amount CHECK (amount_minor > 0), 
	CONSTRAINT check_contribution_type CHECK (contribution_type IN ('deposit', 'withdrawal')), 
	FOREIGN KEY(goal_id) REFERENCES goals (id) ON DELETE CASCADE, 
	FOREIGN KEY(transaction_id) REFERENCES transactions (id) ON DELETE SET NULL
);
INSERT INTO "goal_contributions" VALUES(1,1,NULL,1000000,'2026-10-02','deposit','Monthly emergency fund automated allocation');
CREATE TABLE goals (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	target_amount_minor BIGINT NOT NULL, 
	current_amount_minor BIGINT NOT NULL, 
	target_date DATE, 
	priority VARCHAR(20) NOT NULL, 
	linked_account_id INTEGER, 
	status VARCHAR(20) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT check_positive_goal_target CHECK (target_amount_minor > 0), 
	CONSTRAINT check_non_negative_goal_current CHECK (current_amount_minor >= 0), 
	CONSTRAINT check_goal_priority CHECK (priority IN ('low', 'medium', 'high')), 
	CONSTRAINT check_goal_status CHECK (status IN ('in_progress', 'achieved', 'paused')), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(linked_account_id) REFERENCES accounts (id) ON DELETE SET NULL
);
INSERT INTO "goals" VALUES(1,1,'Emergency Fund (6 Months)',30000000,24000000,'2026-12-31','high',4,'in_progress','2026-10-15 17:32:53.699578','2026-10-15 17:32:53.699585');
INSERT INTO "goals" VALUES(2,1,'Japan Autumn Vacation 2027',20000000,7500000,'2027-10-15','medium',1,'in_progress','2026-10-15 17:32:53.699588','2026-10-15 17:32:53.699590');
CREATE TABLE recurring_rules (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	account_id INTEGER NOT NULL, 
	category_id INTEGER, 
	name VARCHAR(100) NOT NULL, 
	rule_type VARCHAR(20) NOT NULL, 
	expected_amount_minor BIGINT NOT NULL, 
	frequency VARCHAR(20) NOT NULL, 
	start_date DATE NOT NULL, 
	next_due_date DATE NOT NULL, 
	end_date DATE, 
	status VARCHAR(20) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT check_recurring_rule_type CHECK (rule_type IN ('expense', 'income', 'transfer')), 
	CONSTRAINT check_recurring_frequency CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')), 
	CONSTRAINT check_recurring_status CHECK (status IN ('active', 'paused', 'cancelled')), 
	CONSTRAINT check_positive_recurring_amount CHECK (expected_amount_minor > 0), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(account_id) REFERENCES accounts (id) ON DELETE CASCADE, 
	FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE SET NULL
);
INSERT INTO "recurring_rules" VALUES(1,1,1,9,'ACME Corp Monthly Salary','income',8500000,'monthly','2026-01-01','2026-11-01',NULL,'active','2026-10-15 17:32:53.693332','2026-10-15 17:32:53.693341');
INSERT INTO "recurring_rules" VALUES(2,1,1,3,'Apartment House Rent','expense',2500000,'monthly','2026-01-05','2026-11-05',NULL,'active','2026-10-15 17:32:53.693345','2026-10-15 17:32:53.693347');
INSERT INTO "recurring_rules" VALUES(3,1,1,3,'HDFC Home Loan EMI','expense',2250000,'monthly','2026-02-20','2026-10-20',NULL,'active','2026-10-15 17:32:53.693348','2026-10-15 17:32:53.693349');
INSERT INTO "recurring_rules" VALUES(4,1,2,8,'Netflix Premium Subscription','expense',64900,'monthly','2026-01-24','2026-10-24',NULL,'active','2026-10-15 17:32:53.693351','2026-10-15 17:32:53.693352');
INSERT INTO "recurring_rules" VALUES(5,1,1,5,'Airtel Xstream Fiber Broadband','expense',117900,'monthly','2026-01-28','2026-10-28',NULL,'active','2026-10-15 17:32:53.693353','2026-10-15 17:32:53.693355');
CREATE TABLE transactions (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	account_id INTEGER NOT NULL, 
	category_id INTEGER, 
	transaction_type VARCHAR(20) NOT NULL, 
	amount_minor BIGINT NOT NULL, 
	currency VARCHAR(3) NOT NULL, 
	merchant VARCHAR(150), 
	description VARCHAR(255), 
	transaction_date DATE NOT NULL, 
	payment_method VARCHAR(30) NOT NULL, 
	transfer_group_id VARCHAR(64), 
	linked_transaction_id INTEGER, 
	recurring_rule_id INTEGER, 
	notes VARCHAR(500), 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT check_transaction_type CHECK (transaction_type IN ('expense', 'income', 'transfer', 'refund')), 
	CONSTRAINT check_payment_method CHECK (payment_method IN ('upi', 'debit_card', 'credit_card', 'net_banking', 'cash', 'other')), 
	CONSTRAINT check_positive_amount CHECK (amount_minor > 0), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(account_id) REFERENCES accounts (id) ON DELETE CASCADE, 
	FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE SET NULL, 
	FOREIGN KEY(linked_transaction_id) REFERENCES transactions (id) ON DELETE SET NULL, 
	FOREIGN KEY(recurring_rule_id) REFERENCES recurring_rules (id) ON DELETE SET NULL
);
INSERT INTO "transactions" VALUES(1,1,1,9,'income',8500000,'INR','ACME Technologies India Pvt Ltd','Monthly salary disbursement','2026-10-01','net_banking',NULL,NULL,NULL,NULL,'2026-10-15 17:32:53.708378','2026-10-15 17:32:53.708385');
INSERT INTO "transactions" VALUES(2,1,1,11,'transfer',1000000,'INR','Transfer to SBI Emergency Savings','Monthly emergency fund contribution leg 1','2026-10-02','net_banking','b9e8bb5d-bb4d-41f2-b375-f5d20173181b',NULL,NULL,NULL,'2026-10-15 17:32:53.708388','2026-10-15 17:32:53.708390');
INSERT INTO "transactions" VALUES(3,1,4,11,'transfer',1000000,'INR','Transfer from HDFC Salary Bank','Monthly emergency fund contribution leg 2','2026-10-02','net_banking','b9e8bb5d-bb4d-41f2-b375-f5d20173181b',NULL,NULL,NULL,'2026-10-15 17:32:53.708391','2026-10-15 17:32:53.708392');
INSERT INTO "transactions" VALUES(4,1,1,3,'expense',2500000,'INR','Landlord Realty Trust','October Apartment Rent','2026-10-05','net_banking',NULL,NULL,NULL,NULL,'2026-10-15 17:32:53.708394','2026-10-15 17:32:53.708395');
INSERT INTO "transactions" VALUES(5,1,2,4,'expense',210000,'INR','Indian Oil Corporation','Vehicle petrol fuel refill','2026-10-08','credit_card',NULL,NULL,NULL,NULL,'2026-10-15 17:32:53.708396','2026-10-15 17:32:53.708398');
INSERT INTO "transactions" VALUES(6,1,1,1,'expense',345000,'INR','Nature''s Basket','Fortnightly household groceries','2026-10-10','debit_card',NULL,NULL,NULL,NULL,'2026-10-15 17:32:53.708399','2026-10-15 17:32:53.708400');
INSERT INTO "transactions" VALUES(7,1,3,5,'expense',185000,'INR','Tata Power / Electricity','Monthly electricity consumption bill','2026-10-12','upi',NULL,NULL,NULL,NULL,'2026-10-15 17:32:53.708402','2026-10-15 17:32:53.708403');
INSERT INTO "transactions" VALUES(8,1,3,2,'expense',64000,'INR','Swiggy Gourmet','Team dinner delivery','2026-10-13','upi',NULL,NULL,NULL,NULL,'2026-10-15 17:32:53.708405','2026-10-15 17:32:53.708406');
INSERT INTO "transactions" VALUES(9,1,1,1,'expense',248000,'INR','Nature''s Basket','Fresh organic produce and dairy','2026-10-14','debit_card',NULL,NULL,NULL,NULL,'2026-10-15 17:32:53.708407','2026-10-15 17:32:53.708408');
CREATE TABLE users (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	default_currency VARCHAR(3) NOT NULL, 
	timezone VARCHAR(50) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO "users" VALUES(1,'Sanskriti Vadher','sanskriti@klyro.finance','$2b$12$qqEwLYlxu9p.AuC/y.3lHOqoynBhelSCGcjZxec2NIg0JXCn8RhVm','INR','Asia/Kolkata','2026-10-15 17:32:53.616031','2026-10-15 17:32:53.616037');
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE INDEX ix_users_id ON users (id);
CREATE INDEX ix_accounts_id ON accounts (id);
CREATE INDEX ix_accounts_user_id ON accounts (user_id);
CREATE INDEX ix_categories_user_id ON categories (user_id);
CREATE INDEX ix_categories_id ON categories (id);
CREATE INDEX ix_budgets_end_date ON budgets (end_date);
CREATE INDEX ix_budgets_id ON budgets (id);
CREATE INDEX ix_budgets_start_date ON budgets (start_date);
CREATE INDEX ix_budgets_user_id ON budgets (user_id);
CREATE INDEX ix_app_settings_id ON app_settings (id);
CREATE INDEX ix_app_settings_user_id ON app_settings (user_id);
CREATE INDEX ix_budget_allocations_category_id ON budget_allocations (category_id);
CREATE INDEX ix_budget_allocations_id ON budget_allocations (id);
CREATE INDEX ix_budget_allocations_budget_id ON budget_allocations (budget_id);
CREATE INDEX ix_recurring_rules_user_id ON recurring_rules (user_id);
CREATE INDEX ix_recurring_rules_id ON recurring_rules (id);
CREATE INDEX ix_recurring_rules_next_due_date ON recurring_rules (next_due_date);
CREATE INDEX ix_goals_user_id ON goals (user_id);
CREATE INDEX ix_goals_id ON goals (id);
CREATE INDEX ix_transactions_account_id ON transactions (account_id);
CREATE INDEX idx_user_tx_date ON transactions (user_id, transaction_date);
CREATE INDEX ix_transactions_transfer_group_id ON transactions (transfer_group_id);
CREATE INDEX ix_transactions_category_id ON transactions (category_id);
CREATE INDEX ix_transactions_transaction_date ON transactions (transaction_date);
CREATE INDEX ix_transactions_id ON transactions (id);
CREATE INDEX ix_transactions_user_id ON transactions (user_id);
CREATE INDEX ix_transactions_merchant ON transactions (merchant);
CREATE INDEX idx_user_category ON transactions (user_id, category_id);
CREATE INDEX ix_goal_contributions_contribution_date ON goal_contributions (contribution_date);
CREATE INDEX ix_goal_contributions_id ON goal_contributions (id);
CREATE INDEX ix_goal_contributions_goal_id ON goal_contributions (goal_id);
COMMIT;

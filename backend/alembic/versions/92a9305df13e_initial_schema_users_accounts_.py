"""Initial schema: users, accounts, categories, transactions, budgets, recurring, goals, settings

Revision ID: 92a9305df13e
Revises: 
Create Date: 2026-10-15 19:13:39.159644

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '92a9305df13e'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('default_currency', sa.String(length=3), nullable=False, server_default='INR'),
        sa.Column('timezone', sa.String(length=50), nullable=False, server_default='Asia/Kolkata'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. accounts
    op.create_table(
        'accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('account_type', sa.String(length=30), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='INR'),
        sa.Column('opening_balance_minor', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('institution_name', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint("account_type IN ('bank', 'cash', 'wallet', 'credit_card')", name='check_account_type'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accounts_id'), 'accounts', ['id'], unique=False)
    op.create_index(op.f('ix_accounts_user_id'), 'accounts', ['user_id'], unique=False)

    # 3. categories
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('category_type', sa.String(length=20), nullable=False),
        sa.Column('parent_category_id', sa.Integer(), nullable=True),
        sa.Column('icon_key', sa.String(length=50), nullable=False, server_default='tag'),
        sa.Column('color_token', sa.String(length=50), nullable=False, server_default='neutral'),
        sa.Column('is_archived', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint("category_type IN ('expense', 'income', 'transfer')", name='check_category_type'),
        sa.ForeignKeyConstraint(['parent_category_id'], ['categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_user_id'), 'categories', ['user_id'], unique=False)

    # 4. budgets
    op.create_table(
        'budgets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('period_type', sa.String(length=20), nullable=False, server_default='monthly'),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('total_limit_minor', sa.BigInteger(), nullable=True),
        sa.Column('rollover_enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint("period_type IN ('monthly', 'custom')", name='check_budget_period_type'),
        sa.CheckConstraint('end_date >= start_date', name='check_budget_date_range'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_budgets_id'), 'budgets', ['id'], unique=False)
    op.create_index(op.f('ix_budgets_user_id'), 'budgets', ['user_id'], unique=False)
    op.create_index(op.f('ix_budgets_start_date'), 'budgets', ['start_date'], unique=False)
    op.create_index(op.f('ix_budgets_end_date'), 'budgets', ['end_date'], unique=False)

    # 5. budget_allocations
    op.create_table(
        'budget_allocations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('budget_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('allocated_amount_minor', sa.BigInteger(), nullable=False),
        sa.CheckConstraint('allocated_amount_minor >= 0', name='check_non_negative_allocation'),
        sa.ForeignKeyConstraint(['budget_id'], ['budgets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('budget_id', 'category_id', name='uq_budget_category')
    )
    op.create_index(op.f('ix_budget_allocations_id'), 'budget_allocations', ['id'], unique=False)
    op.create_index(op.f('ix_budget_allocations_budget_id'), 'budget_allocations', ['budget_id'], unique=False)
    op.create_index(op.f('ix_budget_allocations_category_id'), 'budget_allocations', ['category_id'], unique=False)

    # 6. recurring_rules
    op.create_table(
        'recurring_rules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('rule_type', sa.String(length=20), nullable=False),
        sa.Column('expected_amount_minor', sa.BigInteger(), nullable=False),
        sa.Column('frequency', sa.String(length=20), nullable=False, server_default='monthly'),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('next_due_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint("frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')", name='check_recurring_frequency'),
        sa.CheckConstraint("rule_type IN ('expense', 'income', 'transfer')", name='check_recurring_rule_type'),
        sa.CheckConstraint("status IN ('active', 'paused', 'cancelled')", name='check_recurring_status'),
        sa.CheckConstraint('expected_amount_minor > 0', name='check_positive_recurring_amount'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_recurring_rules_id'), 'recurring_rules', ['id'], unique=False)
    op.create_index(op.f('ix_recurring_rules_user_id'), 'recurring_rules', ['user_id'], unique=False)
    op.create_index(op.f('ix_recurring_rules_next_due_date'), 'recurring_rules', ['next_due_date'], unique=False)

    # 7. transactions
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('transaction_type', sa.String(length=20), nullable=False),
        sa.Column('amount_minor', sa.BigInteger(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='INR'),
        sa.Column('merchant', sa.String(length=150), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('payment_method', sa.String(length=30), nullable=False, server_default='upi'),
        sa.Column('transfer_group_id', sa.String(length=64), nullable=True),
        sa.Column('linked_transaction_id', sa.Integer(), nullable=True),
        sa.Column('recurring_rule_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint('amount_minor > 0', name='check_positive_amount'),
        sa.CheckConstraint("payment_method IN ('upi', 'debit_card', 'credit_card', 'net_banking', 'cash', 'other')", name='check_payment_method'),
        sa.CheckConstraint("transaction_type IN ('expense', 'income', 'transfer', 'refund')", name='check_transaction_type'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['linked_transaction_id'], ['transactions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['recurring_rule_id'], ['recurring_rules.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_id'), 'transactions', ['id'], unique=False)
    op.create_index(op.f('ix_transactions_user_id'), 'transactions', ['user_id'], unique=False)
    op.create_index(op.f('ix_transactions_account_id'), 'transactions', ['account_id'], unique=False)
    op.create_index(op.f('ix_transactions_category_id'), 'transactions', ['category_id'], unique=False)
    op.create_index(op.f('ix_transactions_merchant'), 'transactions', ['merchant'], unique=False)
    op.create_index(op.f('ix_transactions_transaction_date'), 'transactions', ['transaction_date'], unique=False)
    op.create_index(op.f('ix_transactions_transfer_group_id'), 'transactions', ['transfer_group_id'], unique=False)
    op.create_index('idx_user_tx_date', 'transactions', ['user_id', 'transaction_date'], unique=False)
    op.create_index('idx_user_category', 'transactions', ['user_id', 'category_id'], unique=False)

    # 8. goals
    op.create_table(
        'goals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('target_amount_minor', sa.BigInteger(), nullable=False),
        sa.Column('current_amount_minor', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('target_date', sa.Date(), nullable=True),
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='medium'),
        sa.Column('linked_account_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='in_progress'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint('current_amount_minor >= 0', name='check_non_negative_goal_current'),
        sa.CheckConstraint("priority IN ('low', 'medium', 'high')", name='check_goal_priority'),
        sa.CheckConstraint("status IN ('in_progress', 'achieved', 'paused')", name='check_goal_status'),
        sa.CheckConstraint('target_amount_minor > 0', name='check_positive_goal_target'),
        sa.ForeignKeyConstraint(['linked_account_id'], ['accounts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_goals_id'), 'goals', ['id'], unique=False)
    op.create_index(op.f('ix_goals_user_id'), 'goals', ['user_id'], unique=False)

    # 9. goal_contributions
    op.create_table(
        'goal_contributions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('goal_id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=True),
        sa.Column('amount_minor', sa.BigInteger(), nullable=False),
        sa.Column('contribution_date', sa.Date(), nullable=False),
        sa.Column('contribution_type', sa.String(length=20), nullable=False, server_default='deposit'),
        sa.Column('notes', sa.String(length=255), nullable=True),
        sa.CheckConstraint('amount_minor > 0', name='check_positive_contribution_amount'),
        sa.CheckConstraint("contribution_type IN ('deposit', 'withdrawal')", name='check_contribution_type'),
        sa.ForeignKeyConstraint(['goal_id'], ['goals.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_goal_contributions_id'), 'goal_contributions', ['id'], unique=False)
    op.create_index(op.f('ix_goal_contributions_goal_id'), 'goal_contributions', ['goal_id'], unique=False)
    op.create_index(op.f('ix_goal_contributions_contribution_date'), 'goal_contributions', ['contribution_date'], unique=False)

    # 10. app_settings
    op.create_table(
        'app_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('setting_key', sa.String(length=100), nullable=False),
        sa.Column('setting_value', sa.Text(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'setting_key', name='uq_user_setting_key')
    )
    op.create_index(op.f('ix_app_settings_id'), 'app_settings', ['id'], unique=False)
    op.create_index(op.f('ix_app_settings_user_id'), 'app_settings', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_table('app_settings')
    op.drop_table('goal_contributions')
    op.drop_table('goals')
    op.drop_table('transactions')
    op.drop_table('recurring_rules')
    op.drop_table('budget_allocations')
    op.drop_table('budgets')
    op.drop_table('categories')
    op.drop_table('accounts')
    op.drop_table('users')

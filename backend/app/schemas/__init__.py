from backend.app.schemas.common import ErrorDetail, ErrorResponse, PaginationMeta, PaginatedResponse
from backend.app.schemas.user import UserCreate, UserLogin, UserUpdate, UserResponse, Token, TokenPayload, PasswordChange
from backend.app.schemas.account import (
    AccountCreate,
    AccountUpdate,
    AccountAdjustmentCreate,
    AccountResponse,
)
from backend.app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from backend.app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransferCreate,
    TransactionResponse,
)
from backend.app.schemas.budget import (
    BudgetBase,
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetAllocationCreate,
    BudgetAllocationResponse,
    CategoryPerformance,
    BudgetPerformanceResponse,
)

from backend.app.schemas.recurring import (
    RecurringRuleCreate,
    RecurringRuleUpdate,
    RecurringRuleResponse,
    UpcomingCommitmentResponse,
)
from backend.app.schemas.goal import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    GoalContributionCreate,
    GoalContributionResponse,
)
from backend.app.schemas.analytics import (
    MoneyWeatherResponse,
    DashboardSummaryResponse,
    SpendingByCategoryResponse,
    SpendingByCategoryItem,
    CashFlowAnalyticsResponse,
    CashFlowPeriodItem,
    SpendingDNAInsight,
)


__all__ = [
    "ErrorDetail",
    "ErrorResponse",
    "PaginationMeta",
    "PaginatedResponse",
    "UserCreate",
    "UserLogin",
    "UserUpdate",
    "UserResponse",
    "Token",
    "TokenPayload",
    "AccountCreate",
    "AccountUpdate",
    "AccountAdjustmentCreate",
    "AccountResponse",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    "TransactionCreate",
    "TransactionUpdate",
    "TransferCreate",
    "TransactionResponse",
    "BudgetCreate",
    "BudgetUpdate",
    "BudgetResponse",
    "BudgetAllocationCreate",
    "BudgetAllocationResponse",
    "CategoryPerformance",
    "BudgetPerformanceResponse",
    "RecurringRuleCreate",
    "RecurringRuleUpdate",
    "RecurringRuleResponse",
    "UpcomingCommitmentResponse",
    "GoalCreate",
    "GoalUpdate",
    "GoalResponse",
    "GoalContributionCreate",
    "GoalContributionResponse",
    "MoneyWeatherResponse",
    "DashboardSummaryResponse",
    "SpendingByCategoryResponse",
    "CashFlowAnalyticsResponse",
    "SpendingDNAInsight",
]

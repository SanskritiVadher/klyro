from fastapi import APIRouter

from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.accounts import router as accounts_router
from backend.app.api.v1.categories import router as categories_router
from backend.app.api.v1.transactions import router as transactions_router
from backend.app.api.v1.budgets import router as budgets_router
from backend.app.api.v1.goals import router as goals_router
from backend.app.api.v1.recurring import router as recurring_router
from backend.app.api.v1.dashboard import router as dashboard_router
from backend.app.api.v1.analytics import router as analytics_router
from backend.app.api.v1.data_management import router as data_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(accounts_router)
api_v1_router.include_router(categories_router)
api_v1_router.include_router(transactions_router)
api_v1_router.include_router(budgets_router)
api_v1_router.include_router(goals_router)
api_v1_router.include_router(recurring_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(data_router)

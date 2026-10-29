from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models import User, Category
from backend.app.schemas import UserCreate, UserLogin, UserResponse, Token, PasswordChange
from backend.app.utils.security import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

DEFAULT_ONBOARDING_CATEGORIES = [
    ("Groceries & Essentials", "expense", "shopping-cart", "sage"),
    ("Dining Out & Delivery", "expense", "dining", "coral"),
    ("Utilities & Bills", "expense", "bolt", "terracotta"),
    ("Transport & Fuel", "expense", "car", "marigold"),
    ("Rent & Housing", "expense", "home", "stone"),
    ("Entertainment & Subscriptions", "expense", "movie", "coral"),
    ("Healthcare & Medicine", "expense", "health", "sage"),
    ("Shopping & Discretionary", "expense", "bag", "marigold"),
    ("Salary", "income", "briefcase", "sage"),
    ("Freelance & Consulting", "income", "laptop", "marigold"),
    ("Investments & Dividends", "income", "chart", "sage"),
]


def seed_default_user_categories(db: Session, user_id: int):
    """Seed standard financial taxonomy for newly registered users."""
    for name, cat_type, icon, color in DEFAULT_ONBOARDING_CATEGORIES:
        cat = Category(
            user_id=user_id,
            name=name,
            category_type=cat_type,
            icon_key=icon,
            color_token=color,
            is_archived=False,
        )
        db.add(cat)
    db.commit()


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Enforce verified server-side authentication via signed JWT bearer token.
    Rejects unauthenticated, forged, or expired requests with standard 401 Unauthorized.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Authentication required. Please provide a valid Bearer token."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_EXPIRED", "message": "Session token has expired. Please log in again."},
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Invalid authentication token signature."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Token does not specify a valid user identity."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Token subject is malformed."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "USER_NOT_FOUND", "message": "User account not found or access revoked."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Register a new user and seed their default financial category taxonomy."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EMAIL_EXISTS", "message": "An account with this email already exists"}
        )

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        default_currency=payload.default_currency,
        timezone=payload.timezone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Seed initial category taxonomy for the new user workspace
    seed_default_user_categories(db, user.id)

    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive a signed JWT access token."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"}
        )

    token = create_access_token(subject=user.id)
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/change-password")
def change_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Securely change the authenticated user's password with current credential verification."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_PASSWORD", "message": "Current password is incorrect."}
        )

    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    return {"status": "success", "message": "Password changed successfully."}


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Acknowledge session termination on client."""
    return {"status": "success", "message": "Successfully logged out."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user profile."""
    return current_user

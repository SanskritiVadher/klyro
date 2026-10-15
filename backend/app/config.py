import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_NAME: str = "Klyro Financial Intelligence"
    DEBUG: bool = True
    PORT: int = 8081
    HOST: str = "127.0.0.1"

    SECRET_KEY: str = "klyro-dev-super-secret-key-change-in-production-min-32-chars-long!"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"

    DATABASE_URL: str = "sqlite:///./kosh.db"

    DEFAULT_CURRENCY: str = "INR"
    CURRENCY_LOCALE: str = "en_IN"
    FINANCIAL_YEAR_START_MONTH: int = 4
    SAFE_TO_SPEND_BUFFER_PCT: float = 10.0
    TIMEZONE: str = "Asia/Kolkata"

    CORS_ORIGINS: List[str] = [
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

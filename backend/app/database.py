from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker

from backend.app.config import settings

# Normalize DATABASE_URL for Postgres / Neon (psycopg3 driver)
raw_db_url = settings.DATABASE_URL
if raw_db_url.startswith("postgres://"):
    db_url = raw_db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+"):
    db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg://", 1)
else:
    db_url = raw_db_url

is_sqlite = db_url.startswith("sqlite")

engine_kwargs = {
    "echo": False,
    "future": True,
}

if is_sqlite:
    # SQLite requires check_same_thread=False for FastAPI multi-threaded requests
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL settings optimized for serverless platforms (e.g. Neon, Vercel)
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(
    db_url,
    **engine_kwargs,
)

# Enforce foreign key constraints ONLY in SQLite
if is_sqlite:
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)

Base = declarative_base()


def get_db():
    """Dependency that provides an isolated database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

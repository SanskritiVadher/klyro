import os
import shutil
from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker

from backend.app.config import settings

# Normalize DATABASE_URL for Postgres / Neon (psycopg3 driver)
raw_db_url = settings.DATABASE_URL

# In Vercel serverless environment, local filesystem is read-only except /tmp
if os.getenv("VERCEL") and (raw_db_url.startswith("sqlite") and "/tmp" not in raw_db_url):
    tmp_db = Path("/tmp/kosh.db")
    src_db = Path("./kosh.db")
    if not tmp_db.exists() and src_db.exists():
        try:
            shutil.copy2(src_db, tmp_db)
        except Exception:
            pass
    raw_db_url = f"sqlite:///{tmp_db}"

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

# Enforce foreign key constraints and high-concurrency pragmas in SQLite
if is_sqlite:
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)

Base = declarative_base()


def get_db():
    """Dependency that provides an isolated database session per request with automatic rollback on failure."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

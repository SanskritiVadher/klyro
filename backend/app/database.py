from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker

from backend.app.config import settings

# Create engine with appropriate SQLite / PostgreSQL settings
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite requires check_same_thread=False for FastAPI multi-threaded requests
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    future=True,
)

# Enforce foreign key constraints in SQLite
if settings.DATABASE_URL.startswith("sqlite"):
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

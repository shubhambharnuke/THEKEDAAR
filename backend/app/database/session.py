"""SQLAlchemy 2.x Database Session and Base Configuration"""

import os
from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from backend.app.core.config import settings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy declarative models."""
    pass


db_url = settings.DATABASE_URL.strip()

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# Handle SQLite vs PostgreSQL configurations
if db_url.startswith("sqlite"):
    # Ensure local directory exists if relative or file path
    if ":///" in db_url:
        sqlite_file = db_url.split(":///", 1)[1]
        db_file_path = Path(sqlite_file)
        if db_file_path.parent:
            db_file_path.parent.mkdir(parents=True, exist_ok=True)

    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        echo=(settings.ENVIRONMENT == "development"),
    )

    # Enforce foreign key constraints in SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

else:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=(settings.ENVIRONMENT == "development"),
    )

# Session factory
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for injecting transactional database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

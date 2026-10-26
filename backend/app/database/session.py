"""SQLAlchemy 2.x Database Session and Base Configuration"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from backend.app.core.config import settings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy declarative models."""
    pass


# Normalize database URL for psycopg2 dialect
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# Configure engine with pooling and pre-ping to handle serverless disconnects
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

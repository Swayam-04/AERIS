import os
from functools import lru_cache
from typing import Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class DatabaseSettings:
    """Database configuration loaded from environment variables."""

    def __init__(self):
        # Database URL - defaults to PostgreSQL, can also accept SQLite for testing
        raw_url = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/aeris_db")
        # Normalize postgres:// or postgresql:// to postgresql+psycopg:// if needed
        if raw_url.startswith("postgres://"):
            raw_url = raw_url.replace("postgres://", "postgresql+psycopg://", 1)
        elif raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+"):
            raw_url = raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
        self.database_url: str = raw_url

        # Batch persistence settings
        self.batch_size: int = int(os.getenv("TELEMETRY_BATCH_SIZE", "100"))
        self.flush_interval: float = float(os.getenv("TELEMETRY_FLUSH_INTERVAL", "1.0"))
        self.queue_size: int = int(os.getenv("TELEMETRY_PERSISTENCE_QUEUE_SIZE", "5000"))
        self.retry_interval: float = float(os.getenv("TELEMETRY_DB_RETRY_INTERVAL", "5.0"))
        self.echo: bool = os.getenv("DATABASE_ECHO", "false").lower() in ("true", "1", "yes")


@lru_cache()
def get_db_settings() -> DatabaseSettings:
    return DatabaseSettings()

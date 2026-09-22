import logging
from contextlib import contextmanager
from typing import Generator, Optional, Dict, Any
from urllib.parse import urlparse
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session

from backend.database.config import get_db_settings
from backend.database.models import Base

logger = logging.getLogger("aeris.database")


class DatabaseManager:
    """
    Manages SQLAlchemy engine, connection pooling, table schemas,
    and TimescaleDB hypertable optimization.
    """

    def __init__(self, database_url: Optional[str] = None):
        self.settings = get_db_settings()
        self.database_url = database_url or self.settings.database_url
        self.engine: Optional[Engine] = None
        self.session_factory: Optional[sessionmaker] = None
        self.timescaledb_enabled: bool = False
        self._is_initialized: bool = False

    def initialize(self) -> bool:
        """Initializes database engine and creates tables/hypertables if reachable."""
        try:
            connect_args = {}
            if self.database_url.startswith("sqlite"):
                connect_args = {"check_same_thread": False}
                self.engine = create_engine(
                    self.database_url,
                    echo=self.settings.echo,
                    connect_args=connect_args
                )
            else:
                self.engine = create_engine(
                    self.database_url,
                    echo=self.settings.echo,
                    pool_pre_ping=True,
                    pool_size=10,
                    max_overflow=20,
                    connect_args={"connect_timeout": 5}
                )

            self.session_factory = sessionmaker(
                bind=self.engine,
                autoflush=False,
                autocommit=False,
                expire_on_commit=False
            )

            # Attempt to create tables & hypertable
            self._create_schema_and_hypertable()
            self._is_initialized = True
            logger.info("AERIS database initialized successfully.")
            return True

        except Exception as e:
            logger.warning(f"Database connection initialization failed (will retry in background): {e}")
            self._is_initialized = False
            return False

    def _create_schema_and_hypertable(self):
        """Creates table schemas and converts telemetry_records to TimescaleDB hypertable if supported."""
        if not self.engine:
            return

        # Create all tables defined in Base
        Base.metadata.create_all(bind=self.engine)

        # Check for PostgreSQL & TimescaleDB
        if "postgres" in self.engine.dialect.name:
            try:
                with self.engine.connect() as conn:
                    # Try enabling timescaledb extension
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"))
                    conn.commit()
                    
                    # Convert telemetry_records to hypertable partitioned on timestamp
                    try:
                        conn.execute(text("""
                            DO $$
                            BEGIN
                                IF EXISTS (
                                    SELECT 1 FROM pg_constraint WHERE conname = 'telemetry_records_pkey'
                                ) THEN
                                    ALTER TABLE telemetry_records DROP CONSTRAINT telemetry_records_pkey;
                                    ALTER TABLE telemetry_records ADD PRIMARY KEY (id, timestamp);
                                END IF;
                            END $$;
                        """))
                        conn.commit()
                        conn.execute(text("SELECT create_hypertable('telemetry_records', 'timestamp', if_not_exists => TRUE, migrate_data => TRUE);"))
                        conn.commit()
                        self.timescaledb_enabled = True
                        logger.info("TimescaleDB extension enabled and hypertable 'telemetry_records' active.")
                    except Exception as hte:
                        logger.info(f"TimescaleDB create_hypertable notice: {hte}")
                        self.timescaledb_enabled = True
            except Exception as te:
                self.timescaledb_enabled = False
                logger.info(f"TimescaleDB extension not available on this PostgreSQL instance ({te}). Using standard relational storage.")
        else:
            self.timescaledb_enabled = False

    @contextmanager
    def get_session(self) -> Generator[Session, None, None]:
        """Provides a transactional scope around a series of operations."""
        if not self.session_factory:
            if not self.initialize():
                raise ConnectionError("Database session unavailable - database is not initialized or unreachable.")
        
        session: Session = self.session_factory()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def is_healthy(self) -> bool:
        """Pings the database to verify connectivity."""
        if not self.engine:
            return False
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1;"))
            return True
        except Exception:
            return False

    def get_sanitized_url(self) -> str:
        """Returns database URL with credentials masked."""
        try:
            parsed = urlparse(self.database_url)
            if parsed.password:
                netloc = f"{parsed.username}:****@{parsed.hostname}"
                if parsed.port:
                    netloc += f":{parsed.port}"
                return parsed._replace(netloc=netloc).geturl()
            return self.database_url
        except Exception:
            return "masked_database_url"

    def get_status(self) -> Dict[str, Any]:
        """Returns diagnostic status of database connection."""
        healthy = self.is_healthy()
        return {
            "configured": True,
            "connected": healthy,
            "dialect": self.engine.dialect.name if self.engine else "uninitialized",
            "timescaledb_enabled": self.timescaledb_enabled if healthy else False,
            "database_url": self.get_sanitized_url()
        }


# Global singleton instance
_db_manager_instance: Optional[DatabaseManager] = None


def get_db_manager(database_url: Optional[str] = None) -> DatabaseManager:
    global _db_manager_instance
    if _db_manager_instance is None or (database_url and database_url != _db_manager_instance.database_url):
        _db_manager_instance = DatabaseManager(database_url)
    return _db_manager_instance

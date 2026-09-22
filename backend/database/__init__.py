"""
AERIS Persistent Database Module
Provides PostgreSQL / TimescaleDB storage for telemetry records.
"""

from backend.database.config import DatabaseSettings, get_db_settings
from backend.database.models import Base, TelemetryRecordModel
from backend.database.connection import DatabaseManager, get_db_manager
from backend.database.repository import TelemetryRepository
from backend.database.batch_writer import TelemetryBatchWriter

__all__ = [
    "DatabaseSettings",
    "get_db_settings",
    "Base",
    "TelemetryRecordModel",
    "DatabaseManager",
    "get_db_manager",
    "TelemetryRepository",
    "TelemetryBatchWriter",
]

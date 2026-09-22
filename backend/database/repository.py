import datetime
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import func, select, desc, asc
from sqlalchemy.orm import Session

from backend.database.connection import DatabaseManager, get_db_manager
from backend.database.models import TelemetryRecordModel
from backend.schemas.telemetry import DigitalTwinState

logger = logging.getLogger("aeris.repository")


class TelemetryRepository:
    """
    Data Access Object (DAO) for historical telemetry queries and batch persistence.
    """

    def __init__(self, db_manager: Optional[DatabaseManager] = None):
        self.db = db_manager or get_db_manager()

    def insert_batch(self, states: List[DigitalTwinState]) -> int:
        """
        Persists a batch of DigitalTwinState objects into the database.
        Returns the number of successfully written records.
        """
        if not states:
            return 0

        models = [TelemetryRecordModel.from_digital_twin_state(s) for s in states]

        with self.db.get_session() as session:
            session.add_all(models)
            # Transaction commits automatically on context manager exit

        return len(models)

    def query_history(
        self,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        engine_id: Optional[str] = None,
        mission_id: Optional[str] = None,
        mission_phase: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 300,
        offset: int = 0,
        order_desc: bool = False
    ) -> List[DigitalTwinState]:
        """
        Queries historical telemetry records with database-side filtering, ordering, and pagination.
        """
        clamped_limit = max(1, min(5000, limit))
        clamped_offset = max(0, offset)

        with self.db.get_session() as session:
            stmt = select(TelemetryRecordModel)

            # Time-range filtering
            if start_time is not None:
                start_dt = datetime.datetime.fromtimestamp(start_time, tz=datetime.timezone.utc)
                stmt = stmt.where(TelemetryRecordModel.timestamp >= start_dt)

            if end_time is not None:
                end_dt = datetime.datetime.fromtimestamp(end_time, tz=datetime.timezone.utc)
                stmt = stmt.where(TelemetryRecordModel.timestamp <= end_dt)

            # Identifiers & status filtering
            if engine_id:
                stmt = stmt.where(TelemetryRecordModel.engine_id == engine_id)

            if mission_id:
                stmt = stmt.where(TelemetryRecordModel.mission_id == mission_id)

            if mission_phase:
                stmt = stmt.where(TelemetryRecordModel.mission_phase == str(mission_phase).lower())

            if status:
                stmt = stmt.where(TelemetryRecordModel.status == str(status).lower())

            # Ordering
            if order_desc:
                stmt = stmt.order_by(desc(TelemetryRecordModel.timestamp))
            else:
                stmt = stmt.order_by(asc(TelemetryRecordModel.timestamp))

            # Pagination
            stmt = stmt.offset(clamped_offset).limit(clamped_limit)

            rows = session.scalars(stmt).all()
            return [row.to_digital_twin_state() for row in rows]

    def count_records(
        self,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        engine_id: Optional[str] = None,
        mission_id: Optional[str] = None
    ) -> int:
        """Counts matching records using database-side COUNT query."""
        with self.db.get_session() as session:
            stmt = select(func.count()).select_from(TelemetryRecordModel)

            if start_time is not None:
                start_dt = datetime.datetime.fromtimestamp(start_time, tz=datetime.timezone.utc)
                stmt = stmt.where(TelemetryRecordModel.timestamp >= start_dt)

            if end_time is not None:
                end_dt = datetime.datetime.fromtimestamp(end_time, tz=datetime.timezone.utc)
                stmt = stmt.where(TelemetryRecordModel.timestamp <= end_dt)

            if engine_id:
                stmt = stmt.where(TelemetryRecordModel.engine_id == engine_id)

            if mission_id:
                stmt = stmt.where(TelemetryRecordModel.mission_id == mission_id)

            return session.scalar(stmt) or 0

    def get_stats(self) -> Dict[str, Any]:
        """Returns statistical overview of persisted telemetry records."""
        with self.db.get_session() as session:
            total = session.scalar(select(func.count()).select_from(TelemetryRecordModel)) or 0
            if total == 0:
                return {
                    "total_records": 0,
                    "earliest_timestamp": None,
                    "latest_timestamp": None,
                    "active_engines": [],
                    "missions": []
                }

            min_time = session.scalar(select(func.min(TelemetryRecordModel.timestamp)))
            max_time = session.scalar(select(func.max(TelemetryRecordModel.timestamp)))
            
            engines = list(session.scalars(
                select(TelemetryRecordModel.engine_id).distinct()
            ).all())
            
            missions = list(session.scalars(
                select(TelemetryRecordModel.mission_id).distinct()
            ).all())

            return {
                "total_records": total,
                "earliest_timestamp": min_time.timestamp() if min_time else None,
                "latest_timestamp": max_time.timestamp() if max_time else None,
                "active_engines": engines,
                "missions": missions
            }

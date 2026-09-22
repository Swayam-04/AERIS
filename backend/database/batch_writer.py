import asyncio
import logging
import time
from typing import List, Optional, Dict, Any

from backend.database.config import get_db_settings
from backend.database.connection import DatabaseManager, get_db_manager
from backend.database.repository import TelemetryRepository
from backend.schemas.telemetry import DigitalTwinState

logger = logging.getLogger("aeris.batch_writer")


class TelemetryBatchWriter:
    """
    Asynchronous queue-based batch writer for long-term telemetry persistence.
    Decouples real-time simulation/WebSocket broadcasting from database I/O latency
    and provides resilient automatic retry during database connection drops.
    """

    def __init__(
        self,
        db_manager: Optional[DatabaseManager] = None,
        batch_size: Optional[int] = None,
        flush_interval: Optional[float] = None,
        max_queue_size: Optional[int] = None,
        retry_interval: Optional[float] = None
    ):
        settings = get_db_settings()
        self.db_manager = db_manager or get_db_manager()
        self.repository = TelemetryRepository(self.db_manager)
        
        self.batch_size: int = batch_size or settings.batch_size
        self.flush_interval: float = flush_interval or settings.flush_interval
        self.max_queue_size: int = max_queue_size or settings.queue_size
        self.retry_interval: float = retry_interval or settings.retry_interval

        # Bounded asynchronous queue
        self.queue: asyncio.Queue[DigitalTwinState] = asyncio.Queue(maxsize=self.max_queue_size)
        
        # Lifecycle & state flags
        self.is_running: bool = False
        self._worker_task: Optional[asyncio.Task] = None
        self._is_connected: bool = False
        self._last_flush_time: float = time.time()
        
        # Diagnostic metrics
        self.total_enqueued: int = 0
        self.total_written: int = 0
        self.total_dropped: int = 0
        self.total_retries: int = 0
        self.last_error: Optional[str] = None

    def enqueue_state(self, state: DigitalTwinState) -> bool:
        """
        Enqueues a processed telemetry frame for persistent batch insertion.
        If the queue is full (e.g. during prolonged DB downtime), drops the oldest frame
        to maintain bounded memory usage without ever blocking the simulation loop.
        """
        try:
            # If queue is saturated, pop the oldest item to make room
            if self.queue.full():
                try:
                    self.queue.get_nowait()
                    self.queue.task_done()
                    self.total_dropped += 1
                except (asyncio.QueueEmpty, ValueError):
                    pass

            self.queue.put_nowait(state)
            self.total_enqueued += 1
            return True
        except Exception as e:
            logger.warning(f"Error enqueueing telemetry state: {e}")
            self.total_dropped += 1
            return False

    async def start(self):
        """Starts the background batch writing loop."""
        if self.is_running:
            return
        self.is_running = True
        self._worker_task = asyncio.create_task(self._batch_worker_loop())
        logger.info(
            f"TelemetryBatchWriter started (batch_size={self.batch_size}, "
            f"flush_interval={self.flush_interval}s, max_queue={self.max_queue_size})"
        )

    async def stop(self):
        """Gracefully flushes remaining items in the queue and terminates the worker."""
        if not self.is_running:
            return
        self.is_running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
            self._worker_task = None

        # Final synchronous flush of remaining in-memory queue
        await self._flush_remaining()
        logger.info("TelemetryBatchWriter stopped cleanly.")

    async def _batch_worker_loop(self):
        """Continuous background task consuming queue and executing bulk inserts."""
        batch: List[DigitalTwinState] = []
        last_flush = time.time()

        while self.is_running:
            try:
                # Wait for next item with a timeout corresponding to flush interval
                time_since_flush = time.time() - last_flush
                timeout = max(0.05, self.flush_interval - time_since_flush)

                try:
                    state = await asyncio.wait_for(self.queue.get(), timeout=timeout)
                    batch.append(state)
                    self.queue.task_done()
                except asyncio.TimeoutError:
                    pass  # Flush interval reached

                # Check if batch flush criteria met
                now = time.time()
                should_flush = (
                    len(batch) >= self.batch_size or
                    (len(batch) > 0 and (now - last_flush) >= self.flush_interval)
                )

                if should_flush and batch:
                    success = await self._write_batch_with_retry(batch)
                    if success:
                        self.total_written += len(batch)
                        batch = []
                        last_flush = time.time()
                        self._last_flush_time = last_flush
                        self._is_connected = True
                        self.last_error = None
                    else:
                        # Database is unavailable - keep batch, wait retry_interval
                        self._is_connected = False
                        self.total_retries += 1
                        await asyncio.sleep(self.retry_interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                self.last_error = str(e)
                logger.error(f"Unexpected error in telemetry batch worker: {e}", exc_info=True)
                await asyncio.sleep(1.0)

        # On loop exit, try to save any pending batch
        if batch:
            await self._write_batch_with_retry(batch)

    async def _write_batch_with_retry(self, batch: List[DigitalTwinState]) -> bool:
        """Executes database batch insert in thread pool to prevent blocking event loop."""
        try:
            loop = asyncio.get_running_loop()
            written_count = await loop.run_in_executor(
                None,
                self.repository.insert_batch,
                batch
            )
            return written_count == len(batch)
        except Exception as e:
            self.last_error = str(e)
            logger.warning(f"Database batch write failed ({len(batch)} records pending): {e}")
            return False

    async def _flush_remaining(self):
        """Flushes any remaining records left in queue."""
        remaining: List[DigitalTwinState] = []
        while not self.queue.empty():
            try:
                item = self.queue.get_nowait()
                remaining.append(item)
                self.queue.task_done()
            except asyncio.QueueEmpty:
                break

        if remaining:
            logger.info(f"Flushing {len(remaining)} final telemetry records to database...")
            await self._write_batch_with_retry(remaining)

    def get_status(self) -> Dict[str, Any]:
        """Returns runtime health and throughput metrics."""
        return {
            "is_running": self.is_running,
            "connected_to_db": self._is_connected or self.db_manager.is_healthy(),
            "queue_depth": self.queue.qsize(),
            "max_queue_size": self.max_queue_size,
            "batch_size": self.batch_size,
            "flush_interval_sec": self.flush_interval,
            "total_enqueued": self.total_enqueued,
            "total_written": self.total_written,
            "total_dropped": self.total_dropped,
            "total_retries": self.total_retries,
            "last_flush_time": self._last_flush_time,
            "last_error": self.last_error
        }

"""Initial telemetry schema with TimescaleDB hypertable support

Revision ID: 001_initial_telemetry_schema
Revises: 
Create Date: 2026-09-10 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_telemetry_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create telemetry_records table
    op.create_table(
        'telemetry_records',
        sa.Column('id', sa.BigInteger(), sa.Identity(start=1, cycle=False), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('engine_id', sa.String(length=64), nullable=False, server_default='UAV-ENG-26054'),
        sa.Column('mission_id', sa.String(length=64), nullable=False, server_default='MIS-ALPHA-01'),
        sa.Column('mission_phase', sa.String(length=32), nullable=False, server_default='cruise'),
        sa.Column('source_type', sa.String(length=32), nullable=False, server_default='simulated'),
        sa.Column('schema_version', sa.String(length=16), nullable=False, server_default='2.0'),
        sa.Column('throttle_pct', sa.Float(), nullable=False, server_default='70.0'),
        sa.Column('altitude_ft', sa.Float(), nullable=False, server_default='15000.0'),
        sa.Column('ambient_temp_c', sa.Float(), nullable=False, server_default='15.0'),
        sa.Column('rpm', sa.Float(), nullable=False),
        sa.Column('cht_c', sa.Float(), nullable=False),
        sa.Column('egt_c', sa.Float(), nullable=False),
        sa.Column('oil_pressure_psi', sa.Float(), nullable=False),
        sa.Column('oil_temp_c', sa.Float(), nullable=False),
        sa.Column('fuel_flow_lph', sa.Float(), nullable=False),
        sa.Column('vibration_g', sa.Float(), nullable=False),
        sa.Column('injection_timing_deg', sa.Float(), nullable=False),
        sa.Column('battery_volts', sa.Float(), nullable=False),
        sa.Column('bus_voltage', sa.Float(), nullable=True),
        sa.Column('battery_current', sa.Float(), nullable=True),
        sa.Column('battery_temp', sa.Float(), nullable=True),
        sa.Column('battery_soc', sa.Float(), nullable=True),
        sa.Column('battery_soh', sa.Float(), nullable=True),
        sa.Column('alternator_power', sa.Float(), nullable=True),
        sa.Column('alternator_current', sa.Float(), nullable=True),
        sa.Column('alternator_temp', sa.Float(), nullable=True),
        sa.Column('expected_values', sa.JSON(), nullable=True),
        sa.Column('residual_values', sa.JSON(), nullable=True),
        sa.Column('mahalanobis_distance', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('overall_health_score', sa.Float(), nullable=False, server_default='100.0'),
        sa.Column('subsystem_health', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='normal'),
        sa.Column('active_fault', sa.String(length=64), nullable=False, server_default='none'),
        sa.Column('fault_severity', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('alerts', sa.JSON(), nullable=True),
        sa.Column('rul_hours', sa.Float(), nullable=True),
        sa.Column('state_json', sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint('id', 'timestamp')
    )

    # 2. Create Indexes
    op.create_index('idx_telemetry_timestamp_desc', 'telemetry_records', ['timestamp'], unique=False)
    op.create_index('idx_telemetry_engine_time', 'telemetry_records', ['engine_id', 'timestamp'], unique=False)
    op.create_index('idx_telemetry_mission_time', 'telemetry_records', ['mission_id', 'timestamp'], unique=False)
    op.create_index('idx_telemetry_status_time', 'telemetry_records', ['status', 'timestamp'], unique=False)

    # 3. Optional TimescaleDB Hypertable conversion (PostgreSQL dialect only)
    bind = op.get_bind()
    if bind and "postgres" in bind.dialect.name:
        try:
            op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;")
            op.execute("SELECT create_hypertable('telemetry_records', 'timestamp', if_not_exists => TRUE, migrate_data => TRUE);")
        except Exception:
            pass  # TimescaleDB extension optional


def downgrade() -> None:
    op.drop_index('idx_telemetry_status_time', table_name='telemetry_records')
    op.drop_index('idx_telemetry_mission_time', table_name='telemetry_records')
    op.drop_index('idx_telemetry_engine_time', table_name='telemetry_records')
    op.drop_index('idx_telemetry_timestamp_desc', table_name='telemetry_records')
    op.drop_table('telemetry_records')

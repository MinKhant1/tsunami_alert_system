"""PostGIS + schema from spec."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
from geoalchemy2 import Geometry

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=True),
        sa.Column("fcm_token", sa.Text(), nullable=True),
        sa.Column("location", Geometry(geometry_type="POINT", srid=4326, spatial_index=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_users_location", "users", ["location"], postgresql_using="gist")
    op.create_table(
        "seismic_events",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("usgs_id", sa.String(length=50), nullable=True),
        sa.Column("magnitude", sa.Numeric(4, 2), nullable=True),
        sa.Column("depth_km", sa.Numeric(8, 2), nullable=True),
        sa.Column("epicenter", Geometry(geometry_type="POINT", srid=4326, spatial_index=False), nullable=True),
        sa.Column("event_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("raw_data", JSONB(), nullable=True),
        sa.Column("near_subduction_zone", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uix_seismic_events_usgs_id", "seismic_events", ["usgs_id"], unique=True)
    op.create_table(
        "alerts",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("seismic_event_id", UUID(as_uuid=True), nullable=True),
        sa.Column("level", sa.String(length=20), nullable=False),
        sa.Column("eta_minutes", sa.Numeric(8, 2), nullable=True),
        sa.Column("wave_height_m", sa.Numeric(6, 2), nullable=True),
        sa.Column("impact_zone", Geometry(geometry_type="POLYGON", srid=4326, spatial_index=False), nullable=True),
        sa.Column("users_notified", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(
            ["seismic_event_id"],
            ["seismic_events.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_alerts_impact_zone", "alerts", ["impact_zone"], postgresql_using="gist")
    op.create_table(
        "tide_readings",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("station_id", sa.String(length=50), nullable=True),
        sa.Column("value_m", sa.Numeric(8, 4), nullable=True),
        sa.Column("reading_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("tide_readings")
    op.drop_index("idx_alerts_impact_zone", table_name="alerts")
    op.drop_table("alerts")
    op.drop_index("uix_seismic_events_usgs_id", table_name="seismic_events")
    op.drop_table("seismic_events")
    op.drop_index("idx_users_location", table_name="users")
    op.drop_table("users")
    # keep postgis extension
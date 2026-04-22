import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, Column, DateTime, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.database import Base


class SeismicEvent(Base):
    __tablename__ = "seismic_events"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    usgs_id = Column(String(50), unique=True, nullable=True)
    magnitude = Column(Numeric(4, 2), nullable=True)
    depth_km = Column(Numeric(8, 2), nullable=True)
    epicenter = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    event_time = Column(DateTime(timezone=True), nullable=True)
    raw_data = Column(JSONB, nullable=True)
    near_subduction_zone = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

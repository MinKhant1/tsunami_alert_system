import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import ForeignKey

from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    seismic_event_id = Column(
        UUID(as_uuid=True), ForeignKey("seismic_events.id"), nullable=True
    )
    level = Column(String(20), nullable=False)  # WATCH, ADVISORY, WARNING
    eta_minutes = Column(Numeric(8, 2), nullable=True)
    wave_height_m = Column(Numeric(6, 2), nullable=True)
    impact_zone = Column(Geometry(geometry_type="POLYGON", srid=4326), nullable=True)
    users_notified = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

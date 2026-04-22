import uuid

from sqlalchemy import Column, DateTime, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class TideReading(Base):
    __tablename__ = "tide_readings"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    station_id = Column(String(50), nullable=True)
    value_m = Column(Numeric(8, 4), nullable=True)
    reading_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

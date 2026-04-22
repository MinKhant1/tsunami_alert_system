from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SeismicEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

    id: UUID
    usgs_id: Optional[str] = None
    magnitude: Optional[Decimal] = None
    depth_km: Optional[Decimal] = None
    event_time: Optional[datetime] = None
    near_subduction_zone: bool = False
    epicenter: Optional[dict] = None

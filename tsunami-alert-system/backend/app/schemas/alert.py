from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

    id: UUID
    seismic_event_id: Optional[UUID] = None
    level: str
    eta_minutes: Optional[Decimal] = None
    wave_height_m: Optional[Decimal] = None
    users_notified: int = 0
    is_active: bool = True
    created_at: Optional[datetime] = None
    impact_zone_geojson: Optional[dict] = None


class AlertListResponse(BaseModel):
    alerts: list[AlertOut]


class SimulateEventRequest(BaseModel):
    magnitude: float = Field(..., ge=4.0, le=10.0)
    depth_km: float = Field(..., ge=0.0, le=800.0)
    lat: float
    lng: float
    force_trigger: bool = True  # for demos when DART does not confirm
    near_subduction_zone: bool = False


class SimulateEventResponse(BaseModel):
    triggered: bool
    detection_passed: bool
    alert_id: Optional[UUID] = None
    level: Optional[str] = None
    eta_minutes: Optional[float] = None
    users_targeted: int = 0
    users_notified: int = 0
    message: str = ""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert
from app.schemas.alert import AlertOut, AlertListResponse
from app.utils import geo_utils

router = APIRouter(prefix="/alerts", tags=["alerts"])


def _alert_to_out(a: Alert) -> AlertOut:
    gj = None
    if a.impact_zone is not None:
        gj = geo_utils.geometry_to_geojson(a.impact_zone)
    return AlertOut(
        id=a.id,
        seismic_event_id=a.seismic_event_id,
        level=a.level,
        eta_minutes=a.eta_minutes,
        wave_height_m=a.wave_height_m,
        users_notified=a.users_notified,
        is_active=a.is_active,
        created_at=a.created_at,
        impact_zone_geojson=gj,
    )


@router.get("/active", response_model=AlertListResponse)
def get_active_alerts(db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Alert).where(Alert.is_active.is_(True)).order_by(Alert.created_at.desc())
    ).all()
    return AlertListResponse(alerts=[_alert_to_out(a) for a in rows])


@router.get("/{alert_id}", response_model=AlertOut)
def get_alert(alert_id: UUID, db: Session = Depends(get_db)):
    a = db.get(Alert, alert_id)
    if not a:
        raise HTTPException(404, "Alert not found")
    return _alert_to_out(a)

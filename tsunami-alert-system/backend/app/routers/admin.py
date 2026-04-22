import json
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status
from geoalchemy2.elements import WKTElement
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas.alert import SimulateEventRequest, SimulateEventResponse
from app.services import (
    alert_processor,
    detection_engine,
    location_targeting,
    notification,
)
from app.utils import geo_utils

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/simulate-event", response_model=SimulateEventResponse)
def simulate_event(
    body: SimulateEventRequest,
    db: Session = Depends(get_db),
) -> SimulateEventResponse:
    """End-to-end test: create seismic record, run detection, alert, target, notify."""
    wkt = f"POINT({body.lng} {body.lat})"
    ev = models.SeismicEvent(
        usgs_id=f"sim-{uuid4().hex[:12]}",
        magnitude=body.magnitude,
        depth_km=body.depth_km,
        epicenter=WKTElement(wkt, srid=4326),
        event_time=datetime.now(timezone.utc),
        near_subduction_zone=body.near_subduction_zone,
        raw_data={
            "source": "simulate",
            "magnitude": body.magnitude,
            "depth_km": body.depth_km,
        },
    )
    db.add(ev)
    db.flush()

    det_passed = bool(detection_engine.evaluate_seismic_event(ev))
    if not det_passed and not body.force_trigger:
        db.rollback()
        return SimulateEventResponse(
            triggered=False,
            detection_passed=False,
            message="Detection did not pass. Enable force_trigger to run the full demo pipeline.",
        )

    # After gate: real detection had DART, or we force a demo (classify with confirmation)
    dart_for_classify = det_passed or body.force_trigger

    impact_str = geo_utils.impact_polygon_geojson_around(
        body.lng, body.lat, radius_deg=3.0
    )
    poly = geo_utils.from_geojson_to_geom(json.loads(impact_str))
    d_km = geo_utils.distance_km(
        body.lng, body.lat, body.lng + 0.5, body.lat + 0.5
    )
    level = alert_processor.classify_alert(
        body.magnitude, d_km, dart_confirmed=bool(dart_for_classify)
    )
    eta = float(alert_processor.compute_alert_eta(d_km, ocean_depth_m=4000.0))
    wave = alert_processor.suggest_wave_height_m(body.magnitude)

    al = models.Alert(
        seismic_event_id=ev.id,
        level=level,
        eta_minutes=eta,
        wave_height_m=wave,
        impact_zone=poly,
        is_active=True,
    )
    db.add(al)
    db.commit()
    db.refresh(al)

    users = location_targeting.get_users_in_zone(db, impact_str)
    n = notification.send_fcm_batch(
        users,
        title=f"Tsunami {level}",
        body=f"ETA ~{int(eta)} min — wave est. {wave:.1f} m",
        data={"alertId": str(al.id), "level": level, "type": "tsunami"},
    )
    al.users_notified = n if n else len(users)
    db.add(al)
    db.commit()
    db.refresh(al)

    return SimulateEventResponse(
        triggered=True,
        detection_passed=det_passed,
        alert_id=al.id,
        level=level,
        eta_minutes=eta,
        users_targeted=len(users),
        users_notified=al.users_notified,
        message="Simulated event processed. FCM key required to deliver real pushes.",
    )


@router.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def deactivate_alert(alert_id: UUID, db: Session = Depends(get_db)) -> None:
    """Clear an active alert (soft-delete for demo / admin)."""
    al = db.get(models.Alert, alert_id)
    if not al:
        raise HTTPException(404, "Alert not found")
    al.is_active = False
    db.add(al)
    db.commit()

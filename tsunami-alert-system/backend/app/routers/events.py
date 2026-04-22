from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.orm import Session
from geoalchemy2.shape import to_shape

from app.database import get_db
from app.models import SeismicEvent
from app.schemas.seismic_event import SeismicEventOut

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/recent", response_model=list[SeismicEventOut])
def recent_events(db: Session = Depends(get_db), limit: int = 20):
    rows = db.scalars(
        select(SeismicEvent).order_by(desc(SeismicEvent.event_time)).limit(
            min(limit, 100)
        )
    ).all()
    out: list[SeismicEventOut] = []
    for e in rows:
        epic = None
        if e.epicenter is not None:
            s = to_shape(e.epicenter)
            epic = {"type": "Point", "coordinates": [s.x, s.y]}
        out.append(
            SeismicEventOut(
                id=e.id,
                usgs_id=e.usgs_id,
                magnitude=e.magnitude,
                depth_km=e.depth_km,
                event_time=e.event_time,
                near_subduction_zone=bool(e.near_subduction_zone),
                epicenter=epic,
            )
        )
    return out

"""
Celery tasks: USGS poll + alert processing.
"""

import json
import logging
import asyncio
from datetime import datetime, timezone

from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape
from sqlalchemy import select

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import Alert, SeismicEvent
from app.services import (
    alert_processor,
    data_ingestion,
    detection_engine,
    location_targeting,
    notification,
)
from app.utils import geo_utils

logger = logging.getLogger(__name__)


@celery_app.task(name="ingest_earthquakes")
def ingest_earthquakes() -> dict:
    async def _run():
        features = await data_ingestion.fetch_usgs_significant_earthquakes()
        with SessionLocal() as db:
            for f in features:
                parsed = data_ingestion.parse_feature_to_epicenter(f)
                if not parsed:
                    continue
                mag, dep_km, lat, lng, eid, ev_time = parsed
                exists = db.scalar(
                    select(SeismicEvent).where(SeismicEvent.usgs_id == eid)
                )
                if exists:
                    continue
                subd = geo_utils.is_near_subduction_zone(lng, lat)
                ev = SeismicEvent(
                    usgs_id=eid,
                    magnitude=mag,
                    depth_km=dep_km,
                    epicenter=WKTElement(f"POINT({lng} {lat})", srid=4326),
                    event_time=ev_time,
                    near_subduction_zone=subd,
                    raw_data=f,
                )
                db.add(ev)
            db.commit()

    asyncio.run(_run())
    return {"ok": True, "task": "ingest_earthquakes"}


@celery_app.task(name="process_seismic_for_alerts")
def process_seismic_for_alerts() -> dict:
    with SessionLocal() as db:
        for ev in db.scalars(
            select(SeismicEvent).order_by(SeismicEvent.event_time.desc()).limit(30)
        ).all():
            if not detection_engine.evaluate_seismic_event(ev):
                continue
            if db.scalar(
                select(Alert).where(Alert.seismic_event_id == ev.id)
            ):
                continue
            if ev.magnitude is None or ev.epicenter is None:
                continue
            mag = float(ev.magnitude)
            pt = to_shape(ev.epicenter)
            lng, lat = float(pt.x), float(pt.y)
            impact_str = geo_utils.impact_polygon_geojson_around(lng, lat, 3.0)
            d_km = geo_utils.distance_km(lng, lat, lng + 0.5, lat + 0.5)
            ok_dart = data_ingestion.check_dart_anomaly_sync(lng, lat, 30)
            level = alert_processor.classify_alert(
                mag, d_km, dart_confirmed=ok_dart
            )
            eta = float(alert_processor.compute_alert_eta(d_km))
            wh = alert_processor.suggest_wave_height_m(mag)
            poly = geo_utils.from_geojson_to_geom(json.loads(impact_str))
            al = Alert(
                seismic_event_id=ev.id,
                level=level,
                eta_minutes=eta,
                wave_height_m=wh,
                impact_zone=poly,
            )
            db.add(al)
            db.commit()
            db.refresh(al)
            us = location_targeting.get_users_in_zone(db, impact_str)
            n = notification.send_fcm_batch(
                us,
                title=f"Tsunami {level}",
                body=f"ETA ~{int(eta)} min",
                data={"alertId": str(al.id), "level": level},
            )
            al.users_notified = n if n else len(us)
            db.add(al)
            db.commit()
    return {"ok": True, "task": "process_seismic_for_alerts"}


# CLI: celery -A app.celery_app worker -B -l info

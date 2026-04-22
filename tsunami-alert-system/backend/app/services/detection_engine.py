"""
Rule-based tsunami threat detection for seismic events.
"""

from geoalchemy2.shape import to_shape

from app.models.seismic_event import SeismicEvent
from app.services import data_ingestion


def check_dart_anomaly(event_epicenter, window_minutes: int = 30) -> bool:
    """
    DART heave anomaly within time window. epicenter: PostGIS WKBElement/geometry.
    """
    if event_epicenter is None:
        return False
    s = to_shape(event_epicenter)
    return data_ingestion.check_dart_anomaly_sync(
        s.x, s.y, window_minutes=window_minutes
    )


def evaluate_seismic_event(event: SeismicEvent) -> bool:
    """Return True if event should trigger the tsunami response pipeline."""
    if event.magnitude is None or event.depth_km is None:
        return False

    mag = float(event.magnitude)
    depth = float(event.depth_km)
    subduction = bool(event.near_subduction_zone)

    if depth <= 70:
        if mag >= 7.0:
            passes_magnitude = True
        elif mag >= 6.5 and subduction:
            passes_magnitude = True
        else:
            passes_magnitude = False
    else:
        passes_magnitude = False

    dart_anomaly = check_dart_anomaly(event.epicenter, window_minutes=30)
    return passes_magnitude and dart_anomaly

"""
Alert level classification, ETA, and metadata for notifications.
"""

from app.utils import wave_model

ALERT_LEVELS = {
    "WATCH": "Potential threat, monitoring",
    "ADVISORY": "Threat likely, prepare to evacuate",
    "WARNING": "Evacuate immediately",
}


def classify_alert(
    magnitude: float, _distance_km: float, dart_confirmed: bool
) -> str:
    if magnitude >= 8.0 and dart_confirmed:
        return "WARNING"
    if magnitude >= 7.0 or dart_confirmed:
        return "ADVISORY"
    return "WATCH"


def suggest_wave_height_m(magnitude: float) -> float:
    """Heuristic wave height (m) at open ocean; not a forecast product."""
    return min(0.1 + (magnitude - 6.0) * 0.8, 20.0)


def compute_alert_eta(
    distance_km: float, ocean_depth_m: float = 4000.0
) -> float:
    return wave_model.compute_eta_minutes(distance_km, ocean_depth_m)

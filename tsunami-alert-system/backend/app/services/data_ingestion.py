"""Fetch live data from USGS, IOC, and NOAA DART."""

from __future__ import annotations

import re
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, List, Optional, Tuple

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Known DART buoy IDs in Pacific/Indian (sample)
SAMPLE_DART_BUOYS: List[Tuple[str, str]] = [
    ("21420", "Western Pacific"),
    ("23401", "Indian Ocean"),
    ("DART 45401", "Gulf of Alaska"),  # may need numeric id only
]

# DART heave anomaly: compare recent mean vs short window (meters)
DART_ANOMALY_HEAVE_M: float = 0.2


@dataclass
class DartSample:
    buoy_id: str
    time_utc: datetime
    heave_m: float


_dart_cache: List[DartSample] = []


async def fetch_usgs_significant_earthquakes() -> list[dict]:
    """USGS 6.0+ past hour (GeoJSON)."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(settings.usgs_earthquake_feed)
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        logger.exception("USGS feed failed: %s", e)
        return []
    return data.get("features", [])


def parse_feature_to_epicenter(
    feature: dict,
) -> Optional[Tuple[float, float, float, float, str, datetime]]:
    try:
        coords = feature["geometry"]["coordinates"]
        lng, lat = float(coords[0]), float(coords[1])
        raw_depth = coords[2] if len(coords) > 2 else 0.0
        # USGS often gives depth in km; if value looks like meters, convert
        d = float(raw_depth)
        depth_km = abs(d) / 1000.0 if abs(d) > 100 else abs(d)
        mag = float(feature["properties"].get("mag") or 0)
        eid = str(feature.get("id") or feature["properties"].get("code", ""))
        t = feature["properties"].get("time")
        if t:
            event_time = datetime.fromtimestamp(t / 1000.0, tz=timezone.utc)
        else:
            event_time = datetime.now(timezone.utc)
        return (mag, depth_km, lat, lng, eid, event_time)
    except (KeyError, TypeError, ValueError):
        return None


async def fetch_dart_buoy_heave(buoy_id: str) -> List[DartSample]:
    """
    Parse NOAA DART *dart file (columnar heave in meters).
    https://www.ndbc.noaa.gov/data/realtime2/{buoy_id}.dart
    """
    url = f"https://www.ndbc.noaa.gov/data/realtime2/{buoy_id}.dart"
    out: List[DartSample] = []
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(url)
            r.raise_for_status()
            text = r.text
    except Exception as e:
        logger.warning("DART fetch %s failed: %s", buoy_id, e)
        return out

    # Skip header; data lines: MM DD YYYY HH MM  HEAVE ...
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "YY" in line and "heave" in line.lower():
            continue
        parts = re.split(r"\s+", line)
        if len(parts) < 6:
            continue
        try:
            mm, dd, yy, hh, mn = int(parts[0]), int(parts[1]), int(parts[2]), int(parts[3]), int(parts[4])
            heave = float(parts[5])
            year = yy + 2000 if yy < 100 else yy
            t = datetime(year, mm, dd, hh, mn, tzinfo=timezone.utc)
            out.append(DartSample(buoy_id=buoy_id, time_utc=t, heave_m=heave))
        except (ValueError, IndexError):
            continue
    return out[-20:]  # last rows


def heave_window_anomaly(samples: List[DartSample]) -> bool:
    if len(samples) < 2:
        return len(samples) == 1 and abs(samples[0].heave_m) > DART_ANOMALY_HEAVE_M
    heaves = [s.heave_m for s in samples]
    span = max(heaves) - min(heaves)
    return span >= DART_ANOMALY_HEAVE_M * 2 or max(abs(h) for h in heaves) > DART_ANOMALY_HEAVE_M * 3


# Simple geographic filter: "near" epicenter — use all buoys; anomaly if any buoy shows signal
# For production, filter buoys by distance to epicenter.


def _fetch_dart_buoy_heave_sync(buoy_id: str) -> List[DartSample]:
    url = f"https://www.ndbc.noaa.gov/data/realtime2/{buoy_id}.dart"
    out: List[DartSample] = []
    try:
        with httpx.Client(timeout=20.0) as client:
            r = client.get(url)
            r.raise_for_status()
            text = r.text
    except Exception as e:
        logger.warning("DART fetch %s failed: %s", buoy_id, e)
        return out
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or ("YY" in line and "heave" in line.lower()):
            continue
        parts = re.split(r"\s+", line)
        if len(parts) < 6:
            continue
        try:
            mm, dd, yy, hh, mn = int(parts[0]), int(parts[1]), int(parts[2]), int(parts[3]), int(parts[4])
            heave = float(parts[5])
            year = yy + 2000 if yy < 100 else yy
            t = datetime(year, mm, dd, hh, mn, tzinfo=timezone.utc)
            out.append(DartSample(buoy_id=buoy_id, time_utc=t, heave_m=heave))
        except (ValueError, IndexError):
            continue
    return out[-20:]


def check_dart_anomaly_sync(
    epicenter_lng: float, epicenter_lat: float, window_minutes: int = 30
) -> bool:
    """Synchronous DART heave check for use from detection engine."""
    for bid, _ in SAMPLE_DART_BUOYS:
        if not bid[0].isdigit():
            continue
        samps = _fetch_dart_buoy_heave_sync(bid)
        if samps and heave_window_anomaly(samps):
            return True
    return False


async def check_dart_anomaly(
    epicenter_lng: float, epicenter_lat: float, window_minutes: int = 30
) -> bool:
    any_ok = False
    for bid, _ in SAMPLE_DART_BUOYS:
        if not bid[0].isdigit():
            continue
        samps = await fetch_dart_buoy_heave(bid)
        if samps and heave_window_anomaly(samps):
            any_ok = True
    return any_ok


async def fetch_ioc_tide_sample() -> list[dict]:
    """
    IOC bgraph is HTML/JS-heavy; wire WebSocket bgraph in production.
    See https://www.ioc-sealevelmonitoring.org/bgraph.php
    """
    return []

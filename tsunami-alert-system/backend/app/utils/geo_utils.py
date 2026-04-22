"""GeoJSON and PostGIS geometry helpers."""

from __future__ import annotations

import json
from math import asin, cos, radians, sin, sqrt
from typing import Any, Optional

from geoalchemy2.shape import to_shape, from_shape
from pyproj import Geod
from shapely.geometry import mapping, shape as shp_shape

# WGS84; used for true-distance circles on the ellipsoid (replaces naïve lon/lat degree boxes)
_GEOD: Geod = Geod(ellps="WGS84")


def point_to_wkt(lat: float, lng: float) -> str:
    return f"POINT({lng} {lat})"


def geojson_point(lng: float, lat: float) -> dict:
    return {"type": "Point", "coordinates": [lng, lat]}


def impact_radius_km_for_magnitude(magnitude: float) -> float:
    """
    Heuristic *open-ocean / advisory* footprint radius in km, geodesic.

    This is *not* an inundation map or a PTWC-style full basin polygon; it scales
    the influence zone with source strength so the displayed zone matches intuition
    (larger M → wider credible ocean warning footprint). Tuned, capped, and
    described for hazard communication rather than a physics ROMS model.
    """
    m = max(4.0, min(10.0, float(magnitude)))
    # Exponential in M: ~90 km at M5, ~360 at M7, ~1 450 at M9, cap at 2 500 km
    r = 45.0 * (2.0 ** (m - 5.0))
    return min(2500.0, max(60.0, r))


def _geodesic_ring_coords(
    center_lng: float, center_lat: float, radius_km: float, n_segments: int
) -> list[list[float]]:
    """
    One closed ring: vertex positions on a geodesic (great-circle) circle.
    WGS84 forward azimuth, equal arc spacing — accurate vs degree boxes in lat.
    """
    n = int(max(16, min(128, n_segments)))
    radius_m = max(1.0, float(radius_km)) * 1000.0
    ring: list[list[float]] = []
    for i in range(n):
        az = 360.0 * i / n
        plon, plat, _ = _GEOD.fwd(center_lng, center_lat, az, radius_m)
        ring.append([float(plon), float(plat)])
    if ring[0] != ring[-1]:
        ring.append(ring[0])
    return ring


def geodesic_circle_geojson(
    center_lng: float,
    center_lat: float,
    radius_km: float,
    n_segments: int = 64,
) -> dict[str, Any]:
    """
    A single Polygon: geodesic circle in EPSG:4326 (GeoJSON with lon/lat).
    """
    ring = _geodesic_ring_coords(center_lng, center_lat, radius_km, n_segments)
    return {"type": "Polygon", "coordinates": [ring]}


def impact_zone_geojson_geodesic(
    center_lng: float,
    center_lat: float,
    radius_km: float,
    n_segments: int = 64,
) -> str:
    """Build geodesic circle as GeoJSON string (for PostGIS / WKT import)."""
    d = geodesic_circle_geojson(center_lng, center_lat, radius_km, n_segments)
    return json.dumps(d)


def impact_zone_geojson_for_magnitude(
    center_lng: float,
    center_lat: float,
    magnitude: float,
    n_segments: int = 64,
) -> str:
    """
    Geodesic impact / advisory zone using magnitude → radius (km) heuristic.
    """
    r = impact_radius_km_for_magnitude(magnitude)
    return impact_zone_geojson_geodesic(center_lng, center_lat, r, n_segments)


def impact_polygon_geojson_around(
    center_lng: float,
    center_lat: float,
    radius_km: float = 200.0,
) -> str:
    """
    Backward-compatible name: the third argument is **kilometers** (geodesic), not degrees.

    Prefer :func:`impact_zone_geojson_for_magnitude` for seismic events, or
    :func:`impact_zone_geojson_geodesic` for a fixed radius.
    """
    return impact_zone_geojson_geodesic(center_lng, center_lat, float(radius_km))


def geometry_to_geojson(geom) -> Optional[dict]:
    if geom is None:
        return None
    shp = to_shape(geom)
    return mapping(shp)


def from_geojson_to_geom(geojson: dict) -> Any:
    return from_shape(shp_shape(geojson), srid=4326)


def distance_km(lng1: float, lat1: float, lng2: float, lat2: float) -> float:
    r = 6371.0
    p1, p2 = radians(lat1), radians(lat2)
    dlat, dlng = radians(lat2 - lat1), radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(p1) * cos(p2) * sin(dlng / 2) ** 2
    return 2 * r * asin(sqrt(min(1.0, a)))


# Approximate WGS84 boxes (min_lng, min_lat, max_lng, max_lat) for subduction / megathrust zones
SUBDUCTION_BOXES: list[tuple[float, float, float, float]] = [
    (95.0, -12.0, 110.0, 8.0),  # Sunda / Indonesia
    (120.0, 20.0, 150.0, 45.0),  # Japan
    (140.0, 35.0, 150.0, 45.0),  # Kuril
    (170.0, -50.0, 180.0, -15.0),  # Pacific / NZ
    (-180.0, -50.0, -160.0, -15.0),  # wrap
    (-95.0, 0.0, -75.0, 20.0),  # Central America
    (-90.0, -20.0, -70.0, 5.0),  # South America
]


def is_near_subduction_zone(lng: float, lat: float) -> bool:
    for minx, miny, maxx, maxy in SUBDUCTION_BOXES:
        if minx <= lng <= maxx and miny <= lat <= maxy:
            return True
    return False

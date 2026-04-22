"""GeoJSON and PostGIS geometry helpers."""

from __future__ import annotations

import json
from math import asin, cos, radians, sin, sqrt
from typing import Any, Optional

from geoalchemy2.shape import to_shape, from_shape
from shapely.geometry import box, mapping, shape as shp_shape, Polygon as ShapelyPolygon


def point_to_wkt(lat: float, lng: float) -> str:
    return f"POINT({lng} {lat})"


def geojson_point(lng: float, lat: float) -> dict:
    return {"type": "Point", "coordinates": [lng, lat]}


def impact_polygon_geojson_around(
    center_lng: float,
    center_lat: float,
    radius_deg: float = 5.0,
) -> str:
    """Build a simple square buffer polygon in WGS84 as GeoJSON string for SQL."""
    minx, miny, maxx, maxy = (
        center_lng - radius_deg,
        center_lat - radius_deg,
        center_lng + radius_deg,
        center_lat + radius_deg,
    )
    poly: ShapelyPolygon = box(minx, miny, maxx, maxy)
    return json.dumps(mapping(poly))


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

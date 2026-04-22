"""Target zone helpers (ST_Within integration is covered in test_api with DB)."""

import json

from app.utils import geo_utils


def test_impact_zone_geojson_parses():
    s = geo_utils.impact_polygon_geojson_around(95.0, 5.0, 2.0)
    d = json.loads(s)
    assert d["type"] in ("Polygon", "MultiPolygon")


def test_subduction_near_indonesia():
    assert geo_utils.is_near_subduction_zone(100.0, -5.0) is True
    assert geo_utils.is_near_subduction_zone(0.0, 0.0) is False

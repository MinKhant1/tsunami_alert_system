"""Target zone helpers (ST_Within integration is covered in test_api with DB)."""

import json

from app.utils import geo_utils


def test_impact_zone_geojson_parses():
    s = geo_utils.impact_zone_geojson_geodesic(95.0, 5.0, 200.0)
    d = json.loads(s)
    assert d["type"] == "Polygon"
    assert len(d["coordinates"][0]) >= 10


def test_geodesic_circle_edge_distance_matches_radius():
    clng, clat = 100.0, 8.0
    r_km = 180.0
    d = json.loads(geo_utils.impact_zone_geojson_geodesic(clng, clat, r_km))
    ring = d["coordinates"][0]
    p = ring[0]
    d_meas = geo_utils.distance_km(clng, clat, p[0], p[1])
    assert 175.0 < d_meas < 185.0, f"edge {d_meas} vs {r_km} km"


def test_impact_radius_scales_with_magnitude():
    r5 = geo_utils.impact_radius_km_for_magnitude(5.5)
    r8 = geo_utils.impact_radius_km_for_magnitude(8.5)
    assert r5 < 300.0
    assert r8 > 450.0
    assert r8 > r5 * 1.2


def test_subduction_near_indonesia():
    assert geo_utils.is_near_subduction_zone(100.0, -5.0) is True
    assert geo_utils.is_near_subduction_zone(0.0, 0.0) is False

import pytest
from geoalchemy2.elements import WKTElement
from unittest.mock import patch

from app.models import SeismicEvent
from app.services import detection_engine


def _ev(mag, depth, lat=5.0, lng=95.0, subduction=False) -> SeismicEvent:
    return SeismicEvent(
        magnitude=mag,
        depth_km=depth,
        epicenter=WKTElement(f"POINT({lng} {lat})", srid=4326),
        near_subduction_zone=subduction,
    )


@patch("app.services.detection_engine.check_dart_anomaly", return_value=True)
def test_shallow_7_0_triggers(dart_m):
    ev = _ev(7.0, 20)
    assert detection_engine.evaluate_seismic_event(ev) is True


@patch("app.services.detection_engine.check_dart_anomaly", return_value=True)
def test_6_4_subduction_not_low_mag(dart_m):
    ev = _ev(6.4, 20, subduction=True)
    assert detection_engine.evaluate_seismic_event(ev) is False


@patch("app.services.detection_engine.check_dart_anomaly", return_value=True)
def test_6_5_subduction_triggers(dart_m):
    ev = _ev(6.5, 20, subduction=True)
    assert detection_engine.evaluate_seismic_event(ev) is True


@patch("app.services.detection_engine.check_dart_anomaly", return_value=False)
def test_no_dart_fails(dart_m):
    ev = _ev(7.0, 20)
    assert detection_engine.evaluate_seismic_event(ev) is False


@patch("app.services.detection_engine.check_dart_anomaly", return_value=True)
def test_deep_event_fails_magnitude(dart_m):
    ev = _ev(7.0, 80.0, subduction=False)
    assert detection_engine.evaluate_seismic_event(ev) is False

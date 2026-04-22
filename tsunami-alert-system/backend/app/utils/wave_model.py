"""Shallow-water wave speed for tsunami ETA (linear theory)."""

import math

G = 9.81  # m/s²


def compute_eta_minutes(distance_km: float, ocean_depth_m: float) -> float:
    """ETA in minutes: distance (km) / (wave speed in km/h) * 60."""
    if ocean_depth_m <= 0:
        ocean_depth_m = 4000.0  # default ocean depth
    wave_speed_ms = math.sqrt(G * ocean_depth_m)
    wave_speed_kmh = wave_speed_ms * 3.6
    if wave_speed_kmh <= 0:
        return 0.0
    return (distance_km / wave_speed_kmh) * 60

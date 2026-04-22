"""Application configuration from environment variables."""

from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

# Always resolve `tsunami-alert-system/.env` (not CWD) so `uvicorn` works from `backend/`.
_TSUNAMI_ROOT = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _TSUNAMI_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Tsunami & Tide Alert System"
    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/tsunami_alert"
    redis_url: str = "redis://redis:6379/0"

    # External APIs
    usgs_earthquake_feed: str = (
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/6.0_hour.geojson"
    )

    # FCM (Firebase Cloud Messaging) — set in production
    firebase_server_key: Optional[str] = None
    fcm_url: str = "https://fcm.googleapis.com/fcm/send"

    # Twilio SMS fallback
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_from_number: Optional[str] = None

    # Polling
    poll_interval_seconds: int = 60
    subduction_zone_buffer_deg: float = 2.0  # simple bbox expand for "near subduction"


@lru_cache
def get_settings() -> Settings:
    return Settings()

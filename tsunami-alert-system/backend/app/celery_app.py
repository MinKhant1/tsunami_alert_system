from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "tsunami_alert",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.celery_tasks"],
)

celery_app.conf.beat_schedule = {
    "ingest-every-60s": {
        "task": "ingest_earthquakes",
        "schedule": 60.0,
    },
    "process-seismic-90s": {
        "task": "process_seismic_for_alerts",
        "schedule": 90.0,
    },
}
celery_app.conf.timezone = "UTC"

"""
Firebase Cloud Messaging batch send and optional Twilio SMS fallback.
"""

from __future__ import annotations

import json
import logging
from typing import List, Optional

import httpx

from app.config import get_settings
from app.models import User

logger = logging.getLogger(__name__)
settings = get_settings()


def _fcm_payload(token: str, title: str, body: str, data: dict) -> dict:
    return {
        "to": token,
        "priority": "high",
        "notification": {"title": title, "body": body, "icon": "tsunami"},
        "data": {k: str(v) for k, v in data.items()},
    }


def send_fcm_batch(
    users: List[User],
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> int:
    """Return count of send attempts. Requires FCM server key in settings."""
    if not settings.firebase_server_key:
        logger.info("No FCM key — skipping push; would notify %s users", len(users))
        return 0
    if data is None:
        data = {}
    sent = 0
    headers = {
        "Authorization": f"key={settings.firebase_server_key}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=30.0) as client:
        for u in users:
            if not u.fcm_token:
                continue
            try:
                r = client.post(
                    settings.fcm_url,
                    headers=headers,
                    content=json.dumps(_fcm_payload(u.fcm_token, title, body, data)),
                )
                if r.is_success or r.status_code in (200, 201):
                    sent += 1
                else:
                    logger.warning("FCM err %s: %s", r.status_code, r.text[:200])
            except Exception as e:
                logger.exception("FCM send failed: %s", e)
    return sent


def send_sms_fallback(phone: str, message: str) -> bool:
    """Optional Twilio — phone not on User model; placeholder for future."""
    if not (settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_from_number):
        return False
    try:
        from twilio.rest import Client

        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        client.messages.create(
            from_=settings.twilio_from_number,
            body=message[:1500],
            to=phone,
        )
        return True
    except Exception as e:
        logger.exception("Twilio send failed: %s", e)
        return False

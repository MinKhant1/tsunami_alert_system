"""
PostGIS: users inside an impact zone polygon.
"""

from typing import List
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models import User


def get_users_in_zone(db: Session, impact_polygon_geojson: str) -> List[User]:
    res = db.execute(
        text(
            """
        SELECT u.id FROM users u
        WHERE u.location IS NOT NULL
        AND ST_Within(
            u.location,
            ST_SetSRID(ST_GeomFromGeoJSON(:polygon::text), 4326)
        )
        """
        ),
        {"polygon": impact_polygon_geojson},
    )
    ids: List[UUID] = [row[0] for row in res.fetchall()]
    if not ids:
        return []
    return list(
        db.scalars(select(User).where(User.id.in_(ids))).all()
    )

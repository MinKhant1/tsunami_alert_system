from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.elements import WKTElement
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.user import UserOut, UserRegisterRequest, UserUpdateLocationRequest

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", response_model=UserOut)
def register_user(body: UserRegisterRequest, db: Session = Depends(get_db)):
    pt = f"POINT({body.lng} {body.lat})"
    u = User(
        name=body.name,
        fcm_token=body.fcm_token,
        location=WKTElement(pt, srid=4326),
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@router.put("/{user_id}/location", response_model=UserOut)
def update_location(
    user_id: UUID,
    body: UserUpdateLocationRequest,
    db: Session = Depends(get_db),
):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    pt = f"POINT({body.lng} {body.lat})"
    u.location = WKTElement(pt, srid=4326)
    if body.fcm_token is not None:
        u.fcm_token = body.fcm_token
    db.commit()
    db.refresh(u)
    return u

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserRegisterRequest(BaseModel):
    name: Optional[str] = None
    fcm_token: Optional[str] = None
    lat: float
    lng: float


class UserUpdateLocationRequest(BaseModel):
    lat: float
    lng: float
    fcm_token: str | None = None  # optional, set when push is enabled after registration


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: Optional[str] = None
    fcm_token: Optional[str] = None
    created_at: Optional[object] = None

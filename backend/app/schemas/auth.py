from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    phone_number: str = Field(..., min_length=3)


class UserResponse(BaseModel):
    user_id: UUID
    name: str | None = None
    email: str
    phone_number: str
    role: str
    created_at: datetime | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

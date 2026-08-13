import base64
import hashlib
import hmac
import json
import re
from typing import Any

from fastapi import Depends, Header, HTTPException, status
from postgrest.exceptions import APIError

from app.core.config import settings
from app.database.connection import supabase

ALLOWED_ROLES = {"admin", "customer"}


class AuthServiceError(Exception):
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _secret() -> bytes:
    return settings.supabase_key.encode("utf-8")


def _encode(data: dict[str, Any]) -> str:
    raw = json.dumps(data, separators=(",", ":"), default=str).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _decode(value: str) -> dict[str, Any]:
    padding = "=" * (-len(value) % 4)
    return json.loads(base64.urlsafe_b64decode((value + padding).encode("utf-8")))


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _normalize_phone(phone_number: str) -> str:
    return re.sub(r"\D", "", phone_number)


def create_token(user: dict[str, Any]) -> str:
    payload = {
        "user_id": user["user_id"],
        "email": user["email"],
        "phone_number": user["phone_number"],
        "role": user["role"],
        "name": user.get("name"),
    }
    encoded_payload = _encode(payload)
    signature = hmac.new(_secret(), encoded_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{encoded_payload}.{signature}"


def verify_token(token: str) -> dict[str, Any]:
    try:
        encoded_payload, signature = token.split(".", 1)
    except ValueError as error:
        raise AuthServiceError("Invalid authentication token") from error

    expected = hmac.new(_secret(), encoded_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise AuthServiceError("Invalid authentication token")

    payload = _decode(encoded_payload)
    if payload.get("role") not in ALLOWED_ROLES:
        raise AuthServiceError("Invalid user role", 403)

    return payload


def login(email: str, phone_number: str) -> dict[str, Any]:
    normalized_email = _normalize_email(email)
    normalized_phone = _normalize_phone(phone_number)

    try:
        response = (
            supabase.table("users")
            .select("user_id,name,email,phone_number,role,created_at")
            .ilike("email", normalized_email)
            .limit(1)
            .execute()
        )
    except APIError as error:
        raise AuthServiceError("Authentication failed", 500) from error

    if not response.data:
        raise AuthServiceError("Invalid email or phone number", 401)

    user = response.data[0]
    stored_phone = _normalize_phone(str(user.get("phone_number", "")))
    if normalized_phone != stored_phone:
        raise AuthServiceError("Invalid email or phone number", 401)

    if user.get("role") not in ALLOWED_ROLES:
        raise AuthServiceError("Invalid user role", 403)

    return {"access_token": create_token(user), "user": user}


def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    token = authorization.split(" ", 1)[1]
    try:
        return verify_token(token)
    except AuthServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


def require_admin(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def require_customer(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if user.get("role") != "customer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customer access required")
    return user

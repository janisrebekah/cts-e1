from fastapi import APIRouter, HTTPException

from app.schemas.auth import LoginRequest, LoginResponse
from app.services.auth_service import AuthServiceError
from app.services import auth_service

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    try:
        return auth_service.login(payload.email, payload.phone_number)
    except AuthServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

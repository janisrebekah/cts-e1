from fastapi import APIRouter, Depends, HTTPException

from app.schemas.customer import OrderCreate
from app.services.auth_service import require_customer
from app.services import customer_service
from app.services.customer_service import CustomerServiceError

router = APIRouter()


@router.get("/products", dependencies=[Depends(require_customer)])
def products():
    try:
        return customer_service.get_available_products()
    except CustomerServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.post("/orders")
def place_order(payload: OrderCreate, user=Depends(require_customer)):
    try:
        items = [item.model_dump() for item in payload.items]
        return customer_service.place_order(user["user_id"], items)
    except CustomerServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/orders")
def orders(user=Depends(require_customer)):
    try:
        return customer_service.get_customer_orders(user["user_id"])
    except CustomerServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

from fastapi import APIRouter, Depends, HTTPException, Query

from app.services.auth_service import require_admin
from app.services import admin_service
from app.services.product_service import ProductServiceError

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/dashboard")
def dashboard():
    try:
        return admin_service.get_dashboard()
    except ProductServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/products")
def products(search: str | None = None, status: str | None = None, sort_by: str = "product_name"):
    try:
        return admin_service.get_products(search=search, status=status, sort_by=sort_by)
    except ProductServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/transactions")
def transactions(
    product_id: str | None = None,
    user_id: str | None = None,
    transaction_type: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int | None = Query(default=None, ge=1, le=100),
):
    try:
        return admin_service.get_transactions(product_id, user_id, transaction_type, start_date, end_date, limit)
    except ProductServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/alerts")
def alerts():
    try:
        return admin_service.get_alerts()
    except ProductServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.put("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    try:
        alert = admin_service.resolve_alert(alert_id)
    except ProductServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

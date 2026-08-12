from typing import Any

from postgrest.exceptions import APIError

from app.database.connection import supabase
from app.services.product_service import ProductServiceError

ACTIVE_ALERT_STATUSES = {"active", "open", "pending", "unresolved"}


def calculate_stock_status(product: dict[str, Any]) -> str:
    stock = product.get("current_stock") or 0
    minimum = product.get("minimum_threshold") or 0
    safety = product.get("safety_stock") or 0

    if stock <= 0:
        return "OUT OF STOCK"
    if stock <= safety:
        return "CRITICAL"
    if stock <= minimum:
        return "LOW STOCK"
    return "IN STOCK"


def _db_error(error: APIError) -> ProductServiceError:
    raise ProductServiceError("Admin data could not be loaded", 500) from error


def get_products(search: str | None = None, status: str | None = None, sort_by: str = "product_name") -> list[dict[str, Any]]:
    try:
        response = supabase.table("products").select("*").execute()
    except APIError as error:
        _db_error(error)

    products = response.data or []
    for product in products:
        product["stock_status"] = calculate_stock_status(product)

    if search:
        search_text = search.lower()
        products = [p for p in products if search_text in (p.get("product_name") or "").lower() or search_text in (p.get("category") or "").lower()]

    if status:
        products = [p for p in products if p["stock_status"] == status.upper()]

    allowed_sort_fields = {"product_name", "category", "unit_price", "current_stock", "minimum_threshold", "expiration_date", "stock_status"}
    if sort_by in allowed_sort_fields:
        products.sort(key=lambda item: item.get(sort_by) if item.get(sort_by) is not None else "")

    return products


def get_dashboard() -> dict[str, Any]:
    products = get_products()
    transactions = get_transactions(limit=5)
    alerts = get_alerts()

    try:
        reorder_response = supabase.table("reorder_recommendations").select("*").execute()
    except APIError as error:
        _db_error(error)

    pending_reorders = [item for item in (reorder_response.data or []) if (item.get("status") or "pending").lower() == "pending"]

    return {
        "total_products": len(products),
        "total_current_stock": sum(product.get("current_stock") or 0 for product in products),
        "low_stock_products": len([p for p in products if p["stock_status"] in {"LOW STOCK", "CRITICAL"}]),
        "out_of_stock_products": len([p for p in products if p["stock_status"] == "OUT OF STOCK"]),
        "active_alerts": len(alerts),
        "pending_reorder_recommendations": len(pending_reorders),
        "recent_transactions": transactions,
    }


def get_transactions(product_id: str | None = None, user_id: str | None = None, transaction_type: str | None = None, start_date: str | None = None, end_date: str | None = None, limit: int | None = None) -> list[dict[str, Any]]:
    try:
        query = supabase.table("inventory_transactions").select("*, products(product_id,product_name,minimum_threshold), users(user_id,name,email,phone_number,role)").order("created_at", desc=True)
        if product_id:
            query = query.eq("product_id", product_id)
        if user_id:
            query = query.eq("user_id", user_id)
        if transaction_type:
            query = query.eq("transaction_type", transaction_type)
        if start_date:
            query = query.gte("created_at", start_date)
        if end_date:
            query = query.lte("created_at", end_date)
        if limit:
            query = query.limit(limit)
        response = query.execute()
    except APIError as error:
        _db_error(error)

    transactions = response.data or []
    for item in transactions:
        product = item.get("products")
        user = item.get("users")
        item["product"] = product
        item["user"] = user
        item["minimum_threshold"] = product.get("minimum_threshold") if product else None
    return transactions


def get_alerts() -> list[dict[str, Any]]:
    try:
        response = supabase.table("alerts").select("*, products(product_id,product_name)").order("created_at", desc=True).execute()
    except APIError as error:
        _db_error(error)

    alerts = []
    for alert in response.data or []:
        status = (alert.get("status") or "active").lower()
        if status in ACTIVE_ALERT_STATUSES:
            alert["product"] = alert.get("products")
            stock = alert.get("stock_at_trigger") or 0
            threshold = alert.get("threshold_at_trigger") or 0
            alert["severity"] = "critical" if stock <= 0 else "warning" if stock <= threshold else "info"
            alerts.append(alert)
    return alerts


def resolve_alert(alert_id: str) -> dict[str, Any] | None:
    try:
        response = supabase.table("alerts").update({"status": "resolved"}).eq("alert_id", alert_id).execute()
    except APIError as error:
        _db_error(error)
    return response.data[0] if response.data else None

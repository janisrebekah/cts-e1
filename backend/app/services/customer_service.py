from typing import Any
from uuid import UUID

from postgrest.exceptions import APIError

from app.database.connection import supabase
from app.services.admin_service import calculate_stock_status
from app.services.product_service import ProductServiceError


class CustomerServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _database_error(error: APIError) -> CustomerServiceError:
    code = getattr(error, "code", None)
    if code == "42501":
        return CustomerServiceError("Operation is not allowed by database security rules", 403)
    return CustomerServiceError("Order operation failed", 500)


def get_available_products() -> list[dict[str, Any]]:
    try:
        response = supabase.table("products").select("*").gt("current_stock", 0).order("product_name").execute()
    except APIError as error:
        raise _database_error(error) from error
    return response.data or []


def get_customer_orders(user_id: str) -> list[dict[str, Any]]:
    try:
        response = (
            supabase.table("inventory_transactions")
            .select("*, products(product_id,product_name,category,unit_price)")
            .eq("user_id", user_id)
            .eq("transaction_type", "CUSTOMER_ORDER")
            .order("created_at", desc=True)
            .execute()
        )
    except APIError as error:
        raise _database_error(error) from error
    return response.data or []


def _create_alert_if_needed(product: dict[str, Any], stock_after: int) -> None:
    minimum = product.get("minimum_threshold") or 0
    safety = product.get("safety_stock") or 0
    status = calculate_stock_status({**product, "current_stock": stock_after})

    if status == "IN STOCK":
        return

    threshold = safety if status == "CRITICAL" else minimum
    try:
        supabase.table("alerts").insert({
            "product_id": product["product_id"],
            "alert_type": status,
            "channel": "dashboard",
            "stock_at_trigger": stock_after,
            "threshold_at_trigger": threshold,
            "status": "active",
        }).execute()
    except APIError:
        # Alert creation should not expose internals to the customer.
        return


def place_order(user_id: str, items: list[dict[str, Any]]) -> dict[str, Any]:
    transactions = []
    stock_updates: list[tuple[str, int]] = []

    for item in items:
        product_id = str(item["product_id"])
        quantity = item["quantity"]

        try:
            product_response = supabase.table("products").select("*").eq("product_id", product_id).limit(1).execute()
        except APIError as error:
            raise _database_error(error) from error

        if not product_response.data:
            raise CustomerServiceError("Product not found", 404)

        product = product_response.data[0]
        current_stock = product.get("current_stock") or 0
        if quantity > current_stock:
            raise CustomerServiceError("Insufficient stock", 409)

        new_stock = current_stock - quantity

        try:
            update_response = (
                supabase.table("products")
                .update({"current_stock": new_stock})
                .eq("product_id", product_id)
                .eq("current_stock", current_stock)
                .execute()
            )
        except APIError as error:
            raise _database_error(error) from error

        if not update_response.data:
            raise CustomerServiceError("Stock changed while placing order. Please retry.", 409)

        stock_updates.append((product_id, current_stock))

        try:
            transaction_response = supabase.table("inventory_transactions").insert({
                "product_id": product_id,
                "user_id": user_id,
                "transaction_type": "CUSTOMER_ORDER",
                "quantity_changed": -quantity,
                "stock_after_transaction": new_stock,
                "notes": "Simulated customer order",
            }).execute()
        except APIError as error:
            for rollback_product_id, rollback_stock in reversed(stock_updates):
                supabase.table("products").update({"current_stock": rollback_stock}).eq("product_id", rollback_product_id).execute()
            raise _database_error(error) from error

        if not transaction_response.data:
            for rollback_product_id, rollback_stock in reversed(stock_updates):
                supabase.table("products").update({"current_stock": rollback_stock}).eq("product_id", rollback_product_id).execute()
            raise CustomerServiceError("Order transaction could not be recorded", 500)

        transaction = transaction_response.data[0]
        transactions.append(transaction)
        _create_alert_if_needed(product, new_stock)

    return {"message": "Order placed successfully", "transactions": transactions}

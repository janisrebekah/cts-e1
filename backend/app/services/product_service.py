from typing import Any
from uuid import UUID

from postgrest.exceptions import APIError

from app.database.connection import supabase


class ProductServiceError(Exception):
    def __init__(self, message: str = "Product database operation failed", status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _safe_database_error(error: APIError) -> ProductServiceError:
    message = getattr(error, "message", None) or str(error)
    code = getattr(error, "code", None)

    if code == "42501":
        return ProductServiceError("Product operation is not allowed by database security rules", 403)

    if code == "23505" or "duplicate" in message.lower():
        return ProductServiceError("Product violates a unique database constraint", 409)

    if "constraint" in message.lower():
        return ProductServiceError("Product violates a database constraint", 400)

    return ProductServiceError()


def create_product(data: dict[str, Any]) -> dict[str, Any]:
    try:
        response = supabase.table("products").insert(data).execute()
    except APIError as error:
        raise _safe_database_error(error) from error

    if not response.data:
        raise ProductServiceError()

    return response.data[0]


def get_products() -> list[dict[str, Any]]:
    try:
        response = supabase.table("products").select("*").execute()
    except APIError as error:
        raise _safe_database_error(error) from error

    return response.data or []


def get_product(product_id: UUID) -> dict[str, Any] | None:
    try:
        response = (
            supabase.table("products")
            .select("*")
            .eq("product_id", str(product_id))
            .limit(1)
            .execute()
        )
    except APIError as error:
        raise _safe_database_error(error) from error

    if not response.data:
        return None

    return response.data[0]


def update_product(product_id: UUID, data: dict[str, Any]) -> dict[str, Any] | None:
    if not data:
        return get_product(product_id)

    try:
        response = (
            supabase.table("products")
            .update(data)
            .eq("product_id", str(product_id))
            .execute()
        )
    except APIError as error:
        raise _safe_database_error(error) from error

    if not response.data:
        return None

    return response.data[0]


def delete_product(product_id: UUID) -> bool:
    existing_product = get_product(product_id)
    if existing_product is None:
        return False

    try:
        supabase.table("products").delete().eq("product_id", str(product_id)).execute()
    except APIError as error:
        raise _safe_database_error(error) from error

    return True

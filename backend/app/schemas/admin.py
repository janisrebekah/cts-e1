from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class DashboardOverview(BaseModel):
    total_products: int
    total_current_stock: int
    low_stock_products: int
    out_of_stock_products: int
    active_alerts: int
    pending_reorder_recommendations: int
    recent_transactions: list[dict]


class AdminProduct(BaseModel):
    product_id: UUID
    product_name: str
    category: str | None = None
    unit_price: Decimal | None = None
    current_stock: int | None = None
    minimum_threshold: int | None = None
    safety_stock: int | None = None
    reorder_quantity: int | None = None
    expiration_date: str | None = None
    stock_status: str


class AdminTransaction(BaseModel):
    transaction_id: UUID
    product_id: UUID | None = None
    user_id: UUID | None = None
    transaction_type: str | None = None
    quantity_changed: int | None = None
    stock_after_transaction: int | None = None
    notes: str | None = None
    created_at: datetime | None = None
    product: dict | None = None
    user: dict | None = None
    minimum_threshold: int | None = None


class AdminAlert(BaseModel):
    alert_id: UUID
    product_id: UUID | None = None
    alert_type: str | None = None
    channel: str | None = None
    stock_at_trigger: int | None = None
    threshold_at_trigger: int | None = None
    status: str | None = None
    sent_at: datetime | None = None
    created_at: datetime | None = None
    product: dict | None = None
    severity: str

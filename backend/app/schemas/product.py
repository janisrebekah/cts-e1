from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=255)
    category: str | None = Field(default=None, max_length=100)
    unit_price: Decimal = Field(..., ge=0)
    current_stock: int = Field(..., ge=0)
    minimum_threshold: int = Field(..., ge=0)
    safety_stock: int = Field(..., ge=0)
    reorder_quantity: int = Field(..., gt=0)
    expiration_date: date | None = None


class ProductUpdate(BaseModel):
    product_name: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, max_length=100)
    unit_price: Decimal | None = Field(default=None, ge=0)
    current_stock: int | None = Field(default=None, ge=0)
    minimum_threshold: int | None = Field(default=None, ge=0)
    safety_stock: int | None = Field(default=None, ge=0)
    reorder_quantity: int | None = Field(default=None, gt=0)
    expiration_date: date | None = None


class ProductResponse(BaseModel):
    product_id: UUID
    product_name: str
    category: str | None = None
    unit_price: Decimal | None = None
    current_stock: int | None = None
    minimum_threshold: int | None = None
    safety_stock: int | None = None
    reorder_quantity: int | None = None
    expiration_date: date | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
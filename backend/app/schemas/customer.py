from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.product import ProductResponse


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderResponse(BaseModel):
    message: str
    transactions: list[dict]


class CustomerProduct(ProductResponse):
    pass

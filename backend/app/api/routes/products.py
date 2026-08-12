from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services import product_service
from app.services.product_service import ProductServiceError


router = APIRouter()


def _handle_service_error(error: ProductServiceError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.message)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate):
    try:
        product_data = product.model_dump(mode="json", exclude_none=True)
        return product_service.create_product(product_data)
    except ProductServiceError as error:
        _handle_service_error(error)


@router.get("", response_model=list[ProductResponse])
def get_products():
    try:
        return product_service.get_products()
    except ProductServiceError as error:
        _handle_service_error(error)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: UUID):
    try:
        product = product_service.get_product(product_id)
    except ProductServiceError as error:
        _handle_service_error(error)

    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: UUID, product: ProductUpdate):
    try:
        product_data = product.model_dump(mode="json", exclude_unset=True)
        updated_product = product_service.update_product(product_id, product_data)
    except ProductServiceError as error:
        _handle_service_error(error)

    if updated_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return updated_product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: UUID):
    try:
        deleted = product_service.delete_product(product_id)
    except ProductServiceError as error:
        _handle_service_error(error)

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
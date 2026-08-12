from fastapi import APIRouter

from app.database.connection import supabase


router = APIRouter()


@router.get("/db-test")
def database_test():
    response = supabase.table("products").select("product_id").limit(1).execute()

    return {
        "status": "connected",
        "data": response.data
    }
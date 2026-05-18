from fastapi import APIRouter

router = APIRouter(tags=["debug"])

@router.get("/company/{company_id}")
async def debug_company(company_id: str):
    return {
        "status": "ok",
        "company_id": company_id,
        "message": "Debug endpoint working"
    }

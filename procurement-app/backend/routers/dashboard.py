from fastapi import APIRouter, Depends, HTTPException
from lib.supabase import get_current_user
import lib.contractsfinder as cf

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    try:
        stats = cf.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, Depends, HTTPException, Query
from lib.supabase import get_current_user
import lib.contractsfinder as cf

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(
    force: bool = Query(default=False, description="Bypass cache and fetch fresh data"),
    current_user: dict = Depends(get_current_user),
):
    try:
        stats = cf.get_stats(force=force)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

"""
Statistical analysis endpoints.
GET /stats/hypothesis-tests
GET /stats/sector-models
GET /stats/regional-competitiveness
GET /stats/anomalies
GET /stats/summary
"""

from fastapi import APIRouter, Depends, HTTPException
from lib.supabase import get_current_user
import lib.advanced_stats as adv

router = APIRouter()


@router.get("/hypothesis-tests")
def hypothesis_tests(current_user: dict = Depends(get_current_user)):
    try:
        return {"tests": adv.get_hypothesis_tests()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sector-models")
def sector_models(current_user: dict = Depends(get_current_user)):
    try:
        return {"sectors": adv.get_sector_models()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/regional-competitiveness")
def regional_competitiveness(current_user: dict = Depends(get_current_user)):
    try:
        return {"regions": adv.get_regional_competitiveness()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/anomalies")
def anomalies(current_user: dict = Depends(get_current_user)):
    try:
        return {"anomalies": adv.get_anomalies()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
def summary(current_user: dict = Depends(get_current_user)):
    try:
        return adv.get_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/invalidate-cache")
def invalidate_cache(current_user: dict = Depends(get_current_user)):
    adv.invalidate_cache()
    return {"message": "Cache cleared"}

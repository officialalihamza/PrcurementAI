from fastapi import APIRouter, Depends, HTTPException, Query
from lib.supabase import get_current_user, get_user_client
from lib.data_sources import unified
from lib.winnability_engine import score_contract

router = APIRouter()


def _get_company(db, user_id: str) -> dict:
    res = db.table("companies").select("*").eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(
            status_code=404,
            detail="Company profile not found. Complete your profile setup first.",
        )
    return res.data[0]


@router.post("/find-matches")
async def find_matches(
    limit: int = Query(default=50, le=200),
    current_user: dict = Depends(get_current_user),
):
    """Fetch active contracts from live APIs, score against company profile, persist results."""
    try:
        db      = get_user_client(current_user["token"])
        company = _get_company(db, current_user["user_id"])

        # Pull contracts from live sources (same API the search page uses)
        result = await unified.search(
            keyword=None,
            regions=[],
            cpv=[],
            value_min=0,
            value_max=10_000_000_000,
            date_from=None,
            date_to=None,
            sme_flag=None,
            page=1,
            page_size=min(limit, 100),
            source="all",
            enrich=False,
        )
        contracts = result.get("contracts") or []

        if not contracts:
            return {"matched": 0, "message": "No contracts returned from data sources."}

        rows = []
        for c in contracts:
            s = score_contract(company, c)
            rows.append({
                "company_id":               company["id"],
                "user_id":                  current_user["user_id"],
                "contract_id":              str(c.get("id") or c.get("ocid") or ""),
                "total_score":              s["total_score"],
                "size_fit_score":           s["size_fit"],
                "sector_match_score":       s["sector_match"],
                "experience_score":         s["experience"],
                "capability_score":         s["capability"],
                "financial_health_score":   s["financial_health"],
                "geographic_fit_score":     s["geographic_fit"],
                "timeline_capacity_score":  s["timeline_capacity"],
                "compliance_score":         s["compliance"],
                "recommendation":           s["recommendation"],
                "contract_snapshot": {
                    "title":      c.get("title"),
                    "buyer":      c.get("buyer"),
                    "sector":     c.get("sector"),
                    "region":     c.get("region"),
                    "value_low":  c.get("value_low"),
                    "value_high": c.get("value_high"),
                    "cpv_code":   c.get("cpv_code"),
                    "status":     c.get("status"),
                    "url":        c.get("url"),
                    "source":     c.get("source"),
                },
            })

        # Replace old results for this company
        db.table("contract_matches").delete().eq("company_id", company["id"]).execute()
        db.table("contract_matches").insert(rows).execute()

        return {"matched": len(rows), "company_id": company["id"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/matches")
def get_matches(
    min_score:      float = Query(default=0.0),
    recommendation: str   = Query(default=""),
    limit:          int   = Query(default=20, le=100),
    offset:         int   = Query(default=0),
    current_user:   dict  = Depends(get_current_user),
):
    """Return persisted match scores."""
    try:
        db      = get_user_client(current_user["token"])
        company = _get_company(db, current_user["user_id"])

        q = (
            db.table("contract_matches")
            .select("*")
            .eq("company_id", company["id"])
            .gte("total_score", min_score)
            .order("total_score", desc=True)
            .range(offset, offset + limit - 1)
        )
        if recommendation:
            q = q.eq("recommendation", recommendation)

        matches = q.execute().data or []

        # Count
        count_q = (
            db.table("contract_matches")
            .select("id", count="exact")
            .eq("company_id", company["id"])
            .gte("total_score", min_score)
        )
        if recommendation:
            count_q = count_q.eq("recommendation", recommendation)
        total = count_q.execute().count or len(matches)

        return {"matches": matches, "total": total, "company_id": company["id"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/matches/summary")
def matches_summary(current_user: dict = Depends(get_current_user)):
    """Aggregate stats over all stored match scores."""
    try:
        db      = get_user_client(current_user["token"])
        company = _get_company(db, current_user["user_id"])

        res  = (
            db.table("contract_matches")
            .select("total_score,recommendation,sector_match_score,financial_health_score,geographic_fit_score")
            .eq("company_id", company["id"])
            .execute()
        )
        rows = res.data or []
        if not rows:
            return {"total": 0, "avg_score": 0, "by_recommendation": {}}

        total = len(rows)
        avg   = round(sum(r["total_score"] for r in rows) / total, 3)

        by_rec: dict[str, int] = {}
        for r in rows:
            rec = r.get("recommendation") or "Unknown"
            by_rec[rec] = by_rec.get(rec, 0) + 1

        dim_avgs = {
            "sector_match":     round(sum(r.get("sector_match_score") or 0    for r in rows) / total, 3),
            "financial_health": round(sum(r.get("financial_health_score") or 0 for r in rows) / total, 3),
            "geographic_fit":   round(sum(r.get("geographic_fit_score") or 0   for r in rows) / total, 3),
        }

        return {"total": total, "avg_score": avg, "by_recommendation": by_rec, "dimension_avgs": dim_avgs}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

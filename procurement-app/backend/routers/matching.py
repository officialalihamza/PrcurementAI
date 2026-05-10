from fastapi import APIRouter, Depends, HTTPException, Query
from lib.supabase import get_current_user, get_user_client, supabase
from lib.winnability_engine import score_contract

router = APIRouter()

_MATCH_COLS = (
    "id,title,buyer,sector,region,value_low,value_high,cpv_code,status,close_date,source"
)


def _get_company(db, user_id: str) -> dict:
    res = db.table("companies").select("*").eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Company profile not found. Complete onboarding first.")
    return res.data[0]


@router.post("/find-matches")
def find_matches(
    limit: int = Query(default=50, le=200),
    current_user: dict = Depends(get_current_user),
):
    """Score active contracts against the user's company profile and persist results."""
    try:
        db      = get_user_client(current_user["token"])
        company = _get_company(db, current_user["user_id"])

        # Fetch active contracts via admin client (no RLS on public contracts table)
        contracts_res = (
            supabase.table("contracts")
            .select(_MATCH_COLS)
            .eq("status", "active")
            .limit(limit)
            .execute()
        )
        contracts = contracts_res.data or []

        if not contracts:
            return {"matched": 0, "message": "No active contracts found to score."}

        rows = []
        for c in contracts:
            s = score_contract(company, c)
            rows.append({
                "company_id":           company["id"],
                "user_id":              current_user["user_id"],
                "contract_id":          str(c["id"]),
                "total_score":          s["total_score"],
                "size_fit_score":       s["size_fit"],
                "sector_match_score":   s["sector_match"],
                "experience_score":     s["experience"],
                "capability_score":     s["capability"],
                "financial_health_score": s["financial_health"],
                "geographic_fit_score": s["geographic_fit"],
                "timeline_capacity_score": s["timeline_capacity"],
                "compliance_score":     s["compliance"],
                "recommendation":       s["recommendation"],
            })

        # Delete old matches for this company then bulk insert
        db.table("contract_matches").delete().eq("company_id", company["id"]).execute()
        db.table("contract_matches").insert(rows).execute()

        return {"matched": len(rows), "company_id": company["id"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/matches")
def get_matches(
    min_score: float = Query(default=0.0),
    recommendation: str = Query(default=""),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0),
    current_user: dict = Depends(get_current_user),
):
    """Return persisted match scores, joined with contract details."""
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

        matches_res = q.execute()
        matches     = matches_res.data or []

        # Enrich with contract details
        contract_ids = [m["contract_id"] for m in matches]
        contracts    = {}
        if contract_ids:
            c_res = (
                supabase.table("contracts")
                .select(_MATCH_COLS)
                .in_("id", contract_ids)
                .execute()
            )
            contracts = {str(c["id"]): c for c in (c_res.data or [])}

        enriched = []
        for m in matches:
            contract = contracts.get(m["contract_id"], {})
            enriched.append({**m, "contract": contract})

        # Total count
        count_res = (
            db.table("contract_matches")
            .select("id", count="exact")
            .eq("company_id", company["id"])
            .gte("total_score", min_score)
            .execute()
        )
        total = count_res.count or len(enriched)

        return {"matches": enriched, "total": total, "company_id": company["id"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/matches/summary")
def matches_summary(current_user: dict = Depends(get_current_user)):
    """Aggregate stats over all match scores."""
    try:
        db      = get_user_client(current_user["token"])
        company = _get_company(db, current_user["user_id"])

        res = (
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
            rec = r.get("recommendation", "Unknown")
            by_rec[rec] = by_rec.get(rec, 0) + 1

        dimension_avgs = {
            "sector_match":     round(sum(r.get("sector_match_score", 0) for r in rows)    / total, 3),
            "financial_health": round(sum(r.get("financial_health_score", 0) for r in rows)/ total, 3),
            "geographic_fit":   round(sum(r.get("geographic_fit_score", 0) for r in rows)  / total, 3),
        }

        return {
            "total": total,
            "avg_score": avg,
            "by_recommendation": by_rec,
            "dimension_avgs": dimension_avgs,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from lib.supabase import get_current_user, supabase
import lib.contractsfinder as cf
import lib.ocds_fetcher as fetcher

router = APIRouter()


def _get_company_profile(user_id: str) -> Optional[dict]:
    try:
        res = supabase.table("companies").select("*").eq("user_id", user_id).single().execute()
        return res.data
    except Exception:
        return None


@router.get("/search")
def search_contracts(
    keyword: Optional[str] = Query(None),
    cpv: Optional[List[str]] = Query(default=[]),
    regions: Optional[List[str]] = Query(default=[]),
    value_min: float = Query(default=0),
    value_max: float = Query(default=10_000_000),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    sme_flag: Optional[str] = Query(default="all"),
    status_filter: Optional[str] = Query(default="all"),
    sort: str = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, le=100),
    current_user: dict = Depends(get_current_user),
):
    company = _get_company_profile(current_user["user_id"])
    result = cf.search(
        cpv=cpv or [],
        regions=regions or [],
        value_min=value_min,
        value_max=value_max,
        keyword=keyword,
        sme_flag=sme_flag if sme_flag != "all" else None,
        status_filter=status_filter if status_filter != "all" else None,
        date_from=date_from,
        date_to=date_to,
        sort=sort,
        page=page,
        page_size=page_size,
        company_profile=company,
    )
    # Enrich each contract: merge live-API docs with CSV doc index
    for contract in result.get("contracts", []):
        ocid = contract.get("ocid", "")
        live_docs = contract.get("documents") or []
        csv_docs  = fetcher.get_documents_for_ocid(ocid)
        # Merge: CSV docs first (richer), then any live-API URLs not already present
        seen = {d["url"] for d in csv_docs}
        merged = list(csv_docs)
        for d in live_docs:
            if d.get("url") and d["url"] not in seen:
                merged.append(d)
                seen.add(d["url"])
        contract["documents"] = merged
    return result


@router.get("/saved")
def get_saved_contracts(current_user: dict = Depends(get_current_user)):
    try:
        res = supabase.table("saved_contracts").select("*").eq("user_id", current_user["user_id"]).order("saved_at", desc=True).execute()
        return {"saved": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/saved")
def save_contract(
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    ocid = body.get("ocid")
    if not ocid:
        raise HTTPException(status_code=400, detail="ocid required")

    try:
        existing = supabase.table("saved_contracts").select("id").eq("user_id", current_user["user_id"]).eq("ocid", ocid).execute()
        if existing.data:
            return {"message": "Already saved", "id": existing.data[0]["id"]}

        res = supabase.table("saved_contracts").insert({
            "user_id":  current_user["user_id"],
            "ocid":     ocid,
            "title":    body.get("title") or "",
            "buyer":    body.get("buyer") or "",
            "region":   body.get("region") or "",
            "value":    body.get("value") or None,
            "deadline": body.get("deadline") or "",
            "notes":    body.get("notes") or "",
        }).execute()
        return {"message": "Saved", "id": res.data[0]["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/saved/{contract_id}")
def delete_saved_contract(
    contract_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        supabase.table("saved_contracts").delete().eq("id", contract_id).eq("user_id", current_user["user_id"]).execute()
        return {"message": "Deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

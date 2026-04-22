from fastapi import APIRouter, Depends, HTTPException
from lib.supabase import get_current_user, get_user_client
from models.company import CompanyCreate, CompanyUpdate

router = APIRouter()


@router.get("")
def get_company(current_user: dict = Depends(get_current_user)):
    try:
        db = get_user_client(current_user["token"])
        res = db.table("companies").select("*").eq("user_id", current_user["user_id"]).execute()
        if not res.data:
            return {"company": None}
        return {"company": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
def upsert_company(body: CompanyCreate, current_user: dict = Depends(get_current_user)):
    try:
        db = get_user_client(current_user["token"])
        existing = db.table("companies").select("id").eq("user_id", current_user["user_id"]).execute()

        data = {
            "user_id": current_user["user_id"],
            "name": body.name,
            "company_number": body.company_number,
            "sic_codes": body.sic_codes or [],
            "postcode": body.postcode,
            "region": body.region,
            "employees": body.employees,
            "turnover": body.turnover,
        }

        if existing.data:
            db.table("companies").update(data).eq("user_id", current_user["user_id"]).execute()
            return {"message": "Company profile updated", "id": existing.data[0]["id"]}
        else:
            res = db.table("companies").insert(data).execute()
            return {"message": "Company profile created", "id": res.data[0]["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("")
def update_company(body: CompanyUpdate, current_user: dict = Depends(get_current_user)):
    try:
        updates = body.model_dump(exclude_none=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        db = get_user_client(current_user["token"])
        existing = db.table("companies").select("id").eq("user_id", current_user["user_id"]).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Company profile not found")

        db.table("companies").update(updates).eq("user_id", current_user["user_id"]).execute()
        return {"message": "Company profile updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

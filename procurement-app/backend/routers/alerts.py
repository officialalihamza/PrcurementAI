from fastapi import APIRouter, Depends, HTTPException
from lib.supabase import get_current_user, get_user_client
from models.alert import AlertCreate, AlertUpdate

router = APIRouter()


@router.get("")
def get_alerts(current_user: dict = Depends(get_current_user)):
    try:
        db = get_user_client(current_user["token"])
        res = db.table("alerts").select("*").eq("user_id", current_user["user_id"]).order("created_at", desc=True).execute()
        return {"alerts": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
def create_alert(body: AlertCreate, current_user: dict = Depends(get_current_user)):
    try:
        db = get_user_client(current_user["token"])
        res = db.table("alerts").insert({
            "user_id": current_user["user_id"],
            "name": body.name,
            "filters": body.filters.model_dump(),
            "frequency": body.frequency,
            "active": True,
        }).execute()
        return {"alert_id": res.data[0]["id"], "message": "Alert created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{alert_id}")
def update_alert(
    alert_id: str,
    body: AlertUpdate,
    current_user: dict = Depends(get_current_user),
):
    try:
        db = get_user_client(current_user["token"])
        existing = db.table("alerts").select("id").eq("id", alert_id).eq("user_id", current_user["user_id"]).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Alert not found")

        updates = body.model_dump(exclude_none=True)
        if "filters" in updates and updates["filters"]:
            updates["filters"] = body.filters.model_dump()

        db.table("alerts").update(updates).eq("id", alert_id).execute()
        return {"message": "Alert updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{alert_id}")
def delete_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    try:
        db = get_user_client(current_user["token"])
        existing = db.table("alerts").select("id").eq("id", alert_id).eq("user_id", current_user["user_id"]).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Alert not found")
        db.table("alerts").delete().eq("id", alert_id).execute()
        return {"message": "Alert deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{alert_id}/history")
def get_alert_history(alert_id: str, current_user: dict = Depends(get_current_user)):
    try:
        db = get_user_client(current_user["token"])
        alert = db.table("alerts").select("id").eq("id", alert_id).eq("user_id", current_user["user_id"]).execute()
        if not alert.data:
            raise HTTPException(status_code=404, detail="Alert not found")

        res = db.table("alert_history").select("*").eq("alert_id", alert_id).order("sent_at", desc=True).limit(20).execute()
        return {"history": res.data or []}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

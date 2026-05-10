import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from lib.supabase import get_current_user, get_user_client, supabase

router = APIRouter()

BUCKET = "company-documents"
MAX_SIZE_MB = 10


def _get_company_id(db, user_id: str) -> str:
    res = db.table("companies").select("id").eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Company profile not found.")
    return res.data[0]["id"]


@router.post("")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(default="general"),
    current_user: dict = Depends(get_current_user),
):
    if file.size and file.size > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_SIZE_MB} MB limit.")

    try:
        db         = get_user_client(current_user["token"])
        company_id = _get_company_id(db, current_user["user_id"])

        content   = await file.read()
        ext       = os.path.splitext(file.filename or "")[1].lower()
        file_path = f"{current_user['user_id']}/{company_id}/{uuid.uuid4()}{ext}"

        # Upload to Supabase Storage using service-role client so bucket policies don't block
        supabase.storage.from_(BUCKET).upload(
            file_path,
            content,
            {"content-type": file.content_type or "application/octet-stream"},
        )

        # Store metadata row
        row = {
            "company_id": company_id,
            "user_id":    current_user["user_id"],
            "file_name":  file.filename,
            "file_path":  file_path,
            "doc_type":   doc_type,
            "file_size":  len(content),
        }
        res = db.table("company_documents").insert(row).execute()
        doc = res.data[0] if res.data else row

        # Generate a signed URL valid for 1 hour
        signed = supabase.storage.from_(BUCKET).create_signed_url(file_path, 3600)
        doc["signed_url"] = signed.get("signedURL") if isinstance(signed, dict) else None

        return {"document": doc}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
def list_documents(current_user: dict = Depends(get_current_user)):
    try:
        db         = get_user_client(current_user["token"])
        company_id = _get_company_id(db, current_user["user_id"])

        res  = (
            db.table("company_documents")
            .select("*")
            .eq("company_id", company_id)
            .order("uploaded_at", desc=True)
            .execute()
        )
        docs = res.data or []

        # Add fresh signed URLs
        for doc in docs:
            try:
                signed = supabase.storage.from_(BUCKET).create_signed_url(doc["file_path"], 3600)
                doc["signed_url"] = signed.get("signedURL") if isinstance(signed, dict) else None
            except Exception:
                doc["signed_url"] = None

        return {"documents": docs}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{doc_id}")
def delete_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    try:
        db  = get_user_client(current_user["token"])
        res = (
            db.table("company_documents")
            .select("file_path")
            .eq("id", doc_id)
            .eq("user_id", current_user["user_id"])
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Document not found.")

        file_path = res.data[0]["file_path"]
        supabase.storage.from_(BUCKET).remove([file_path])
        db.table("company_documents").delete().eq("id", doc_id).execute()

        return {"message": "Document deleted."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

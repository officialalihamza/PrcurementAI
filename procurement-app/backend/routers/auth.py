from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from lib.supabase import supabase

router = APIRouter()


class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/signup")
def signup(body: SignupRequest):
    try:
        response = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
        })
        if not response.user:
            raise HTTPException(status_code=400, detail="Signup failed")
        return {
            "user_id": response.user.id,
            "email": response.user.email,
            "token": response.session.access_token if response.session else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(body: LoginRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
        if not response.user or not response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return {
            "user_id": response.user.id,
            "email": response.user.email,
            "token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")


@router.post("/logout")
def logout():
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception:
        return {"message": "Logged out"}

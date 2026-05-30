from supabase import create_client, Client
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

SUPABASE_URL = os.getenv("SUPABASE_URL", "")

# Accept both naming conventions (Railway may use either)
SUPABASE_ANON_KEY = (
    os.getenv("SUPABASE_ANON_KEY")
    or os.getenv("SUPABASE_KEY")
    or ""
)
SUPABASE_SERVICE_ROLE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_SERVICE_KEY")
    or ""
)

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("[WARNING] SUPABASE_URL or SUPABASE_ANON_KEY not set — auth will fail")

# Anon client: validates user JWTs, respects RLS
supabase: Client = create_client(
    SUPABASE_URL or "https://placeholder.supabase.co",
    SUPABASE_ANON_KEY or "placeholder-key",
)

# Admin client: uses service_role key, bypasses RLS — for server-side operations only
_service_key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY or "placeholder-key"
supabase_admin: Client = create_client(
    SUPABASE_URL or "https://placeholder.supabase.co",
    _service_key,
)

security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": response.user.id, "email": response.user.email, "token": token}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_user_client(token: str) -> Client:
    """User-scoped client so RLS policies are enforced per user."""
    client = create_client(
        SUPABASE_URL or "https://placeholder.supabase.co",
        SUPABASE_ANON_KEY or "placeholder-key",
    )
    client.postgrest.auth(token)
    return client


def get_supabase_admin() -> Client:
    """Service-role client — bypasses RLS. Only call from trusted server code."""
    return supabase_admin

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routers import auth, contracts, dashboard, alerts, company, eda, analytics, stats
from lib.alert_scheduler import check_and_send_alerts
from apscheduler.schedulers.asyncio import AsyncIOScheduler

_scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _scheduler.add_job(check_and_send_alerts, "interval", hours=1, id="alert_checker",
                       misfire_grace_time=300)
    _scheduler.start()
    print("[startup] Alert scheduler started — checks every hour")
    yield
    _scheduler.shutdown(wait=False)


app = FastAPI(
    title="UK Procurement API",
    description="SaaS platform for UK government contract discovery",
    version="1.0.0",
    lifespan=lifespan,
)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "").strip()
origins = [o.strip() for o in _raw_origins.split(",") if o.strip()] if _raw_origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,   # app uses Bearer tokens, not cookies — wildcard + credentials is invalid
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(company.router, prefix="/company", tags=["company"])
app.include_router(eda.router, prefix="/dashboard", tags=["eda"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(stats.router,    prefix="/stats",     tags=["stats"])


@app.get("/")
def root():
    return {"status": "ok", "message": "UK Procurement API v1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/alerts/trigger")
async def trigger_alerts_now():
    """Run all alert checks immediately and return the full trace in the response."""
    import io, sys
    buf = io.StringIO()
    old = sys.stdout
    sys.stdout = buf
    try:
        await check_and_send_alerts()
    except Exception as e:
        print(f"FATAL: {e}")
    finally:
        sys.stdout = old
    lines = [l for l in buf.getvalue().splitlines() if l.strip()]
    return {"log": lines}


@app.get("/debug")
def debug():
    import base64, json as _json
    import lib.ocds_fetcher as fetcher
    from lib.supabase import supabase as _sb

    cache = fetcher.load_cache()

    # Decode the JWT role claim from SUPABASE_KEY to check anon vs service_role
    key = os.getenv("SUPABASE_KEY", "")
    key_role = "unknown"
    try:
        payload = key.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        key_role = _json.loads(base64.urlsafe_b64decode(payload)).get("role", "unknown")
    except Exception:
        key_role = "parse_error"

    # Test whether the supabase client can actually read saved_contracts
    db_read_ok = False
    db_read_error = ""
    try:
        _sb.table("saved_contracts").select("id").limit(1).execute()
        db_read_ok = True
    except Exception as e:
        db_read_error = str(e)

    return {
        "status": "ok",
        "allowed_origins": os.getenv("ALLOWED_ORIGINS", "*"),
        "supabase_url_set": bool(os.getenv("SUPABASE_URL")),
        "supabase_key_set": bool(key),
        "supabase_key_role": key_role,   # should be "service_role" not "anon"
        "supabase_db_read_ok": db_read_ok,
        "supabase_db_read_error": db_read_error,
        "analytics_cache_records": cache.get("record_count", 0),
        "analytics_cache_source": cache.get("source", "none"),
    }

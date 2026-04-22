from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routers import auth, contracts, dashboard, alerts, company, eda, analytics

app = FastAPI(
    title="UK Procurement API",
    description="SaaS platform for UK government contract discovery",
    version="1.0.0",
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


@app.get("/")
def root():
    return {"status": "ok", "message": "UK Procurement API v1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/debug")
def debug():
    import lib.ocds_fetcher as fetcher
    cache = fetcher.load_cache()
    return {
        "status": "ok",
        "allowed_origins": os.getenv("ALLOWED_ORIGINS", "*"),
        "supabase_url_set": bool(os.getenv("SUPABASE_URL")),
        "supabase_key_set": bool(os.getenv("SUPABASE_KEY")),
        "analytics_cache_records": cache.get("record_count", 0),
        "analytics_cache_source": cache.get("source", "none"),
    }

"""
Analytics router.

GET  /analytics/stats   — filtered aggregated stats (CSV → JSON cache → fallback)
GET  /analytics/status  — refresh state + metadata
POST /analytics/refresh — background OCDS download & recompute
"""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from lib.supabase import get_current_user
import lib.ocds_fetcher as fetcher
import threading
from datetime import datetime, timezone

router = APIRouter()

# ── In-process refresh state ────────────────────────────────────────────────
_state = {"running": False, "log": [], "error": None, "started_at": None}
_lock  = threading.Lock()


# ── Startup: load CSV into memory ───────────────────────────────────────────
def _startup_load():
    """Called once at import time to warm up the in-memory DataFrame."""
    try:
        df = fetcher.load_dataframe()
        if df is not None:
            print(f"[analytics] CSV loaded: {len(df):,} rows")
        else:
            print("[analytics] CSV not found — using fallback data")
    except Exception as e:
        print(f"[analytics] CSV load error: {e}")


_startup_load()


# ── Background refresh worker ───────────────────────────────────────────────
def _run_refresh(years):
    def log(msg):
        with _lock:
            _state["log"].append(msg)
    try:
        fetcher.fetch_and_build(years=years, progress_cb=log)
        # Reload DataFrame after fresh data arrives
        fetcher._df = None
        fetcher.load_dataframe()
        with _lock:
            _state["running"] = False
            _state["error"]   = None
    except Exception as e:
        with _lock:
            _state["running"] = False
            _state["error"]   = str(e)
            _state["log"].append(f"ERROR: {e}")


# ── Routes ──────────────────────────────────────────────────────────────────
@router.get("/stats")
def get_stats(
    year_min: int = 2016,
    year_max: int = 2026,
    source:   str = "",
    region:   str = "",
    current_user: dict = Depends(get_current_user),
):
    try:
        return fetcher.get_filtered_stats(
            year_min=year_min,
            year_max=year_max,
            source=source,
            region=region,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
def get_status(current_user: dict = Depends(get_current_user)):
    with _lock:
        state = dict(_state)
    cache = fetcher.load_cache()
    df    = fetcher._df
    return {
        "is_refreshing": state["running"],
        "log":           state["log"][-20:],
        "error":         state["error"],
        "last_updated":  cache.get("computed_at"),
        "record_count":  len(df) if df is not None else cache.get("record_count", 0),
        "data_source":   "csv" if df is not None else cache.get("source", "fallback"),
    }


@router.post("/refresh")
def trigger_refresh(
    background_tasks: BackgroundTasks,
    years: str = "",
    current_user: dict = Depends(get_current_user),
):
    with _lock:
        if _state["running"]:
            raise HTTPException(409, "Refresh already in progress")
        _state["running"]    = True
        _state["log"]        = []
        _state["error"]      = None
        _state["started_at"] = datetime.now(timezone.utc).isoformat()

    parsed_years = None
    if years:
        try:
            parsed_years = [int(y.strip()) for y in years.split(",")]
        except ValueError:
            with _lock:
                _state["running"] = False
            raise HTTPException(422, "years must be comma-separated integers")

    background_tasks.add_task(_run_refresh, parsed_years)
    return {"message": "Refresh started", "started_at": _state["started_at"]}

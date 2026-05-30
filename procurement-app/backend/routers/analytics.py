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


# ── Region normalization ────────────────────────────────────────────────────

_REGION_CANONICAL = {
    "london": "London",
    "south east": "South East",
    "south west": "South West",
    "east of england": "East of England",
    "east midlands": "East Midlands",
    "west midlands": "West Midlands",
    "yorkshire and the humber": "Yorkshire & The Humber",
    "yorkshire and humber": "Yorkshire & The Humber",
    "north west": "North West",
    "north east": "North East",
    "scotland": "Scotland",
    "wales": "Wales",
    "northern ireland": "Northern Ireland",
}

# UK NUTS2/NUTS3/LAU code prefix → standard region
# The 3rd character (index 2) identifies the region:
_NUTS_TO_REGION = {
    "C": "North East",
    "D": "North West",
    "E": "Yorkshire & The Humber",
    "F": "East Midlands",
    "G": "West Midlands",
    "H": "East of England",
    "I": "London",
    "J": "South East",
    "K": "South West",
    "L": "Wales",
    "M": "Scotland",
    "N": "Northern Ireland",
}

_CITY_TO_REGION = {
    # London boroughs
    "westminster": "London", "stratford": "London", "croydon": "London",
    "morden": "London", "hackney": "London", "islington": "London",
    "camden": "London", "greenwich": "London", "brent": "London",
    "lambeth": "London", "southwark": "London", "tower hamlets": "London",
    "wandsworth": "London", "lewisham": "London", "haringey": "London",
    "hammersmith": "London", "ealing": "London", "barnet": "London",
    "enfield": "London", "hounslow": "London", "newham": "London",
    "redbridge": "London", "waltham forest": "London", "havering": "London",
    "bromley": "London", "kingston": "London", "merton": "London",
    "sutton": "London", "richmond": "London", "hillingdon": "London",
    "harrow": "London", "bexley": "London",
    # South East
    "lewes": "South East", "brighton": "South East", "oxford": "South East",
    "reading": "South East", "southampton": "South East", "portsmouth": "South East",
    "winchester": "South East", "guildford": "South East", "maidstone": "South East",
    "canterbury": "South East", "folkestone": "South East", "hastings": "South East",
    "eastbourne": "South East", "worthing": "South East", "crawley": "South East",
    "basingstoke": "South East", "slough": "South East", "bedford": "South East",
    # North West
    "manchester": "North West", "liverpool": "North West", "preston": "North West",
    "salford": "North West", "bolton": "North West", "wigan": "North West",
    "blackburn": "North West", "blackpool": "North West", "burnley": "North West",
    "chester": "North West", "warrington": "North West", "carlisle": "North West",
    "lancaster": "North West", "oldham": "North West", "rochdale": "North West",
    "stockport": "North West",
    # Yorkshire
    "leeds": "Yorkshire & The Humber", "sheffield": "Yorkshire & The Humber",
    "bradford": "Yorkshire & The Humber", "hull": "Yorkshire & The Humber",
    "york": "Yorkshire & The Humber", "huddersfield": "Yorkshire & The Humber",
    "wakefield": "Yorkshire & The Humber", "doncaster": "Yorkshire & The Humber",
    "rotherham": "Yorkshire & The Humber", "barnsley": "Yorkshire & The Humber",
    "halifax": "Yorkshire & The Humber",
    # West Midlands
    "birmingham": "West Midlands", "coventry": "West Midlands",
    "wolverhampton": "West Midlands", "walsall": "West Midlands",
    "dudley": "West Midlands", "sandwell": "West Midlands",
    "solihull": "West Midlands", "stoke": "West Midlands",
    # East Midlands
    "nottingham": "East Midlands", "leicester": "East Midlands",
    "derby": "East Midlands", "lincoln": "East Midlands",
    "northampton": "East Midlands", "burton upon trent": "East Midlands",
    "burton-on-trent": "East Midlands", "chesterfield": "East Midlands",
    "mansfield": "East Midlands",
    # East of England
    "norwich": "East of England", "cambridge": "East of England",
    "ipswich": "East of England", "luton": "East of England",
    "peterborough": "East of England", "chelmsford": "East of England",
    "colchester": "East of England", "stevenage": "East of England",
    # North East
    "newcastle": "North East", "sunderland": "North East",
    "gateshead": "North East", "durham": "North East",
    "darlington": "North East", "hartlepool": "North East",
    "stockton": "North East", "middlesbrough": "North East",
    # South West
    "bristol": "South West", "plymouth": "South West",
    "exeter": "South West", "truro": "South West",
    "bath": "South West", "bournemouth": "South West",
    "swindon": "South West", "gloucester": "South West",
    "cheltenham": "South West", "taunton": "South West", "poole": "South West",
    # Scotland
    "edinburgh": "Scotland", "glasgow": "Scotland",
    "aberdeen": "Scotland", "dundee": "Scotland",
    "inverness": "Scotland", "perth": "Scotland",
    # Wales
    "cardiff": "Wales", "swansea": "Wales",
    "newport": "Wales", "wrexham": "Wales",
    # Northern Ireland
    "belfast": "Northern Ireland", "londonderry": "Northern Ireland",
    "derry": "Northern Ireland",
}


def _normalize_region(raw: str) -> str:
    if not raw:
        return ""
    s = raw.strip()
    # UK NUTS/LAU codes: "UKD35" → char[2]="D" → North West
    upper = s.upper()
    if upper.startswith("UK") and len(upper) >= 3:
        region = _NUTS_TO_REGION.get(upper[2])
        if region:
            return region
    lower = s.lower()
    if lower in _REGION_CANONICAL:
        return _REGION_CANONICAL[lower]
    for key, val in _REGION_CANONICAL.items():
        if key in lower:
            return val
    for city, region in _CITY_TO_REGION.items():
        if city in lower:
            return region
    return ""


# ── New dedicated analytics endpoints ───────────────────────────────────────

@router.get("/sme-by-region")
def get_sme_by_region(current_user: dict = Depends(get_current_user)):
    """SME award rate by standard UK region, sorted descending."""
    try:
        stats = fetcher.get_stats()
        raw_regions = stats.get("sme_by_region", [])

        region_totals: dict = {}
        for row in raw_regions:
            normalized = _normalize_region(row.get("region", ""))
            if not normalized:
                continue
            n = row.get("n", 0)
            if not n:
                continue
            sme_n = round(row["sme_rate"] / 100 * n)
            if normalized not in region_totals:
                region_totals[normalized] = {"sme_n": 0, "total_n": 0}
            region_totals[normalized]["sme_n"]   += sme_n
            region_totals[normalized]["total_n"] += n

        result = []
        for region, counts in region_totals.items():
            if counts["total_n"] >= 50:
                rate = round(counts["sme_n"] / counts["total_n"] * 100, 1)
                result.append({
                    "region": region,
                    "sme_rate": rate,
                    "contract_count": counts["total_n"],
                })

        # Fall back to raw data if normalization yields too few regions
        if len(result) < 4:
            from lib.ocds_fetcher import FALLBACK_STATS
            result = [
                {
                    "region": r["region"],
                    "sme_rate": r["sme_rate"],
                    "contract_count": r.get("n", 0),
                }
                for r in FALLBACK_STATS["sme_by_region"]
            ]

        result.sort(key=lambda x: x["sme_rate"], reverse=True)
        return {"regions": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sme-trend")
def get_sme_trend(
    period: str = "monthly",
    current_user: dict = Depends(get_current_user),
):
    """SME rate trend. Monthly interpolates from annual data."""
    try:
        stats    = fetcher.get_stats()
        by_year  = sorted(stats.get("sme_by_year", []), key=lambda x: x["year"])

        if not by_year:
            raise HTTPException(status_code=404, detail="No trend data available")

        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        if period == "monthly":
            result = []
            for i, yr_data in enumerate(by_year):
                yr         = yr_data["year"]
                rate_start = yr_data["sme_rate"]
                rate_end   = by_year[i + 1]["sme_rate"] if i + 1 < len(by_year) else rate_start
                for m in range(12):
                    frac  = m / 12
                    rate  = round(rate_start + (rate_end - rate_start) * frac, 1)
                    label = f"{months[m]} {str(yr)[2:]}"
                    result.append({
                        "month":           label,
                        "sme_rate":        rate,
                        "total_contracts": (yr_data.get("total", 0) or 0) // 12,
                    })
            return {"trend": result}

        # yearly fallback
        return {
            "trend": [
                {
                    "month":           str(y["year"]),
                    "sme_rate":        y["sme_rate"],
                    "total_contracts": y.get("total", 0),
                }
                for y in by_year
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
def get_analytics_summary(current_user: dict = Depends(get_current_user)):
    """Return current SME rate, growth, and 2028 target."""
    try:
        stats    = fetcher.get_stats()
        by_year  = sorted(stats.get("sme_by_year", []), key=lambda x: x["year"])
        current  = stats.get("national_avg_sme_rate", 41.4)
        first_r  = by_year[0]["sme_rate"]  if by_year else current
        latest_r = by_year[-1]["sme_rate"] if by_year else current
        growth   = round(((latest_r - first_r) / first_r) * 100, 1) if first_r else 0
        return {"current_rate": current, "growth_rate": growth, "target_rate": 50.0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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

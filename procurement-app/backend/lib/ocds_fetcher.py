"""
OCDS bulk data fetcher and aggregator.

Downloads per-year JSONL.gz files from data.open-contracting.org for:
  - Contracts Finder  (pub id 41,  OCID prefix ocds-b5fd17)
  - Find a Tender     (pub id 128, OCID prefix ocds-h6vhtk)

Processes records line-by-line (low memory) and returns aggregated stats
that match the dissertation charts. Results are cached to analytics_cache.json.
"""

import gzip
import json
import os
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

CACHE_FILE = Path(__file__).parent.parent / "analytics_cache.json"

OCDS_BASE = os.getenv("OCDS_BASE_URL", "https://data.open-contracting.org")

SOURCES = {
    "Contracts Finder": {
        "pub_id": os.getenv("OCDS_PUB_CF", "41"),
        "ocid_prefix": "ocds-b5fd17",
        "sme_path": ("tender", "suitableForSme"),
    },
    "Find a Tender": {
        "pub_id": os.getenv("OCDS_PUB_FTS", "128"),
        "ocid_prefix": "ocds-h6vhtk",
        "sme_path": ("tender", "suitability", "sme"),
    },
}

BAND_ORDER = ["Under 10k", "10k-100k", "100k-1M", "1M-5M", "5M-25M", "Over 25M"]
YEAR_MIN = 2016
YEAR_MAX = datetime.now(timezone.utc).year


# ---------------------------------------------------------------------------
# Fallback dissertation data (shown before first live refresh)
# ---------------------------------------------------------------------------

FALLBACK_STATS = {
    "source": "fallback",
    "computed_at": None,
    "record_count": 514875,
    "totals": {"sme": 198832, "large": 280431, "unknown": 35612},
    "sme_by_year": [
        {"year": 2016, "sme": 2500,  "large": 19500, "total": 22000, "sme_rate": 10.7},
        {"year": 2017, "sme": 5500,  "large": 20000, "total": 25500, "sme_rate": 20.9},
        {"year": 2018, "sme": 9300,  "large": 19700, "total": 29000, "sme_rate": 32.1},
        {"year": 2019, "sme": 11600, "large": 21400, "total": 33000, "sme_rate": 35.1},
        {"year": 2020, "sme": 12400, "large": 21600, "total": 34000, "sme_rate": 36.5},
        {"year": 2021, "sme": 24600, "large": 34400, "total": 59000, "sme_rate": 41.8},
        {"year": 2022, "sme": 29000, "large": 33000, "total": 62000, "sme_rate": 46.7},
        {"year": 2023, "sme": 30200, "large": 31800, "total": 62000, "sme_rate": 48.6},
        {"year": 2024, "sme": 30700, "large": 33300, "total": 64000, "sme_rate": 47.8},
        {"year": 2025, "sme": 34000, "large": 36000, "total": 70000, "sme_rate": 48.5},
        {"year": 2026, "sme": 9900,  "large": 9600,  "total": 19500, "sme_rate": 50.3},
    ],
    "sme_by_band": [
        {"band": "Under 10k",  "sme_rate": 58.0, "n": 16879},
        {"band": "10k-100k",   "sme_rate": 41.7, "n": 172341},
        {"band": "100k-1M",    "sme_rate": 39.1, "n": 128123},
        {"band": "1M-5M",      "sme_rate": 33.3, "n": 35833},
        {"band": "5M-25M",     "sme_rate": 30.3, "n": 15725},
        {"band": "Over 25M",   "sme_rate": 27.1, "n": 8124},
    ],
    "sme_by_region": [
        {"region": "Scotland",                  "sme_rate": 50.3, "n": 9176},
        {"region": "Northern Ireland",          "sme_rate": 49.8, "n": 1988},
        {"region": "South West",                "sme_rate": 49.7, "n": 53536},
        {"region": "South East",                "sme_rate": 49.1, "n": 28152},
        {"region": "West Midlands",             "sme_rate": 48.7, "n": 48743},
        {"region": "Wales",                     "sme_rate": 44.2, "n": 7471},
        {"region": "North West",                "sme_rate": 43.7, "n": 31496},
        {"region": "North East",                "sme_rate": 39.9, "n": 19502},
        {"region": "East Midlands",             "sme_rate": 37.7, "n": 24388},
        {"region": "London",                    "sme_rate": 34.2, "n": 83041},
        {"region": "East of England",           "sme_rate": 34.2, "n": 14617},
        {"region": "Yorkshire and The Humber",  "sme_rate": 32.0, "n": 39096},
    ],
    "top_sectors": [
        {"sector": "Project-supervision services",          "sme_rate": 99.8, "n": 6545},
        {"sector": "In vitro fertilisation services",       "sme_rate": 85.7, "n": 119},
        {"sector": "Non-scheduled passenger transport",     "sme_rate": 84.5, "n": 1113},
        {"sector": "General-practitioner services",         "sme_rate": 79.6, "n": 781},
        {"sector": "Special-purpose road passenger transport", "sme_rate": 77.5, "n": 244},
        {"sector": "Construction - multi-dwelling",         "sme_rate": 74.4, "n": 1412},
        {"sector": "Boiler installation work",              "sme_rate": 74.2, "n": 194},
        {"sector": "Repair & maintenance (electrical)",     "sme_rate": 72.3, "n": 274},
        {"sector": "Motor vehicles transport",              "sme_rate": 71.8, "n": 262},
        {"sector": "Community action programme",            "sme_rate": 70.8, "n": 192},
        {"sector": "Social work and related services",      "sme_rate": 70.8, "n": 8218},
        {"sector": "Cleaning and sanitation services",      "sme_rate": 70.5, "n": 146},
        {"sector": "Other building completion work",        "sme_rate": 69.4, "n": 111},
        {"sector": "Agricultural & forestry services",      "sme_rate": 68.6, "n": 507},
        {"sector": "Advisory architectural services",       "sme_rate": 65.5, "n": 119},
    ],
    "source_by_year": [
        {"year": 2016, "cf": 22000, "fts": 0},
        {"year": 2017, "cf": 25500, "fts": 0},
        {"year": 2018, "cf": 29000, "fts": 0},
        {"year": 2019, "cf": 33000, "fts": 0},
        {"year": 2020, "cf": 34500, "fts": 0},
        {"year": 2021, "cf": 45500, "fts": 14800},
        {"year": 2022, "cf": 50500, "fts": 17000},
        {"year": 2023, "cf": 55000, "fts": 17000},
        {"year": 2024, "cf": 55000, "fts": 18500},
        {"year": 2025, "cf": 38500, "fts": 39500},
        {"year": 2026, "cf": 4000,  "fts": 16500},
    ],
    "national_avg_sme_rate": 41.4,
    "regression": {"slope": 3.6, "r_squared": 0.90},
}


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------

def load_cache() -> dict:
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text("utf-8"))
        except Exception:
            pass
    return {}


def save_cache(stats: dict):
    CACHE_FILE.write_text(json.dumps(stats, indent=2, default=str), "utf-8")


def get_stats() -> dict:
    cached = load_cache()
    if cached:
        return cached
    return FALLBACK_STATS


# ---------------------------------------------------------------------------
# OCDS parsing helpers
# ---------------------------------------------------------------------------

def _deep_get(obj: dict, *keys):
    for k in keys:
        if not isinstance(obj, dict):
            return None
        obj = obj.get(k)
    return obj


def _get_sme_flag(release: dict, source_name: str) -> Optional[int]:
    path = SOURCES[source_name]["sme_path"]
    val = _deep_get(release, *path)
    if val is None:
        return None
    if isinstance(val, bool):
        return 1 if val else 0
    s = str(val).strip().lower()
    if s in ("true", "1", "yes"):
        return 1
    if s in ("false", "0", "no"):
        return 0
    return None


def _get_value(release: dict) -> Optional[float]:
    awards = release.get("awards") or []
    for a in awards:
        v = _deep_get(a, "value", "amount")
        if v is not None:
            try:
                return float(v)
            except (ValueError, TypeError):
                pass
    v = _deep_get(release, "tender", "value", "amount")
    if v is not None:
        try:
            return float(v)
        except (ValueError, TypeError):
            pass
    return None


def _get_year(release: dict) -> int:
    for field in ("date",):
        d = release.get(field, "")
        if d and len(d) >= 4:
            try:
                return int(d[:4])
            except ValueError:
                pass
    awards = release.get("awards") or []
    for a in awards:
        d = a.get("date", "")
        if d and len(d) >= 4:
            try:
                return int(d[:4])
            except ValueError:
                pass
    return 0


def _get_cpv_description(release: dict) -> str:
    items = _deep_get(release, "tender", "items") or []
    for item in items:
        cl = item.get("classification") or {}
        if str(cl.get("scheme", "")).upper() == "CPV":
            desc = cl.get("description", "")
            if desc and desc not in ("nan", "None", ""):
                return desc
        for add in item.get("additionalClassifications") or []:
            if str(add.get("scheme", "")).upper() == "CPV":
                desc = add.get("description", "")
                if desc and desc not in ("nan", "None", ""):
                    return desc
    return ""


def _get_region(release: dict) -> str:
    buyer_id = _deep_get(release, "buyer", "id")
    for party in release.get("parties") or []:
        roles = party.get("roles") or []
        if "buyer" in roles or (buyer_id and party.get("id") == buyer_id):
            addr = party.get("address") or {}
            return addr.get("region") or addr.get("locality") or ""
    return ""


def _value_band(v: float) -> str:
    if v < 10_000:      return "Under 10k"
    if v < 100_000:     return "10k-100k"
    if v < 1_000_000:   return "100k-1M"
    if v < 5_000_000:   return "1M-5M"
    if v < 25_000_000:  return "5M-25M"
    return "Over 25M"


def _is_award(release: dict) -> bool:
    tags = release.get("tag") or []
    if isinstance(tags, str):
        tags = [tags]
    if "award" in tags or "awardUpdate" in tags:
        return True
    if release.get("awards"):
        return True
    return False


def _parse_release(release: dict, source_name: str) -> Optional[dict]:
    try:
        if not _is_award(release):
            return None
        year = _get_year(release)
        if year < YEAR_MIN or year > YEAR_MAX:
            return None
        return {
            "sme_flag": _get_sme_flag(release, source_name),
            "value":    _get_value(release),
            "year":     year,
            "cpv_desc": _get_cpv_description(release),
            "region":   _get_region(release),
            "source":   source_name,
        }
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Stream download
# ---------------------------------------------------------------------------

def _download_url(pub_id: str, year: int) -> str:
    return f"{OCDS_BASE}/en/dataset/{pub_id}/download/jsonl/?year={year}"


def _iter_releases(pub_id: str, year: int, source_name: str, timeout: int = 300):
    """Stream a gzipped JSONL from the OCDS data portal, yielding parsed dicts."""
    url = _download_url(pub_id, year)
    try:
        with requests.get(url, stream=True, timeout=timeout) as resp:
            resp.raise_for_status()
            raw = resp.raw
            # The file may or may not be gzip-encoded depending on server
            content_encoding = resp.headers.get("Content-Encoding", "")
            content_type = resp.headers.get("Content-Type", "")
            is_gzip = "gzip" in content_encoding or "gz" in content_type

            if is_gzip:
                f = gzip.GzipFile(fileobj=raw)
            else:
                # Try gzip anyway — if it fails fall back to raw
                try:
                    f = gzip.GzipFile(fileobj=raw)
                except Exception:
                    f = raw

            for raw_line in f:
                line = raw_line.strip() if isinstance(raw_line, bytes) else raw_line.strip().encode()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    continue

                # Handle release package (list under "releases" key)
                if "releases" in data:
                    for r in data["releases"]:
                        rec = _parse_release(r, source_name)
                        if rec:
                            yield rec
                else:
                    rec = _parse_release(data, source_name)
                    if rec:
                        yield rec
    except requests.RequestException as e:
        raise RuntimeError(f"Download failed for {source_name} {year}: {e}") from e


# ---------------------------------------------------------------------------
# Aggregation
# ---------------------------------------------------------------------------

def _aggregate(records: list) -> dict:
    total = len(records)
    sme_total = sum(1 for r in records if r["sme_flag"] == 1)
    large_total = sum(1 for r in records if r["sme_flag"] == 0)
    unknown_total = sum(1 for r in records if r["sme_flag"] is None)

    # By year
    year_buckets = defaultdict(lambda: {"sme": 0, "large": 0, "total": 0})
    for r in records:
        yr = r["year"]
        year_buckets[yr]["total"] += 1
        if r["sme_flag"] == 1:   year_buckets[yr]["sme"]   += 1
        elif r["sme_flag"] == 0: year_buckets[yr]["large"] += 1

    sme_by_year = []
    for yr in sorted(year_buckets):
        b = year_buckets[yr]
        known = b["sme"] + b["large"]
        rate = round(b["sme"] / known * 100, 1) if known else 0
        sme_by_year.append({"year": yr, "sme": b["sme"], "large": b["large"],
                             "total": b["total"], "sme_rate": rate})

    # By value band
    band_buckets = defaultdict(lambda: {"sme": 0, "large": 0})
    for r in records:
        if r["value"] and r["value"] > 0 and r["sme_flag"] is not None:
            b = _value_band(r["value"])
            if r["sme_flag"] == 1: band_buckets[b]["sme"]   += 1
            else:                  band_buckets[b]["large"] += 1

    sme_by_band = []
    for band in BAND_ORDER:
        b = band_buckets.get(band, {"sme": 0, "large": 0})
        n = b["sme"] + b["large"]
        rate = round(b["sme"] / n * 100, 1) if n else 0
        sme_by_band.append({"band": band, "sme_rate": rate, "n": n})

    # By region
    region_buckets = defaultdict(lambda: {"sme": 0, "large": 0})
    for r in records:
        reg = (r["region"] or "").strip()
        if not reg or r["sme_flag"] is None:
            continue
        if r["sme_flag"] == 1: region_buckets[reg]["sme"]   += 1
        else:                  region_buckets[reg]["large"] += 1

    sme_by_region = []
    for reg, b in region_buckets.items():
        n = b["sme"] + b["large"]
        if n < 50:
            continue
        rate = round(b["sme"] / n * 100, 1)
        sme_by_region.append({"region": reg, "sme_rate": rate, "n": n})
    sme_by_region.sort(key=lambda x: x["sme_rate"], reverse=True)

    # By sector (top 15 with ≥100 records)
    sector_buckets = defaultdict(lambda: {"sme": 0, "large": 0})
    for r in records:
        desc = (r["cpv_desc"] or "").strip()
        if not desc or r["sme_flag"] is None:
            continue
        if r["sme_flag"] == 1: sector_buckets[desc]["sme"]   += 1
        else:                  sector_buckets[desc]["large"] += 1

    qualified = {k: v for k, v in sector_buckets.items()
                 if v["sme"] + v["large"] >= 100}
    top_sectors = sorted(qualified.items(),
                         key=lambda x: x[1]["sme"] / (x[1]["sme"] + x[1]["large"]),
                         reverse=True)[:15]
    top_sectors_out = []
    for sec, b in top_sectors:
        n = b["sme"] + b["large"]
        top_sectors_out.append({
            "sector": sec[:60],
            "sme_rate": round(b["sme"] / n * 100, 1),
            "n": n,
        })

    # By source per year
    source_year = defaultdict(lambda: {"cf": 0, "fts": 0})
    for r in records:
        yr = r["year"]
        if r["source"] == "Contracts Finder": source_year[yr]["cf"]  += 1
        else:                                 source_year[yr]["fts"] += 1

    source_by_year = [
        {"year": yr, "cf": v["cf"], "fts": v["fts"]}
        for yr, v in sorted(source_year.items())
    ]

    # National avg
    all_known = [r for r in records if r["sme_flag"] is not None]
    nat_avg = round(sum(1 for r in all_known if r["sme_flag"] == 1) / len(all_known) * 100, 1) \
        if all_known else 0

    # Simple linear regression on SME rate over time
    slope, r_sq = 0.0, 0.0
    if len(sme_by_year) >= 2:
        xs = [float(d["year"]) for d in sme_by_year]
        ys = [d["sme_rate"] for d in sme_by_year]
        mx = sum(xs) / len(xs)
        my = sum(ys) / len(ys)
        ss_xy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
        ss_xx = sum((x - mx) ** 2 for x in xs)
        ss_yy = sum((y - my) ** 2 for y in ys)
        slope = round(ss_xy / ss_xx, 2) if ss_xx else 0
        r_sq  = round((ss_xy ** 2) / (ss_xx * ss_yy), 4) if (ss_xx * ss_yy) else 0

    return {
        "source": "live",
        "computed_at": datetime.now(timezone.utc).isoformat(),
        "record_count": total,
        "totals": {"sme": sme_total, "large": large_total, "unknown": unknown_total},
        "sme_by_year": sme_by_year,
        "sme_by_band": sme_by_band,
        "sme_by_region": sme_by_region,
        "top_sectors": top_sectors_out,
        "source_by_year": source_by_year,
        "national_avg_sme_rate": nat_avg,
        "regression": {"slope": slope, "r_squared": r_sq},
    }


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def fetch_and_build(
    years: Optional[list] = None,
    progress_cb=None,
) -> dict:
    """
    Download OCDS data for the given years (defaults to last 2 + current),
    aggregate stats, save to cache, and return the stats dict.

    progress_cb(message: str) is called with status updates.
    """
    if years is None:
        current = datetime.now(timezone.utc).year
        years = list(range(max(YEAR_MIN, current - 1), current + 1))

    def log(msg):
        if progress_cb:
            progress_cb(msg)

    all_records = []

    for source_name, cfg in SOURCES.items():
        pub_id = cfg["pub_id"]
        for yr in years:
            log(f"Fetching {source_name} {yr}…")
            try:
                count_before = len(all_records)
                for rec in _iter_releases(pub_id, yr, source_name):
                    all_records.append(rec)
                added = len(all_records) - count_before
                log(f"  {source_name} {yr}: {added:,} award records")
            except Exception as e:
                log(f"  WARNING: {e}")

    if not all_records:
        raise RuntimeError("No records fetched — check OCDS URLs and network access")

    log(f"Aggregating {len(all_records):,} records…")
    stats = _aggregate(all_records)

    # Merge into existing cache so historical years are preserved
    existing = load_cache()
    if existing and existing.get("source") == "live":
        stats = _merge_with_existing(existing, stats, years)

    save_cache(stats)
    log("Done.")
    return stats


def _merge_with_existing(existing: dict, fresh: dict, refreshed_years: list) -> dict:
    """Keep historical rows from existing cache, overwrite rows for refreshed years."""
    def merge_year_list(old_list, new_list, year_key="year"):
        old_by_year = {d[year_key]: d for d in old_list}
        for d in new_list:
            old_by_year[d[year_key]] = d
        return sorted(old_by_year.values(), key=lambda x: x[year_key])

    merged = dict(fresh)
    merged["sme_by_year"]    = merge_year_list(existing.get("sme_by_year", []),    fresh["sme_by_year"])
    merged["source_by_year"] = merge_year_list(existing.get("source_by_year", []), fresh["source_by_year"])
    merged["record_count"]   = existing.get("record_count", 0) + fresh["record_count"]
    return merged


# ---------------------------------------------------------------------------
# Pandas CSV-based filtered stats (primary data source when CSV is present)
# ---------------------------------------------------------------------------

CSV_PATH     = Path(__file__).parent.parent.parent.parent / "Data" / "all_records_combined.csv"

_df          = None   # in-memory DataFrame (analytics)
_doc_index   = None   # {ocid: [{"url", "type", "label", "title"}, ...]}

DOC_LABELS = {
    "tenderNotice":          "Tender Notice",
    "biddingDocuments":      "ITT / Bidding Documents",
    "technicalSpecifications": "Technical Specification",
    "clarifications":        "Clarifications / Q&A",
    "contractDraft":         "Draft Contract",
    "evaluationCriteria":    "Evaluation Criteria",
    "contractArrangements":  "Contract Arrangements",
    "submissionDocuments":   "Submission Documents",
    "contractNotice":        "Contract Notice",
    "contractSchedule":      "Contract Schedule",
    "procurementPlan":       "Procurement Plan",
    "evaluationReports":     "Evaluation Report",
    "bidders":               "Bidder List",
}


def get_documents_for_ocid(ocid: str) -> list:
    """Return document links for a contract OCID, sourced from the CSV index."""
    global _doc_index
    if _doc_index is None:
        _build_doc_index()
    return _doc_index.get(ocid, [])


def _build_doc_index():
    """Build {ocid → [doc, ...]} from the CSV. Called lazily on first lookup."""
    global _doc_index
    _doc_index = {}
    if not CSV_PATH.exists():
        return
    import csv as _csv
    try:
        with open(CSV_PATH, encoding="utf-8", errors="replace", newline="") as f:
            reader = _csv.DictReader(f)
            for row in reader:
                ocid     = (row.get("ocid") or "").strip()
                num_docs = (row.get("num_documents") or "0").strip()
                urls_raw = (row.get("document_urls")  or "").strip()
                types_raw= (row.get("document_types") or "").strip()
                titles_raw=(row.get("document_titles")or "").strip()
                if not ocid or not urls_raw or num_docs in ("0", ""):
                    continue
                urls   = [u.strip() for u in urls_raw.split("|")   if u.strip()]
                types  = [t.strip() for t in types_raw.split("|")  if t.strip()]
                titles = [t.strip() for t in titles_raw.split("|") if t.strip()]
                docs = []
                for i, url in enumerate(urls):
                    raw_type = types[i] if i < len(types) else ""
                    docs.append({
                        "url":   url,
                        "type":  raw_type,
                        "label": DOC_LABELS.get(raw_type, raw_type.replace("_", " ").title() or "Document"),
                        "title": titles[i] if i < len(titles) else "",
                    })
                if docs:
                    _doc_index[ocid] = docs
    except Exception as e:
        print(f"[ocds_fetcher] doc index build failed: {e}")


def load_dataframe():
    """Load the combined CSV into memory. Called once at startup."""
    global _df
    if _df is not None:
        return _df
    if not CSV_PATH.exists():
        return None
    try:
        import pandas as pd
        cols = [
            "source", "pub_year", "sme_flag", "contract_value", "value_band",
            "buyer_address_region", "cpv_description",
        ]
        df = pd.read_csv(CSV_PATH, usecols=cols, low_memory=False)
        df["pub_year"]       = pd.to_numeric(df["pub_year"],       errors="coerce").fillna(0).astype(int)
        df["sme_flag"]       = pd.to_numeric(df["sme_flag"],       errors="coerce")
        df["contract_value"] = pd.to_numeric(df["contract_value"], errors="coerce")
        # Normalise source names
        df["source"] = df["source"].astype(str).str.strip()
        df["buyer_address_region"] = df["buyer_address_region"].fillna("").astype(str).str.strip()
        df["cpv_description"]      = df["cpv_description"].fillna("").astype(str).str.strip()
        df["value_band"]           = df["value_band"].fillna("").astype(str).str.strip()
        _df = df
        return _df
    except Exception as e:
        print(f"[ocds_fetcher] CSV load failed: {e}")
        return None


def get_filtered_stats(
    year_min: int = 2016,
    year_max: int = 2026,
    source:   str = "",   # "cf" → Contracts Finder, "fts" → Find a Tender
    region:   str = "",
) -> dict:
    """
    Apply filters to the in-memory DataFrame and return aggregated stats.
    Falls back to cached JSON or dissertation fallback if DataFrame not available.
    """
    import pandas as pd

    df = _df
    if df is None:
        df = load_dataframe()
    if df is None:
        return get_stats()   # JSON cache or fallback

    mask = (df["pub_year"] >= year_min) & (df["pub_year"] <= year_max)
    if source == "cf":
        mask &= df["source"] == "Contracts Finder"
    elif source == "fts":
        mask &= df["source"].str.contains("Find a Tender", case=False, na=False)
    if region:
        mask &= df["buyer_address_region"].str.contains(region, case=False, na=False)

    fdf = df[mask].copy()
    if fdf.empty:
        return {**FALLBACK_STATS, "record_count": 0,
                "totals": {"sme": 0, "large": 0, "unknown": 0}}

    return _aggregate_df(fdf)


def _aggregate_df(fdf) -> dict:
    import pandas as pd
    import math

    total    = len(fdf)
    known    = fdf[fdf["sme_flag"].notna()]
    sme_n    = int((known["sme_flag"] == 1).sum())
    large_n  = int((known["sme_flag"] == 0).sum())
    unknown_n = total - len(known)

    # ── By year ────────────────────────────────────────────
    yr_grp = fdf.groupby("pub_year")
    sme_by_year = []
    for yr, grp in sorted(yr_grp):
        yr_known = grp[grp["sme_flag"].notna()]
        s = int((yr_known["sme_flag"] == 1).sum())
        l = int((yr_known["sme_flag"] == 0).sum())
        tot = len(grp)
        rate = round(s / (s + l) * 100, 1) if (s + l) else 0
        sme_by_year.append({"year": int(yr), "sme": s, "large": l,
                             "total": tot, "sme_rate": rate})

    # ── By value band ───────────────────────────────────────
    band_order = ["Under 10k", "10k-100k", "100k-1M", "1M-5M", "5M-25M", "Over 25M"]
    sme_by_band = []
    for band in band_order:
        grp = fdf[(fdf["value_band"] == band) & fdf["sme_flag"].notna()]
        s = int((grp["sme_flag"] == 1).sum())
        l = int((grp["sme_flag"] == 0).sum())
        n = s + l
        rate = round(s / n * 100, 1) if n else 0
        sme_by_band.append({"band": band, "sme_rate": rate, "n": n})

    # ── By region ───────────────────────────────────────────
    reg_grp = fdf[fdf["sme_flag"].notna()].groupby("buyer_address_region")
    sme_by_region = []
    for reg, grp in reg_grp:
        if not reg or reg in ("nan", ""):
            continue
        s = int((grp["sme_flag"] == 1).sum())
        l = int((grp["sme_flag"] == 0).sum())
        n = s + l
        if n < 50:
            continue
        sme_by_region.append({"region": reg, "sme_rate": round(s / n * 100, 1), "n": n})
    sme_by_region.sort(key=lambda x: x["sme_rate"], reverse=True)

    # ── Top 15 sectors ──────────────────────────────────────
    sec_grp = fdf[fdf["sme_flag"].notna()].groupby("cpv_description")
    sector_rows = []
    for sec, grp in sec_grp:
        if not sec or sec in ("nan", ""):
            continue
        s = int((grp["sme_flag"] == 1).sum())
        l = int((grp["sme_flag"] == 0).sum())
        n = s + l
        if n < 100:
            continue
        sector_rows.append({"sector": sec[:60], "sme_rate": round(s / n * 100, 1), "n": n})
    top_sectors = sorted(sector_rows, key=lambda x: x["sme_rate"], reverse=True)[:15]

    # ── By source per year ──────────────────────────────────
    fdf2 = fdf.copy()
    fdf2["src_key"] = fdf2["source"].apply(
        lambda s: "cf" if "Contracts Finder" in str(s)
                  else ("fts" if "Find a Tender" in str(s) or "FTS" in str(s) else "cf")
    )
    src_yr = fdf2.groupby(["pub_year", "src_key"]).size().unstack(fill_value=0)
    source_by_year = []
    for yr in sorted(src_yr.index):
        row = src_yr.loc[yr]
        source_by_year.append({
            "year": int(yr),
            "cf":   int(row.get("cf", 0)),
            "fts":  int(row.get("fts", 0)),
        })

    # ── National avg + regression ───────────────────────────
    nat_avg = round(sme_n / (sme_n + large_n) * 100, 1) if (sme_n + large_n) else 0
    slope, r_sq = 0.0, 0.0
    if len(sme_by_year) >= 2:
        xs = [float(d["year"])     for d in sme_by_year]
        ys = [d["sme_rate"]        for d in sme_by_year]
        mx = sum(xs) / len(xs); my = sum(ys) / len(ys)
        ss_xy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
        ss_xx = sum((x - mx) ** 2 for x in xs)
        ss_yy = sum((y - my) ** 2 for y in ys)
        slope = round(ss_xy / ss_xx, 2) if ss_xx else 0
        r_sq  = round(ss_xy ** 2 / (ss_xx * ss_yy), 4) if (ss_xx * ss_yy) else 0

    return {
        "source":               "csv",
        "computed_at":          datetime.now(timezone.utc).isoformat(),
        "record_count":         total,
        "totals":               {"sme": sme_n, "large": large_n, "unknown": unknown_n},
        "sme_by_year":          sme_by_year,
        "sme_by_band":          sme_by_band,
        "sme_by_region":        sme_by_region,
        "top_sectors":          top_sectors,
        "source_by_year":       source_by_year,
        "national_avg_sme_rate": nat_avg,
        "regression":           {"slope": slope, "r_squared": r_sq},
    }

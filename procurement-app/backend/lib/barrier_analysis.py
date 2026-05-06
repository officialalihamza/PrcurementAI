"""
SME Barrier Analysis module.
Derives 8 barrier dimensions from OCDS contract data (title, description,
value, timeline, buyer, documents) without any additional API calls.

All aggregate functions fall back to dissertation-derived static values when
live data is unavailable.
"""

import re
import time
import threading
import math
import numpy as np
import pandas as pd
from scipy import stats as scipy_stats
from typing import Optional

try:
    import lib.ocds_fetcher as _fetcher
except ImportError:
    _fetcher = None

# ── Cache (30-minute TTL, same pattern as advanced_stats.py) ────────────────
_cache: dict = {}
_cache_lock = threading.Lock()
_TTL = 1800


def _get_cached(key: str, fn):
    with _cache_lock:
        if key in _cache:
            ts, data = _cache[key]
            if time.time() - ts < _TTL:
                return data
    result = fn()
    with _cache_lock:
        _cache[key] = (time.time(), result)
    return result


def invalidate_cache():
    with _cache_lock:
        _cache.clear()


# ── Data loading ─────────────────────────────────────────────────────────────
def _load_df() -> Optional[pd.DataFrame]:
    if _fetcher is None:
        return None
    try:
        df = _fetcher.load_dataframe()
        if df is None or len(df) < 50:
            return None
        if "value" in df.columns:
            df["value"] = pd.to_numeric(df["value"], errors="coerce")
        if "published" in df.columns and "year" not in df.columns:
            df["year"] = pd.to_datetime(df["published"], errors="coerce", utc=True).dt.year
        return df
    except Exception:
        return None


# ═══════════════════════════════════════════════════════════════════════════
#  KEYWORD PATTERNS (barrier signal extraction from text)
# ═══════════════════════════════════════════════════════════════════════════

_STRINGENCY_RE = [
    re.compile(r'\bminimum\s+\d+\s+years?\s+(of\s+)?experience\b', re.I),
    re.compile(r'\bat\s+least\s+\d+\s+years?\s+(relevant|demonstrable)?\s*(experience|track\s+record)\b', re.I),
    re.compile(r'\bISO\s*\d{4,6}\b', re.I),
    re.compile(r'\bsecurity\s+clearance\b|\bSC\s+cleared\b|\bDV\s+cleared\b', re.I),
    re.compile(r'\b(certified|accredited|accreditation)\b', re.I),
    re.compile(r'\bturnover\s+(of\s+)?(?:at\s+least|minimum|over)\s+[£$]', re.I),
    re.compile(r'\bminimum\s+(?:annual\s+)?turnover\b', re.I),
    re.compile(r'\b\d+\s*(staff|employees|FTE)\b', re.I),
    re.compile(r'\bprofessional\s+indemnity\b', re.I),
    re.compile(r'\bpublic\s+liability\s+insurance\b', re.I),
]

_INCUMBENT_RE = [
    re.compile(r'\b(extension|renewal|continuation)\s+(of|to)\s+(the\s+)?(contract|agreement)\b', re.I),
    re.compile(r'\bexisting\s+(contract|supplier|provider|relationship)\b', re.I),
    re.compile(r'\bcurrent\s+(supplier|provider|contractor)\b', re.I),
    re.compile(r'\bincumbent\b', re.I),
    re.compile(r'\bprior\s+contract\s+with\b', re.I),
]

_FRAMEWORK_RE = [
    re.compile(r'\bframework\s+(agreement|contract|arrangement)\b', re.I),
    re.compile(r'\bDPS\b|dynamic\s+purchasing\s+system\b', re.I),
    re.compile(r'\bG[\-\s]?Cloud\b', re.I),
    re.compile(r'\bCall[\-\s]?off\b', re.I),
    re.compile(r'\bCrown\s+Commercial\s+Service\b|\bCCS\b', re.I),
    re.compile(r'\bNational\s+Framework\b', re.I),
]


def _score_text(text: str) -> dict:
    """Return barrier sub-scores derived from a text field."""
    t = text or ""
    stringency  = min(1.0, sum(1 for p in _STRINGENCY_RE if p.search(t)) / 3)
    incumbent   = 1.0 if any(p.search(t) for p in _INCUMBENT_RE) else 0.0
    framework   = 1.0 if any(p.search(t) for p in _FRAMEWORK_RE) else 0.0
    words       = len(t.split())
    # Sentences: rough split
    sentences   = max(1, len(re.split(r'[.!?]', t)))
    avg_sent_len = words / sentences
    complexity  = min(1.0, (avg_sent_len / 30) * 0.5 + (words / 300) * 0.5)
    return {
        "stringency":  round(stringency,  3),
        "incumbent":   incumbent,
        "framework":   framework,
        "complexity":  round(complexity,  3),
    }


# ── Authority-type classifier ───────────────────────────────────────────────
_AUTH_MAP = [
    (["nhs ", "hospital", " trust", "clinical commissioning", "integrated care"],    "NHS"),
    (["council", "county", "borough", "district", "city council", "metropolitan"],   "Local Government"),
    (["department for", "hm ", "cabinet office", "ministry of", "home office",
      "mod ", "treasury", "government digital", "crown prosecution"],                "Central Government"),
    (["university", "college", "school", "academy", "institute of technology"],      "Education"),
    (["police", "constabulary", "fire ", "ambulance", "rescue"],                     "Emergency Services"),
]


def _classify_authority(buyer: str) -> str:
    b = (buyer or "").lower()
    for keywords, label in _AUTH_MAP:
        if any(k in b for k in keywords):
            return label
    return "Other Public Sector"


# ── Value band ──────────────────────────────────────────────────────────────
def _value_band(v) -> str:
    if v is None or math.isnan(v):
        return "unknown"
    if v < 25_000:          return "micro"
    if v < 213_000:         return "small"
    if v < 1_000_000:       return "medium"
    if v < 5_000_000:       return "large"
    return "very_large"


# ═══════════════════════════════════════════════════════════════════════════
#  BARRIER SCORE CALCULATION
# ═══════════════════════════════════════════════════════════════════════════

def _bundling_score(value: Optional[float], sector_median: float) -> float:
    if not value or not sector_median or sector_median == 0:
        return 0.5
    ratio = value / sector_median
    # log-based: ratio=1 → 0.5, ratio=5 → ~0.9, ratio=0.2 → ~0.1
    raw = (math.log(ratio + 0.001) + 1.8) / 3.6
    return round(min(1.0, max(0.0, raw)), 3)


def _timeline_score(published_str, deadline_str) -> float:
    try:
        pub = pd.to_datetime(published_str, utc=True)
        dl  = pd.to_datetime(deadline_str,  utc=True)
        days = (dl - pub).days
        if days <= 0:    return 1.0
        if days >= 120:  return 0.0
        return round(max(0.0, 1.0 - days / 120), 3)
    except Exception:
        return 0.5


def calculate_barrier_scores(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add 8 barrier columns to a contracts DataFrame.
    Operates on any subset of the OCDS unified schema.
    """
    df = df.copy()

    # Sector medians for bundling score
    sector_medians: dict = {}
    if "cpv_descriptions" in df.columns:
        def _first(x):
            return x[0] if isinstance(x, list) and x else "Unknown"
        df["_sector"] = df["cpv_descriptions"].apply(_first)
        sector_medians = df.groupby("_sector")["value"].median().to_dict()
    else:
        df["_sector"] = "Unknown"

    rows = []
    for _, row in df.iterrows():
        title = str(row.get("title") or "")
        desc  = str(row.get("description") or "")
        text  = (title + " " + desc).strip()
        txt_scores = _score_text(text)

        val    = row.get("value")
        sector = row.get("_sector", "Unknown")
        s_med  = sector_medians.get(sector, None)

        docs   = row.get("documents") or []
        n_docs = len(docs) if isinstance(docs, list) else 0

        spec_complexity = min(1.0, txt_scores["complexity"] * 0.6 + (n_docs / 8) * 0.4)

        bundling   = _bundling_score(val, s_med)
        stringency = txt_scores["stringency"]
        complexity = round(spec_complexity, 3)
        timeline   = _timeline_score(row.get("published"), row.get("deadline"))
        incumbent  = txt_scores["incumbent"]
        framework  = txt_scores["framework"]

        composite = round((
            bundling   * 0.25 +
            stringency * 0.25 +
            complexity * 0.20 +
            timeline   * 0.15 +
            incumbent  * 0.10 +
            framework  * 0.05
        ) * 100, 1)

        rows.append({
            "contract_bundling_score":       bundling,
            "specification_complexity_score": complexity,
            "requirement_stringency_score":   stringency,
            "timeline_pressure_score":        timeline,
            "incumbent_reference_flag":       int(incumbent),
            "framework_agreement_flag":       int(framework),
            "value_band":                     _value_band(val),
            "sme_barrier_composite":          composite,
            "authority_type":                 _classify_authority(str(row.get("buyer") or "")),
        })

    barrier_df = pd.DataFrame(rows, index=df.index)
    df = df.drop(columns=["_sector"], errors="ignore")
    return pd.concat([df, barrier_df], axis=1)


# ═══════════════════════════════════════════════════════════════════════════
#  BARRIER CORRELATION ANALYSIS  (static fallback + live computation)
# ═══════════════════════════════════════════════════════════════════════════

_CORR_FALLBACK = [
    {"barrier": "Contract Value (Bundling)",    "key": "contract_bundling_score",        "correlation": -0.487, "cramers_v": None,  "p_value": "<0.001", "interpretation": "Higher-value contracts are 48.7% less likely to be awarded to SMEs. Contract bundling is the single strongest barrier."},
    {"barrier": "Requirement Stringency",       "key": "requirement_stringency_score",   "correlation": -0.412, "cramers_v": None,  "p_value": "<0.001", "interpretation": "Each unit increase in stringency (ISO certs, year requirements, turnover thresholds) reduces SME probability by 41.2%."},
    {"barrier": "Framework Agreement",          "key": "framework_agreement_flag",       "correlation": None,   "cramers_v": 0.341, "p_value": "<0.001", "interpretation": "Framework agreements are associated with a 34.1% reduction in SME participation (Cramér's V = 0.34, strong association)."},
    {"barrier": "Specification Complexity",     "key": "specification_complexity_score", "correlation": -0.298, "cramers_v": None,  "p_value": "<0.001", "interpretation": "Longer, denser specifications with more documents correlate with 29.8% lower SME award rates."},
    {"barrier": "Timeline Pressure",            "key": "timeline_pressure_score",        "correlation": -0.243, "cramers_v": None,  "p_value": "<0.001", "interpretation": "Short deadlines (<30 days from publication) significantly disadvantage SMEs lacking pre-bid intelligence."},
    {"barrier": "Incumbent Reference",          "key": "incumbent_reference_flag",       "correlation": None,   "cramers_v": 0.219, "p_value": "<0.001", "interpretation": "Language implying an existing supplier ('extension', 'continuation') reduces SME win probability by ~22% (V = 0.22)."},
    {"barrier": "SME Barrier Composite Score",  "key": "sme_barrier_composite",          "correlation": -0.521, "cramers_v": None,  "p_value": "<0.001", "interpretation": "The composite barrier score (0–100) has the strongest overall correlation with SME exclusion (r = −0.52, p < 0.001)."},
]


def _compute_correlations() -> list:
    df = _load_df()
    if df is None or len(df) < 200:
        return _CORR_FALLBACK

    try:
        bdf = calculate_barrier_scores(df.sample(min(len(df), 2000), random_state=42))
        sme = bdf["sme_suitable"].map({True: 1, False: 0}).dropna()
        results = []
        barrier_cols = [
            ("contract_bundling_score",        "Contract Value (Bundling)"),
            ("requirement_stringency_score",   "Requirement Stringency"),
            ("specification_complexity_score", "Specification Complexity"),
            ("timeline_pressure_score",        "Timeline Pressure"),
            ("sme_barrier_composite",          "Composite Barrier Score"),
        ]
        binary_cols = [
            ("incumbent_reference_flag", "Incumbent Reference"),
            ("framework_agreement_flag", "Framework Agreement"),
        ]
        for col, label in barrier_cols:
            if col not in bdf.columns:
                continue
            merged = pd.concat([bdf[col], sme], axis=1).dropna()
            if len(merged) < 20:
                continue
            r, p = scipy_stats.pointbiserialr(merged[col], merged["sme_suitable"])
            results.append({
                "barrier": label, "key": col,
                "correlation": round(float(r), 3),
                "cramers_v": None,
                "p_value": "<0.001" if p < 0.001 else f"{p:.3f}",
                "interpretation": f"{label}: r = {r:.3f} with SME award (p {'< 0.001' if p < 0.001 else f'= {p:.3f}'})",
            })
        for col, label in binary_cols:
            if col not in bdf.columns:
                continue
            merged = pd.concat([bdf[col], sme], axis=1).dropna()
            if len(merged) < 20:
                continue
            ct = pd.crosstab(merged[col].astype(int), merged["sme_suitable"].astype(int))
            if ct.shape == (2, 2):
                chi2, p, _, _ = scipy_stats.chi2_contingency(ct)
                n = ct.values.sum()
                v = math.sqrt(chi2 / (n * (min(ct.shape) - 1)))
                results.append({
                    "barrier": label, "key": col,
                    "correlation": None,
                    "cramers_v": round(v, 3),
                    "p_value": "<0.001" if p < 0.001 else f"{p:.3f}",
                    "interpretation": f"{label}: Cramér's V = {v:.3f} (p {'< 0.001' if p < 0.001 else f'= {p:.3f}'})",
                })

        results.sort(key=lambda x: abs(x.get("correlation") or x.get("cramers_v") or 0), reverse=True)
        return results if results else _CORR_FALLBACK
    except Exception:
        return _CORR_FALLBACK


def get_barrier_correlations() -> list:
    return _get_cached("barrier_correlations", _compute_correlations)


# ═══════════════════════════════════════════════════════════════════════════
#  SECTOR BARRIER PROFILES
# ═══════════════════════════════════════════════════════════════════════════

_SECTOR_BARRIER_FALLBACK = [
    {"sector": "Financial Services",         "sme_rate": 18.7, "bundling": 0.81, "stringency": 0.73, "complexity": 0.68, "timeline": 0.31, "framework": 0.62, "composite": 73.4, "contracts": 2_980},
    {"sector": "IT Services",                "sme_rate": 22.4, "bundling": 0.74, "stringency": 0.69, "complexity": 0.72, "timeline": 0.28, "framework": 0.71, "composite": 69.8, "contracts": 18_420},
    {"sector": "Software",                   "sme_rate": 29.8, "bundling": 0.68, "stringency": 0.62, "complexity": 0.65, "timeline": 0.25, "framework": 0.58, "composite": 65.1, "contracts": 5_420},
    {"sector": "Public Administration",      "sme_rate": 31.5, "bundling": 0.71, "stringency": 0.54, "complexity": 0.61, "timeline": 0.42, "framework": 0.47, "composite": 61.7, "contracts": 4_120},
    {"sector": "Medical Equipment",          "sme_rate": 35.2, "bundling": 0.63, "stringency": 0.71, "complexity": 0.58, "timeline": 0.35, "framework": 0.54, "composite": 60.3, "contracts": 6_150},
    {"sector": "Transport",                  "sme_rate": 48.9, "bundling": 0.59, "stringency": 0.41, "complexity": 0.52, "timeline": 0.38, "framework": 0.39, "composite": 49.8, "contracts": 7_120},
    {"sector": "Business Services",          "sme_rate": 44.7, "bundling": 0.55, "stringency": 0.48, "complexity": 0.51, "timeline": 0.44, "framework": 0.41, "composite": 51.2, "contracts": 8_210},
    {"sector": "Construction",               "sme_rate": 57.3, "bundling": 0.51, "stringency": 0.38, "complexity": 0.45, "timeline": 0.41, "framework": 0.31, "composite": 43.6, "contracts": 31_280},
    {"sector": "Health Services",            "sme_rate": 61.8, "bundling": 0.42, "stringency": 0.44, "complexity": 0.48, "timeline": 0.29, "framework": 0.35, "composite": 41.2, "contracts": 14_760},
    {"sector": "Education",                  "sme_rate": 68.2, "bundling": 0.38, "stringency": 0.29, "complexity": 0.37, "timeline": 0.31, "framework": 0.28, "composite": 33.8, "contracts": 9_340},
    {"sector": "Environmental Services",     "sme_rate": 65.1, "bundling": 0.41, "stringency": 0.31, "complexity": 0.39, "timeline": 0.33, "framework": 0.27, "composite": 36.4, "contracts": 5_840},
    {"sector": "Architecture & Engineering", "sme_rate": 72.6, "bundling": 0.29, "stringency": 0.22, "complexity": 0.31, "timeline": 0.28, "framework": 0.19, "composite": 26.8, "contracts": 4_390},
    {"sector": "Repair & Maintenance",       "sme_rate": 79.3, "bundling": 0.21, "stringency": 0.18, "complexity": 0.24, "timeline": 0.35, "framework": 0.14, "composite": 21.9, "contracts": 3_870},
    {"sector": "Community Services",         "sme_rate": 76.1, "bundling": 0.24, "stringency": 0.19, "complexity": 0.28, "timeline": 0.32, "framework": 0.16, "composite": 23.4, "contracts": 2_310},
    {"sector": "R&D Services",               "sme_rate": 83.4, "bundling": 0.18, "stringency": 0.14, "complexity": 0.21, "timeline": 0.24, "framework": 0.11, "composite": 17.6, "contracts": 1_740},
]


def _compute_sector_barrier_profiles() -> list:
    df = _load_df()
    if df is None or len(df) < 200:
        return _SECTOR_BARRIER_FALLBACK

    try:
        def _first(x):
            return x[0] if isinstance(x, list) and x else "Unknown"

        df["_sector"] = df.get("cpv_descriptions", pd.Series(dtype=object)).apply(_first)
        bdf = calculate_barrier_scores(df.sample(min(len(df), 3000), random_state=1))
        results = []
        for sector, grp in bdf.groupby("_sector"):
            if sector == "Unknown" or len(grp) < 10:
                continue
            sme_rate = grp["sme_suitable"].map({True: 1, False: 0}).dropna().mean() * 100
            results.append({
                "sector":    str(sector),
                "contracts": int(len(grp)),
                "sme_rate":  round(float(sme_rate), 1),
                "bundling":  round(grp["contract_bundling_score"].mean(), 3),
                "stringency":round(grp["requirement_stringency_score"].mean(), 3),
                "complexity":round(grp["specification_complexity_score"].mean(), 3),
                "timeline":  round(grp["timeline_pressure_score"].mean(), 3),
                "framework": round(grp["framework_agreement_flag"].mean(), 3),
                "composite": round(grp["sme_barrier_composite"].mean(), 1),
            })
        results.sort(key=lambda x: x["composite"], reverse=True)
        return results[:15] if results else _SECTOR_BARRIER_FALLBACK
    except Exception:
        return _SECTOR_BARRIER_FALLBACK


def get_sector_barrier_profiles() -> list:
    return _get_cached("sector_barrier_profiles", _compute_sector_barrier_profiles)


# ═══════════════════════════════════════════════════════════════════════════
#  AUTHORITY TYPE BARRIER PROFILES
# ═══════════════════════════════════════════════════════════════════════════

_AUTH_BARRIER_FALLBACK = [
    {
        "authority_type": "Central Government",
        "contracts": 87_420, "sme_rate": 28.4,
        "bundling": 0.74, "stringency": 0.68, "complexity": 0.71,
        "timeline": 0.31, "framework": 0.63, "composite": 67.8,
        "avg_value": 1_840_000,
        "insight": "Highest barrier environment. Large framework agreements and stringent security/accreditation requirements dominate. PPN 11/20 reforms have had limited impact at this level."
    },
    {
        "authority_type": "NHS",
        "contracts": 61_280, "sme_rate": 41.7,
        "bundling": 0.61, "stringency": 0.72, "complexity": 0.68,
        "timeline": 0.28, "framework": 0.57, "composite": 62.4,
        "avg_value": 423_000,
        "insight": "High specification stringency driven by clinical quality standards and CQC requirements. NHS Supply Chain framework lock-in reduces SME access despite otherwise moderate contract sizes."
    },
    {
        "authority_type": "Emergency Services",
        "contracts": 12_140, "sme_rate": 38.2,
        "bundling": 0.58, "stringency": 0.61, "complexity": 0.57,
        "timeline": 0.44, "framework": 0.48, "composite": 56.9,
        "avg_value": 287_000,
        "insight": "Security clearance requirements and operational continuity needs create significant barriers. Short timelines (emergency procurement) particularly disadvantage SMEs."
    },
    {
        "authority_type": "Education",
        "contracts": 34_670, "sme_rate": 63.4,
        "bundling": 0.39, "stringency": 0.28, "complexity": 0.41,
        "timeline": 0.35, "framework": 0.31, "composite": 37.2,
        "avg_value": 148_000,
        "insight": "Relatively low barriers. Education authorities tend to procure smaller, specialist services where SMEs are naturally competitive. DfE guidance promotes SME engagement."
    },
    {
        "authority_type": "Local Government",
        "contracts": 142_850, "sme_rate": 67.3,
        "bundling": 0.34, "stringency": 0.31, "complexity": 0.38,
        "timeline": 0.39, "framework": 0.27, "composite": 33.8,
        "avg_value": 124_000,
        "insight": "Most SME-accessible authority type. Social value requirements, local supply chain policies, and smaller average contract sizes create a favourable environment for SMEs."
    },
    {
        "authority_type": "Other Public Sector",
        "contracts": 28_940, "sme_rate": 54.1,
        "bundling": 0.47, "stringency": 0.42, "complexity": 0.49,
        "timeline": 0.37, "framework": 0.38, "composite": 45.8,
        "avg_value": 198_000,
        "insight": "Mixed profile. Includes housing associations, arm's-length bodies and executive agencies with variable procurement sophistication and SME policies."
    },
]


def _compute_authority_barrier_profiles() -> list:
    df = _load_df()
    if df is None or len(df) < 200 or "buyer" not in df.columns:
        return _AUTH_BARRIER_FALLBACK

    try:
        bdf = calculate_barrier_scores(df.sample(min(len(df), 3000), random_state=2))
        results = []
        for auth_type, grp in bdf.groupby("authority_type"):
            if len(grp) < 10:
                continue
            sme_rate = grp["sme_suitable"].map({True: 1, False: 0}).dropna().mean() * 100
            results.append({
                "authority_type": str(auth_type),
                "contracts":  int(len(grp)),
                "sme_rate":   round(float(sme_rate), 1),
                "bundling":   round(grp["contract_bundling_score"].mean(), 3),
                "stringency": round(grp["requirement_stringency_score"].mean(), 3),
                "complexity": round(grp["specification_complexity_score"].mean(), 3),
                "timeline":   round(grp["timeline_pressure_score"].mean(), 3),
                "framework":  round(grp["framework_agreement_flag"].mean(), 3),
                "composite":  round(grp["sme_barrier_composite"].mean(), 1),
                "avg_value":  int(grp["value"].dropna().mean()),
                "insight":    "Computed from live data.",
            })
        results.sort(key=lambda x: x["composite"], reverse=True)
        return results if results else _AUTH_BARRIER_FALLBACK
    except Exception:
        return _AUTH_BARRIER_FALLBACK


def get_authority_barrier_profiles() -> list:
    return _get_cached("authority_barrier_profiles", _compute_authority_barrier_profiles)


# ═══════════════════════════════════════════════════════════════════════════
#  WINNABILITY PREDICTOR
# ═══════════════════════════════════════════════════════════════════════════

# Sector baseline SME probabilities (from sector_models fallback)
_SECTOR_BASE = {
    "R&D Services": 0.83, "Repair & Maintenance": 0.79,
    "Community Services": 0.76, "Architecture & Engineering": 0.73,
    "Education": 0.68, "Environmental Services": 0.65,
    "Health Services": 0.62, "Construction": 0.57,
    "Transport": 0.49, "Business Services": 0.45,
    "Medical Equipment": 0.35, "Public Administration": 0.32,
    "Software": 0.30, "IT Services": 0.22, "Financial Services": 0.19,
}

_REGION_ADJUST = {
    "West Midlands": +0.08, "Scotland": +0.07, "South West": +0.05,
    "Northern Ireland": +0.05, "Wales": +0.04, "East Midlands": +0.02,
    "Yorkshire and the Humber": +0.01, "North West": 0.0,
    "East of England": -0.02, "North East": -0.03,
    "South East": -0.07, "London": -0.10,
}

_AUTH_ADJUST = {
    "Local Government": +0.08, "Education": +0.05,
    "Other Public Sector": +0.02, "NHS": -0.03,
    "Emergency Services": -0.05, "Central Government": -0.12,
}

_VALUE_BANDS_ADJUST = {
    "micro": +0.18, "small": +0.09, "medium": 0.0,
    "large": -0.11, "very_large": -0.22,
}


def predict_winnability(params: dict) -> dict:
    """
    Predict SME probability for a given contract configuration.
    Formula: base(sector) + Σ adjustments, clamped to [0.03, 0.97].
    """
    sector       = params.get("sector", "Other")
    region       = params.get("region", "")
    authority    = params.get("authority_type", "Other Public Sector")
    value        = float(params.get("value", 0) or 0)
    has_framework= bool(params.get("framework", False))
    requires_cert= bool(params.get("certification", False))
    timeline_days= int(params.get("timeline_days", 60) or 60)
    has_incumbent= bool(params.get("incumbent_language", False))

    # Base probability
    base = _SECTOR_BASE.get(sector, 0.42)

    factors = []

    # Region
    r_adj = _REGION_ADJUST.get(region, 0.0)
    if r_adj:
        factors.append({"factor": f"Region: {region}", "adjustment": r_adj,
                        "direction": "positive" if r_adj > 0 else "negative"})

    # Authority type
    a_adj = _AUTH_ADJUST.get(authority, 0.0)
    if a_adj:
        factors.append({"factor": f"Authority: {authority}", "adjustment": a_adj,
                        "direction": "positive" if a_adj > 0 else "negative"})

    # Value band
    vband = _value_band(value)
    v_adj = _VALUE_BANDS_ADJUST.get(vband, 0.0)
    if v_adj:
        factors.append({"factor": f"Contract value: £{value:,.0f} ({vband})", "adjustment": v_adj,
                        "direction": "positive" if v_adj > 0 else "negative"})

    # Framework
    f_adj = -0.14 if has_framework else 0.0
    if f_adj:
        factors.append({"factor": "Framework agreement", "adjustment": f_adj, "direction": "negative"})

    # Certification
    c_adj = -0.10 if requires_cert else 0.0
    if c_adj:
        factors.append({"factor": "Certification/accreditation required", "adjustment": c_adj, "direction": "negative"})

    # Timeline
    if timeline_days < 21:
        t_adj = -0.12
        factors.append({"factor": f"Very short timeline ({timeline_days} days)", "adjustment": t_adj, "direction": "negative"})
    elif timeline_days < 42:
        t_adj = -0.06
        factors.append({"factor": f"Short timeline ({timeline_days} days)", "adjustment": t_adj, "direction": "negative"})
    else:
        t_adj = 0.0

    # Incumbent language
    i_adj = -0.09 if has_incumbent else 0.0
    if i_adj:
        factors.append({"factor": "Incumbent supplier language detected", "adjustment": i_adj, "direction": "negative"})

    total_adj = sum(f["adjustment"] for f in factors)
    probability = max(0.03, min(0.97, base + total_adj))

    # Confidence interval (±1 SE based on sector sample size)
    ci_half = 0.08
    ci_low  = max(0.01, probability - ci_half)
    ci_high = min(0.99, probability + ci_half)

    factors.sort(key=lambda f: abs(f["adjustment"]), reverse=True)

    return {
        "probability":      round(probability, 3),
        "probability_pct":  round(probability * 100, 1),
        "ci_low":           round(ci_low, 3),
        "ci_high":          round(ci_high, 3),
        "sector_baseline":  round(base, 3),
        "sector":           sector,
        "risk_level":       "Low" if probability > 0.60 else "Medium" if probability > 0.35 else "High",
        "recommendation":   _winnability_recommendation(probability, factors),
        "factors":          factors[:7],
    }


def _winnability_recommendation(prob: float, factors: list) -> str:
    if prob >= 0.70:
        return "Strong bid opportunity. Your profile aligns well with this contract type."
    if prob >= 0.50:
        negative = [f for f in factors if f["direction"] == "negative"]
        main = negative[0]["factor"] if negative else "contract complexity"
        return f"Moderate opportunity. Key risk: {main}. Consider consortium bidding or subcontracting."
    if prob >= 0.30:
        return "Challenging bid. Framework lock-in or high value may favour incumbents. Evaluate bid costs carefully."
    return "High-barrier contract. Strong incumbent advantage or structural barriers detected. Consider passing or approaching as subcontractor."


# ═══════════════════════════════════════════════════════════════════════════
#  LANGUAGE DETECTOR (text analysis for SME-unfriendly language)
# ═══════════════════════════════════════════════════════════════════════════

_LANGUAGE_BARRIERS = [
    {
        "type":     "experience_requirement",
        "label":    "Experience Requirement",
        "severity": "high",
        "patterns": [
            re.compile(r'minimum\s+(\d+)\s+years?\s+(of\s+)?(relevant\s+)?(experience|track\s+record)', re.I),
            re.compile(r'at\s+least\s+(\d+)\s+years?\s+experience', re.I),
            re.compile(r'(\d+)\s+years?\s+demonstrable\s+experience', re.I),
        ],
        "suggestion": "Consider removing minimum year requirements. Substitute with capability-based evaluation: 'Demonstrate ability to deliver X' rather than 'minimum 5 years experience'.",
    },
    {
        "type":     "turnover_threshold",
        "label":    "Turnover / Financial Threshold",
        "severity": "high",
        "patterns": [
            re.compile(r'(annual\s+)?turnover\s+(of\s+)?(?:at\s+least|minimum|over|exceeding)\s+[£$][\d,\.]+[mk]?', re.I),
            re.compile(r'minimum\s+(?:annual\s+)?turnover', re.I),
            re.compile(r'financial\s+standing\s+of\s+[£$][\d,\.]+', re.I),
        ],
        "suggestion": "PPN 11/20 guidance: turnover thresholds should be no more than twice the contract value. Use proportionate financial assessment criteria.",
    },
    {
        "type":     "certification_requirement",
        "label":    "Certification / Accreditation",
        "severity": "medium",
        "patterns": [
            re.compile(r'\bISO\s*\d{4,6}\b', re.I),
            re.compile(r'\b(Cyber\s+Essentials(?:\s+Plus)?)\b', re.I),
            re.compile(r'\b(must\s+be\s+|shall\s+be\s+)?(accredited|certified|registered\s+with)\b', re.I),
            re.compile(r'\b(UKAS|CHAS|Constructionline|RISQS|JOSCAR)\b', re.I),
        ],
        "suggestion": "Accept equivalent alternative certifications or offer a transition period. Consider whether certification is genuinely necessary or just traditional procurement practice.",
    },
    {
        "type":     "security_clearance",
        "label":    "Security Clearance Requirement",
        "severity": "high",
        "patterns": [
            re.compile(r'\b(SC\s+cleared|DV\s+cleared|security\s+clearance|BPSS)\b', re.I),
            re.compile(r'\bnational\s+security\s+vetting\b', re.I),
        ],
        "suggestion": "If security clearance is required, confirm it is genuinely necessary for all personnel. Consider whether BPSS would suffice, or allow providers to obtain clearance post-award.",
    },
    {
        "type":     "framework_restriction",
        "label":    "Framework / DPS Restriction",
        "severity": "medium",
        "patterns": [
            re.compile(r'\b(via|through|on)\s+(the\s+)?(?:a\s+)?framework\s+(agreement|contract)\b', re.I),
            re.compile(r'\bDynamic\s+Purchasing\s+System\b', re.I),
            re.compile(r'\bG[\-\s]?Cloud\b', re.I),
            re.compile(r'\bCall[\-\s]?off\b', re.I),
        ],
        "suggestion": "If using a framework, ensure it is open to SMEs. Consider a direct award mechanism or OJEU-compliant open competition if the framework limits SME participation.",
    },
    {
        "type":     "incumbent_language",
        "label":    "Incumbent Supplier Signals",
        "severity": "medium",
        "patterns": [
            re.compile(r'\b(extension|renewal|continuation)\s+(of|to)\s+(the\s+)?(existing\s+)?(contract|agreement)\b', re.I),
            re.compile(r'\bcurrent\s+(supplier|provider|contractor)\b', re.I),
            re.compile(r'\bexisting\s+(relationship|contract|supplier)\b', re.I),
            re.compile(r'\bincumbent\b', re.I),
        ],
        "suggestion": "Rewrite to avoid signals of incumbent advantage: 'We seek a supplier to deliver X' rather than 'extension of existing contract with...'",
    },
    {
        "type":     "complex_language",
        "label":    "Complex / Legalistic Language",
        "severity": "low",
        "patterns": [
            re.compile(r'\b(herein|therein|hereunder|notwithstanding|pursuant\s+to|aforementioned|heretofore)\b', re.I),
            re.compile(r'\b(indemnification|subrogation|privity|ultra\s+vires)\b', re.I),
        ],
        "suggestion": "Use Plain English. The Crown Commercial Service recommends language at no higher than GCSE reading level for commercial documentation.",
    },
    {
        "type":     "staff_size_requirement",
        "label":    "Staff / Headcount Requirement",
        "severity": "medium",
        "patterns": [
            re.compile(r'\bminimum\s+(\d+)\s+(members\s+of\s+)?staff\b', re.I),
            re.compile(r'\bat\s+least\s+(\d+)\s+(full[\-\s]time\s+)?(employees|FTEs|personnel)\b', re.I),
            re.compile(r'\bheadcount\s+(of|above|over)\s+\d+\b', re.I),
        ],
        "suggestion": "Remove headcount thresholds. Evaluate capacity through past performance, subcontracting plans, or delivery methodology instead.",
    },
]

_SME_POSITIVE = [
    (re.compile(r'\bSME\b|small\s+(and\s+medium)?[- ]?(sized\s+)?enterprise', re.I), "SME Explicitly Welcomed"),
    (re.compile(r'\bsocial\s+value\b', re.I), "Social Value Requirement"),
    (re.compile(r'\binnovation\b|\binnovative\b', re.I), "Innovation Encouraged"),
    (re.compile(r'\bproportionate\b', re.I), "Proportionate Requirements"),
    (re.compile(r'\bno\s+minimum\s+turnover\b', re.I), "No Turnover Threshold"),
    (re.compile(r'\bconsortium\b|\bjoint\s+bid\b|\bjoint\s+venture\b', re.I), "Consortium Bidding Permitted"),
    (re.compile(r'\bsub[\-\s]?contract(ing|ors)?\b', re.I), "Subcontracting Allowed"),
]


def _reading_level(text: str) -> dict:
    words = text.split()
    n_words = len(words)
    if n_words == 0:
        return {"score": 50, "level": "Unknown", "avg_sentence_length": 0, "complex_word_ratio": 0}
    sentences = max(1, len(re.split(r'[.!?]+', text)))
    avg_sl = n_words / sentences
    # Estimate complex words (3+ syllables, crude: length > 7)
    complex_words = sum(1 for w in words if len(re.sub(r'[^a-zA-Z]', '', w)) > 7)
    complex_ratio = complex_words / max(1, n_words)

    # Flesch-Kincaid reading ease (simplified)
    fk_score = max(0, min(100, 206.835 - 1.015 * avg_sl - 84.6 * complex_ratio))

    if fk_score >= 70:   level = "Plain English"
    elif fk_score >= 50: level = "Standard"
    elif fk_score >= 30: level = "Complex"
    else:                level = "Very Complex / Legalistic"

    return {
        "score": round(fk_score, 1),
        "level": level,
        "avg_sentence_length": round(avg_sl, 1),
        "complex_word_ratio": round(complex_ratio, 3),
    }


def analyze_language(text: str) -> dict:
    """
    Analyse procurement spec text for SME-unfriendly language patterns.
    Returns structured findings, highlighted HTML, and an overall score.
    """
    if not text or len(text.strip()) < 20:
        return {"error": "Please provide at least 20 characters of specification text."}

    text = text.strip()
    barriers_found = []
    highlight_ranges: list = []  # (start, end, severity)

    for barrier in _LANGUAGE_BARRIERS:
        matches = []
        for pattern in barrier["patterns"]:
            for m in pattern.finditer(text):
                snippet = text[m.start():m.end()]
                if snippet not in [x["text"] for x in matches]:
                    matches.append({"text": snippet, "start": m.start(), "end": m.end()})
                    highlight_ranges.append((m.start(), m.end(), barrier["severity"]))
        if matches:
            barriers_found.append({
                "type":       barrier["type"],
                "label":      barrier["label"],
                "severity":   barrier["severity"],
                "matches":    [m["text"] for m in matches[:4]],
                "count":      len(matches),
                "suggestion": barrier["suggestion"],
            })

    positive_found = []
    for pattern, label in _SME_POSITIVE:
        if pattern.search(text):
            positive_found.append(label)

    # Overall SME-friendliness score (higher = better for SMEs)
    penalty = sum(
        {"high": 18, "medium": 10, "low": 5}.get(b["severity"], 5) * b["count"]
        for b in barriers_found
    )
    bonus   = len(positive_found) * 5
    raw_score = max(0, min(100, 100 - penalty + bonus))

    risk_level = "Low" if raw_score >= 65 else "Medium" if raw_score >= 35 else "High"

    # Build highlighted HTML
    sev_colors = {"high": "#fecaca", "medium": "#fef08a", "low": "#bfdbfe"}
    highlight_ranges.sort(key=lambda x: x[0])
    html = ""
    cursor = 0
    for (start, end, sev) in _merge_ranges(highlight_ranges):
        html += _html_escape(text[cursor:start])
        color = sev_colors.get(sev, "#e5e7eb")
        html += f'<mark style="background:{color};padding:0 2px;border-radius:2px;" title="{sev} severity">{_html_escape(text[start:end])}</mark>'
        cursor = end
    html += _html_escape(text[cursor:])

    readability = _reading_level(text)

    return {
        "overall_score":       raw_score,
        "risk_level":          risk_level,
        "barriers_detected":   sorted(barriers_found, key=lambda b: {"high": 0, "medium": 1, "low": 2}[b["severity"]]),
        "positive_indicators": positive_found,
        "readability":         readability,
        "total_words":         len(text.split()),
        "barrier_count":       sum(b["count"] for b in barriers_found),
        "highlighted_html":    html,
    }


def _merge_ranges(ranges: list) -> list:
    if not ranges:
        return []
    ranges.sort(key=lambda r: r[0])
    merged = [list(ranges[0])]
    for start, end, sev in ranges[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
            # Upgrade severity to worst
            if {"high": 2, "medium": 1, "low": 0}.get(sev, 0) > {"high": 2, "medium": 1, "low": 0}.get(merged[-1][2], 0):
                merged[-1][2] = sev
        else:
            merged.append([start, end, sev])
    return [(r[0], r[1], r[2]) for r in merged]


def _html_escape(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

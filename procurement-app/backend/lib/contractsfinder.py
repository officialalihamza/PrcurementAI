import requests
import os
import time
import hashlib
import json
from typing import List, Optional, Dict, Any

CF_API_URL = os.getenv("CF_API_URL", "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search")
CACHE_TTL = int(os.getenv("CACHE_TTL_SECONDS", 3600))

_cache: Dict[str, Dict] = {}

UK_REGIONS = [
    "East Midlands", "East of England", "London", "North East",
    "North West", "Northern Ireland", "Scotland", "South East",
    "South West", "Wales", "West Midlands", "Yorkshire and the Humber",
]

CPV_DESCRIPTIONS = {
    "72": "IT Services", "45": "Construction", "85": "Health Services",
    "80": "Education", "60": "Transport", "90": "Environmental Services",
    "55": "Hotel & Catering", "71": "Architecture & Engineering",
    "79": "Business Services", "50": "Repair & Maintenance",
    "33": "Medical Equipment", "35": "Security Equipment",
    "48": "Software", "64": "Postal Services", "65": "Utilities",
    "66": "Financial Services", "70": "Real Estate", "73": "R&D",
    "75": "Public Administration", "76": "Mining", "77": "Agriculture",
    "98": "Other Community Services", "99": "Extraterritorial",
}


def _cache_key(params: dict) -> str:
    s = json.dumps(params, sort_keys=True)
    return hashlib.md5(s.encode()).hexdigest()


def _cache_get(key: str) -> Optional[Any]:
    entry = _cache.get(key)
    if entry and time.time() - entry["ts"] < CACHE_TTL:
        return entry["data"]
    return None


def _cache_set(key: str, data: Any):
    _cache[key] = {"data": data, "ts": time.time()}


def _parse_release(release: dict) -> Optional[dict]:
    try:
        tender = release.get("tender", {})
        awards = release.get("awards", [])
        buyer = release.get("buyer", {})
        parties = release.get("parties", [])

        title = tender.get("title") or release.get("title", "Untitled")
        description = tender.get("description", "")
        ocid = release.get("ocid", "")
        status = tender.get("status", release.get("tag", ["unknown"])[0] if release.get("tag") else "unknown")

        value = None
        if awards:
            value = awards[0].get("value", {}).get("amount")
        if value is None:
            value = tender.get("value", {}).get("amount")

        deadline = tender.get("tenderPeriod", {}).get("endDate")
        published = release.get("date")

        buyer_name = buyer.get("name", "Unknown")
        buyer_region = ""

        for party in parties:
            if party.get("id") == buyer.get("id") or "buyer" in party.get("roles", []):
                addr = party.get("address", {})
                buyer_region = addr.get("region", addr.get("locality", ""))
                break

        cpv_codes = []
        cpv_descs = []
        items = tender.get("items", [])
        for item in items:
            for classification in item.get("additionalClassifications", []) + [item.get("classification", {})]:
                if classification and classification.get("scheme") in ("CPV", "cpv"):
                    code = str(classification.get("id", ""))
                    if code:
                        cpv_codes.append(code)
                        prefix = code[:2]
                        cpv_descs.append(CPV_DESCRIPTIONS.get(prefix, classification.get("description", "")))

        sme_suitable = tender.get("suitableForSme", None)
        if sme_suitable is None:
            sme_suitable = tender.get("SMEsuitable", None)

        region = buyer_region
        if not region and buyer_region:
            region = buyer_region

        url = f"https://www.contractsfinder.service.gov.uk/Notice/{ocid.split('-')[-1]}" if ocid else ""

        # Documents — collect from tender and awards
        documents = []
        doc_type_labels = {
            "tenderNotice": "Tender Notice",
            "biddingDocuments": "ITT / Bidding Documents",
            "technicalSpecifications": "Technical Specification",
            "clarifications": "Clarifications / Q&A",
            "contractDraft": "Draft Contract",
            "evaluationCriteria": "Evaluation Criteria",
            "contractArrangements": "Contract Arrangements",
            "submissionDocuments": "Submission Documents",
            "contractNotice": "Contract Notice",
            "contractSchedule": "Contract Schedule",
            "procurementPlan": "Procurement Plan",
            "evaluationReports": "Evaluation Report",
            "bidders": "Bidder List",
        }
        seen_urls = set()
        for doc in (tender.get("documents") or []) + \
                   [d for a in awards for d in (a.get("documents") or [])]:
            doc_url = doc.get("url", "")
            if not doc_url or doc_url in seen_urls:
                continue
            seen_urls.add(doc_url)
            raw_type = doc.get("documentType", "")
            documents.append({
                "url":   doc_url,
                "type":  raw_type,
                "label": doc_type_labels.get(raw_type, raw_type.replace("_", " ").title() or "Document"),
                "title": doc.get("title") or doc.get("description", "")[:80],
            })

        return {
            "ocid": ocid,
            "title": title,
            "description": description[:500] if description else "",
            "buyer": buyer_name,
            "buyer_region": buyer_region,
            "value": float(value) if value is not None else None,
            "currency": tender.get("value", {}).get("currency", "GBP"),
            "region": region or "Unknown",
            "deadline": deadline,
            "published": published,
            "sme_suitable": sme_suitable,
            "cpv_codes": cpv_codes[:5],
            "cpv_descriptions": cpv_descs[:5],
            "status": status,
            "url": url,
            "match_score": 0,
            "documents": documents,
        }
    except Exception:
        return None


def _calc_match_score(contract: dict, company_profile: Optional[dict]) -> int:
    if not company_profile:
        return 0

    score = 0
    company_cpv_prefixes = set()
    for sic in company_profile.get("sic_codes", []):
        company_cpv_prefixes.add(sic[:2])

    for code in contract.get("cpv_codes", []):
        if code[:2] in company_cpv_prefixes:
            score += 40
            break

    company_region = company_profile.get("region", "")
    if company_region and contract.get("region", "") == company_region:
        score += 30

    contract_value = contract.get("value")
    company_turnover = company_profile.get("turnover")
    if contract_value and company_turnover:
        ratio = contract_value / company_turnover
        if 0.01 <= ratio <= 0.5:
            score += 30
        elif ratio < 0.01 or ratio <= 2.0:
            score += 15

    return min(score, 100)


def search(
    cpv: List[str] = [],
    regions: List[str] = [],
    value_min: float = 0,
    value_max: float = 10_000_000,
    keyword: Optional[str] = None,
    sme_flag: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 20,
    company_profile: Optional[dict] = None,
) -> Dict[str, Any]:

    params_dict = {
        "cpv": sorted(cpv), "regions": sorted(regions),
        "value_min": value_min, "value_max": value_max,
        "keyword": keyword, "sme_flag": sme_flag,
        "date_from": date_from, "date_to": date_to,
        "sort": sort, "page": page,
    }
    key = _cache_key(params_dict)
    cached = _cache_get(key)
    if cached:
        _apply_match_scores(cached["contracts"], company_profile)
        return cached

    query_params = {
        "size": min(page_size * 2, 100),
        "page": page,
    }

    if keyword:
        query_params["keyword"] = keyword
    if value_min > 0:
        query_params["minimumValue"] = int(value_min)
    if value_max < 10_000_000:
        query_params["maximumValue"] = int(value_max)
    if date_from:
        query_params["startDateFrom"] = date_from
    if date_to:
        query_params["startDateTo"] = date_to
    if cpv:
        query_params["cpvCode"] = ",".join(cpv)

    try:
        resp = requests.get(CF_API_URL, params=query_params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        return {"contracts": [], "total": 0, "page": page, "error": str(e)}

    releases = data.get("releases", [])
    if not releases and "results" in data:
        releases = []
        for result in data.get("results", []):
            releases.extend(result.get("releases", []))

    contracts = []
    for release in releases:
        parsed = _parse_release(release)
        if parsed:
            if regions and parsed["region"] not in regions and parsed["buyer_region"] not in regions:
                continue
            if sme_flag == "sme" and parsed["sme_suitable"] is False:
                continue
            if sme_flag == "large" and parsed["sme_suitable"] is True:
                continue
            contracts.append(parsed)

    if sort == "value":
        contracts.sort(key=lambda x: x.get("value") or 0, reverse=True)
    elif sort == "deadline":
        contracts.sort(key=lambda x: x.get("deadline") or "", reverse=False)
    else:
        contracts.sort(key=lambda x: x.get("published") or "", reverse=True)

    total = data.get("maxPage", 1) * page_size
    result = {"contracts": contracts, "total": total, "page": page}
    _cache_set(key, result)
    _apply_match_scores(result["contracts"], company_profile)
    return result


def _apply_match_scores(contracts: List[dict], company_profile: Optional[dict]):
    for c in contracts:
        c["match_score"] = _calc_match_score(c, company_profile)


def get_stats(filters: Optional[dict] = None) -> Dict[str, Any]:
    """Fetch aggregated stats for dashboard KPIs."""
    params_dict = {"type": "stats", **(filters or {})}
    key = _cache_key(params_dict)
    cached = _cache_get(key)
    if cached:
        return cached

    try:
        resp = requests.get(CF_API_URL, params={"size": 100, "page": 1}, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        releases = data.get("releases", [])
        if not releases:
            for r in data.get("results", []):
                releases.extend(r.get("releases", []))
    except Exception:
        releases = []

    contracts = [c for c in (_parse_release(r) for r in releases) if c]
    stats = _compute_stats(contracts)
    _cache_set(key, stats)
    return stats


def _compute_stats(contracts: List[dict]) -> Dict[str, Any]:
    from datetime import datetime, timedelta

    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    week_contracts = [
        c for c in contracts
        if c.get("published") and c["published"][:10] >= week_ago.strftime("%Y-%m-%d")
    ]

    values = [c["value"] for c in contracts if c.get("value")]
    sme_contracts = [c for c in contracts if c.get("sme_suitable") is True]

    sme_rate = (len(sme_contracts) / len(contracts) * 100) if contracts else 0
    avg_value = sum(values) / len(values) if values else 0
    total_spend = sum(values)

    region_sme: Dict[str, Dict] = {}
    for c in contracts:
        r = c.get("region", "Unknown")
        if r not in region_sme:
            region_sme[r] = {"total": 0, "sme": 0}
        region_sme[r]["total"] += 1
        if c.get("sme_suitable"):
            region_sme[r]["sme"] += 1

    sme_by_region = [
        {"region": r, "sme_rate": (v["sme"] / v["total"] * 100) if v["total"] else 0}
        for r, v in region_sme.items()
    ]

    value_bands = [
        {"band": "< £10k", "count": sum(1 for v in values if v < 10_000)},
        {"band": "£10k–100k", "count": sum(1 for v in values if 10_000 <= v < 100_000)},
        {"band": "£100k–500k", "count": sum(1 for v in values if 100_000 <= v < 500_000)},
        {"band": "£500k–1M", "count": sum(1 for v in values if 500_000 <= v < 1_000_000)},
        {"band": "> £1M", "count": sum(1 for v in values if v >= 1_000_000)},
    ]

    sector_counts: Dict[str, int] = {}
    for c in contracts:
        for desc in c.get("cpv_descriptions", []):
            if desc:
                sector_counts[desc] = sector_counts.get(desc, 0) + 1
    top_sectors = sorted(sector_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "kpis": {
            "week_count": len(week_contracts),
            "sme_rate": round(sme_rate, 1),
            "avg_value": round(avg_value, 2),
            "total_spend": round(total_spend, 2),
        },
        "charts": {
            "sme_by_region": sme_by_region,
            "sme_over_time": [],
            "value_bands": value_bands,
            "top_sectors": [{"sector": s, "count": c} for s, c in top_sectors],
        },
    }

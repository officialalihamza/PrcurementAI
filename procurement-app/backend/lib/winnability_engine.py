from typing import Optional


SECTOR_SIC_MAP: dict[str, list[str]] = {
    "IT Services":               ["62", "63", "95"],
    "Software":                  ["62", "63"],
    "Construction":              ["41", "42", "43"],
    "R&D Services":              ["72", "73"],
    "Health Services":           ["86", "87", "88"],
    "Architecture & Engineering":["71"],
    "Education":                 ["85"],
    "Environmental Services":    ["37", "38", "39"],
    "Business Services":         ["69", "70", "74", "78", "80"],
    "Transport":                 ["49", "50", "51", "52", "53"],
    "Financial Services":        ["64", "65", "66"],
}

# CPV top-level division → sector name
CPV_SECTOR_MAP: dict[str, str] = {
    "48": "Software", "72": "IT Services", "73": "R&D Services",
    "45": "Construction", "71": "Architecture & Engineering",
    "85": "Health Services", "80": "Education",
    "90": "Environmental Services", "79": "Business Services",
    "60": "Transport", "66": "Financial Services",
}

WEIGHTS: dict[str, float] = {
    "sector_match":       0.30,
    "financial_health":   0.20,
    "size_fit":           0.15,
    "geographic_fit":     0.15,
    "capability":         0.10,
    "experience":         0.05,
    "timeline_capacity":  0.025,
    "compliance":         0.025,
}


def _recommendation(total: float) -> str:
    if total >= 0.78:
        return "Strong Match"
    if total >= 0.62:
        return "Good Match"
    if total >= 0.45:
        return "Moderate Match"
    return "Weak Match"


def _sector_match(company: dict, contract: dict) -> float:
    contract_sector = (contract.get("sector") or "").strip()
    company_sectors = [s.strip() for s in (company.get("primary_sectors") or [])]
    company_sic     = [str(s) for s in (company.get("sic_codes") or [])]

    if contract_sector and contract_sector in company_sectors:
        return 1.0

    # CPV code prefix match
    cpv = str(contract.get("cpv_code") or "")
    if cpv:
        cpv_sector = CPV_SECTOR_MAP.get(cpv[:2]) or CPV_SECTOR_MAP.get(cpv[:3])
        if cpv_sector and cpv_sector in company_sectors:
            return 0.90
        if cpv_sector and contract_sector and cpv_sector == contract_sector:
            allowed = SECTOR_SIC_MAP.get(cpv_sector, [])
            for sic in company_sic:
                if any(sic.startswith(p) for p in allowed):
                    return 0.80

    # SIC code prefix match against contract sector
    allowed = SECTOR_SIC_MAP.get(contract_sector, [])
    if allowed and company_sic:
        for sic in company_sic:
            if any(sic.startswith(p) for p in allowed):
                return 0.75

    return 0.10


def _financial_health(company: dict, contract: dict) -> float:
    turnover = company.get("turnover_latest") or company.get("turnover") or 0
    if not turnover:
        return 0.30

    lo = contract.get("value_low") or 0
    hi = contract.get("value_high") or 0
    contract_value = (lo + hi) / 2 if lo and hi else (hi or lo or 0)
    if not contract_value:
        return 0.50

    ratio = contract_value / turnover
    if 0.05 <= ratio <= 0.25:
        return 1.00
    if 0.01 <= ratio < 0.05:
        return 0.80
    if 0.25 < ratio <= 0.50:
        return 0.70
    if ratio < 0.01:
        return 0.50
    if 0.50 < ratio <= 1.00:
        return 0.35
    return 0.10  # contract > annual turnover


def _size_fit(company: dict, contract: dict) -> float:
    employees = company.get("employees") or 0
    lo = contract.get("value_low") or 0
    hi = contract.get("value_high") or 0
    contract_value = (lo + hi) / 2 if lo and hi else (hi or lo or 0)

    if not employees or not contract_value:
        return 0.50

    vpe = contract_value / employees
    if 10_000 <= vpe <= 200_000:
        return 1.00
    if 5_000 <= vpe < 10_000:
        return 0.80
    if 200_000 < vpe <= 500_000:
        return 0.70
    if vpe < 5_000:
        return 0.50
    return 0.30


def _geographic_fit(company: dict, contract: dict) -> float:
    company_region  = (company.get("region") or "").lower().strip()
    contract_region = (contract.get("region") or "").lower().strip()
    coverage        = (company.get("geographic_coverage") or "regional").lower()
    regions_active  = [(r or "").lower().strip() for r in (company.get("regions_active") or [])]

    if coverage == "national":
        return 1.00
    if company_region and contract_region and company_region == contract_region:
        return 1.00
    if contract_region and contract_region in regions_active:
        return 0.90
    if coverage in ("multi-regional", "multi_regional"):
        return 0.65
    if not contract_region:
        return 0.70
    return 0.25


def _capability(company: dict) -> float:
    cert_count = len(company.get("certifications") or [])
    if company.get("has_iso_9001"):    cert_count += 1
    if company.get("has_iso_27001"):   cert_count += 1
    if company.get("has_cyber_essentials"): cert_count += 1
    return min(1.0, cert_count * 0.20)


def _experience(company: dict) -> float:
    years    = min(company.get("years_public_sector") or 0, 15)
    past_cnt = min(company.get("past_contract_count") or 0, 30)
    return round(years / 15 * 0.60 + past_cnt / 30 * 0.40, 3)


def _timeline_capacity(company: dict, _contract: dict) -> float:
    employees = company.get("employees") or 0
    if employees >= 250: return 1.00
    if employees >= 100: return 0.90
    if employees >=  50: return 0.80
    if employees >=  10: return 0.65
    if employees >=   5: return 0.50
    return 0.35


def _compliance(company: dict) -> float:
    checks = [
        bool(company.get("has_gdpr_docs")),
        bool(company.get("has_modern_slavery")),
        bool(company.get("has_public_liability")),
    ]
    return round(sum(checks) / len(checks), 3)


def score_contract(company: dict, contract: dict) -> dict:
    """Return per-dimension scores + weighted total for one company/contract pair."""
    scores = {
        "sector_match":      _sector_match(company, contract),
        "financial_health":  _financial_health(company, contract),
        "size_fit":          _size_fit(company, contract),
        "geographic_fit":    _geographic_fit(company, contract),
        "capability":        _capability(company),
        "experience":        _experience(company),
        "timeline_capacity": _timeline_capacity(company, contract),
        "compliance":        _compliance(company),
    }
    total = round(sum(scores[k] * WEIGHTS[k] for k in scores), 4)
    return {**scores, "total_score": total, "recommendation": _recommendation(total)}

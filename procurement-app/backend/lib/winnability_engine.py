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

    # No sector data on either side → neutral baseline (not a penalty)
    if not company_sectors and not company_sic:
        return 0.40

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

    # Company has sectors defined but no match — small penalty
    if company_sectors:
        return 0.15
    return 0.40


def _financial_health(company: dict, contract: dict) -> float:
    turnover = company.get("turnover_latest") or company.get("turnover") or 0
    if not turnover:
        # Unknown turnover → neutral (don't penalise for missing data)
        return 0.50

    contract_value = contract.get("value") or 0
    if not contract_value:
        return 0.55  # no contract value info — slightly above neutral

    ratio = contract_value / turnover
    if 0.05 <= ratio <= 0.25:
        return 1.00
    if 0.01 <= ratio < 0.05:
        return 0.80
    if 0.25 < ratio <= 0.50:
        return 0.70
    if ratio < 0.01:
        return 0.55
    if 0.50 < ratio <= 1.00:
        return 0.35
    return 0.10  # contract > annual turnover


def _size_fit(company: dict, contract: dict) -> float:
    employees      = company.get("employees") or 0
    contract_value = contract.get("value") or 0

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
        return 0.55
    return 0.30


def _geographic_fit(company: dict, contract: dict) -> float:
    company_region  = (company.get("region") or "").lower().strip()
    contract_region = (contract.get("region") or "").lower().strip()
    coverage        = (company.get("geographic_coverage") or "").lower()
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
        return 0.60  # no location info — assume reachable
    # No region set on company → neutral (not penalised for incomplete profile)
    if not company_region and not regions_active and not coverage:
        return 0.55
    return 0.25


def _capability(company: dict) -> float:
    cert_count = len(company.get("certifications") or [])
    if company.get("has_iso_9001"):         cert_count += 1
    if company.get("has_iso_27001"):        cert_count += 1
    if company.get("has_cyber_essentials"): cert_count += 1
    if cert_count == 0:
        return 0.20  # baseline — most companies can bid without certs
    return min(1.0, 0.20 + cert_count * 0.20)


def _experience(company: dict) -> float:
    years    = min(company.get("years_public_sector") or 0, 15)
    past_cnt = min(company.get("past_contract_count") or 0, 30)
    base     = years / 15 * 0.60 + past_cnt / 30 * 0.40
    if base == 0:
        return 0.20  # unknown experience → give benefit of doubt
    return round(base, 3)


def _timeline_capacity(company: dict, _contract: dict) -> float:
    employees = company.get("employees") or 0
    if employees == 0:
        return 0.50  # unknown → neutral
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
    score = sum(checks) / len(checks)
    if score == 0:
        return 0.15  # baseline — docs often not uploaded but company may still comply
    return round(score, 3)


# ---------------------------------------------------------------------------
# Insights
# ---------------------------------------------------------------------------

def generate_insights(scores: dict, company: dict, contract: dict) -> dict:
    """Return lists of strengths, weaknesses, recommendations, and risks."""
    strengths: list[str]        = []
    weaknesses: list[str]       = []
    recommendations: list[str]  = []
    risks: list[str]            = []

    # --- Sector ---
    sm = scores["sector_match"]
    if sm >= 0.85:
        strengths.append("Strong sector alignment with this contract")
    elif sm >= 0.60:
        strengths.append("Good sector overlap")
    elif sm < 0.25:
        weaknesses.append("Sector mismatch — outside usual areas of work")
        recommendations.append("Focus on contracts in your registered sectors")

    # --- Financial Health ---
    fh = scores["financial_health"]
    contract_value = contract.get("value") or 0
    turnover = company.get("turnover_latest") or company.get("turnover") or 0
    if fh >= 0.85:
        strengths.append("Contract value is well-proportioned to company turnover")
    elif fh <= 0.35:
        if contract_value and turnover and contract_value > turnover:
            risks.append("Contract value exceeds annual turnover — significant financial risk")
            recommendations.append("Consider a consortium or subcontracting arrangement")
        elif fh <= 0.35:
            weaknesses.append("Contract value is high relative to company turnover")

    # --- Size Fit ---
    sf = scores["size_fit"]
    if sf >= 0.85:
        strengths.append("Contract scale matches company capacity")
    elif sf <= 0.35:
        weaknesses.append("Contract may be too large or too small for your headcount")
        recommendations.append("Verify staffing capacity before bidding")

    # --- Geographic Fit ---
    gf = scores["geographic_fit"]
    contract_region = contract.get("region") or ""
    if gf >= 0.90:
        strengths.append(f"Contract is in your operating region ({contract_region})")
    elif gf <= 0.30:
        weaknesses.append(f"Contract location ({contract_region}) is outside your usual area")
        recommendations.append("Assess travel and mobilisation costs carefully")
        risks.append("Geographic stretch may affect delivery quality and cost")

    # --- Capability ---
    cap = scores["capability"]
    if cap >= 0.60:
        strengths.append("Strong certification portfolio")
    elif cap <= 0.20:
        certs_needed = []
        if not company.get("has_iso_9001"):
            certs_needed.append("ISO 9001")
        if not company.get("has_iso_27001") and "IT" in str(contract.get("sector") or ""):
            certs_needed.append("ISO 27001")
        if not company.get("has_cyber_essentials"):
            certs_needed.append("Cyber Essentials")
        if certs_needed:
            recommendations.append(f"Consider obtaining: {', '.join(certs_needed)}")

    # --- Experience ---
    exp = scores["experience"]
    if exp >= 0.60:
        strengths.append("Solid public sector experience")
    elif exp <= 0.20:
        weaknesses.append("Limited public sector track record")
        recommendations.append("Build case studies from any public sector work done")
        risks.append("Buyers may view limited experience as a risk factor")

    # --- Compliance ---
    comp = scores["compliance"]
    if comp >= 0.66:
        strengths.append("Good compliance documentation in place")
    elif comp <= 0.15:
        missing = []
        if not company.get("has_gdpr_docs"):        missing.append("GDPR policy")
        if not company.get("has_modern_slavery"):   missing.append("Modern Slavery statement")
        if not company.get("has_public_liability"): missing.append("Public Liability insurance")
        if missing:
            weaknesses.append(f"Missing compliance docs: {', '.join(missing)}")
            recommendations.append("Upload compliance documents to strengthen bids")

    # Generic positive signal
    total = scores["total_score"]
    if total >= 0.78:
        strengths.append("Overall strong match — prioritise this opportunity")
    elif total >= 0.62:
        strengths.append("Good overall fit — worth pursuing")

    return {
        "strengths":       strengths,
        "weaknesses":      weaknesses,
        "recommendations": recommendations,
        "risks":           risks,
    }


def score_contract(company: dict, contract: dict) -> dict:
    """Return per-dimension scores, weighted total, recommendation, and insights."""
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
    scores["total_score"]    = total
    scores["recommendation"] = _recommendation(total)

    insights = generate_insights(scores, company, contract)
    scores.update(insights)
    return scores

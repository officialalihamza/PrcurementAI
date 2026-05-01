"""
Unified contract schema used by all data source modules.
Every source normalises its raw API response into this dict shape.
"""

SOURCE_CF    = "contracts-finder"
SOURCE_FTS   = "find-a-tender"
SOURCE_SPEND = "spend-data"

CPV_LABELS = {
    "72": "IT Services",       "45": "Construction",       "85": "Health Services",
    "80": "Education",         "60": "Transport",          "90": "Environmental Services",
    "55": "Hotel & Catering",  "71": "Architecture & Engineering",
    "79": "Business Services", "50": "Repair & Maintenance",
    "33": "Medical Equipment", "35": "Security Equipment",
    "48": "Software",          "64": "Postal Services",    "65": "Utilities",
    "66": "Financial Services","70": "Real Estate",        "73": "R&D",
    "75": "Public Administration", "77": "Agriculture",    "98": "Community Services",
}

DOC_LABELS = {
    "tenderNotice":        "Tender Notice",
    "biddingDocuments":    "ITT / Bidding Documents",
    "technicalSpecifications": "Technical Specification",
    "clarifications":      "Clarifications / Q&A",
    "contractDraft":       "Draft Contract",
    "evaluationCriteria":  "Evaluation Criteria",
    "contractArrangements":"Contract Arrangements",
    "submissionDocuments": "Submission Documents",
    "contractNotice":      "Contract Notice",
    "contractSchedule":    "Contract Schedule",
    "evaluationReports":   "Evaluation Report",
}


def make_contract(
    *,
    ocid: str,
    source: str,
    title: str,
    buyer: str,
    description: str = "",
    value=None,
    currency: str = "GBP",
    region: str = "Unknown",
    published=None,
    deadline=None,
    status: str = "unknown",
    sme_suitable=None,
    cpv_codes=None,
    cpv_descriptions=None,
    supplier: str = "",
    url: str = "",
    documents=None,
    # Companies House enrichment (optional)
    supplier_number: str = "",
    supplier_turnover=None,
    supplier_employees=None,
    supplier_sic=None,
    match_score: int = 0,
) -> dict:
    return {
        "ocid":                ocid,
        "source":              source,
        "title":               title,
        "description":         (description or "")[:500],
        "buyer":               buyer or "Unknown",
        "supplier":            supplier or "",
        "value":               float(value) if value is not None else None,
        "currency":            currency,
        "region":              region or "Unknown",
        "cpv_codes":           cpv_codes or [],
        "cpv_descriptions":    cpv_descriptions or [],
        "sme_suitable":        sme_suitable,
        "status":              status,
        "published":           published,
        "deadline":            deadline,
        "url":                 url,
        "documents":           documents or [],
        "supplier_number":     supplier_number or "",
        "supplier_turnover":   supplier_turnover,
        "supplier_employees":  supplier_employees,
        "supplier_sic":        supplier_sic or [],
        "match_score":         match_score,
    }


def extract_cpv(items: list) -> tuple[list, list]:
    codes, descs = [], []
    for item in items:
        for cl in item.get("additionalClassifications", []) + [item.get("classification") or {}]:
            if cl.get("scheme") in ("CPV", "cpv"):
                code = str(cl.get("id", ""))
                if code:
                    codes.append(code)
                    descs.append(CPV_LABELS.get(code[:2], cl.get("description", "")))
    return codes[:5], descs[:5]


def extract_docs(tender: dict, awards: list) -> list:
    seen, docs = set(), []
    all_docs = list(tender.get("documents") or [])
    for a in awards:
        all_docs += list(a.get("documents") or [])
    for doc in all_docs:
        url = doc.get("url", "")
        if not url or url in seen:
            continue
        seen.add(url)
        raw = doc.get("documentType", "")
        docs.append({
            "url":   url,
            "type":  raw,
            "label": DOC_LABELS.get(raw, raw.replace("_", " ").title() or "Document"),
            "title": (doc.get("title") or doc.get("description", ""))[:80],
        })
    return docs

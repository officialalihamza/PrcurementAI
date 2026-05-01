"""
Find a Tender Service (FTS) live OCDS search.
Above-threshold UK public contracts (OJEU/Find-a-Tender, typically >£213k for services).
API: https://www.find-a-tender.service.gov.uk/api/1.0/ocds/releases.json
"""

import os
import requests
from typing import Optional
from .schema import SOURCE_FTS, make_contract, extract_cpv, extract_docs

_BASE    = os.getenv("FTS_API_URL", "https://www.find-a-tender.service.gov.uk/api/1.0/ocds/releases.json")
_TIMEOUT = 15


def _parse(release: dict) -> Optional[dict]:
    try:
        tender  = release.get("tender", {}) or {}
        awards  = release.get("awards", []) or []
        buyer   = release.get("buyer", {}) or {}
        parties = release.get("parties", []) or []

        title       = tender.get("title") or release.get("title", "Untitled")
        description = tender.get("description", "")
        ocid        = release.get("ocid", "")
        tags        = release.get("tag") or []
        status      = tender.get("status") or (tags[0] if tags else "unknown")

        value = None
        for award in awards:
            v = award.get("value", {})
            if v.get("amount") is not None:
                value = v["amount"]
                break
        if value is None:
            value = (tender.get("value") or {}).get("amount")

        deadline  = tender.get("tenderPeriod", {}).get("endDate")
        published = release.get("date")

        buyer_name = buyer.get("name", "Unknown")
        region = ""
        supplier = ""

        for party in parties:
            roles = party.get("roles", [])
            if "buyer" in roles or party.get("id") == buyer.get("id"):
                addr = party.get("address", {})
                region = addr.get("region", addr.get("locality",
                         addr.get("countryName", "")))
            if "supplier" in roles or "tenderer" in roles:
                supplier = party.get("name", "")

        cpv_codes, cpv_descs = extract_cpv(tender.get("items", []))
        documents             = extract_docs(tender, awards)

        # FTS stores SME suitability differently
        sme = tender.get("suitableForSme")
        if sme is None:
            sme = (tender.get("suitability") or {}).get("sme")

        url = release.get("url") or ""
        if not url and ocid:
            url = f"https://www.find-a-tender.service.gov.uk/Notice/{ocid.split('-')[-1]}"

        return make_contract(
            ocid=ocid, source=SOURCE_FTS, title=title, buyer=buyer_name,
            description=description, value=value,
            currency=(tender.get("value") or {}).get("currency", "GBP"),
            region=region or "Unknown", published=published, deadline=deadline,
            status=status, sme_suitable=sme,
            cpv_codes=cpv_codes, cpv_descriptions=cpv_descs,
            supplier=supplier, url=url, documents=documents,
        )
    except Exception:
        return None


def search(
    keyword: Optional[str] = None,
    regions: list = [],
    cpv: list = [],
    value_min: float = 0,
    value_max: float = 10_000_000,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sme_flag: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    params: dict = {"limit": min(page_size * 2, 100), "page": page - 1}  # FTS is 0-indexed
    if keyword:          params["keyword"]          = keyword
    if date_from:        params["publishedFrom"]    = date_from
    if date_to:          params["publishedTo"]      = date_to
    if value_min > 0:    params["minContractValue"] = int(value_min)
    if value_max < 10_000_000:
                         params["maxContractValue"] = int(value_max)
    if cpv:              params["cpvCodes"]         = ",".join(cpv)

    headers = {"Accept": "application/json"}

    try:
        r = requests.get(_BASE, params=params, headers=headers, timeout=_TIMEOUT)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        return {"contracts": [], "total": 0, "source": SOURCE_FTS, "error": str(e)}

    # FTS response: {"releases": [...]} or {"results": [{"releases": [...]}]}
    releases = data.get("releases", [])
    if not releases:
        for result in data.get("results", []):
            releases.extend(result.get("releases", []))

    contracts = []
    for rel in releases:
        c = _parse(rel)
        if not c:
            continue
        if regions and c["region"] not in regions:
            continue
        if sme_flag == "sme"   and c["sme_suitable"] is False:
            continue
        if sme_flag == "large" and c["sme_suitable"] is True:
            continue
        contracts.append(c)

    total = data.get("totalResults", data.get("maxPage", 1) * page_size)
    return {"contracts": contracts, "total": total, "source": SOURCE_FTS}

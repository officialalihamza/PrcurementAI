"""
Contracts Finder live OCDS search.
Below-threshold UK public contracts (typically < £25k for goods/services).
API: https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search
"""

import os
import requests
from typing import Optional
from .schema import SOURCE_CF, make_contract, extract_cpv, extract_docs

_BASE = os.getenv("CF_API_URL", "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search")
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
        status      = tender.get("status") or (release.get("tag") or ["unknown"])[0]

        value = None
        if awards:
            value = awards[0].get("value", {}).get("amount")
        if value is None:
            value = tender.get("value", {}).get("amount")

        deadline  = tender.get("tenderPeriod", {}).get("endDate")
        published = release.get("date")

        buyer_name = buyer.get("name", "Unknown")
        region = ""
        supplier = ""

        for party in parties:
            roles = party.get("roles", [])
            if "buyer" in roles or party.get("id") == buyer.get("id"):
                addr = party.get("address", {})
                region = addr.get("region", addr.get("locality", ""))
            if "supplier" in roles or "tenderer" in roles:
                supplier = party.get("name", "")

        cpv_codes, cpv_descs = extract_cpv(tender.get("items", []))
        documents             = extract_docs(tender, awards)

        sme = tender.get("suitableForSme") if tender.get("suitableForSme") is not None \
              else tender.get("SMEsuitable")

        url = ""
        if ocid:
            ref = ocid.split("-")[-1]
            url = f"https://www.contractsfinder.service.gov.uk/Notice/{ref}"

        return make_contract(
            ocid=ocid, source=SOURCE_CF, title=title, buyer=buyer_name,
            description=description, value=value,
            currency=tender.get("value", {}).get("currency", "GBP"),
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
    params = {"size": min(page_size * 2, 100), "page": page}
    if keyword:                           params["keyword"]      = keyword
    if value_min > 0:                     params["minimumValue"] = int(value_min)
    if value_max < 10_000_000:            params["maximumValue"] = int(value_max)
    if date_from:                         params["startDateFrom"] = date_from
    if date_to:                           params["startDateTo"]   = date_to
    if cpv:                               params["cpvCode"]       = ",".join(cpv)

    try:
        r = requests.get(_BASE, params=params, timeout=_TIMEOUT)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        return {"contracts": [], "total": 0, "source": SOURCE_CF, "error": str(e)}

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

    total = data.get("maxPage", 1) * page_size
    return {"contracts": contracts, "total": total, "source": SOURCE_CF}

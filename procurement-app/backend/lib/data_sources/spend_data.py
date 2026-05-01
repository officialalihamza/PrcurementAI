"""
Cabinet Office Spend Data — monthly CSV bulk downloads.
Fetches the latest published CSV from data.gov.uk, caches it in-process.
No API key required. Data is public domain (OGL v3).

Spend data does NOT have live tenders — it shows historical awarded spend
£25k+ by central government. Used for analytics and supplier intelligence.
"""

import csv
import hashlib
import io
import re
import requests
from datetime import datetime, timezone
from typing import Optional
from .schema import SOURCE_SPEND, make_contract

_TIMEOUT   = 20
_INDEX_URL = "https://www.data.gov.uk/api/3/action/package_show?id=spending-over-25-000-in-cabinet-office"

_csv_cache: Optional[list] = None
_cache_ts:  Optional[float] = None
_CACHE_TTL  = 3600 * 6  # 6 hours


def _fetch_csv_url() -> Optional[str]:
    """Get the URL of the most recent spend CSV from data.gov.uk."""
    try:
        r = requests.get(_INDEX_URL, timeout=_TIMEOUT)
        r.raise_for_status()
        resources = r.json().get("result", {}).get("resources", [])
        # Prefer CSV resources, most recent first
        csv_resources = [res for res in resources if res.get("format", "").upper() == "CSV"]
        if csv_resources:
            return csv_resources[0].get("url")
        # Fallback: any URL ending in .csv
        for res in resources:
            url = res.get("url", "")
            if url.lower().endswith(".csv"):
                return url
    except Exception:
        pass
    return None


def _load_spend_data() -> list:
    global _csv_cache, _cache_ts
    now = datetime.now(timezone.utc).timestamp()
    if _csv_cache is not None and _cache_ts and (now - _cache_ts) < _CACHE_TTL:
        return _csv_cache

    url = _fetch_csv_url()
    if not url:
        return []

    try:
        r = requests.get(url, timeout=_TIMEOUT)
        r.raise_for_status()
        # CSV may be UTF-8 or latin-1
        try:
            text = r.content.decode("utf-8-sig")
        except UnicodeDecodeError:
            text = r.content.decode("latin-1")

        reader = csv.DictReader(io.StringIO(text))
        rows = []
        for row in reader:
            rows.append({k.strip().lower().replace(" ", "_"): v.strip() for k, v in row.items()})
        _csv_cache = rows
        _cache_ts = now
        return rows
    except Exception:
        return []


def _clean_amount(raw: str) -> Optional[float]:
    if not raw:
        return None
    cleaned = re.sub(r"[£,\s]", "", raw)
    try:
        return float(cleaned)
    except ValueError:
        return None


def _row_to_contract(row: dict) -> Optional[dict]:
    try:
        # Common column name variants across different Cabinet Office CSV formats
        title = (
            row.get("expense_area") or row.get("description") or
            row.get("narrative") or row.get("transaction_number") or "Spend Record"
        )
        supplier = (
            row.get("supplier") or row.get("vendor_name") or
            row.get("supplier_name") or ""
        )
        buyer = (
            row.get("department_family") or row.get("entity") or
            row.get("department") or "Cabinet Office"
        )
        amount_raw = (
            row.get("amount") or row.get("value") or
            row.get("net_amount") or row.get("expense_value") or ""
        )
        value = _clean_amount(amount_raw)

        date_raw = (
            row.get("date") or row.get("payment_date") or
            row.get("invoice_date") or row.get("transaction_date") or ""
        )
        published = date_raw if date_raw else None

        region = row.get("region") or row.get("area") or "England"
        expense_type = row.get("expense_type") or row.get("category") or ""
        _key = f"{supplier}|{date_raw}|{amount_raw}".encode()
        ocid = f"spend-{hashlib.sha1(_key).hexdigest()[:12]}"

        if not supplier and not value:
            return None

        return make_contract(
            ocid=ocid,
            source=SOURCE_SPEND,
            title=title[:200] or f"Spend: {supplier}",
            buyer=buyer,
            description=f"{expense_type} — {supplier}" if expense_type else supplier,
            value=value,
            currency="GBP",
            region=region,
            published=published,
            deadline=None,
            status="complete",
            sme_suitable=None,
            supplier=supplier,
            url="https://www.data.gov.uk/dataset/spending-over-25-000-in-cabinet-office",
        )
    except Exception:
        return None


def search(
    keyword: Optional[str] = None,
    regions: list = [],
    value_min: float = 0,
    value_max: float = 10_000_000,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    rows = _load_spend_data()
    if not rows:
        return {"contracts": [], "total": 0, "source": SOURCE_SPEND,
                "error": "Could not load Cabinet Office spend data"}

    contracts = []
    kw = keyword.lower() if keyword else None

    for row in rows:
        c = _row_to_contract(row)
        if not c:
            continue
        if kw:
            hay = f"{c['title']} {c['supplier']} {c['buyer']} {c['description']}".lower()
            if kw not in hay:
                continue
        if value_min > 0 and (c["value"] is None or c["value"] < value_min):
            continue
        if value_max < 10_000_000 and (c["value"] is not None and c["value"] > value_max):
            continue
        if date_from and c["published"] and c["published"] < date_from:
            continue
        if date_to and c["published"] and c["published"] > date_to:
            continue
        if regions and c["region"] not in regions:
            continue
        contracts.append(c)

    total = len(contracts)
    start = (page - 1) * page_size
    return {
        "contracts": contracts[start: start + page_size],
        "total": total,
        "source": SOURCE_SPEND,
    }

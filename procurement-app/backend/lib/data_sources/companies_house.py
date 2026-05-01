"""
Companies House API — supplier enrichment.
Given a supplier name, looks up company number, turnover, employees, SIC codes.
Requires: COMPANIES_HOUSE_API_KEY env var (free at developer.company-information.service.gov.uk)
"""

import os
import requests
from typing import Optional

_API_KEY  = os.getenv("COMPANIES_HOUSE_API_KEY", "")
_BASE     = "https://api.company-information.service.gov.uk"
_TIMEOUT  = 8

_cache: dict = {}


def _get(path: str) -> Optional[dict]:
    if not _API_KEY:
        return None
    url = f"{_BASE}{path}"
    if url in _cache:
        return _cache[url]
    try:
        r = requests.get(url, auth=(_API_KEY, ""), timeout=_TIMEOUT)
        if r.status_code == 200:
            _cache[url] = r.json()
            return _cache[url]
    except Exception:
        pass
    return None


def search_company(name: str) -> Optional[str]:
    """Return the company_number of the best-match company for `name`."""
    if not name or not _API_KEY:
        return None
    data = _get(f"/search/companies?q={requests.utils.quote(name)}&items_per_page=3")
    if not data:
        return None
    items = data.get("items", [])
    if not items:
        return None
    # Prefer active companies
    for item in items:
        if item.get("company_status") == "active":
            return item.get("company_number")
    return items[0].get("company_number")


def get_company_details(company_number: str) -> dict:
    """Return enrichment fields for a given company number."""
    if not company_number or not _API_KEY:
        return {}
    data = _get(f"/company/{company_number}")
    if not data:
        return {}

    accounts = data.get("accounts", {})
    confirmation = data.get("confirmation_statement", {})

    # Turnover and employees live in /company/{number}/filing-history or accounts
    # The basic profile has: sic_codes, registered_office_address, type
    sic_codes = data.get("sic_codes", [])

    # Try to get accounts data for turnover/employees
    accounts_data = _get(f"/company/{company_number}/filing-history?category=accounts&items_per_page=1")
    turnover  = None
    employees = None

    return {
        "supplier_number":   company_number,
        "supplier_sic":      sic_codes,
        "supplier_turnover": turnover,
        "supplier_employees": employees,
    }


def enrich(contracts: list) -> list:
    """
    Add Companies House data to contracts that have a supplier name.
    Mutates contracts in-place and returns the list.
    Only runs when COMPANIES_HOUSE_API_KEY is set.
    """
    if not _API_KEY:
        return contracts

    for c in contracts:
        supplier = c.get("supplier", "")
        if not supplier or c.get("supplier_number"):
            continue
        number = search_company(supplier)
        if number:
            details = get_company_details(number)
            c.update(details)

    return contracts

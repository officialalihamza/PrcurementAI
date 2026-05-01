"""
Unified search across all procurement data sources.
Runs CF, FTS, and Spend in parallel; deduplicates by OCID; optionally enriches
with Companies House supplier data.
"""

import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from . import contracts_finder as cf
from . import find_a_tender   as fts
from . import spend_data      as spend
from . import companies_house as ch
from .schema import SOURCE_CF, SOURCE_FTS, SOURCE_SPEND

_executor = ThreadPoolExecutor(max_workers=6)

VALID_SOURCES = {SOURCE_CF, SOURCE_FTS, SOURCE_SPEND, "all"}


def _run_cf(kwargs: dict) -> dict:
    try:
        return cf.search(**kwargs)
    except Exception as e:
        return {"contracts": [], "total": 0, "source": SOURCE_CF, "error": str(e)}


def _run_fts(kwargs: dict) -> dict:
    try:
        return fts.search(**kwargs)
    except Exception as e:
        return {"contracts": [], "total": 0, "source": SOURCE_FTS, "error": str(e)}


def _run_spend(kwargs: dict) -> dict:
    try:
        return spend.search(**kwargs)
    except Exception as e:
        return {"contracts": [], "total": 0, "source": SOURCE_SPEND, "error": str(e)}


async def search(
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
    source: str = "all",
    enrich: bool = False,
) -> dict:
    """
    Parallel multi-source search. source= "all" | "contracts-finder" | "find-a-tender" | "spend-data"
    Returns {"contracts": [...], "total": int, "sources": {source: {total, error?}}}
    """
    loop = asyncio.get_event_loop()

    common = dict(
        keyword=keyword,
        regions=regions,
        value_min=value_min,
        value_max=value_max,
        date_from=date_from,
        date_to=date_to,
        page=1,
        page_size=min(page_size * 3, 100),  # fetch extra; we re-paginate after merge
    )
    cf_kwargs    = {**common, "cpv": cpv, "sme_flag": sme_flag}
    fts_kwargs   = {**common, "cpv": cpv, "sme_flag": sme_flag}
    spend_kwargs = {k: v for k, v in common.items() if k not in ("sme_flag",)}

    active_sources = source if source != "all" else "all"

    tasks = []
    if active_sources in ("all", SOURCE_CF):
        tasks.append(loop.run_in_executor(_executor, _run_cf,    cf_kwargs))
    if active_sources in ("all", SOURCE_FTS):
        tasks.append(loop.run_in_executor(_executor, _run_fts,   fts_kwargs))
    if active_sources in ("all", SOURCE_SPEND):
        tasks.append(loop.run_in_executor(_executor, _run_spend, spend_kwargs))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_contracts = []
    source_meta: dict = {}
    seen_ocids: set = set()

    for res in results:
        if isinstance(res, Exception):
            continue
        src = res.get("source", "unknown")
        source_meta[src] = {"total": res.get("total", 0)}
        if res.get("error"):
            source_meta[src]["error"] = res["error"]
        for c in res.get("contracts", []):
            ocid = c.get("ocid", "")
            if ocid and ocid in seen_ocids:
                continue
            if ocid:
                seen_ocids.add(ocid)
            all_contracts.append(c)

    # Sort by published date descending, then value descending
    all_contracts.sort(
        key=lambda c: (c.get("published") or "", c.get("value") or 0),
        reverse=True,
    )

    if enrich:
        ch.enrich(all_contracts)

    total = len(all_contracts)
    start = (page - 1) * page_size
    page_contracts = all_contracts[start: start + page_size]

    return {
        "contracts":    page_contracts,
        "total":        total,
        "page":         page,
        "page_size":    page_size,
        "sources":      source_meta,
    }


def search_sync(
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
    source: str = "all",
    enrich: bool = False,
) -> dict:
    """Synchronous wrapper for use outside async context (e.g. alert scheduler)."""
    return asyncio.run(search(
        keyword=keyword, regions=regions, cpv=cpv,
        value_min=value_min, value_max=value_max,
        date_from=date_from, date_to=date_to,
        sme_flag=sme_flag, page=page, page_size=page_size,
        source=source, enrich=enrich,
    ))

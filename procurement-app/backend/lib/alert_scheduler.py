"""
Alert scheduler — runs every hour via APScheduler.

For each active alert it:
  1. Checks whether enough time has passed (instant=1h, daily=24h, weekly=7d)
  2. Searches Contracts Finder with the stored filters
  3. Skips OCIDs already recorded in alert_history (no duplicate emails)
  4. Sends an HTML email and records the new matches in alert_history
"""

from datetime import datetime, timezone, timedelta
from lib.supabase import supabase
import lib.contractsfinder as cf
from lib.email import send_alert_email

_FREQUENCY_SECONDS = {
    "instant": 3600,
    "daily":   86400,
    "weekly":  604800,
}


async def check_and_send_alerts():
    print("[alerts] Running scheduled check…")
    try:
        res = supabase.table("alerts").select("*").eq("active", True).execute()
    except Exception as e:
        print(f"[alerts] Could not fetch alerts: {e}")
        return

    print(f"[alerts] Found {len(res.data or [])} active alert(s)")
    for alert in (res.data or []):
        print(f"[alerts] Processing: '{alert.get('name')}' (freq={alert.get('frequency')})")
        try:
            await _process_alert(alert)
        except Exception as e:
            print(f"[alerts] Error on alert {alert.get('id')}: {e}")


async def _process_alert(alert: dict):
    alert_id  = alert["id"]
    user_id   = alert["user_id"]
    filters   = alert.get("filters") or {}
    frequency = alert.get("frequency", "daily")
    min_gap   = _FREQUENCY_SECONDS.get(frequency, 86400)

    # ── Timing check ────────────────────────────────────────────────────────
    now = datetime.now(timezone.utc)
    hist = supabase.table("alert_history") \
        .select("sent_at") \
        .eq("alert_id", alert_id) \
        .order("sent_at", desc=True) \
        .limit(1).execute()

    if hist.data:
        last_sent = datetime.fromisoformat(hist.data[0]["sent_at"].replace("Z", "+00:00"))
        elapsed = (now - last_sent).total_seconds()
        if elapsed < min_gap:
            print(f"[alerts]   → skipped (sent {int(elapsed/60)}m ago, min gap {int(min_gap/60)}m)")
            return

    # ── Search Contracts Finder ──────────────────────────────────────────────
    result = cf.search(
        cpv=filters.get("cpv") or [],
        regions=filters.get("regions") or [],
        value_min=float(filters.get("value_min") or 0),
        value_max=float(filters.get("value_max") or 10_000_000),
        keyword=filters.get("keyword") or None,
        sme_flag="sme" if filters.get("sme_only") else None,
    )
    contracts = result.get("contracts") or []
    print(f"[alerts]   → CF search returned {len(contracts)} contract(s)")
    if not contracts:
        return

    # ── Deduplicate against history ──────────────────────────────────────────
    all_hist = supabase.table("alert_history") \
        .select("contracts") \
        .eq("alert_id", alert_id).execute()

    sent_ocids: set[str] = set()
    for row in (all_hist.data or []):
        for c in (row.get("contracts") or []):
            if c.get("ocid"):
                sent_ocids.add(c["ocid"])

    new_contracts = [c for c in contracts if c.get("ocid") not in sent_ocids]
    print(f"[alerts]   → {len(new_contracts)} new (not previously sent)")
    if not new_contracts:
        return

    # ── Get user email via Supabase admin ────────────────────────────────────
    try:
        user_res   = supabase.auth.admin.get_user_by_id(user_id)
        user_email = user_res.user.email if (user_res and user_res.user) else None
    except Exception as e:
        print(f"[alerts]   → email lookup failed: {e} — is SUPABASE_KEY the service_role key?")
        user_email = None

    if not user_email:
        print(f"[alerts]   → no email for user {user_id}, skipping")
        return

    # ── Send email ───────────────────────────────────────────────────────────
    sent = await send_alert_email(user_email, alert["name"], new_contracts)
    if sent:
        supabase.table("alert_history").insert({
            "alert_id":  alert_id,
            "contracts": [{"ocid": c.get("ocid", ""), "title": c.get("title", "")}
                          for c in new_contracts],
        }).execute()
        print(f"[alerts] '{alert['name']}' → {user_email} ({len(new_contracts)} new contracts)")
    else:
        print(f"[alerts] Email send failed for alert '{alert['name']}' — check SMTP env vars")

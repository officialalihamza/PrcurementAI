"""
Run this LOCALLY before deploying:
    python generate_cache.py

Reads the full CSV, computes all aggregated stats, writes analytics_cache.json.
Commit the resulting analytics_cache.json — it is only ~20 KB.
The deployed server uses the cache; the raw CSV stays on your machine only.
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

import lib.ocds_fetcher as fetcher

print("Loading CSV…")
df = fetcher.load_dataframe()
if df is None:
    print("ERROR: CSV not found at", fetcher.CSV_PATH)
    sys.exit(1)

print(f"Loaded {len(df):,} rows. Computing stats…")
stats = fetcher._aggregate_df(df)
stats["source"] = "csv_precomputed"
fetcher.save_cache(stats)
print(f"Saved to: {fetcher.CACHE_FILE}")
print(f"  Total records : {stats['record_count']:,}")
print(f"  SME count     : {stats['totals']['sme']:,}")
print(f"  SME avg rate  : {stats['national_avg_sme_rate']}%")
print("Done. Commit analytics_cache.json and deploy.")

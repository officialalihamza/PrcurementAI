# -*- coding: utf-8 -*-
# ydata-profiling EDA Report
# Place in: FYP/code/
# Run: python eda_profiling.py
#
# Install: pip install ydata-profiling
# Output:  ../reports/eda_profiling.html

import os, warnings
warnings.filterwarnings("ignore")
from pathlib import Path
os.chdir(Path(__file__).parent)

import pandas as pd
from ydata_profiling import ProfileReport

INPUT      = Path("../Extracted Data/master.csv")
REPORT_DIR = Path("../reports")
REPORT_DIR.mkdir(parents=True, exist_ok=True)

YEAR_MIN = 2016
YEAR_MAX = 2026

def load():
    print("Loading master.csv ...")
    df = pd.read_csv(INPUT, low_memory=False)
    df["pub_year"]       = pd.to_numeric(df["pub_year"], errors="coerce")
    df = df[(df["pub_year"] >= YEAR_MIN) & (df["pub_year"] <= YEAR_MAX)].copy()
    df["sme_flag"]       = pd.to_numeric(df["sme_flag"], errors="coerce")
    df["contract_value"] = pd.to_numeric(df["contract_value"], errors="coerce")

    # Keep relevant columns only
    cols = ["sme_flag", "contract_value", "pub_year",
            "value_band", "source", "cpv_code",
            "cpv_description", "region", "buyer",
            "supplier", "authority_type"]
    cols = [c for c in cols if c in df.columns]
    df   = df[cols].copy()
    print("Loaded {:,} records".format(len(df)))
    return df

if __name__ == "__main__":
    print("\nydata-profiling EDA Report")
    print("="*50)
    print("This takes 3-5 minutes on a large dataset ...")

    df = load()

    profile = ProfileReport(
        df,
        title       = "UK Procurement Data - EDA Profile",
        explorative = True,
        minimal     = False,
        correlations= {"auto": {"calculate": True}},
    )

    out = str(REPORT_DIR / "eda_profiling.html")
    profile.to_file(out)

    print("\nSaved: %s" % out)
    print("Open in Chrome -> Ctrl+P -> Save as PDF")

# -*- coding: utf-8 -*-
# Sweetviz EDA Report
# Place in: FYP/code/
# Run: python eda_sweetviz.py
#
# Install: pip install sweetviz
# Output:  ../reports/eda_sweetviz.html

import os, warnings
warnings.filterwarnings("ignore")
from pathlib import Path
os.chdir(Path(__file__).parent)

import pandas as pd
import sweetviz as sv

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
    df["pub_year"]       = df["pub_year"].astype("Int64")

    # Keep only columns sweetviz handles well
    cols = ["sme_flag", "contract_value", "pub_year",
            "value_band", "source", "cpv_description",
            "region", "buyer", "supplier"]
    cols = [c for c in cols if c in df.columns]
    df   = df[cols].copy()
    print("Loaded {:,} records".format(len(df)))
    return df

if __name__ == "__main__":
    print("\nSweetviz EDA Report")
    print("="*50)

    df    = load()
    known = df[df["sme_flag"].notna()].copy()

    # Compare SME vs Large
    sme_df   = known[known["sme_flag"] == 1]
    large_df = known[known["sme_flag"] == 0]

    print("\nGenerating Sweetviz comparison report ...")
    print("(SME contracts vs Large contracts - takes 1-2 minutes)")

    report = sv.compare(
        [sme_df,   "SME Suppliers"],
        [large_df, "Large Suppliers"],
        target_feat="sme_flag"
    )

    out = str(REPORT_DIR / "eda_sweetviz.html")
    report.show_html(out, open_browser=False)

    print("\nSaved: %s" % out)
    print("Open in Chrome -> Ctrl+P -> Save as PDF")

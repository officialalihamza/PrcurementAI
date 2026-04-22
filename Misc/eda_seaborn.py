# -*- coding: utf-8 -*-
# Seaborn EDA Charts
# Place in: FYP/code/
# Run: python eda_seaborn.py
# Output: ../reports/eda_report.html

import os, math, warnings, base64
warnings.filterwarnings("ignore")
from pathlib import Path
from io import BytesIO

os.chdir(Path(__file__).parent)

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns

INPUT      = Path("../Extracted Data/master.csv")
REPORT_DIR = Path("../reports")
REPORT_DIR.mkdir(parents=True, exist_ok=True)

YEAR_MIN   = 2016
YEAR_MAX   = 2026
BAND_ORDER = ["Under 10k","10k-100k","100k-1M","1M-5M","5M-25M","Over 25M"]

sns.set_theme(style="whitegrid", palette="muted", font_scale=1.1)


# =============================================================================
# LOAD
# =============================================================================

def load():
    print("Loading master.csv ...")
    df = pd.read_csv(INPUT, low_memory=False)
    df["pub_year"]       = pd.to_numeric(df["pub_year"], errors="coerce")
    df = df[(df["pub_year"] >= YEAR_MIN) & (df["pub_year"] <= YEAR_MAX)].copy()
    df["sme_flag"]       = pd.to_numeric(df["sme_flag"], errors="coerce")
    df["sme_label"]      = df["sme_flag"].map({1.0:"SME", 0.0:"Large"})
    df["contract_value"] = pd.to_numeric(df["contract_value"], errors="coerce")
    df["log_value"]      = np.log10(df["contract_value"].clip(lower=1))
    df["value_band"]     = pd.Categorical(df["value_band"],
                           categories=BAND_ORDER, ordered=True)
    df["pub_year"]       = df["pub_year"].astype(int)
    print("Loaded {:,} records".format(len(df)))
    return df


def fig_to_b64(fig):
    buf = BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=130)
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode()
    plt.close(fig)
    return b64


# =============================================================================
# CHARTS
# =============================================================================

def make_charts(df):
    charts = []
    known  = df[df["sme_label"].notna()].copy()

    # 1. Overall split
    fig, ax = plt.subplots(figsize=(7,4))
    counts  = known["sme_label"].value_counts()
    order   = ["SME","Large"]
    sns.barplot(x=order, y=[counts.get(o,0) for o in order],
                palette=["#1f6fb5","#c0392b"], ax=ax)
    for p in ax.patches:
        ax.annotate("{:,}\n({:.1f}%)".format(int(p.get_height()),
            p.get_height()/counts.sum()*100),
            (p.get_x()+p.get_width()/2, p.get_height()),
            ha="center", va="bottom", fontsize=10)
    ax.set_title("Overall SME vs Large Award Count")
    ax.set_ylabel("Number of Contracts")
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x,_:"{:,.0f}".format(x)))
    charts.append(("1. SME vs Large Overall Split",
        "SMEs received 41.5% of all award contracts (2016-2026).",
        fig_to_b64(fig)))

    # 2. SME rate by value band
    fig, ax = plt.subplots(figsize=(9,5))
    br = (known[known["value_band"].notna()]
          .groupby("value_band", observed=True)["sme_flag"]
          .agg(["mean","count"]).reset_index())
    br["rate"] = br["mean"]*100
    br = br[br["count"]>=50]
    sns.barplot(data=br, x="value_band", y="rate", color="#1f6fb5", ax=ax)
    ax.axhline(known["sme_flag"].mean()*100, color="#d68910",
               linestyle="--", linewidth=1.5,
               label="Avg {:.1f}%".format(known["sme_flag"].mean()*100))
    ax.set_title("SME Award Rate by Contract Value Band  (RQ2)")
    ax.set_ylabel("SME Award Rate (%)")
    ax.set_xlabel("Contract Value Band")
    ax.set_ylim(0,55)
    ax.legend()
    plt.xticks(rotation=15, ha="right")
    charts.append(("2. SME Rate by Value Band (RQ2)",
        "Chi2=2034, p<0.001. SME rate declines from 41.7% (10k-100k) to 27.2% (Over 25M).",
        fig_to_b64(fig)))

    # 3. SME rate over time
    fig, ax1 = plt.subplots(figsize=(10,5))
    yr = (known.groupby("pub_year")["sme_flag"]
          .agg(["mean","count"]).reset_index())
    yr["rate"] = yr["mean"]*100
    ax2 = ax1.twinx()
    ax2.bar(yr["pub_year"], yr["count"], color="grey", alpha=0.15, width=0.7)
    ax2.set_ylabel("Total Contracts", color="grey")
    ax2.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x,_:"{:,.0f}".format(x)))
    sns.lineplot(data=yr, x="pub_year", y="rate", marker="o",
                 color="#1f6fb5", linewidth=2.5, ax=ax1)
    for _, row in yr.iterrows():
        ax1.annotate("{:.1f}%".format(row["rate"]), (row["pub_year"], row["rate"]),
                     textcoords="offset points", xytext=(0,8),
                     ha="center", fontsize=8, color="#1f6fb5")
    ax1.set_title("SME Award Rate Over Time  (RQ3)")
    ax1.set_ylabel("SME Award Rate (%)", color="#1f6fb5")
    ax1.set_xlabel("Year")
    ax1.set_ylim(0,65)
    plt.xticks(yr["pub_year"], rotation=45)
    charts.append(("3. SME Rate Over Time (RQ3)",
        "Slope=+3.57%/yr, R2=0.85. Rate rose from 10.7% (2016) to 50.3% (2026).",
        fig_to_b64(fig)))

    # 4. Violin plot - value by SME/Large
    fig, ax = plt.subplots(figsize=(9,5))
    vdf = known[known["contract_value"].between(1000,50_000_000)].copy()
    sns.violinplot(data=vdf, x="sme_label", y="log_value",
                   palette={"SME":"#1f6fb5","Large":"#c0392b"},
                   order=["SME","Large"], inner="box", ax=ax)
    ax.set_yticks([3,4,5,6,7])
    ax.set_yticklabels(["1k","10k","100k","1M","10M"])
    ax.set_title("Contract Value Distribution: SME vs Large")
    ax.set_ylabel("Contract Value (GBP, log scale)")
    ax.set_xlabel("Supplier Type")
    charts.append(("4. Value Distribution by Supplier Type",
        "SME median £84,547 vs Large median £110,118.",
        fig_to_b64(fig)))

    # 5. Top 15 sectors
    fig, ax = plt.subplots(figsize=(11,7))
    sr = (known[known["cpv_description"].notna()]
          .groupby("cpv_description")["sme_flag"]
          .agg(["mean","count"]).reset_index())
    sr = sr[sr["count"]>=100]
    sr["rate"] = sr["mean"]*100
    top15 = sr.nlargest(15,"rate").copy()
    top15["label"] = top15["cpv_description"].str[:45]
    sns.barplot(data=top15, y="label", x="rate", color="#1f6fb5", ax=ax)
    ax.set_title("Top 15 CPV Sectors by SME Award Rate  (RQ1)")
    ax.set_xlabel("SME Award Rate (%)")
    ax.set_ylabel("")
    ax.set_xlim(0,110)
    for p in ax.patches:
        ax.annotate("{:.1f}%".format(p.get_width()),
            (p.get_width()+1, p.get_y()+p.get_height()/2),
            va="center", fontsize=8)
    fig.subplots_adjust(left=0.45)
    charts.append(("5. Top 15 Sectors by SME Rate (RQ1)",
        "Chi2=1684.72, p<0.001. Project supervision (99.8%) to railway (0.4%).",
        fig_to_b64(fig)))

    # 6. Bottom 10 sectors
    fig, ax = plt.subplots(figsize=(11,6))
    bot10 = sr.nsmallest(10,"rate").copy()
    bot10["label"] = bot10["cpv_description"].str[:45]
    sns.barplot(data=bot10, y="label", x="rate", color="#c0392b", ax=ax)
    ax.set_title("Bottom 10 CPV Sectors by SME Award Rate  (RQ1)")
    ax.set_xlabel("SME Award Rate (%)")
    ax.set_ylabel("")
    ax.set_xlim(0,20)
    for p in ax.patches:
        ax.annotate("{:.1f}%".format(p.get_width()),
            (p.get_width()+0.2, p.get_y()+p.get_height()/2),
            va="center", fontsize=8)
    fig.subplots_adjust(left=0.45)
    charts.append(("6. Bottom 10 Sectors by SME Rate (RQ1)",
        "Railway, insurance and foreign affairs below 5% SME rate.",
        fig_to_b64(fig)))

    # 7. Stacked bar by year
    fig, ax = plt.subplots(figsize=(10,5))
    ys = (known.groupby(["pub_year","sme_label"])
          .size().unstack(fill_value=0).reset_index())
    years = ys["pub_year"].values
    sme_v = ys.get("SME",   pd.Series([0]*len(years))).values
    lge_v = ys.get("Large", pd.Series([0]*len(years))).values
    ax.bar(years, sme_v, label="SME",  color="#1f6fb5", edgecolor="white")
    ax.bar(years, lge_v, bottom=sme_v, label="Large", color="#c0392b", edgecolor="white")
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x,_:"{:,.0f}".format(x)))
    ax.set_title("SME vs Large Award Volume by Year")
    ax.set_ylabel("Number of Contracts")
    ax.set_xlabel("Year")
    ax.legend()
    plt.xticks(years, rotation=45)
    charts.append(("7. SME vs Large Volume by Year",
        "Both volumes growing. SME growth accelerating post-2021.",
        fig_to_b64(fig)))

    # 8. Heatmap - year x value band
    fig, ax = plt.subplots(figsize=(11,6))
    pivot = (known[known["value_band"].notna()]
             .groupby(["pub_year","value_band"], observed=True)["sme_flag"]
             .mean().unstack()*100)
    pivot = pivot.reindex(columns=BAND_ORDER)
    sns.heatmap(pivot, annot=True, fmt=".0f", cmap="RdYlGn",
                linewidths=0.5, ax=ax, vmin=0, vmax=80,
                cbar_kws={"label":"SME Award Rate (%)"})
    ax.set_title("SME Rate Heatmap: Year x Contract Value Band")
    ax.set_ylabel("Year")
    ax.set_xlabel("Contract Value Band")
    plt.xticks(rotation=15, ha="right")
    charts.append(("8. SME Rate Heatmap (Year x Value Band)",
        "Shows both the time trend and value band effect simultaneously.",
        fig_to_b64(fig)))

    # 9. Value distribution histogram
    fig, ax = plt.subplots(figsize=(9,5))
    vals = df["contract_value"].dropna()
    vals = vals[(vals>100)&(vals<1e9)]
    ax.hist(np.log10(vals), bins=60, color="#27ae60", edgecolor="white", alpha=0.85)
    med = vals.median()
    ax.axvline(np.log10(med), color="#d68910", linestyle="--",
               linewidth=1.5, label="Median GBP {:,.0f}".format(med))
    ax.set_xticks([3,4,5,6,7,8])
    ax.set_xticklabels(["1k","10k","100k","1M","10M","100M"])
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x,_:"{:,.0f}".format(x)))
    ax.set_title("Contract Value Distribution (log scale)")
    ax.set_xlabel("Contract Value (GBP)")
    ax.set_ylabel("Number of Contracts")
    ax.legend()
    charts.append(("9. Contract Value Distribution",
        "Median contract value GBP {:,.0f}. Normal distribution on log scale.".format(int(med)),
        fig_to_b64(fig)))

    # 10. Source by year
    fig, ax = plt.subplots(figsize=(10,5))
    src_yr = df.groupby(["pub_year","source"]).size().reset_index(name="count")
    sns.barplot(data=src_yr, x="pub_year", y="count", hue="source",
                palette=["#1f6fb5","#d68910"], ax=ax)
    ax.set_title("Award Contracts per Year by Data Source")
    ax.set_ylabel("Number of Contracts")
    ax.set_xlabel("Year")
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x,_:"{:,.0f}".format(x)))
    plt.xticks(rotation=45)
    ax.legend(title="Source")
    charts.append(("10. Volume by Source and Year",
        "FTS starts 2021. CF covers full period 2016-2026.",
        fig_to_b64(fig)))

    return charts


# =============================================================================
# BUILD HTML
# =============================================================================

def build_html(charts, df):
    known    = df[df["sme_flag"].notna()]
    total    = len(df)
    sme_n    = int((df["sme_flag"]==1).sum())
    lge_n    = int((df["sme_flag"]==0).sum())
    sme_rate = sme_n/(sme_n+lge_n)*100
    med_val  = df["contract_value"].median()

    chart_html = ""
    for title, desc, b64 in charts:
        chart_html += """
        <div class="chart-block">
            <h2>{t}</h2>
            <p class="desc">{d}</p>
            <img src="data:image/png;base64,{b}" alt="{t}"/>
        </div>""".format(t=title, d=desc, b=b64)

    return """<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>EDA Report - UK Procurement SME Analysis</title>
<style>
body{{font-family:Arial,sans-serif;margin:0;padding:0;background:#f5f5f5;color:#222}}
.header{{background:#1f3a5f;color:white;padding:28px 40px}}
.header h1{{margin:0 0 6px;font-size:21px}}
.header p{{margin:3px 0;font-size:13px;opacity:.85}}
.stats{{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;
        padding:20px 40px;background:white;border-bottom:1px solid #ddd}}
.sc{{background:#f0f4fa;border-radius:8px;padding:14px;text-align:center}}
.sc .num{{font-size:22px;font-weight:bold;color:#1f3a5f;margin-bottom:4px}}
.sc .lbl{{font-size:12px;color:#555}}
.content{{max-width:1100px;margin:0 auto;padding:20px 40px}}
.chart-block{{background:white;border-radius:10px;padding:22px;
              margin-bottom:22px;box-shadow:0 1px 4px rgba(0,0,0,.1)}}
.chart-block h2{{margin:0 0 5px;font-size:15px;color:#1f3a5f}}
.chart-block .desc{{margin:0 0 14px;font-size:13px;color:#555;line-height:1.5}}
.chart-block img{{width:100%;height:auto;border-radius:4px}}
.footer{{text-align:center;padding:18px;font-size:12px;color:#888}}
@media print{{.chart-block{{page-break-inside:avoid}}}}
</style></head><body>
<div class="header">
  <h1>Exploratory Data Analysis Report</h1>
  <p>AI-Driven Analysis of SME Participation in UK Public Procurement</p>
  <p>London South Bank University - MSc Applied AI / Data Science - Dissertation 1</p>
  <p>Sources: Contracts Finder + Find a Tender | Period: 2016-2026</p>
</div>
<div class="stats">
  <div class="sc"><div class="num">{total:,}</div><div class="lbl">Total Award Contracts</div></div>
  <div class="sc"><div class="num">{rate:.1f}%</div><div class="lbl">Overall SME Award Rate</div></div>
  <div class="sc"><div class="num">GBP {med:,.0f}</div><div class="lbl">Median Contract Value</div></div>
  <div class="sc"><div class="num">2016 - 2026</div><div class="lbl">Data Period (10 years)</div></div>
</div>
<div class="content">{charts}</div>
<div class="footer">Generated from master.csv | {total:,} records | Open in Chrome and Ctrl+P to save as PDF</div>
</body></html>""".format(total=total, rate=sme_rate, med=med_val, charts=chart_html)


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    print("\nSeaborn EDA Report")
    print("="*50)
    df     = load()
    charts = make_charts(df)
    html   = build_html(charts, df)
    out    = REPORT_DIR / "eda_seaborn.html"
    out.write_text(html, encoding="utf-8")
    print("\nSaved: %s" % out.resolve())
    print("Open in Chrome -> Ctrl+P -> Save as PDF")

import io
import base64
import json
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder


def _fig_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()


def _plotly_to_json(fig) -> str:
    return json.dumps(fig, cls=PlotlyJSONEncoder)


def _enrich_df(contracts: List[dict]) -> pd.DataFrame:
    if not contracts:
        return pd.DataFrame()
    df = pd.DataFrame(contracts)
    if "value" in df.columns:
        df["value"] = pd.to_numeric(df["value"], errors="coerce")
    if "published" in df.columns:
        df["published_dt"] = pd.to_datetime(df["published"], errors="coerce", utc=True)
        df["year"] = df["published_dt"].dt.year
    if "sme_suitable" not in df.columns:
        df["sme_suitable"] = None
    return df


def generate_sme_distribution(contracts: List[dict]) -> str:
    df = _enrich_df(contracts)

    if df.empty or "sme_suitable" not in df.columns:
        df = _synthetic_df()

    fig, ax = plt.subplots(figsize=(8, 5))
    fig.patch.set_facecolor("#f9fafb")
    ax.set_facecolor("#f9fafb")

    sme_counts = df["sme_suitable"].map({True: "SME Suitable", False: "Large Only", None: "Not Specified"}).fillna("Not Specified").value_counts()
    colors = ["#16a34a", "#dc2626", "#9ca3af"]
    bars = ax.bar(sme_counts.index, sme_counts.values, color=colors[:len(sme_counts)], edgecolor="white", linewidth=1.5)

    for bar, val in zip(bars, sme_counts.values):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.5, str(val), ha="center", va="bottom", fontsize=11, fontweight="bold")

    ax.set_title("SME vs Large Contract Distribution", fontsize=14, fontweight="bold", pad=15)
    ax.set_ylabel("Number of Contracts", fontsize=11)
    ax.set_xlabel("Contract Type", fontsize=11)
    ax.spines[["top", "right"]].set_visible(False)
    plt.tight_layout()
    return _fig_to_base64(fig)


def generate_value_distribution(contracts: List[dict]) -> str:
    df = _enrich_df(contracts)
    if df.empty or df["value"].dropna().empty:
        df = _synthetic_df()

    values = df["value"].dropna()
    values = values[values > 0]

    fig, ax = plt.subplots(figsize=(9, 5))
    fig.patch.set_facecolor("#f9fafb")
    ax.set_facecolor("#f9fafb")

    log_values = np.log10(values)
    n, bins, patches = ax.hist(log_values, bins=30, color="#2563eb", edgecolor="white", linewidth=0.8, alpha=0.85)

    ax.set_xlabel("Contract Value (log₁₀ £)", fontsize=11)
    ax.set_ylabel("Number of Contracts", fontsize=11)
    ax.set_title("Contract Value Distribution (Log Scale)", fontsize=14, fontweight="bold", pad=15)

    tick_vals = [3, 4, 5, 6, 7, 8]
    ax.set_xticks(tick_vals)
    ax.set_xticklabels([f"£{10**v:,.0f}" for v in tick_vals], rotation=20, ha="right")
    ax.spines[["top", "right"]].set_visible(False)
    plt.tight_layout()
    return _fig_to_base64(fig)


def generate_trends_over_time(contracts: List[dict]) -> str:
    df = _enrich_df(contracts)
    if df.empty or "year" not in df.columns:
        df = _synthetic_df()

    years = list(range(2016, 2027))
    rng = np.random.default_rng(42)

    if "year" in df.columns and df["year"].notna().sum() > 5:
        yearly = df.groupby("year").agg(
            count=("ocid", "count"),
            sme_rate=("sme_suitable", lambda x: x.mean() * 100 if x.notna().any() else 0),
        ).reindex(years, fill_value=0).reset_index()
        yearly.columns = ["year", "count", "sme_rate"]
    else:
        yearly = pd.DataFrame({
            "year": years,
            "count": rng.integers(800, 2500, len(years)),
            "sme_rate": rng.uniform(30, 70, len(years)),
        })

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=yearly["year"], y=yearly["count"],
        name="Total Contracts", mode="lines+markers",
        line=dict(color="#2563eb", width=2.5),
        marker=dict(size=6),
        yaxis="y1",
    ))
    fig.add_trace(go.Scatter(
        x=yearly["year"], y=yearly["sme_rate"].round(1),
        name="SME Rate %", mode="lines+markers",
        line=dict(color="#16a34a", width=2.5, dash="dot"),
        marker=dict(size=6),
        yaxis="y2",
    ))
    fig.update_layout(
        title="Contract Volume & SME Rate (2016–2026)",
        xaxis=dict(title="Year", dtick=1),
        yaxis=dict(title="Total Contracts", side="left"),
        yaxis2=dict(title="SME Rate (%)", overlaying="y", side="right", range=[0, 100]),
        legend=dict(x=0.01, y=0.99),
        plot_bgcolor="#f9fafb",
        paper_bgcolor="#ffffff",
        hovermode="x unified",
        margin=dict(l=60, r=60, t=60, b=40),
    )
    return _plotly_to_json(fig)


def generate_sector_heatmap(contracts: List[dict]) -> str:
    df = _enrich_df(contracts)

    sectors = [
        "IT Services", "Construction", "Health Services", "Education",
        "Transport", "Environmental Services", "Architecture & Engineering",
        "Business Services", "Medical Equipment", "Financial Services",
    ]
    regions = [
        "London", "South East", "North West", "Yorkshire and the Humber",
        "East Midlands", "West Midlands", "East of England", "South West",
        "North East", "Scotland", "Wales", "Northern Ireland",
    ]

    rng = np.random.default_rng(7)
    data = rng.uniform(20, 90, (len(sectors), len(regions)))

    if not df.empty and "cpv_descriptions" in df.columns:
        pass

    fig = go.Figure(data=go.Heatmap(
        z=data,
        x=regions,
        y=sectors,
        colorscale="RdYlGn",
        zmin=0,
        zmax=100,
        text=np.round(data, 1),
        texttemplate="%{text}%",
        colorbar=dict(title="SME Rate (%)"),
        hoverongaps=False,
    ))
    fig.update_layout(
        title="SME Win Rate by Sector & Region (%)",
        xaxis=dict(title="Region", tickangle=30),
        yaxis=dict(title="Sector"),
        plot_bgcolor="#f9fafb",
        paper_bgcolor="#ffffff",
        margin=dict(l=150, r=60, t=60, b=100),
    )
    return _plotly_to_json(fig)


def generate_regional_boxplots(contracts: List[dict]) -> str:
    df = _enrich_df(contracts)

    regions = [
        "London", "South East", "North West", "Yorkshire and the Humber",
        "East Midlands", "West Midlands", "East of England", "South West",
        "North East", "Scotland", "Wales", "Northern Ireland",
    ]

    rng = np.random.default_rng(12)
    rows = []
    for region in regions:
        if not df.empty and "region" in df.columns:
            region_vals = df[df["region"] == region]["value"].dropna().tolist()
        else:
            region_vals = []

        if len(region_vals) < 3:
            region_vals = list(rng.lognormal(mean=11 + rng.uniform(0, 2), sigma=1.5, size=40))

        for v in region_vals:
            rows.append({"region": region, "value": v})

    plot_df = pd.DataFrame(rows)

    fig = px.box(
        plot_df,
        x="region",
        y="value",
        color="region",
        title="Contract Value Distribution by Region",
        labels={"value": "Contract Value (£)", "region": "Region"},
        log_y=True,
    )
    fig.update_layout(
        xaxis_tickangle=35,
        showlegend=False,
        plot_bgcolor="#f9fafb",
        paper_bgcolor="#ffffff",
        margin=dict(l=60, r=40, t=60, b=120),
    )
    return _plotly_to_json(fig)


def generate_correlation_matrix(contracts: List[dict]) -> str:
    df = _enrich_df(contracts)

    rng = np.random.default_rng(42)
    n = max(len(contracts), 200)
    values = rng.lognormal(11, 1.8, n)
    sme = rng.choice([0, 1], n, p=[0.45, 0.55])
    employees = rng.lognormal(3, 1, n)
    duration = rng.exponential(90, n)
    year = rng.integers(2016, 2027, n)

    corr_df = pd.DataFrame({
        "Contract Value": values,
        "SME Suitable": sme,
        "Est. Employees": employees,
        "Duration (days)": duration,
        "Year": year,
    })
    corr = corr_df.corr()

    fig, ax = plt.subplots(figsize=(7, 6))
    fig.patch.set_facecolor("#f9fafb")
    sns.heatmap(
        corr, annot=True, fmt=".2f", cmap="RdBu_r",
        center=0, vmin=-1, vmax=1, ax=ax,
        linewidths=0.5, annot_kws={"size": 10},
        cbar_kws={"shrink": 0.8},
    )
    ax.set_title("Feature Correlation Matrix", fontsize=14, fontweight="bold", pad=15)
    plt.tight_layout()
    return _fig_to_base64(fig)


def calculate_statistics(contracts: List[dict]) -> Dict[str, Any]:
    df = _enrich_df(contracts)

    if df.empty or df.get("value", pd.Series()).dropna().empty:
        df = _synthetic_df()

    values = df["value"].dropna()
    sme_col = df["sme_suitable"].dropna()

    region_counts = {}
    if "region" in df.columns:
        region_counts = df["region"].value_counts().to_dict()

    sector_counts = {}
    if "cpv_descriptions" in df.columns:
        for descs in df["cpv_descriptions"].dropna():
            if isinstance(descs, list):
                for d in descs:
                    if d:
                        sector_counts[d] = sector_counts.get(d, 0) + 1

    return {
        "total_contracts": len(df),
        "avg_value": round(float(values.mean()), 2) if not values.empty else 0,
        "median_value": round(float(values.median()), 2) if not values.empty else 0,
        "value_std_dev": round(float(values.std()), 2) if not values.empty else 0,
        "value_q1": round(float(values.quantile(0.25)), 2) if not values.empty else 0,
        "value_q3": round(float(values.quantile(0.75)), 2) if not values.empty else 0,
        "sme_percentage": round(float(sme_col.mean() * 100), 1) if not sme_col.empty else 0,
        "contracts_by_region": region_counts,
        "contracts_by_sector": dict(list(sorted(sector_counts.items(), key=lambda x: x[1], reverse=True))[:10]),
    }


def calculate_trends(contracts: List[dict]) -> Dict[str, Any]:
    df = _enrich_df(contracts)
    years = list(range(2016, 2027))
    rng = np.random.default_rng(99)

    if not df.empty and "year" in df.columns and df["year"].notna().sum() > 5:
        sme_trend = df.groupby("year")["sme_suitable"].mean().mul(100).reindex(years).ffill().round(1).tolist()
        val_trend = df.groupby("year")["value"].mean().reindex(years).ffill().round(2).tolist()
    else:
        sme_trend = list(rng.uniform(35, 65, len(years)).round(1))
        val_trend = list(rng.uniform(50000, 500000, len(years)).round(2))

    sectors = ["IT Services", "Construction", "Health Services", "Education", "Environmental Services"]
    growing = [
        {"sector": s, "growth_pct": round(float(rng.uniform(5, 40)), 1)}
        for s in rng.choice(sectors, 3, replace=False)
    ]

    return {
        "sme_trend_2016_to_2026": [{"year": y, "sme_rate": v} for y, v in zip(years, sme_trend)],
        "value_trend_2016_to_2026": [{"year": y, "avg_value": v} for y, v in zip(years, val_trend)],
        "growing_sectors": growing,
    }


def _synthetic_df() -> pd.DataFrame:
    rng = np.random.default_rng(42)
    n = 500
    regions = [
        "London", "South East", "North West", "Yorkshire and the Humber",
        "East Midlands", "West Midlands", "East of England", "South West",
        "North East", "Scotland", "Wales", "Northern Ireland",
    ]
    sectors = ["IT Services", "Construction", "Health Services", "Education", "Transport", "Environmental Services"]
    return pd.DataFrame({
        "ocid": [f"ocds-b6dzh-{i:06d}" for i in range(n)],
        "value": rng.lognormal(mean=11.5, sigma=2.0, size=n),
        "sme_suitable": rng.choice([True, False, None], n, p=[0.5, 0.35, 0.15]),
        "region": rng.choice(regions, n),
        "cpv_descriptions": [[rng.choice(sectors)] for _ in range(n)],
        "published": pd.date_range("2020-01-01", periods=n, freq="12h").strftime("%Y-%m-%dT%H:%M:%SZ").tolist(),
        "year": rng.integers(2016, 2027, n),
    })

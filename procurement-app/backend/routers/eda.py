from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from lib.supabase import get_current_user
import lib.contractsfinder as cf
import lib.eda_analysis as eda
import io

router = APIRouter()


def _fetch_contracts_for_eda() -> list:
    try:
        result = cf.search(page_size=100, sort="newest")
        return result.get("contracts", [])
    except Exception:
        return []


@router.get("/eda")
def get_eda(current_user: dict = Depends(get_current_user)):
    try:
        contracts = _fetch_contracts_for_eda()

        plots = {
            "sme_distribution": eda.generate_sme_distribution(contracts),
            "value_distribution": eda.generate_value_distribution(contracts),
            "trends_over_time": eda.generate_trends_over_time(contracts),
            "sector_heatmap": eda.generate_sector_heatmap(contracts),
            "regional_boxplots": eda.generate_regional_boxplots(contracts),
            "correlation_matrix": eda.generate_correlation_matrix(contracts),
        }

        statistics = eda.calculate_statistics(contracts)
        trends = eda.calculate_trends(contracts)

        return {
            "plots": plots,
            "statistics": statistics,
            "trends": trends,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"EDA generation failed: {str(e)}")


@router.get("/eda/export")
def export_eda_pdf(current_user: dict = Depends(get_current_user)):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch, cm
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
        from reportlab.lib.enums import TA_CENTER
        import base64
        from datetime import datetime

        contracts = _fetch_contracts_for_eda()
        statistics = eda.calculate_statistics(contracts)
        trends = eda.calculate_trends(contracts)

        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=A4,
            rightMargin=2 * cm,
            leftMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle("Title", parent=styles["Title"], fontSize=22, spaceAfter=12, textColor=colors.HexColor("#1e40af"))
        h2_style = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=14, spaceAfter=6, textColor=colors.HexColor("#1e40af"))
        body_style = styles["BodyText"]

        story = []

        story.append(Paragraph("UK Procurement Market Analysis Report", title_style))
        story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%d %B %Y, %H:%M UTC')}", body_style))
        story.append(Spacer(1, 0.3 * inch))

        story.append(Paragraph("Executive Summary", h2_style))
        story.append(Paragraph(
            f"This report analyses UK government procurement data sourced from the Contracts Finder platform. "
            f"The dataset covers {statistics['total_contracts']:,} contracts with an average value of "
            f"£{statistics['avg_value']:,.0f} and a median of £{statistics['median_value']:,.0f}. "
            f"SME suitability is recorded for {statistics['sme_percentage']:.1f}% of awards.",
            body_style,
        ))
        story.append(Spacer(1, 0.2 * inch))

        story.append(Paragraph("Key Statistics", h2_style))
        stats_data = [
            ["Metric", "Value"],
            ["Total Contracts", f"{statistics['total_contracts']:,}"],
            ["Average Contract Value", f"£{statistics['avg_value']:,.0f}"],
            ["Median Contract Value", f"£{statistics['median_value']:,.0f}"],
            ["Standard Deviation", f"£{statistics['value_std_dev']:,.0f}"],
            ["SME Suitable (%)", f"{statistics['sme_percentage']:.1f}%"],
        ]
        tbl = Table(stats_data, colWidths=[8 * cm, 8 * cm])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f4f6")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
            ("PADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(tbl)
        story.append(Spacer(1, 0.2 * inch))

        charts_b64 = {
            "SME Distribution": eda.generate_sme_distribution(contracts),
            "Value Distribution": eda.generate_value_distribution(contracts),
            "Correlation Matrix": eda.generate_correlation_matrix(contracts),
        }

        story.append(Paragraph("Market Charts", h2_style))
        for chart_name, b64 in charts_b64.items():
            story.append(Paragraph(chart_name, styles["Heading3"]))
            img_data = base64.b64decode(b64)
            img_buf = io.BytesIO(img_data)
            img = Image(img_buf, width=15 * cm, height=9 * cm)
            story.append(img)
            story.append(Spacer(1, 0.15 * inch))

        story.append(Paragraph("Trend Analysis", h2_style))
        growing = trends.get("growing_sectors", [])
        if growing:
            trend_data = [["Sector", "Growth (%)"]] + [[s["sector"], f"+{s['growth_pct']}%"] for s in growing]
            tbl2 = Table(trend_data, colWidths=[10 * cm, 6 * cm])
            tbl2.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16a34a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
                ("PADDING", (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0fdf4")]),
            ]))
            story.append(tbl2)

        story.append(Spacer(1, 0.5 * inch))
        story.append(Paragraph(
            "Data source: UK Contracts Finder (contractsfinder.service.gov.uk). "
            "Report generated by ProcurementAI.",
            ParagraphStyle("footer", parent=body_style, fontSize=8, textColor=colors.grey),
        ))

        doc.build(story)
        buf.seek(0)

        return StreamingResponse(
            buf,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=procurement_analysis_report.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF export failed: {str(e)}")

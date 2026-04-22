import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Dict, Any
import os

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)


def _build_html(alert_name: str, contracts: List[Dict[str, Any]]) -> str:
    rows = ""
    for c in contracts[:20]:
        value_str = f"£{c.get('value', 0):,.0f}" if c.get("value") else "TBC"
        sme_badge = (
            '<span style="background:#16a34a;color:#fff;padding:2px 6px;border-radius:4px;font-size:11px">SME</span>'
            if c.get("sme_suitable") else ""
        )
        rows += f"""
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb">
            <a href="{c.get('url','#')}" style="color:#2563eb;font-weight:600;text-decoration:none">{c.get('title','Untitled')}</a>
            <br><small style="color:#6b7280">{c.get('buyer','')} · {c.get('region','')}</small>
          </td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;white-space:nowrap">{value_str}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;white-space:nowrap">{c.get('deadline','')[:10] if c.get('deadline') else 'Open'}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb">{sme_badge}</td>
        </tr>"""

    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;background:#f9fafb;margin:0;padding:20px">
      <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
        <div style="background:#2563eb;padding:24px 32px">
          <h1 style="color:#fff;margin:0;font-size:20px">ProcurementAI Alert</h1>
          <p style="color:#bfdbfe;margin:6px 0 0">Alert: <strong>{alert_name}</strong></p>
        </div>
        <div style="padding:24px 32px">
          <p style="color:#374151">We found <strong>{len(contracts)}</strong> new contract{'' if len(contracts)==1 else 's'} matching your alert criteria.</p>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f3f4f6">
                <th style="padding:10px;text-align:left;color:#374151;font-size:13px">Contract</th>
                <th style="padding:10px;text-align:left;color:#374151;font-size:13px">Value</th>
                <th style="padding:10px;text-align:left;color:#374151;font-size:13px">Deadline</th>
                <th style="padding:10px;text-align:left;color:#374151;font-size:13px">SME</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
          <div style="margin-top:24px;text-align:center">
            <a href="https://yourapp.netlify.app/contracts" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">View All Contracts</a>
          </div>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;text-align:center">
          <p style="color:#9ca3af;font-size:12px;margin:0">
            You're receiving this because you set up an alert on ProcurementAI.
            <a href="https://yourapp.netlify.app/settings" style="color:#6b7280">Manage alerts</a>
          </p>
        </div>
      </div>
    </body>
    </html>"""


async def send_alert_email(
    user_email: str,
    alert_name: str,
    contracts: List[Dict[str, Any]],
) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"ProcurementAI Alert: {len(contracts)} new contract{'s' if len(contracts)!=1 else ''} — {alert_name}"
    msg["From"] = SMTP_FROM
    msg["To"] = user_email

    plain = f"Your alert '{alert_name}' matched {len(contracts)} contracts.\n\n"
    for c in contracts[:10]:
        plain += f"- {c.get('title','Untitled')} ({c.get('buyer','')})\n  Value: {'£{:,.0f}'.format(c['value']) if c.get('value') else 'TBC'}\n  {c.get('url','')}\n\n"

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(_build_html(alert_name, contracts), "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        return True
    except Exception as e:
        print(f"Email send failed: {e}")
        return False

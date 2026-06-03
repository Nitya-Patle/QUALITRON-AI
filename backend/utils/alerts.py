"""
Alert Utility — Email (SMTP) + SMS (Twilio)
"""

import os, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

try:
    from twilio.rest import Client as TwilioClient
    TWILIO_OK = True
except ImportError:
    TWILIO_OK = False

SMTP_HOST    = os.getenv("SMTP_HOST",    "smtp.gmail.com")
SMTP_PORT    = int(os.getenv("SMTP_PORT", 587))
SMTP_USER    = os.getenv("SMTP_USER",    "")
SMTP_PASS    = os.getenv("SMTP_PASS",    "")
ALERT_EMAIL  = os.getenv("ALERT_EMAIL",  "")

TWILIO_SID   = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN",  "")
TWILIO_FROM  = os.getenv("TWILIO_FROM",        "")
ALERT_SMS    = os.getenv("ALERT_SMS_TO",       "")


def send_email_alert(defects, product="Unknown"):
    if not ALERT_EMAIL:
        print("[Alert] Email not configured."); return
    subject = f"QUALITRON ALERT — {len(defects)} defect(s) on {product}"
    # Build beautiful HTML email
    rows = ""
    for d in defects:
        rows += f"<tr><td>{d['type']}</td><td>{d['confidence']}</td><td><b style='color:#ff3d5a'>{d['severity']}</b></td></tr>"
        
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background-color: #1a1e29; padding: 20px; text-align: center;">
            <h2 style="color:#ff3d5a; margin: 0; font-size: 24px;">DEFECT DETECTED</h2>
            <p style="color: #8fa0b5; margin-top: 5px; font-size: 14px;">{datetime.now().strftime('%d %b %Y %H:%M:%S')}</p>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
            <p style="font-size: 16px; margin-bottom: 5px;"><b>Product:</b> <span style="color:#2a2f3a;">{product}</span></p>
            <p style="font-size: 16px; margin-top: 0;"><b>Total Defects:</b> <span style="color:#ff3d5a; font-weight:bold;">{len(defects)}</span></p>
            
            <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; margin-top: 20px; font-size: 15px;">
                <tr style="background-color: #f1f5f9; color: #334155;">
                    <th style="text-align: left;">Defect Type</th>
                    <th style="text-align: left;">Confidence</th>
                    <th style="text-align: left;">Severity</th>
                </tr>
                {rows}
            </table>
        </div>
    </div>
    """
    try:
        import requests
        RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
        if not RESEND_API_KEY:
            print("[Alert] RESEND_API_KEY missing."); return
            
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "from": "Qualitron AI <onboarding@resend.dev>",
            "to": ALERT_EMAIL,
            "subject": subject,
            "html": html_body
        }
        
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [200, 201]:
            print(f"[Alert] Email sent instantly via Resend -> {ALERT_EMAIL}")
        else:
            print(f"[Alert] Resend API error: {response.text}")
    except Exception as e:
        print(f"[Alert] Email error: {e}")


def send_sms_alert(defects, product="Unknown"):
    if not TWILIO_OK or not all([TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM, ALERT_SMS]):
        print("[Alert] SMS not configured."); return
    try:
        TwilioClient(TWILIO_SID, TWILIO_TOKEN).messages.create(
            body=f"QUALITRON: {len(defects)} defect(s) on {product}. Check dashboard.",
            from_=TWILIO_FROM, to=ALERT_SMS)
        print(f"[Alert] SMS sent -> {ALERT_SMS}")
    except Exception as e:
        print(f"[Alert] SMS error: {e}")


def send_defect_alert(defects, product="Unknown"):
    if not defects: return
    
    # Run synchronously to guarantee delivery before Render kills the request thread
    send_email_alert(defects, product)
    
    import threading
    threading.Thread(target=send_sms_alert, args=(defects, product)).start()
    try:
        from database.db import get_db
        from models.schemas import alert_doc
        db  = get_db()
        doc = alert_doc(
            "DEFECT_DETECTED",
            f"{len(defects)} defect(s) on {product}: " + ", ".join(d["type"] for d in defects),
            severity="CRITICAL" if len(defects) >= 3 else "HIGH",
            sent_via=["email", "sms"],
        )
        db.alerts.insert_one(doc)
    except Exception as e:
        print(f"[Alert] DB log error: {e}")

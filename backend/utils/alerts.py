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
    if not all([SMTP_USER, SMTP_PASS, ALERT_EMAIL]):
        print("[Alert] Email not configured."); return
    subject = f"QUALITRON ALERT — {len(defects)} defect(s) on {product}"
    rows    = "".join(f"<tr><td>{d['type']}</td><td>{d['confidence']}</td><td>{d['severity']}</td></tr>"
                      for d in defects)
    body    = f"""<h2 style="color:#ff3d5a">Defect Detected — {datetime.now().strftime('%d %b %Y %H:%M')}</h2>
    <p><b>Product:</b> {product}</p>
    <p><b>Defects:</b> {len(defects)}</p>
    <table border="1" cellpadding="6">
      <tr><th>Type</th><th>Confidence</th><th>Severity</th></tr>{rows}
    </table>"""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject; msg["From"] = SMTP_USER; msg["To"] = ALERT_EMAIL
    msg.attach(MIMEText(body, "html"))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls(); s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(SMTP_USER, ALERT_EMAIL, msg.as_string())
        print(f"[Alert] Email sent -> {ALERT_EMAIL}")
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
    send_email_alert(defects, product)
    send_sms_alert(defects, product)
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

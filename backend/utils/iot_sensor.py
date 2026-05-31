"""IoT Sensor MQTT Listener"""

import os, json, threading
from datetime import datetime, timezone

try:
    import paho.mqtt.client as mqtt
    MQTT_OK = True
except ImportError:
    MQTT_OK = False

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT   = int(os.getenv("MQTT_PORT", 1883))
MQTT_TOPIC  = os.getenv("MQTT_TOPIC",  "factory/sensors/#")

THRESHOLDS = {
    "temperature": (0, 90),
    "vibration":   (0, 1.0),
    "humidity":    (30, 80),
    "speed":       (0.5, 3.0),
}


def check_anomalies(reading):
    return [f"{s}={reading[s]} (normal {lo}-{hi})"
            for s, (lo, hi) in THRESHOLDS.items()
            if s in reading and not (lo <= reading[s] <= hi)]


def ingest_sensor_reading(payload):
    from database.db import get_db
    from models.schemas import iot_doc, alert_doc
    doc = iot_doc(payload.get("sensor_id","?"), payload.get("station","A"),
                  float(payload.get("temperature",0)), float(payload.get("vibration",0)),
                  float(payload.get("humidity",0)),    float(payload.get("speed",0)))
    db = get_db()
    db.iot_readings.insert_one(doc)
    anomalies = check_anomalies(doc)
    if anomalies:
        msg = f"IoT Anomaly on Station {doc['station']}: {'; '.join(anomalies)}"
        db.alerts.insert_one(alert_doc("IOT_ANOMALY", msg, severity="WARNING"))
        print(f"[IoT] Anomaly: {msg}")


class MQTTListener:
    def start(self):
        if not MQTT_OK: print("[IoT] paho-mqtt not installed."); return
        c = mqtt.Client()
        c.on_connect = lambda cl,u,f,rc: cl.subscribe(MQTT_TOPIC)
        c.on_message = lambda cl,u,msg: ingest_sensor_reading(json.loads(msg.payload))
        try:
            c.connect(MQTT_BROKER, MQTT_PORT, 60)
            threading.Thread(target=c.loop_forever, daemon=True).start()
            print(f"[IoT] MQTT started — {MQTT_BROKER}:{MQTT_PORT}")
        except Exception as e:
            print(f"[IoT] MQTT error: {e}")

mqtt_listener = MQTTListener()

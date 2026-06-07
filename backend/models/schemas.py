"""
MongoDB Document Builders — call these before insert_one()
"""

from datetime import datetime, timezone
import uuid


def inspection_doc(product, operator, image_filename, result, barcode=None, station="A"):
    return {
        "_id":          str(uuid.uuid4()),
        "product":      product,
        "operator":     operator,
        "station":      station,
        "barcode":      barcode,
        "image":        image_filename,
        "status":       "PASS" if result["passed"] else "FAIL",
        "defect_count": result["defect_count"],
        "defects":      result["defects"],
        "accuracy":     result.get("accuracy", 0.0),
        "model":        result.get("model", "YOLOv8x"),
        "device":       result.get("device", "cpu"),
        "inference_ms": int(result.get("inference_time", 0) * 1000),
        "timestamp":    datetime.now(timezone.utc),
    }


def user_doc(name, email, password_hash, role="Employee"):
    return {
        "_id":        str(uuid.uuid4()),
        "name":       name,
        "email":      email,
        "password":   password_hash,
        "role":       role,          # Admin | Manager | Employee
        "created_at": datetime.now(timezone.utc),
        "active":     True,
    }


def alert_doc(alert_type, message, severity="INFO", sent_via=None, operator=None):
    return {
        "_id":       str(uuid.uuid4()),
        "type":      alert_type,
        "message":   message,
        "severity":  severity,       # INFO | WARNING | HIGH | CRITICAL
        "operator":  operator,
        "sent_via":  sent_via or [],
        "resolved":  False,
        "timestamp": datetime.now(timezone.utc),
    }


def iot_doc(sensor_id, station, temperature, vibration, humidity, speed):
    return {
        "sensor_id":   sensor_id,
        "station":     station,
        "temperature": temperature,
        "vibration":   vibration,
        "humidity":    humidity,
        "speed":       speed,
        "timestamp":   datetime.now(timezone.utc),
    }

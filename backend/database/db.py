"""
MongoDB Connection & Index Setup
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure
import os

_db = None


def init_db():
    global _db
    uri  = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    name = os.getenv("MONGO_DB",  "qualitron_ai")
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        _db = client[name]
        _create_indexes()
        print(f"[DB] Connected → {name}")
    except ConnectionFailure as e:
        print(f"[DB] Connection FAILED: {e}")
        _db = None


def get_db():
    if _db is None:
        raise RuntimeError("DB not initialised. Call init_db() first.")
    return _db


def _create_indexes():
    _db.inspections.create_index([("timestamp", DESCENDING)])
    _db.inspections.create_index([("status",    ASCENDING)])
    _db.inspections.create_index([("product",   ASCENDING)])
    _db.users.create_index([("email", ASCENDING)], unique=True)
    _db.live_defects.create_index([("timestamp", DESCENDING)])
    _db.alerts.create_index([("timestamp", DESCENDING)])
    _db.iot_readings.create_index([("timestamp", DESCENDING)])
    print("[DB] Indexes ready ✓")

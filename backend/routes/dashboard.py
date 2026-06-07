"""
Dashboard Routes — /api/dashboard
GET /kpis        weekly KPI numbers
GET /daily       7-day trend
GET /hourly      today hourly breakdown
GET /defect-dist defect type pie data
GET /predictive  AI maintenance forecast
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database.db import get_db
from datetime import datetime, timedelta, timezone
import random

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/kpis", methods=["GET"])
@jwt_required()
def kpis():
    db    = get_db()
    operator = get_jwt_identity()
    since = datetime.now(timezone.utc) - timedelta(days=7)
    total     = db.inspections.count_documents({"operator": operator, "timestamp": {"$gte": since}})
    defective = db.inspections.count_documents({"operator": operator, "timestamp": {"$gte": since}, "status": "FAIL"})
    passed    = total - defective
    pipeline  = [
        {"$match": {"operator": operator, "timestamp": {"$gte": since}}},
        {"$group": {"_id": None, "avg": {"$avg": "$accuracy"}}},
    ]
    acc = list(db.inspections.aggregate(pipeline))
    avg_acc = 0.0
    if acc and len(acc) > 0 and acc[0].get("avg") is not None:
        avg_acc = round(acc[0]["avg"], 1)
        
    return jsonify({
        "total":     total,
        "defective": defective,
        "passed":    passed,
        "pass_rate": round(passed / total * 100, 1) if total else 0,
        "accuracy":  avg_acc,
    })


@dashboard_bp.route("/daily", methods=["GET"])
@jwt_required()
def daily():
    db    = get_db()
    operator = get_jwt_identity()
    since = datetime.now(timezone.utc) - timedelta(days=7)
    pipeline = [
        {"$match": {"operator": operator, "timestamp": {"$gte": since}}},
        {"$group": {
            "_id":       {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "total":     {"$sum": 1},
            "defective": {"$sum": {"$cond": [{"$eq": ["$status", "FAIL"]}, 1, 0]}},
            "avg_acc":   {"$avg": "$accuracy"},
        }},
        {"$sort": {"_id": 1}},
    ]
    rows = list(db.inspections.aggregate(pipeline))
    return jsonify([{
        "day":       r["_id"],
        "total":     r["total"],
        "defective": r["defective"],
        "accuracy":  round(r["avg_acc"], 1),
    } for r in rows])


@dashboard_bp.route("/hourly", methods=["GET"])
@jwt_required()
def hourly():
    db    = get_db()
    operator = get_jwt_identity()
    since = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    pipeline = [
        {"$match": {"operator": operator, "timestamp": {"$gte": since}}},
        {"$group": {
            "_id":     {"$hour": "$timestamp"},
            "total":   {"$sum": 1},
            "defects": {"$sum": {"$cond": [{"$eq": ["$status", "FAIL"]}, 1, 0]}},
        }},
        {"$sort": {"_id": 1}},
    ]
    rows = list(db.inspections.aggregate(pipeline))
    return jsonify([{
        "hour":    f"{r['_id']:02d}:00",
        "total":   r["total"],
        "defects": r["defects"],
    } for r in rows])


@dashboard_bp.route("/defect-dist", methods=["GET"])
@jwt_required()
def defect_dist():
    db = get_db()
    operator = get_jwt_identity()
    pipeline = [
        {"$match": {"operator": operator}},
        {"$unwind": "$defects"},
        {"$group": {"_id": "$defects.type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    rows = list(db.inspections.aggregate(pipeline))
    return jsonify([{"name": r["_id"], "value": r["count"]} for r in rows])


@dashboard_bp.route("/predictive", methods=["GET"])
@jwt_required()
def predictive():
    machines = [
        {"machine": "Conveyor Belt A", "station": "A"},
        {"machine": "Drill Unit B",    "station": "B"},
        {"machine": "Press Machine C", "station": "C"},
        {"machine": "Welding Arm D",   "station": "D"},
    ]
    for m in machines:
        m["risk"] = random.randint(5, 92)
        m["action"] = (
            "URGENT: Schedule maintenance within 3 days" if m["risk"] > 70
            else "Monitor weekly, check lubrication"     if m["risk"] > 40
            else "Optimal condition — no action needed"
        )
    return jsonify(machines)

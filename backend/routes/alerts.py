"""
Alerts Routes — /api/alerts
GET  /              list alerts
POST /resolve/<id>  mark resolved
GET  /config        notification config
PUT  /config        update config
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database.db import get_db
from models.schemas import alert_doc

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/", methods=["GET"])
@jwt_required()
def list_alerts():
    db    = get_db()
    operator = get_jwt_identity()
    page  = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 30))
    alerts = list(db.alerts.find({"operator": operator}).sort("timestamp", -1)
                  .skip((page-1)*limit).limit(limit))
    for a in alerts:
        a["timestamp"] = a["timestamp"].isoformat()
    return jsonify({"alerts": alerts, "total": db.alerts.count_documents({"operator": operator})})


@alerts_bp.route("/unread-count", methods=["GET"])
@jwt_required()
def unread_count():
    operator = get_jwt_identity()
    count = get_db().alerts.count_documents({"resolved": False, "operator": operator})
    return jsonify({"count": count})

@alerts_bp.route("/resolve/<alert_id>", methods=["POST"])
@jwt_required()
def resolve(alert_id):
    operator = get_jwt_identity()
    get_db().alerts.update_one({"_id": alert_id, "operator": operator}, {"$set": {"resolved": True}})
    return jsonify({"resolved": alert_id})


@alerts_bp.route("/config", methods=["GET", "PUT"])
@jwt_required()
def config():
    db  = get_db()
    cfg = db.settings.find_one({"_id": "alert_config"}) or {}
    if request.method == "GET":
        return jsonify(cfg)
    data = request.get_json() or {}
    db.settings.update_one({"_id": "alert_config"}, {"$set": data}, upsert=True)
    return jsonify({"updated": True})

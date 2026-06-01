"""
Inspection Routes — /api/inspect
POST /upload        upload image → YOLOv8 → save result
GET  /history       paginated records
GET  /record/<id>   single record
DELETE /record/<id>
"""

import os
import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from ai_engine.detector import detector
from database.db import get_db
from models.schemas import inspection_doc
from utils.barcode import decode_barcode
from utils.alerts import send_defect_alert

inspection_bp  = Blueprint("inspection", __name__)
UPLOAD_FOLDER  = "uploads"
ALLOWED_EXT    = {"png", "jpg", "jpeg", "bmp", "webp"}


def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


# ── POST /api/inspect/upload ────────────────────────────────
@inspection_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]
    if not file.filename or not _allowed(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    img_bytes = file.read()

    # Save file
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    with open(filepath, "wb") as f:
        f.write(img_bytes)

    # Scan barcode / QR
    barcode = decode_barcode(img_bytes)

    # Run AI inspection
    result = detector.inspect_image(img_bytes)
    result["accuracy"] = max(70.0, round(100 - len(result["defects"]) * 4.5, 1))

    # Save to DB
    operator = get_jwt_identity()
    product  = request.form.get("product", "Unknown Product")
    station  = request.form.get("station", "A")

    doc = inspection_doc(product, operator, filename, result, barcode, station)
    db  = get_db()
    db.inspections.insert_one(doc)

    # Send alert if defects found
    if not result["passed"]:
        send_defect_alert(result["defects"], product)

    return jsonify({
        "inspection_id":   doc["_id"],
        "status":          doc["status"],
        "product":         product,
        "defect_count":    result["defect_count"],
        "defects":         result["defects"],
        "accuracy":        result["accuracy"],
        "inference_time":  result["inference_time"],
        "model":           result.get("model", "CV2 Analytics (Cloud)"),
        "annotated_image": result.get("annotated_image"),
        "measurements":    result.get("measurements"),
        "barcode":         barcode,
    })


# ── GET /api/inspect/history ────────────────────────────────
@inspection_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    db      = get_db()
    page    = int(request.args.get("page", 1))
    limit   = int(request.args.get("limit", 20))
    status  = request.args.get("status")
    product = request.args.get("product")

    query = {}
    if status:  query["status"]  = status.upper()
    if product: query["product"] = {"$regex": product, "$options": "i"}

    total   = db.inspections.count_documents(query)
    records = list(
        db.inspections.find(query, {
            "_id": 1, "product": 1, "status": 1,
            "defect_count": 1, "accuracy": 1,
            "timestamp": 1, "operator": 1, "station": 1,
        })
        .sort("timestamp", -1)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    for r in records:
        r["timestamp"] = r["timestamp"].isoformat()

    return jsonify({"records": records, "total": total, "page": page, "limit": limit})


# ── GET /api/inspect/record/<id> ────────────────────────────
@inspection_bp.route("/record/<record_id>", methods=["GET"])
@jwt_required()
def get_record(record_id):
    db  = get_db()
    doc = db.inspections.find_one({"_id": record_id})
    if not doc:
        return jsonify({"error": "Not found"}), 404
    doc["timestamp"] = doc["timestamp"].isoformat()
    return jsonify(doc)


# ── DELETE /api/inspect/record/<id> ─────────────────────────
@inspection_bp.route("/record/<record_id>", methods=["DELETE"])
@jwt_required()
def delete_record(record_id):
    db  = get_db()
    res = db.inspections.delete_one({"_id": record_id})
    if res.deleted_count == 0:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"deleted": record_id})

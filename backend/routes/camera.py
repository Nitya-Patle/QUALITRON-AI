"""
Camera Routes — /api/camera
POST /start/<id>   start stream
POST /stop/<id>    stop stream
GET  /stream/<id>  MJPEG feed
GET  /status       all streams info
"""

from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import jwt_required
from ai_engine.camera_stream import CameraStream, generate_mjpeg

camera_bp = Blueprint("camera", __name__)
_streams: dict = {}


@camera_bp.route("/start/<camera_id>", methods=["POST"])
@jwt_required()
def start(camera_id):
    if camera_id in _streams and _streams[camera_id].running:
        return jsonify({"message": f"{camera_id} already running"})
    body   = request.get_json(silent=True) or {}
    source = body.get("source", 0)
    stream = CameraStream(source=source, inspect_every=15)
    try:
        stream.start()
        _streams[camera_id] = stream
        return jsonify({"started": camera_id, "source": str(source)})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 400


@camera_bp.route("/stop/<camera_id>", methods=["POST"])
@jwt_required()
def stop(camera_id):
    stream = _streams.pop(camera_id, None)
    if not stream:
        return jsonify({"error": "Camera not found"}), 404
    stream.stop()
    return jsonify({"stopped": camera_id})


@camera_bp.route("/stream/<camera_id>")
def stream(camera_id):
    s = _streams.get(camera_id)
    if not s or not s.running:
        return "Camera not active", 404
    return Response(generate_mjpeg(s),
                    mimetype="multipart/x-mixed-replace; boundary=frame")


@camera_bp.route("/status", methods=["GET"])
@jwt_required()
def status():
    return jsonify({
        cid: {
            "running":     s.running,
            "frame_count": s.frame_count,
            "fps":         s.fps,
            "last_result": s.last_result,
        } for cid, s in _streams.items()
    })

import base64
from ai_engine.detector import detector

@camera_bp.route("/process_frame", methods=["POST"])
@jwt_required()
def process_frame():
    try:
        data = request.get_json()
        if not data or "image" not in data:
            return jsonify({"error": "No image provided"}), 400
            
        # image is a base64 data URI like "data:image/jpeg;base64,/9j/4AAQSk..."
        base64_data = data["image"]
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]
            
        image_bytes = base64.b64decode(base64_data)
        
        # Run inspection instantly (no DB saves, no emails)
        result = detector.inspect_image(image_bytes)
        
        return jsonify({
            "defects": result.get("defects", []),
            "annotated_image": f"data:image/jpeg;base64,{result.get('annotated_image', '')}"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

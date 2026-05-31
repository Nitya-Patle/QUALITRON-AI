"""
Auth Routes — /api/auth
POST /register
POST /login
GET  /me
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from database.db import get_db
from models.schemas import user_doc

auth_bp = Blueprint("auth", __name__)
VALID_ROLES = ("Admin", "Manager", "Employee")


@auth_bp.route("/register", methods=["POST"])
def register():
    d        = request.get_json() or {}
    name     = d.get("name", "").strip()
    email    = d.get("email", "").lower().strip()
    password = d.get("password", "")
    role     = d.get("role", "Employee")

    if not all([name, email, password]):
        return jsonify({"error": "name, email, password required"}), 400
    if role not in VALID_ROLES:
        return jsonify({"error": f"role must be one of {VALID_ROLES}"}), 400

    db = get_db()
    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    doc = user_doc(name, email, generate_password_hash(password), role)
    db.users.insert_one(doc)
    return jsonify({"message": "Registered successfully", "id": doc["_id"]}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    d        = request.get_json() or {}
    email    = d.get("email", "").lower().strip()
    password = d.get("password", "")

    db   = get_db()
    user = db.users.find_one({"email": email})
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid email or password"}), 401
    if not user.get("active", True):
        return jsonify({"error": "Account disabled"}), 403

    token = create_access_token(
        identity=email,
        additional_claims={"role": user["role"], "name": user["name"]},
    )
    return jsonify({
        "token": token,
        "user":  {"name": user["name"], "email": email, "role": user["role"]},
    })


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    email = get_jwt_identity()
    db    = get_db()
    user  = db.users.find_one({"email": email}, {"password": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404
    user["_id"] = str(user["_id"])
    if "created_at" in user:
        user["created_at"] = user["created_at"].isoformat()
    return jsonify(user)

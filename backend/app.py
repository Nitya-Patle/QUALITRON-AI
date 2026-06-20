"""
QUALITRON AI — Main Flask Application
Run: python app.py
"""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "qualitron-super-secret-2024")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB

from datetime import timedelta
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30)

jwt = JWTManager(app)

from database.db import init_db
from routes.auth       import auth_bp
from routes.inspection import inspection_bp
from routes.dashboard  import dashboard_bp
from routes.reports    import reports_bp
from routes.camera     import camera_bp
from routes.alerts     import alerts_bp

init_db()

app.register_blueprint(auth_bp,       url_prefix="/api/auth")
app.register_blueprint(inspection_bp, url_prefix="/api/inspect")
app.register_blueprint(dashboard_bp,  url_prefix="/api/dashboard")
app.register_blueprint(reports_bp,    url_prefix="/api/reports")
app.register_blueprint(camera_bp,     url_prefix="/api/camera")
app.register_blueprint(alerts_bp,     url_prefix="/api/alerts")


@app.errorhandler(Exception)
def handle_exception(e):
    import traceback
    return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

@app.errorhandler(500)
def handle_500(e):
    import traceback
    return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500


@app.route("/")
def health():
    return {"status": "running", "app": "QUALITRON AI v1.0"}


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

import os
from urllib.parse import quote_plus
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from models import db
from routes.auth import auth_bp
from routes.caregiver import caregiver_bp
from routes.scam_checker import scam_checker_bp
from routes.tutorials import tutorials_bp

load_dotenv()


def create_app() -> Flask:
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", os.urandom(32).hex())
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = os.getenv("COOKIE_SECURE", "false").lower() == "true"

    mysql_user = os.getenv("MYSQL_USER", "cybershield_app")
    mysql_password = quote_plus(os.getenv("MYSQL_PASSWORD", ""))
    mysql_host = os.getenv("MYSQL_HOST", "127.0.0.1")
    mysql_port = os.getenv("MYSQL_PORT", "3306")
    mysql_db = os.getenv("MYSQL_DATABASE", "cybershield_db")

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_db}?charset=utf8mb4"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    CORS(app, origins=[frontend_origin], supports_credentials=True)

    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["200 per hour"],
        storage_uri="memory://",
    )
    limiter.limit("40 per 15 minutes")(auth_bp)
    limiter.limit("80 per 15 minutes")(scam_checker_bp)

    @app.after_request
    def apply_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "cybershield-flask-mysql"})

    app.register_blueprint(auth_bp)
    app.register_blueprint(tutorials_bp)
    app.register_blueprint(scam_checker_bp)
    app.register_blueprint(caregiver_bp)

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(host="0.0.0.0", port=5000, debug=os.getenv("FLASK_ENV") == "development")

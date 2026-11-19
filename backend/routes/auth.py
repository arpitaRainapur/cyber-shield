from flask import Blueprint, jsonify, request, session
from models import User, UserRole, db
from security.auth_security import (
    hash_password,
    sanitize_text,
    validate_email,
    validate_password_strength,
    verify_password,
)
from security.encryption import decrypt_sensitive, encrypt_sensitive
from security.rbac import login_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api")


@auth_bp.post("/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    full_name = sanitize_text(data.get("fullName", ""), 100)
    email = sanitize_text(data.get("email", ""), 180).lower()
    password = data.get("password", "")
    role = "caregiver" if data.get("role") == "caregiver" else "senior"
    lang = data.get("preferredLanguage") if data.get("preferredLanguage") in ("en", "hi", "mr") else "en"

    if len(full_name) < 2:
        return jsonify({"error": "Please enter your full name."}), 400
    if not validate_email(email):
        return jsonify({"error": "Please enter a valid email address."}), 400
    valid_pw, pw_errors = validate_password_strength(password)
    if not valid_pw:
        return jsonify({"error": pw_errors[0], "details": pw_errors}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists."}), 409

    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        preferred_language=lang,
    )
    db.session.add(user)
    db.session.flush()
    db.session.add(UserRole(user_id=user.id, role_name=role))
    db.session.commit()

    session["user_id"] = user.id
    session["role"] = role
    return jsonify({
        "user": {
            "id": user.id,
            "fullName": user.full_name,
            "email": user.email,
            "role": role,
            "preferredLanguage": user.preferred_language,
            "recoveryNote": "",
        }
    }), 201


@auth_bp.post("/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = sanitize_text(data.get("email", ""), 180).lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(user.password_hash, password):
        return jsonify({"error": "Incorrect email or password."}), 401

    role_row = UserRole.query.filter_by(user_id=user.id).first()
    role = role_row.role_name if role_row else "senior"

    session["user_id"] = user.id
    session["role"] = role

    return jsonify({
        "user": {
            "id": user.id,
            "fullName": user.full_name,
            "email": user.email,
            "role": role,
            "preferredLanguage": user.preferred_language,
            "recoveryNote": decrypt_sensitive(user.encrypted_recovery_note or ""),
        }
    })


@auth_bp.post("/auth/logout")
def logout():
    session.clear()
    return jsonify({"ok": True})


@auth_bp.get("/auth/me")
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"user": None})
    user = db.session.get(User, user_id)
    if not user:
        session.clear()
        return jsonify({"user": None})
    role_row = UserRole.query.filter_by(user_id=user.id).first()
    return jsonify({
        "user": {
            "id": user.id,
            "fullName": user.full_name,
            "email": user.email,
            "role": role_row.role_name if role_row else "senior",
            "preferredLanguage": user.preferred_language,
            "recoveryNote": decrypt_sensitive(user.encrypted_recovery_note or ""),
        }
    })


@auth_bp.patch("/user/language")
@login_required
def update_language():
    data = request.get_json(silent=True) or {}
    lang = data.get("language")
    if lang not in ("en", "hi", "mr"):
        return jsonify({"error": "Unsupported language."}), 400
    user = db.session.get(User, session["user_id"])
    user.preferred_language = lang
    db.session.commit()
    return jsonify({"preferredLanguage": lang})


@auth_bp.patch("/user/recovery-note")
@login_required
def update_recovery_note():
    data = request.get_json(silent=True) or {}
    note = sanitize_text(data.get("recoveryNote", ""), 300)
    user = db.session.get(User, session["user_id"])
    user.encrypted_recovery_note = encrypt_sensitive(note) if note else ""
    db.session.commit()
    return jsonify({"recoveryNote": note})

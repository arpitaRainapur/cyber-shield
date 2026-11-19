from functools import wraps
from flask import jsonify, session
from models import CaregiverConsent


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required."}), 401
        return fn(*args, **kwargs)

    return wrapper


def role_required(expected_role: str):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if "user_id" not in session:
                return jsonify({"error": "Authentication required."}), 401
            if session.get("role") != expected_role:
                return jsonify({"error": f"Access restricted to {expected_role} accounts."}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def verify_caregiver_consent(caregiver_user_id: int, senior_user_id: int) -> bool:
    consent = CaregiverConsent.query.filter_by(
        caregiver_user_id=caregiver_user_id,
        senior_user_id=senior_user_id,
        status="granted",
    ).first()
    return consent is not None

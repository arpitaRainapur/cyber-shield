import secrets
from flask import Blueprint, jsonify, request, session
from models import CaregiverConsent, LearningProgress, QuizResult, SimulationResult, Tutorial, User, UserRole, db
from security.auth_security import sanitize_text, validate_email
from security.rbac import role_required, verify_caregiver_consent

caregiver_bp = Blueprint("caregiver", __name__, url_prefix="/api")


def _generate_code() -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(6))


@caregiver_bp.get("/consent")
@role_required("senior")
def list_senior_consents():
    rows = CaregiverConsent.query.filter_by(senior_user_id=session["user_id"]).order_by(CaregiverConsent.updated_at.desc()).all()
    return jsonify({
        "consents": [
            {
                "id": r.id,
                "caregiver_email": r.caregiver_email,
                "status": r.status,
                "consent_code": r.consent_code,
                "updated_at": r.updated_at.isoformat(),
            }
            for r in rows
        ]
    })


@caregiver_bp.post("/consent/invite")
@role_required("senior")
def invite_caregiver():
    data = request.get_json(silent=True) or {}
    caregiver_email = sanitize_text(data.get("caregiverEmail", ""), 180).lower()
    if not validate_email(caregiver_email):
        return jsonify({"error": "Please provide a valid caregiver email."}), 400

    caregiver_user = (
        User.query.join(UserRole, UserRole.user_id == User.id)
        .filter(User.email == caregiver_email, UserRole.role_name == "caregiver")
        .first()
    )

    code = _generate_code()
    existing = CaregiverConsent.query.filter_by(
        senior_user_id=session["user_id"],
        caregiver_email=caregiver_email,
    ).first()

    status = "granted" if caregiver_user else "pending"
    if existing:
        existing.status = status
        existing.consent_code = code
        existing.caregiver_user_id = caregiver_user.id if caregiver_user else None
    else:
        db.session.add(
            CaregiverConsent(
                senior_user_id=session["user_id"],
                caregiver_user_id=caregiver_user.id if caregiver_user else None,
                caregiver_email=caregiver_email,
                status=status,
                consent_code=code,
            )
        )
    db.session.commit()
    return jsonify({"consentCode": code, "status": status, "caregiverEmail": caregiver_email}), 201


@caregiver_bp.post("/consent/revoke")
@role_required("senior")
def revoke_consent():
    consent_id = (request.get_json(silent=True) or {}).get("consentId")
    record = CaregiverConsent.query.filter_by(id=consent_id, senior_user_id=session["user_id"]).first()
    if not record:
        return jsonify({"error": "Consent record not found."}), 404
    record.status = "revoked"
    db.session.commit()
    return jsonify({"ok": True})


@caregiver_bp.post("/consent/link")
@role_required("caregiver")
def link_senior_with_code():
    data = request.get_json(silent=True) or {}
    senior_email = sanitize_text(data.get("seniorEmail", ""), 180).lower()
    code = sanitize_text(data.get("consentCode", ""), 16).upper()

    senior = User.query.filter_by(email=senior_email).first()
    caregiver = db.session.get(User, session["user_id"])
    if not senior or not caregiver:
        return jsonify({"error": "Matching consent record not found."}), 404

    record = CaregiverConsent.query.filter(
        CaregiverConsent.senior_user_id == senior.id,
        CaregiverConsent.consent_code == code,
        CaregiverConsent.status != "revoked",
    ).first()

    if not record or record.caregiver_email.lower() != caregiver.email.lower():
        return jsonify({"error": "Consent code does not authorize your caregiver account."}), 403

    record.caregiver_user_id = caregiver.id
    record.status = "granted"
    db.session.commit()
    return jsonify({"ok": True})


@caregiver_bp.get("/caregiver/seniors")
@role_required("caregiver")
def caregiver_dashboard():
    caregiver_id = session["user_id"]
    consents = CaregiverConsent.query.filter_by(caregiver_user_id=caregiver_id, status="granted").all()
    total_tutorials = Tutorial.query.count()

    seniors_payload = []
    for c in consents:
        if not verify_caregiver_consent(caregiver_id, c.senior_user_id):
            continue
        senior = db.session.get(User, c.senior_user_id)
        if not senior:
            continue

        completed = (
            db.session.query(LearningProgress, Tutorial)
            .join(Tutorial, Tutorial.id == LearningProgress.tutorial_id)
            .filter(LearningProgress.user_id == senior.id, LearningProgress.completed.is_(True))
            .all()
        )
        quizzes = (
            db.session.query(QuizResult, Tutorial)
            .join(Tutorial, Tutorial.id == QuizResult.tutorial_id)
            .filter(QuizResult.user_id == senior.id)
            .order_by(QuizResult.taken_at.desc())
            .limit(10)
            .all()
        )
        sims = SimulationResult.query.filter_by(user_id=senior.id).order_by(SimulationResult.attempted_at.desc()).all()

        seniors_payload.append({
            "consentId": c.id,
            "seniorId": senior.id,
            "fullName": senior.full_name,
            "email": senior.email,
            "preferredLanguage": senior.preferred_language,
            "tutorialsCompletedCount": len(completed),
            "totalTutorials": total_tutorials,
            "quizResults": [
                {
                    "id": q.id,
                    "score": q.score,
                    "total_questions": q.total_questions,
                    "title_en": t.title_en,
                    "taken_at": q.taken_at.isoformat(),
                }
                for q, t in quizzes
            ],
            "simulationSummary": {
                "totalAttempts": len(sims),
                "correctAttempts": sum(1 for s in sims if s.is_correct),
                "uniqueScenariosMastered": len({s.scenario_id for s in sims if s.is_correct}),
            },
        })

    return jsonify({"seniors": seniors_payload})

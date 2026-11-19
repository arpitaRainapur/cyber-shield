from flask import Blueprint, jsonify, request, session
from models import ScamCheckHistory, db
from security.auth_security import sanitize_text
from security.rbac import login_required
from services.scam_detector import analyze_message

scam_checker_bp = Blueprint("scam_checker", __name__, url_prefix="/api")


@scam_checker_bp.post("/scam-check")
def check_scam():
    data = request.get_json(silent=True) or {}
    content = sanitize_text(data.get("content", ""), 3000)
    input_type = data.get("inputType") if data.get("inputType") in ("sms", "whatsapp", "email", "url", "message") else "message"
    save_to_history = data.get("saveToHistory") is True

    if len(content) < 4:
        return jsonify({"error": "Please enter at least 4 characters to analyze."}), 400

    analysis = analyze_message(content, input_type)
    saved = False

    if save_to_history and "user_id" in session:
        excerpt = f"{content[:140]}..." if len(content) > 140 else content
        db.session.add(
            ScamCheckHistory(
                user_id=session["user_id"],
                input_type=input_type,
                content_excerpt=excerpt,
                risk_level=analysis["riskLevel"],
                risk_score=analysis["riskScore"],
                matched_patterns_json=analysis["suspiciousTerms"],
            )
        )
        db.session.commit()
        saved = True

    return jsonify({"analysis": analysis, "savedToHistory": saved})


@scam_checker_bp.get("/scam-check/history")
@login_required
def get_history():
    rows = (
        ScamCheckHistory.query.filter_by(user_id=session["user_id"])
        .order_by(ScamCheckHistory.id.desc())
        .limit(20)
        .all()
    )
    return jsonify({
        "history": [
            {
                "id": r.id,
                "inputType": r.input_type,
                "contentExcerpt": r.content_excerpt,
                "riskLevel": r.risk_level,
                "riskScore": r.risk_score,
                "matchedPatterns": r.matched_patterns_json,
                "createdAt": r.created_at.isoformat(),
            }
            for r in rows
        ]
    })


@scam_checker_bp.delete("/scam-check/history")
@login_required
def clear_history():
    ScamCheckHistory.query.filter_by(user_id=session["user_id"]).delete()
    db.session.commit()
    return jsonify({"ok": True})

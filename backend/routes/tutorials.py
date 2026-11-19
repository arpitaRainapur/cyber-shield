from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, session
from models import LearningProgress, QuizResult, SimulationResult, Tutorial, db
from security.auth_security import sanitize_text
from security.rbac import login_required

tutorials_bp = Blueprint("tutorials", __name__, url_prefix="/api")


@tutorials_bp.get("/tutorials")
def list_tutorials():
    user_id = session.get("user_id")
    tutorials = Tutorial.query.order_by(Tutorial.order_index.asc()).all()

    progress_map = {}
    quiz_map = {}
    if user_id:
        for p in LearningProgress.query.filter_by(user_id=user_id).all():
            progress_map[p.tutorial_id] = {
                "completed": p.completed,
                "voiceListened": p.voice_listened,
                "completedAt": p.completed_at.isoformat() if p.completed_at else None,
            }
        for q in QuizResult.query.filter_by(user_id=user_id).order_by(QuizResult.id.asc()).all():
            quiz_map[q.tutorial_id] = {
                "score": q.score,
                "totalQuestions": q.total_questions,
                "takenAt": q.taken_at.isoformat(),
            }

    payload = []
    for t in tutorials:
        payload.append({
            "id": t.id,
            "slug": t.slug,
            "category": t.category,
            "orderIndex": t.order_index,
            "imageUrl": t.image_url,
            "title": {"en": t.title_en, "hi": t.title_hi, "mr": t.title_mr},
            "summary": {"en": t.summary_en, "hi": t.summary_hi, "mr": t.summary_mr},
            "script": {"en": t.script_en, "hi": t.script_hi, "mr": t.script_mr},
            "tips": t.tips_json,
            "quiz": t.quiz_json,
            "progress": progress_map.get(t.id, {"completed": False, "voiceListened": False, "completedAt": None}),
            "latestQuizResult": quiz_map.get(t.id),
        })
    return jsonify({"tutorials": payload})


@tutorials_bp.post("/tutorials/<int:tutorial_id>/progress")
@login_required
def update_progress(tutorial_id: int):
    data = request.get_json(silent=True) or {}
    completed = bool(data.get("completed"))
    voice_listened = bool(data.get("voiceListened"))

    record = LearningProgress.query.filter_by(user_id=session["user_id"], tutorial_id=tutorial_id).first()
    if not record:
        record = LearningProgress(
            user_id=session["user_id"],
            tutorial_id=tutorial_id,
            completed=completed,
            voice_listened=voice_listened,
            completed_at=datetime.now(timezone.utc) if completed else None,
        )
        db.session.add(record)
    else:
        record.completed = record.completed or completed
        record.voice_listened = record.voice_listened or voice_listened
        if completed and not record.completed_at:
            record.completed_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"ok": True})


@tutorials_bp.post("/tutorials/<int:tutorial_id>/quiz")
@login_required
def submit_quiz(tutorial_id: int):
    tutorial = db.session.get(Tutorial, tutorial_id)
    if not tutorial:
        return jsonify({"error": "Tutorial not found."}), 404

    answers = (request.get_json(silent=True) or {}).get("answers") or {}
    questions = tutorial.quiz_json or []
    score = sum(1 for q in questions if answers.get(q["id"]) == q["correctIndex"])

    db.session.add(
        QuizResult(
            user_id=session["user_id"],
            tutorial_id=tutorial_id,
            score=score,
            total_questions=len(questions),
        )
    )
    record = LearningProgress.query.filter_by(user_id=session["user_id"], tutorial_id=tutorial_id).first()
    if not record:
        db.session.add(
            LearningProgress(
                user_id=session["user_id"],
                tutorial_id=tutorial_id,
                completed=True,
                completed_at=datetime.now(timezone.utc),
            )
        )
    else:
        record.completed = True
        if not record.completed_at:
            record.completed_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"score": score, "totalQuestions": len(questions)})


@tutorials_bp.post("/simulations/attempt")
@login_required
def record_simulation_attempt():
    data = request.get_json(silent=True) or {}
    scenario_id = sanitize_text(data.get("scenarioId", ""), 64)
    selected_option_id = sanitize_text(data.get("selectedOptionId", ""), 64)
    is_correct = bool(data.get("isCorrect"))

    if not scenario_id or not selected_option_id:
        return jsonify({"error": "Invalid simulation payload."}), 400

    db.session.add(
        SimulationResult(
            user_id=session["user_id"],
            scenario_id=scenario_id,
            selected_option_id=selected_option_id,
            is_correct=is_correct,
        )
    )
    db.session.commit()
    return jsonify({"ok": True})

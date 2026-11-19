from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    preferred_language = db.Column(
        db.Enum("en", "hi", "mr", name="lang_enum"),
        nullable=False,
        default="en",
    )
    encrypted_recovery_note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    roles = db.relationship("UserRole", backref="user", cascade="all, delete-orphan")


class UserRole(db.Model):
    __tablename__ = "user_roles"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_name = db.Column(db.Enum("senior", "caregiver", name="role_enum"), nullable=False)
    assigned_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class Tutorial(db.Model):
    __tablename__ = "tutorials"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    slug = db.Column(db.String(64), nullable=False, unique=True)
    category = db.Column(db.String(80), nullable=False)
    order_index = db.Column(db.Integer, nullable=False, index=True)
    image_url = db.Column(db.String(255), nullable=False)
    title_en = db.Column(db.String(200), nullable=False)
    title_hi = db.Column(db.String(200), nullable=False)
    title_mr = db.Column(db.String(200), nullable=False)
    summary_en = db.Column(db.Text, nullable=False)
    summary_hi = db.Column(db.Text, nullable=False)
    summary_mr = db.Column(db.Text, nullable=False)
    script_en = db.Column(db.Text, nullable=False)
    script_hi = db.Column(db.Text, nullable=False)
    script_mr = db.Column(db.Text, nullable=False)
    tips_json = db.Column(db.JSON, nullable=False)
    quiz_json = db.Column(db.JSON, nullable=False)


class LearningProgress(db.Model):
    __tablename__ = "learning_progress"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tutorial_id = db.Column(db.Integer, db.ForeignKey("tutorials.id", ondelete="CASCADE"), nullable=False)
    completed = db.Column(db.Boolean, nullable=False, default=False)
    voice_listened = db.Column(db.Boolean, nullable=False, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)


class QuizResult(db.Model):
    __tablename__ = "quiz_results"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tutorial_id = db.Column(db.Integer, db.ForeignKey("tutorials.id", ondelete="CASCADE"), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    taken_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class SimulationResult(db.Model):
    __tablename__ = "simulation_results"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scenario_id = db.Column(db.String(64), nullable=False, index=True)
    selected_option_id = db.Column(db.String(64), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    attempted_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class CaregiverConsent(db.Model):
    __tablename__ = "caregiver_consent"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    senior_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    caregiver_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    caregiver_email = db.Column(db.String(180), nullable=False, index=True)
    status = db.Column(db.Enum("pending", "granted", "revoked", name="consent_enum"), nullable=False, default="pending")
    consent_code = db.Column(db.String(16), nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class ScamCheckHistory(db.Model):
    __tablename__ = "scam_check_history"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    input_type = db.Column(db.String(32), nullable=False)
    content_excerpt = db.Column(db.String(200), nullable=False)
    risk_level = db.Column(db.Enum("Low", "Medium", "High", name="risk_enum"), nullable=False)
    risk_score = db.Column(db.Integer, nullable=False)
    matched_patterns_json = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

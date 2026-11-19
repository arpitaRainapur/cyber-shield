import re
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=1,
    hash_len=32,
    salt_len=16,
    type=Type.ID,  # Argon2id
)

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")


def hash_password(plain_password: str) -> str:
    return ph.hash(plain_password)


def verify_password(password_hash: str, plain_password: str) -> bool:
    try:
        return ph.verify(password_hash, plain_password)
    except VerifyMismatchError:
        return False
    except Exception:
        return False


def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    errors: list[str] = []
    if not isinstance(password, str) or len(password) < 8:
        errors.append("Password must be at least 8 characters long.")
    if not re.search(r"[A-Za-z]", password or ""):
        errors.append("Password must include at least one letter.")
    if not re.search(r"[0-9]", password or ""):
        errors.append("Password must include at least one digit.")
    if len(password or "") > 128:
        errors.append("Password must be 128 characters or fewer.")
    return len(errors) == 0, errors


def validate_email(email: str) -> bool:
    if not isinstance(email, str):
        return False
    cleaned = email.strip()
    return 5 <= len(cleaned) <= 180 and bool(EMAIL_REGEX.match(cleaned))


def sanitize_text(value: str, max_length: int = 2000) -> str:
    if not isinstance(value, str):
        return ""
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", value)
    return cleaned.strip()[:max_length]

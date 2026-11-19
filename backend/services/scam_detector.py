import os
import re
from urllib.parse import urlparse
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "scam_tfidf_logreg.joblib")

WEIGHTED_PATTERNS = [
    (re.compile(r"\b(kyc\s*(pending|expired|update|suspended|blocked|verify))\b", re.I), "KYC update / suspension threat", 28),
    (re.compile(r"\b(account\s*(will\s*be\s*)?(blocked|suspended|frozen|closed))\b", re.I), "Account block threat", 26),
    (re.compile(r"\b(share|send|enter|verify|tell)\s*(your\s*)?(otp|pin|cvv|mpin|upi\s*pin)\b", re.I), "Request for OTP / PIN / CVV", 40),
    (re.compile(r"\b(won|winner|lottery|prize|jackpot|crore|lucky\s*draw|kbc)\b", re.I), "Unsolicited lottery or prize claim", 32),
    (re.compile(r"\b(processing\s*fee|registration\s*fee|claim\s*charges|tax\s*fee)\b", re.I), "Advance fee requested to claim reward", 28),
    (re.compile(r"\b(anydesk|teamviewer|quicksupport|rustdesk)\b", re.I), "Remote screen-sharing app request", 36),
    (re.compile(r"\b(urgent|immediately|within\s*\d+\s*(hours?|mins?|minutes?)|act\s*now)\b", re.I), "Artificial urgency pressure", 18),
]

SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "cutt.ly", "rb.gy", "shorturl.at"}
SUSPICIOUS_TLDS = (".xyz", ".top", ".tk", ".ml", ".ga", ".cf", ".icu", ".buzz", ".click")
OFFICIAL_DOMAINS = {"sbi.co.in", "onlinesbi.sbi", "hdfcbank.com", "icicibank.com", "rbi.org.in", "cybercrime.gov.in"}
BRAND_TOKENS = ("sbi", "hdfc", "icici", "axis", "paytm", "phonepe", "rbi", "aadhaar", "uidai")


def inspect_urls_lexically(text: str) -> tuple[list[dict], int]:
    urls = re.findall(r"(?:https?://|www\.)[^\s<>\"')]+", text, flags=re.I)
    findings = []
    score_delta = 0

    for raw in set(urls):
        normalized = raw if raw.lower().startswith(("http://", "https://")) else f"http://{raw}"
        parsed = urlparse(normalized)
        host = (parsed.hostname or "").lower()
        flags = []

        if raw.lower().startswith("http://"):
            flags.append("Uses unencrypted http:// instead of https://")
            score_delta += 14
        if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", host):
            flags.append("Uses a raw IP address instead of an official organization domain")
            score_delta += 34
        if "@" in raw:
            flags.append("Contains '@' symbol which can hide the true destination website")
            score_delta += 32
        if host in SHORTENERS:
            flags.append(f"Uses URL shortener ({host}) that hides the final destination")
            score_delta += 24
        if host.endswith(SUSPICIOUS_TLDS):
            flags.append("Uses an unusual top-level domain often abused in temporary phishing links")
            score_delta += 24
        if any(b in normalized.lower() for b in BRAND_TOKENS) and host not in OFFICIAL_DOMAINS:
            flags.append("Mentions a bank/government name on an unrecognized domain")
            score_delta += 34

        if not flags:
            flags.append("No obvious lexical anomalies found, but pattern checks never prove a link is safe.")

        findings.append({"url": raw, "flags": flags})

    return findings, score_delta


def analyze_message(text: str, input_type: str = "message") -> dict:
    cleaned = text.strip()
    suspicious_terms: list[str] = []
    baseline_score = 0

    for pattern, label, weight in WEIGHTED_PATTERNS:
        m = pattern.search(cleaned)
        if m:
            baseline_score += weight
            suspicious_terms.append(f'{label} ("{m.group(0)}")')

    url_findings, url_score = inspect_urls_lexically(cleaned)
    baseline_score += url_score

    engine_label = "Explainable NLP & Pattern Baseline (Trainable via train_model.py)"
    final_score = min(100, baseline_score)

    if os.path.exists(MODEL_PATH):
        pipeline = joblib.load(MODEL_PATH)
        scam_prob = float(pipeline.predict_proba([cleaned])[0][1])
        ml_score = int(round(scam_prob * 100))
        final_score = min(100, int(round(0.6 * ml_score + 0.4 * baseline_score)))
        engine_label = "Trained Scikit-learn TF-IDF + LogisticRegression + Lexical URL Rules"

    if final_score >= 45:
        risk_level = "High"
    elif final_score >= 18:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return {
        "riskLevel": risk_level,
        "riskScore": final_score,
        "engineLabel": engine_label,
        "isBaseline": not os.path.exists(MODEL_PATH),
        "suspiciousTerms": suspicious_terms,
        "urlFindings": url_findings,
        "neverOpenedUrlNotice": bool(url_findings) or input_type == "url",
        "safetyDisclaimer": (
            "CyberShield analyzes text patterns locally and NEVER visits or opens submitted links. "
            "A Low risk score does NOT prove a URL or message is safe."
        ),
    }

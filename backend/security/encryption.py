import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_aes_key() -> bytes:
    encoded = os.getenv("ENCRYPTION_KEY_BASE64", "")
    if encoded:
        raw = base64.b64decode(encoded)
        if len(raw) == 32:
            return raw
    # Ephemeral key for local dev only if ENCRYPTION_KEY_BASE64 is omitted
    if not hasattr(_get_aes_key, "_dev_key"):
        _get_aes_key._dev_key = AESGCM.generate_key(bit_length=256)
    return _get_aes_key._dev_key


def encrypt_sensitive(plaintext: str) -> str:
    if not plaintext:
        return ""
    aes = AESGCM(_get_aes_key())
    nonce = os.urandom(12)
    ciphertext = aes.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("ascii")


def decrypt_sensitive(payload: str) -> str:
    if not payload:
        return ""
    try:
        raw = base64.b64decode(payload)
        nonce, ciphertext = raw[:12], raw[12:]
        aes = AESGCM(_get_aes_key())
        return aes.decrypt(nonce, ciphertext, None).decode("utf-8")
    except Exception:
        return ""

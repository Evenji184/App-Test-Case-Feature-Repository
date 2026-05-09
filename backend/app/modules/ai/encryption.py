from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet

from app.core.config import get_settings


def _get_fernet() -> Fernet:
    settings = get_settings()
    digest = hashlib.sha256(settings.secret_key.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt_api_key(plaintext: str) -> str:
    f = _get_fernet()
    return f.encrypt(plaintext.encode()).decode()


def decrypt_api_key(ciphertext: str) -> str:
    f = _get_fernet()
    return f.decrypt(ciphertext.encode()).decode()


def mask_api_key(plaintext: str) -> str:
    if len(plaintext) <= 7:
        return "****"
    return f"{plaintext[:3]}****{plaintext[-4:]}"

import base64
import hashlib
import hmac
import json
import re
import secrets
import time
from typing import Optional

from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

def _password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 210_000)
    return salt.hex() + "$" + digest.hex()

def _password_ok(password: str, encoded: str) -> bool:
    try:
        salt_hex, digest_hex = encoded.split("$", 1)
        expected = _password_hash(password, bytes.fromhex(salt_hex)).split("$", 1)[1]
        return hmac.compare_digest(expected, digest_hex)
    except (ValueError, TypeError):
        return False

def _token(user_id: int) -> str:
    payload = {"sub": user_id, "exp": int(time.time()) + 60 * 60 * 24 * 7}
    raw = json.dumps(payload, separators=(",", ":")).encode()
    body = base64.urlsafe_b64encode(raw).rstrip(b"=")
    sig = hmac.new(settings.auth_secret.encode(), body, hashlib.sha256).digest()
    return body.decode() + "." + base64.urlsafe_b64encode(sig).rstrip(b"=").decode()

def _token_user_id(token: str) -> int:
    try:
        body, signature = token.split(".", 1)
        expected = hmac.new(settings.auth_secret.encode(), body.encode(), hashlib.sha256).digest()
        supplied = base64.urlsafe_b64decode(signature + "=" * (-len(signature) % 4))
        if not hmac.compare_digest(expected, supplied):
            raise ValueError
        payload = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
        if int(payload["exp"]) < int(time.time()):
            raise ValueError
        return int(payload["sub"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Invalid or expired access token")

def require_auth(authorization: Optional[str] = Header(default=None), x_api_key: Optional[str] = Header(default=None)):
    if x_api_key and hmac.compare_digest(x_api_key, settings.api_key):
        return None
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    return _token_user_id(authorization.split(" ", 1)[1].strip())

def require_user(
    authorization: Optional[str] = Header(default=None),
    x_api_key: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user_id = require_auth(authorization, x_api_key)
    if user_id is None:
        return None
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Account no longer exists")
    return user

def require_roles(*roles):
    def dependency(
        authorization: Optional[str] = Header(default=None),
        x_api_key: Optional[str] = Header(default=None),
        db: Session = Depends(get_db),
    ):
        user_id = require_auth(authorization, x_api_key)
        if user_id is None:
            return None
        user = db.get(User, user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="Account no longer exists")
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="You do not have permission for this action")
        return user
    return dependency

def register_user(db: Session, email: str, password: str):
    email = email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(email=email, password_hash=_password_hash(password))
    if settings.admin_email and email == settings.admin_email.strip().lower():
        user.role = "admin"
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, _token(user.id)

def login_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email.strip().lower()).first()
    if not user or not _password_ok(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user, _token(user.id)

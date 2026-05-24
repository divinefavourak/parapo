"""Authentication service: JWT creation/verification and password hashing."""

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from uuid import UUID

import bcrypt
from jose import JWTError, jwt
from fastapi import HTTPException, status

from config import settings

# ── Password hashing ──────────────────────────────────────────────────────────

def _prepare(plain: str) -> bytes:
    # SHA-256 keeps input to bcrypt at 32 bytes regardless of password length.
    return hashlib.sha256(plain.encode()).digest()


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(_prepare(plain_password), bcrypt.gensalt()).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    hashed = hashed_password.encode()
    # Current method: SHA-256 prehash before bcrypt
    try:
        if bcrypt.checkpw(_prepare(plain_password), hashed):
            return True
    except Exception:
        pass
    # Legacy fallback: plain bcrypt (accounts created before SHA-256 prehash)
    try:
        return bcrypt.checkpw(plain_password.encode()[:72], hashed)
    except Exception:
        return False


# ── JWT ───────────────────────────────────────────────────────────────────────

def _create_token(
    data: Dict[str, Any],
    secret_key: str,
    expires_delta: timedelta,
) -> str:
    """Internal helper to create a signed JWT.

    Args:
        data: Claims to embed in the token.
        secret_key: The HMAC secret used to sign.
        expires_delta: How long until the token expires.

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, secret_key, algorithm="HS256")


def create_access_token(user_id: UUID, email: str) -> str:
    """Create a short-lived access token (default 15 minutes).

    Args:
        user_id: The UUID of the authenticated user.
        email: The user's email address.

    Returns:
        Encoded JWT access token.
    """
    data = {"sub": str(user_id), "email": email, "type": "access"}
    expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _create_token(data, settings.SECRET_KEY, expires)


def create_refresh_token(user_id: UUID, email: str) -> str:
    """Create a long-lived refresh token (default 7 days).

    Args:
        user_id: The UUID of the authenticated user.
        email: The user's email address.

    Returns:
        Encoded JWT refresh token.
    """
    data = {"sub": str(user_id), "email": email, "type": "refresh"}
    expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _create_token(data, settings.REFRESH_SECRET_KEY, expires)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and verify an access token.

    Args:
        token: The JWT string to decode.

    Returns:
        The token payload dict.

    Raises:
        HTTPException 401 if invalid or expired.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "access":
            raise JWTError("Wrong token type")
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def decode_refresh_token(token: str) -> Dict[str, Any]:
    """Decode and verify a refresh token.

    Args:
        token: The JWT refresh token string.

    Returns:
        The token payload dict.

    Raises:
        HTTPException 401 if invalid or expired.
    """
    try:
        payload = jwt.decode(token, settings.REFRESH_SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            raise JWTError("Wrong token type")
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

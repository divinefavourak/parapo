"""Auth middleware: FastAPI dependency for the current authenticated user."""

from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from services.auth_service import decode_access_token

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency that decodes the Bearer token and returns the User ORM object.

    Usage in router:
        @router.get("/me")
        def me(user: User = Depends(get_current_user)):
            ...

    Raises:
        HTTPException 401: If the token is missing, invalid, or expired.
        HTTPException 404: If the user in the token no longer exists.
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    user_id_str: str = payload.get("sub", "")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user

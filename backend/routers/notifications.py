"""Notifications router: push token management and notification sending."""

from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from middleware.auth import get_current_user
from models.notification import NotificationToken
from models.user import User
from services.notification_service import send_push_notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


# ── Schemas (defined inline to keep the file self-contained) ──────────────────

class TokenRegisterRequest(BaseModel):
    token: str
    platform: str = "unknown"  # ios | android | web


class TokenOut(BaseModel):
    id: UUID
    token: str
    platform: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SendNotificationRequest(BaseModel):
    title: str
    body: str
    data: dict | None = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/tokens", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register_token(
    payload: TokenRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TokenOut:
    """Register or update an Expo push token for the current user.

    If the token already exists in the database (for any user), it is re-assigned
    to the current user (handles device re-use after account switching).
    """
    existing = db.query(NotificationToken).filter(NotificationToken.token == payload.token).first()
    if existing:
        existing.user_id = current_user.id
        existing.platform = payload.platform
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return TokenOut.model_validate(existing)

    token_record = NotificationToken(
        user_id=current_user.id,
        token=payload.token,
        platform=payload.platform,
    )
    db.add(token_record)
    db.commit()
    db.refresh(token_record)
    return TokenOut.model_validate(token_record)


@router.get("/tokens", response_model=List[TokenOut])
def list_tokens(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[TokenOut]:
    """List all push tokens registered for the current user."""
    tokens = (
        db.query(NotificationToken)
        .filter(NotificationToken.user_id == current_user.id)
        .order_by(NotificationToken.created_at.desc())
        .all()
    )
    return [TokenOut.model_validate(t) for t in tokens]


@router.delete("/tokens/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_token(
    token_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a push token (e.g. on logout from a device)."""
    token_record = db.query(NotificationToken).filter(
        NotificationToken.id == token_id,
        NotificationToken.user_id == current_user.id,
    ).first()
    if not token_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found.")
    db.delete(token_record)
    db.commit()
    return None


@router.post("/send", status_code=status.HTTP_202_ACCEPTED)
async def send_to_self(
    payload: SendNotificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Send a push notification to all of the current user's registered devices.

    Useful for testing and for server-triggered self-notifications.
    Returns a summary of delivery results.
    """
    tokens = (
        db.query(NotificationToken)
        .filter(NotificationToken.user_id == current_user.id)
        .all()
    )
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No push tokens registered for this user.",
        )

    results = []
    for t in tokens:
        try:
            result = await send_push_notification(
                token=t.token,
                title=payload.title,
                body=payload.body,
                data=payload.data,
            )
            results.append({"token": t.token[:20] + "...", "status": "sent", "result": result})
        except Exception as exc:
            results.append({"token": t.token[:20] + "...", "status": "failed", "error": str(exc)})

    return {"sent": len([r for r in results if r["status"] == "sent"]), "details": results}


@router.delete("/tokens", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_tokens(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete all push tokens for the current user (e.g. on full logout)."""
    db.query(NotificationToken).filter(
        NotificationToken.user_id == current_user.id
    ).delete()
    db.commit()
    return None

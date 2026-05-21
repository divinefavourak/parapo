"""Focus router: sessions and stats."""

from datetime import datetime, timezone, timedelta, date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import get_current_user
from models.focus import FocusSession, FocusStats
from models.user import User
from schemas.focus import (
    FocusSessionCreate,
    FocusSessionUpdate,
    FocusSessionOut,
    FocusStatsOut,
    FocusSummary,
)
from services.analytics_service import calculate_focus_streak

router = APIRouter(prefix="/focus", tags=["focus"])


def _get_session_or_404(session_id: UUID, user_id: UUID, db: Session) -> FocusSession:
    session = db.query(FocusSession).filter(
        FocusSession.id == session_id, FocusSession.user_id == user_id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus session not found.")
    return session


def _upsert_daily_stats(user_id: UUID, db: Session, added_minutes: int) -> None:
    """Update or create today's FocusStats row."""
    today = date.today()
    stats = db.query(FocusStats).filter(
        FocusStats.user_id == user_id, FocusStats.stat_date == today
    ).first()

    if stats:
        stats.total_minutes += added_minutes
        stats.sessions_completed += 1
        stats.updated_at = datetime.utcnow()
    else:
        stats = FocusStats(
            user_id=user_id,
            stat_date=today,
            total_minutes=added_minutes,
            sessions_completed=1,
        )
        db.add(stats)
    db.flush()


@router.get("/sessions", response_model=List[FocusSessionOut])
def list_sessions(
    limit: int = Query(50, ge=1, le=200),
    is_completed: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[FocusSessionOut]:
    """List focus sessions for the current user, newest first."""
    query = db.query(FocusSession).filter(FocusSession.user_id == current_user.id)
    if is_completed is not None:
        query = query.filter(FocusSession.is_completed == is_completed)
    sessions = query.order_by(FocusSession.started_at.desc()).limit(limit).all()
    return [FocusSessionOut.model_validate(s) for s in sessions]


@router.post("/sessions", response_model=FocusSessionOut, status_code=status.HTTP_201_CREATED)
def start_session(
    payload: FocusSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FocusSessionOut:
    """Start a new focus session."""
    session = FocusSession(
        user_id=current_user.id,
        started_at=datetime.now(timezone.utc),
        **payload.model_dump(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return FocusSessionOut.model_validate(session)


@router.get("/sessions/{session_id}", response_model=FocusSessionOut)
def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FocusSessionOut:
    """Get a single focus session."""
    return FocusSessionOut.model_validate(_get_session_or_404(session_id, current_user.id, db))


@router.patch("/sessions/{session_id}", response_model=FocusSessionOut)
def update_session(
    session_id: UUID,
    payload: FocusSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FocusSessionOut:
    """Update a session's elapsed time or mark it as completed.

    When is_completed is set to True, daily stats are updated automatically.
    """
    session = _get_session_or_404(session_id, current_user.id, db)
    was_completed = session.is_completed

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(session, field, value)

    # Auto-set completed_at timestamp if completing now
    if payload.is_completed and not was_completed:
        session.completed_at = datetime.now(timezone.utc)
        _upsert_daily_stats(current_user.id, db, session.duration_minutes)

    db.commit()
    db.refresh(session)
    return FocusSessionOut.model_validate(session)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a focus session."""
    session = _get_session_or_404(session_id, current_user.id, db)
    db.delete(session)
    db.commit()
    return None


@router.get("/stats", response_model=List[FocusStatsOut])
def get_daily_stats(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[FocusStatsOut]:
    """Return daily focus stats for the last N days."""
    cutoff = date.today() - timedelta(days=days - 1)
    stats = (
        db.query(FocusStats)
        .filter(FocusStats.user_id == current_user.id, FocusStats.stat_date >= cutoff)
        .order_by(FocusStats.stat_date.asc())
        .all()
    )
    return [FocusStatsOut.model_validate(s) for s in stats]


@router.get("/summary", response_model=FocusSummary)
def get_focus_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FocusSummary:
    """Return an aggregate focus summary for the current user."""
    total_sessions = (
        db.query(func.count(FocusSession.id))
        .filter(FocusSession.user_id == current_user.id, FocusSession.is_completed == True)
        .scalar()
        or 0
    )
    total_minutes = (
        db.query(func.sum(FocusSession.duration_minutes))
        .filter(FocusSession.user_id == current_user.id, FocusSession.is_completed == True)
        .scalar()
        or 0
    )
    avg_minutes = round(total_minutes / total_sessions, 1) if total_sessions else 0.0

    streak = calculate_focus_streak(current_user.id, db)

    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

    sessions_this_week = (
        db.query(func.count(FocusSession.id))
        .filter(
            FocusSession.user_id == current_user.id,
            FocusSession.is_completed == True,
            FocusSession.completed_at >= week_start,
        )
        .scalar()
        or 0
    )
    minutes_this_week = (
        db.query(func.sum(FocusSession.duration_minutes))
        .filter(
            FocusSession.user_id == current_user.id,
            FocusSession.is_completed == True,
            FocusSession.completed_at >= week_start,
        )
        .scalar()
        or 0
    )

    return FocusSummary(
        total_sessions=total_sessions,
        total_minutes=int(total_minutes),
        average_session_minutes=avg_minutes,
        streak_days=streak,
        sessions_this_week=sessions_this_week,
        minutes_this_week=int(minutes_this_week),
    )

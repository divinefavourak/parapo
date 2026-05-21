"""Pydantic schemas for focus sessions."""

from __future__ import annotations
from datetime import datetime, date
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, Field


FocusMode = Literal["pomodoro", "deep_work", "sprint"]


class FocusSessionBase(BaseModel):
    mode: FocusMode = "pomodoro"
    title: Optional[str] = None
    duration_minutes: int = Field(25, ge=1, le=480)


class FocusSessionCreate(FocusSessionBase):
    pass


class FocusSessionUpdate(BaseModel):
    elapsed_seconds: Optional[int] = Field(None, ge=0)
    is_completed: Optional[bool] = None
    completed_at: Optional[datetime] = None
    title: Optional[str] = None


class FocusSessionOut(FocusSessionBase):
    id: UUID
    user_id: UUID
    elapsed_seconds: int
    started_at: datetime
    completed_at: Optional[datetime]
    is_completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class FocusStatsOut(BaseModel):
    """Daily focus statistics."""
    stat_date: date
    total_minutes: int
    sessions_completed: int
    longest_streak_days: int

    model_config = {"from_attributes": True}


class FocusSummary(BaseModel):
    """Aggregate focus summary for analytics."""
    total_sessions: int
    total_minutes: int
    average_session_minutes: float
    streak_days: int
    sessions_this_week: int
    minutes_this_week: int

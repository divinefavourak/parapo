"""Focus session models: FocusSession, FocusStats."""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Mode: pomodoro | deep_work | sprint
    mode = Column(String(20), nullable=False, default="pomodoro")
    title = Column(String(500), nullable=True)        # what the user is working on

    # Total planned duration in minutes (e.g. 25 for pomodoro)
    duration_minutes = Column(Integer, nullable=False, default=25)

    # Elapsed seconds at time of save / completion
    elapsed_seconds = Column(Integer, default=0, nullable=False)

    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="focus_sessions")


class FocusStats(Base):
    """Aggregated daily focus statistics per user (updated after each session)."""

    __tablename__ = "focus_stats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    stat_date = Column(Date, default=date.today, nullable=False)
    total_minutes = Column(Integer, default=0, nullable=False)
    sessions_completed = Column(Integer, default=0, nullable=False)
    longest_streak_days = Column(Integer, default=0, nullable=False)  # updated globally

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

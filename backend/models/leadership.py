"""Leadership models: Team, TeamMember, Meeting, Delegation."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    org_name = Column(String(255), nullable=True)   # e.g. "Student Union Government"

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    creator = relationship("User", back_populates="created_teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    meetings = relationship("Meeting", back_populates="team", cascade="all, delete-orphan")
    delegations = relationship("Delegation", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    __tablename__ = "team_members"

    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    # Role within the team, e.g. "President", "Treasurer"
    role = Column(String(100), nullable=True)
    is_online = Column(Boolean, default=False, nullable=False)
    current_activity = Column(String(255), nullable=True)  # e.g. "In meeting", "Studying"

    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(500), nullable=False)
    scheduled_time = Column(DateTime, nullable=False)
    location = Column(String(500), nullable=True)    # physical or virtual URL

    # Status: scheduled | in_progress | completed | cancelled
    status = Column(String(30), default="scheduled", nullable=False)

    attendee_count = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)              # raw meeting notes
    ai_summary = Column(Text, nullable=True)         # AI-generated summary

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    team = relationship("Team", back_populates="meetings")


class Delegation(Base):
    __tablename__ = "delegations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)    # e.g. "Finance", "Academics"

    # Status: pending | in_progress | completed | cancelled
    status = Column(String(30), default="pending", nullable=False)

    # Progress 0-100
    progress = Column(Integer, default=0, nullable=False)

    # Name of the person it's assigned to (could be non-user)
    assigned_to = Column(String(255), nullable=True)
    assigned_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    due_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    team = relationship("Team", back_populates="delegations")

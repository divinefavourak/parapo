"""Pydantic schemas for leadership models: Team, TeamMember, Meeting, Delegation."""

from __future__ import annotations
from datetime import datetime
from typing import Optional, Literal, List
from uuid import UUID
from pydantic import BaseModel, Field


MeetingStatus = Literal["scheduled", "in_progress", "completed", "cancelled"]
DelegationStatus = Literal["pending", "in_progress", "completed", "cancelled"]


# ── Team ──────────────────────────────────────────────────────────────────────

class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    org_name: Optional[str] = None


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    org_name: Optional[str] = None


class TeamOut(TeamBase):
    id: UUID
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── TeamMember ────────────────────────────────────────────────────────────────

class TeamMemberBase(BaseModel):
    role: Optional[str] = None
    is_online: bool = False
    current_activity: Optional[str] = None


class TeamMemberAdd(BaseModel):
    user_id: UUID
    role: Optional[str] = None


class TeamMemberUpdate(BaseModel):
    role: Optional[str] = None
    is_online: Optional[bool] = None
    current_activity: Optional[str] = None


class TeamMemberOut(TeamMemberBase):
    team_id: UUID
    user_id: UUID
    joined_at: datetime

    model_config = {"from_attributes": True}


class TeamWithMembers(TeamOut):
    members: List[TeamMemberOut] = []


# ── Meeting ───────────────────────────────────────────────────────────────────

class MeetingBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    scheduled_time: datetime
    location: Optional[str] = None
    status: MeetingStatus = "scheduled"
    attendee_count: int = Field(0, ge=0)
    notes: Optional[str] = None


class MeetingCreate(MeetingBase):
    team_id: UUID


class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    scheduled_time: Optional[datetime] = None
    location: Optional[str] = None
    status: Optional[MeetingStatus] = None
    attendee_count: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    ai_summary: Optional[str] = None


class MeetingOut(MeetingBase):
    id: UUID
    team_id: UUID
    ai_summary: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Delegation ────────────────────────────────────────────────────────────────

class DelegationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = None
    status: DelegationStatus = "pending"
    progress: int = Field(0, ge=0, le=100)
    assigned_to: Optional[str] = None
    assigned_user_id: Optional[UUID] = None
    due_date: Optional[datetime] = None


class DelegationCreate(DelegationBase):
    team_id: UUID


class DelegationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[DelegationStatus] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    assigned_to: Optional[str] = None
    assigned_user_id: Optional[UUID] = None
    due_date: Optional[datetime] = None


class DelegationOut(DelegationBase):
    id: UUID
    team_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

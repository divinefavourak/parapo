"""Pydantic schemas for academic models: Course, Assignment, StudyGoal."""

from __future__ import annotations
from datetime import datetime, date
from typing import Optional, Literal, List
from uuid import UUID
from pydantic import BaseModel, Field


CourseStatus = Literal["active", "completed", "dropped"]
AssignmentStatus = Literal["pending", "submitted", "graded", "overdue"]
AssignmentPriority = Literal["high", "medium", "low"]


# ── Course ────────────────────────────────────────────────────────────────────

class CourseBase(BaseModel):
    code: str = Field(..., max_length=20)
    title: str = Field(..., min_length=1, max_length=255)
    instructor: Optional[str] = None
    credits: int = Field(3, ge=1, le=12)
    current_grade: Optional[float] = Field(None, ge=0, le=100)
    grade_point: Optional[float] = Field(None, ge=0, le=5)
    progress: int = Field(0, ge=0, le=100)
    color: str = "#4F46E5"
    status: CourseStatus = "active"


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=20)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    instructor: Optional[str] = None
    credits: Optional[int] = Field(None, ge=1, le=12)
    current_grade: Optional[float] = Field(None, ge=0, le=100)
    grade_point: Optional[float] = Field(None, ge=0, le=5)
    progress: Optional[int] = Field(None, ge=0, le=100)
    color: Optional[str] = None
    status: Optional[CourseStatus] = None


class CourseOut(CourseBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Assignment ────────────────────────────────────────────────────────────────

class AssignmentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    due_date: Optional[datetime] = None
    status: AssignmentStatus = "pending"
    priority: AssignmentPriority = "medium"
    percent_of_grade: Optional[float] = Field(None, ge=0, le=100)
    score: Optional[float] = None


class AssignmentCreate(AssignmentBase):
    course_id: UUID


class AssignmentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    due_date: Optional[datetime] = None
    status: Optional[AssignmentStatus] = None
    priority: Optional[AssignmentPriority] = None
    percent_of_grade: Optional[float] = Field(None, ge=0, le=100)
    score: Optional[float] = None


class AssignmentOut(AssignmentBase):
    id: UUID
    course_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── StudyGoal ─────────────────────────────────────────────────────────────────

class StudyGoalBase(BaseModel):
    label: str = Field(..., min_length=1, max_length=255)
    target_hours: float = Field(10.0, gt=0)
    completed_hours: float = Field(0.0, ge=0)
    week_start: date


class StudyGoalCreate(StudyGoalBase):
    pass


class StudyGoalUpdate(BaseModel):
    label: Optional[str] = Field(None, min_length=1, max_length=255)
    target_hours: Optional[float] = Field(None, gt=0)
    completed_hours: Optional[float] = Field(None, ge=0)
    week_start: Optional[date] = None


class StudyGoalOut(StudyGoalBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── GPA response ──────────────────────────────────────────────────────────────

class GPAResponse(BaseModel):
    gpa: float
    total_credits: int
    courses_counted: int

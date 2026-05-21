"""Analytics router: productivity, focus, and academic analytics."""

from typing import List, Dict, Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import get_current_user
from models.user import User
from services.analytics_service import (
    calculate_productivity_score,
    calculate_focus_streak,
    calculate_gpa,
    weekly_summary,
    daily_focus_breakdown,
    task_breakdown_by_category,
)
from models.academic import Course
from pydantic import BaseModel

router = APIRouter(prefix="/analytics", tags=["analytics"])


class ProductivityResponse(BaseModel):
    score: float
    streak_days: int
    weekly_summary: Dict[str, Any]
    task_breakdown: List[Dict[str, Any]]


class FocusAnalyticsResponse(BaseModel):
    streak_days: int
    daily_minutes: List[Dict[str, Any]]  # [{"date": "2024-01-01", "minutes": 90}]
    weekly_total_minutes: int
    weekly_sessions: int


class AcademicAnalyticsResponse(BaseModel):
    gpa: float
    total_credits: int
    courses_counted: int
    at_risk_courses: List[Dict[str, Any]]  # courses with grade < 50


@router.get("/productivity", response_model=ProductivityResponse)
def get_productivity_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProductivityResponse:
    """Return a full productivity analytics snapshot for the current user.

    Includes the weighted productivity score (0-100), focus streak, weekly summary,
    and task breakdown by category.
    """
    score = calculate_productivity_score(current_user.id, db)
    streak = calculate_focus_streak(current_user.id, db)
    summary = weekly_summary(current_user.id, db)
    breakdown = task_breakdown_by_category(current_user.id, db)

    return ProductivityResponse(
        score=score,
        streak_days=streak,
        weekly_summary=summary,
        task_breakdown=breakdown,
    )


@router.get("/focus", response_model=FocusAnalyticsResponse)
def get_focus_analytics(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FocusAnalyticsResponse:
    """Return focus analytics for the last N days.

    Provides daily minute breakdown and current streak.
    """
    from sqlalchemy import func
    from models.focus import FocusSession
    from datetime import datetime, timezone, timedelta

    streak = calculate_focus_streak(current_user.id, db)
    daily = daily_focus_breakdown(current_user.id, db, days=days)

    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

    weekly_minutes = (
        db.query(func.sum(FocusSession.duration_minutes))
        .filter(
            FocusSession.user_id == current_user.id,
            FocusSession.is_completed == True,
            FocusSession.completed_at >= week_start,
        )
        .scalar()
        or 0
    )
    weekly_sessions = (
        db.query(func.count(FocusSession.id))
        .filter(
            FocusSession.user_id == current_user.id,
            FocusSession.is_completed == True,
            FocusSession.completed_at >= week_start,
        )
        .scalar()
        or 0
    )

    return FocusAnalyticsResponse(
        streak_days=streak,
        daily_minutes=daily,
        weekly_total_minutes=int(weekly_minutes),
        weekly_sessions=int(weekly_sessions),
    )


@router.get("/academic", response_model=AcademicAnalyticsResponse)
def get_academic_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AcademicAnalyticsResponse:
    """Return academic analytics: GPA breakdown and at-risk courses.

    At-risk is defined as current_grade < 50 or grade_point < 2.0.
    """
    courses = db.query(Course).filter(Course.user_id == current_user.id).all()
    gpa_data = calculate_gpa(courses)

    at_risk = [
        {
            "code": c.code,
            "title": c.title,
            "current_grade": c.current_grade,
            "grade_point": c.grade_point,
            "credits": c.credits,
        }
        for c in courses
        if (c.current_grade is not None and c.current_grade < 50)
        or (c.grade_point is not None and c.grade_point < 2.0)
    ]

    return AcademicAnalyticsResponse(
        gpa=gpa_data["gpa"],
        total_credits=gpa_data["total_credits"],
        courses_counted=gpa_data["courses_counted"],
        at_risk_courses=at_risk,
    )

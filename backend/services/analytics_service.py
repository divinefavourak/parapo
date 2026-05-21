"""Analytics service: real calculations from database data."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone, date
from typing import Dict, Any, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func

from models.task import Task
from models.focus import FocusSession
from models.academic import Course, Assignment, StudyGoal

logger = logging.getLogger(__name__)


def calculate_gpa(courses: List[Course]) -> Dict[str, Any]:
    """Calculate weighted GPA from a list of courses.

    Uses the 5.0 scale: A=5, B=4, C=3, D=2, E/F=1.
    Only courses with a grade_point value and 'active' or 'completed' status
    are included.

    Args:
        courses: List of Course ORM objects.

    Returns:
        Dict with 'gpa' (float), 'total_credits' (int), 'courses_counted' (int).
    """
    eligible = [c for c in courses if c.grade_point is not None and c.status in ("active", "completed")]
    if not eligible:
        return {"gpa": 0.0, "total_credits": 0, "courses_counted": 0}

    total_quality_points = sum(c.grade_point * c.credits for c in eligible)
    total_credits = sum(c.credits for c in eligible)
    gpa = round(total_quality_points / total_credits, 2) if total_credits else 0.0

    return {
        "gpa": gpa,
        "total_credits": total_credits,
        "courses_counted": len(eligible),
    }


def calculate_focus_streak(user_id: UUID, db: Session) -> int:
    """Calculate the current consecutive-day streak of completed focus sessions.

    Counts backwards from today; streak breaks when a day has no completed sessions.

    Args:
        user_id: UUID of the user.
        db: Active SQLAlchemy session.

    Returns:
        Number of consecutive days (including today if applicable).
    """
    today = datetime.now(timezone.utc).date()
    streak = 0

    for delta in range(0, 365):
        check_date = today - timedelta(days=delta)
        start = datetime(check_date.year, check_date.month, check_date.day, tzinfo=timezone.utc)
        end = start + timedelta(days=1)

        count = (
            db.query(func.count(FocusSession.id))
            .filter(
                FocusSession.user_id == user_id,
                FocusSession.is_completed == True,
                FocusSession.completed_at >= start,
                FocusSession.completed_at < end,
            )
            .scalar()
        )

        if count and count > 0:
            streak += 1
        else:
            # Gap found — stop counting
            break

    return streak


def calculate_productivity_score(user_id: UUID, db: Session) -> float:
    """Compute a 0-100 productivity score based on tasks, focus sessions, and GPA.

    Weights:
      - Task completion rate this week: 40%
      - Focus minutes this week (target 300 min): 30%
      - GPA normalised to 5.0 scale: 30%

    Args:
        user_id: UUID of the user.
        db: Active SQLAlchemy session.

    Returns:
        Productivity score between 0.0 and 100.0.
    """
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

    # Task completion score
    total_tasks = (
        db.query(func.count(Task.id))
        .filter(Task.user_id == user_id, Task.created_at >= week_start)
        .scalar()
        or 0
    )
    done_tasks = (
        db.query(func.count(Task.id))
        .filter(
            Task.user_id == user_id,
            Task.is_completed == True,
            Task.updated_at >= week_start,
        )
        .scalar()
        or 0
    )
    task_score = (done_tasks / total_tasks * 100) if total_tasks > 0 else 50.0
    task_score = min(task_score, 100.0)

    # Focus score
    focus_minutes = (
        db.query(func.sum(FocusSession.duration_minutes))
        .filter(
            FocusSession.user_id == user_id,
            FocusSession.is_completed == True,
            FocusSession.completed_at >= week_start,
        )
        .scalar()
        or 0
    )
    WEEKLY_TARGET_MINUTES = 300
    focus_score = min((focus_minutes / WEEKLY_TARGET_MINUTES) * 100, 100.0)

    # GPA score
    courses = db.query(Course).filter(Course.user_id == user_id).all()
    gpa_data = calculate_gpa(courses)
    gpa_score = (gpa_data["gpa"] / 5.0) * 100 if gpa_data["gpa"] else 50.0

    # Weighted sum
    score = (task_score * 0.40) + (focus_score * 0.30) + (gpa_score * 0.30)
    return round(min(max(score, 0.0), 100.0), 1)


def weekly_summary(user_id: UUID, db: Session) -> Dict[str, Any]:
    """Produce a weekly summary of key productivity metrics.

    Covers tasks completed, focus hours, assignments submitted, and focus sessions.

    Args:
        user_id: UUID of the user.
        db: Active SQLAlchemy session.

    Returns:
        Dict with keys: tasks_completed, focus_hours, assignments_submitted,
        focus_sessions, productivity_score, gpa.
    """
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

    tasks_completed = (
        db.query(func.count(Task.id))
        .filter(
            Task.user_id == user_id,
            Task.is_completed == True,
            Task.updated_at >= week_start,
        )
        .scalar()
        or 0
    )

    focus_minutes = (
        db.query(func.sum(FocusSession.duration_minutes))
        .filter(
            FocusSession.user_id == user_id,
            FocusSession.is_completed == True,
            FocusSession.completed_at >= week_start,
        )
        .scalar()
        or 0
    )

    focus_sessions_count = (
        db.query(func.count(FocusSession.id))
        .filter(
            FocusSession.user_id == user_id,
            FocusSession.is_completed == True,
            FocusSession.completed_at >= week_start,
        )
        .scalar()
        or 0
    )

    assignments_submitted = (
        db.query(func.count(Assignment.id))
        .filter(
            Assignment.user_id == user_id,
            Assignment.status.in_(["submitted", "graded"]),
            Assignment.updated_at >= week_start,
        )
        .scalar()
        or 0
    )

    courses = db.query(Course).filter(Course.user_id == user_id).all()
    gpa_data = calculate_gpa(courses)

    productivity_score = calculate_productivity_score(user_id, db)

    return {
        "tasks_completed": tasks_completed,
        "focus_hours": round(focus_minutes / 60, 2),
        "focus_sessions": focus_sessions_count,
        "assignments_submitted": assignments_submitted,
        "productivity_score": productivity_score,
        "gpa": gpa_data["gpa"],
        "week_start": week_start.isoformat(),
    }


def daily_focus_breakdown(user_id: UUID, db: Session, days: int = 7) -> List[Dict[str, Any]]:
    """Return per-day focus minutes for the last N days.

    Args:
        user_id: UUID of the user.
        db: Active SQLAlchemy session.
        days: How many days back to look (default 7).

    Returns:
        List of dicts with 'date' (ISO date string) and 'minutes' (int).
    """
    now = datetime.now(timezone.utc)
    results = []

    for delta in range(days - 1, -1, -1):
        check_date = (now - timedelta(days=delta)).date()
        start = datetime(check_date.year, check_date.month, check_date.day, tzinfo=timezone.utc)
        end = start + timedelta(days=1)

        minutes = (
            db.query(func.sum(FocusSession.duration_minutes))
            .filter(
                FocusSession.user_id == user_id,
                FocusSession.is_completed == True,
                FocusSession.completed_at >= start,
                FocusSession.completed_at < end,
            )
            .scalar()
            or 0
        )
        results.append({"date": check_date.isoformat(), "minutes": int(minutes)})

    return results


def task_breakdown_by_category(user_id: UUID, db: Session) -> List[Dict[str, Any]]:
    """Return task counts grouped by category.

    Args:
        user_id: UUID of the user.
        db: Active SQLAlchemy session.

    Returns:
        List of dicts with 'category', 'total', 'completed'.
    """
    from sqlalchemy import Integer, cast

    rows = (
        db.query(
            Task.category,
            func.count(Task.id).label("total"),
            func.sum(cast(Task.is_completed, Integer)).label("completed"),
        )
        .filter(Task.user_id == user_id)
        .group_by(Task.category)
        .all()
    )

    return [
        {
            "category": row.category or "Uncategorised",
            "total": row.total,
            "completed": int(row.completed or 0),
        }
        for row in rows
    ]

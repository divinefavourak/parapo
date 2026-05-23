"""AI router: chat, daily briefing, meeting summarisation, and task extraction."""

from datetime import datetime, timezone, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from openai import RateLimitError
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import get_current_user
from models.task import Task
from models.focus import FocusSession
from models.academic import Course, Assignment
from models.leadership import Meeting, TeamMember
from models.user import User
from schemas.ai import (
    ChatRequest,
    ChatResponse,
    BriefingRequest,
    BriefingResponse,
    SummarizeMeetingRequest,
    SummarizeMeetingResponse,
    ExtractTasksRequest,
    ExtractTasksResponse,
    StudyPlanResponse,
)
from services import ai_service
from config import settings

router = APIRouter(prefix="/ai", tags=["ai"])


def _require_openai() -> None:
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured. Set GEMINI_API_KEY in backend/.env.",
        )


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Multi-turn conversational chat with PARAPO AI.

    Sends the conversation history to GPT-4o-mini and returns the assistant reply.
    Optionally injects user context (upcoming tasks, GPA) for better responses.
    """
    _require_openai()

    # Build lightweight user context
    user_context = {
        "name": current_user.full_name,
        "role": current_user.role,
        "organization": current_user.organization,
    }
    if payload.context:
        user_context.update(payload.context)

    try:
        reply, usage = await ai_service.chat_with_ai(payload.messages, user_context)
        return ChatResponse(reply=reply, usage=usage)
    except RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI rate limit reached. Wait a moment and try again.",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(exc)}",
        )


@router.post("/briefing", response_model=BriefingResponse)
async def daily_briefing(
    payload: BriefingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BriefingResponse:
    """Generate a personalised daily briefing for the current user.

    Automatically fetches today's pending tasks, upcoming meetings, and
    pending assignments from the database.
    """
    _require_openai()

    now = datetime.now(timezone.utc)
    today_end = now + timedelta(hours=24)

    tasks_raw: List = []
    meetings_raw: List = []
    assignments_raw: List = []

    if payload.include_tasks:
        tasks = (
            db.query(Task)
            .filter(Task.user_id == current_user.id, Task.is_completed == False)
            .order_by(Task.due_date.asc().nullslast())
            .limit(10)
            .all()
        )
        tasks_raw = [
            {"title": t.title, "priority": t.priority, "due_date": t.due_date.isoformat() if t.due_date else None}
            for t in tasks
        ]

    if payload.include_meetings:
        memberships = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).all()
        team_ids = [m.team_id for m in memberships]
        meetings = (
            db.query(Meeting)
            .filter(
                Meeting.team_id.in_(team_ids),
                Meeting.scheduled_time >= now,
                Meeting.scheduled_time <= today_end,
                Meeting.status.in_(["scheduled", "in_progress"]),
            )
            .order_by(Meeting.scheduled_time.asc())
            .limit(5)
            .all()
        )
        meetings_raw = [
            {
                "title": m.title,
                "scheduled_time": m.scheduled_time.isoformat(),
                "location": m.location,
            }
            for m in meetings
        ]

    if payload.include_assignments:
        assignments = (
            db.query(Assignment)
            .filter(
                Assignment.user_id == current_user.id,
                Assignment.status == "pending",
            )
            .order_by(Assignment.due_date.asc().nullslast())
            .limit(5)
            .all()
        )
        assignments_raw = [
            {"title": a.title, "due_date": a.due_date.isoformat() if a.due_date else None, "status": a.status}
            for a in assignments
        ]

    try:
        briefing_text = await ai_service.generate_daily_briefing(
            tasks=tasks_raw,
            meetings=meetings_raw,
            assignments=assignments_raw,
            user_name=current_user.full_name.split()[0],
        )
        return BriefingResponse(
            briefing=briefing_text,
            generated_at=now.isoformat(),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(exc)}",
        )


@router.post("/summarize-meeting", response_model=SummarizeMeetingResponse)
async def summarize_meeting(
    payload: SummarizeMeetingRequest,
    current_user: User = Depends(get_current_user),
) -> SummarizeMeetingResponse:
    """Summarise raw meeting notes using AI.

    Returns a structured summary with key decisions, action items, and next steps.
    """
    _require_openai()
    try:
        return await ai_service.summarize_meeting_notes(
            notes=payload.notes,
            meeting_title=payload.meeting_title,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(exc)}",
        )


@router.post("/extract-tasks", response_model=ExtractTasksResponse)
async def extract_tasks(
    payload: ExtractTasksRequest,
    current_user: User = Depends(get_current_user),
) -> ExtractTasksResponse:
    """Extract actionable tasks from free-form text (e.g. meeting notes, messages).

    Returns a list of suggested tasks with priority and category fields.
    """
    _require_openai()
    try:
        tasks = await ai_service.extract_tasks_from_text(payload.text)
        return ExtractTasksResponse(tasks=tasks)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(exc)}",
        )


@router.post("/study-plan", response_model=StudyPlanResponse)
async def generate_study_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyPlanResponse:
    """Generate a personalised weekly study plan based on the user's courses and assignments."""
    _require_openai()

    courses = db.query(Course).filter(Course.user_id == current_user.id).all()
    assignments = (
        db.query(Assignment)
        .filter(Assignment.user_id == current_user.id, Assignment.status == "pending")
        .order_by(Assignment.due_date.asc().nullslast())
        .all()
    )

    courses_data = [
        {"code": c.code, "title": c.title, "credits": c.credits, "current_grade": c.current_grade, "status": c.status}
        for c in courses
    ]
    assignments_data = [
        {"title": a.title, "due_date": a.due_date.isoformat() if a.due_date else None, "priority": a.priority}
        for a in assignments
    ]

    try:
        return await ai_service.generate_study_plan(courses_data, assignments_data)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(exc)}",
        )


@router.post("/analyze-workload", response_model=ChatResponse)
async def analyze_workload(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Provide an AI workload analysis based on current tasks and recent focus sessions."""
    _require_openai()

    tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id, Task.is_completed == False)
        .limit(15)
        .all()
    )
    sessions = (
        db.query(FocusSession)
        .filter(FocusSession.user_id == current_user.id)
        .order_by(FocusSession.started_at.desc())
        .limit(20)
        .all()
    )

    tasks_data = [
        {"title": t.title, "priority": t.priority, "category": t.category, "due_date": t.due_date.isoformat() if t.due_date else None}
        for t in tasks
    ]
    sessions_data = [
        {"mode": s.mode, "duration_minutes": s.duration_minutes, "is_completed": s.is_completed}
        for s in sessions
    ]

    try:
        analysis = await ai_service.analyze_workload(tasks_data, sessions_data)
        return ChatResponse(reply=analysis)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(exc)}",
        )

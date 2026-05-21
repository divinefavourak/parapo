"""Pydantic schemas for AI assistant endpoints."""

from __future__ import annotations
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field


MessageRole = Literal["user", "assistant", "system"]


class ChatMessage(BaseModel):
    role: MessageRole
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1)
    context: Optional[Dict[str, Any]] = None  # extra user context (upcoming tasks, etc.)


class ChatResponse(BaseModel):
    reply: str
    usage: Optional[Dict[str, int]] = None


class BriefingRequest(BaseModel):
    """Optional override — if omitted, backend fetches data from DB."""
    include_tasks: bool = True
    include_meetings: bool = True
    include_assignments: bool = True


class BriefingResponse(BaseModel):
    briefing: str
    generated_at: str           # ISO timestamp


class SummarizeMeetingRequest(BaseModel):
    notes: str = Field(..., min_length=1)
    meeting_title: Optional[str] = None


class ActionItem(BaseModel):
    description: str
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None


class SummarizeMeetingResponse(BaseModel):
    summary: str
    key_decisions: List[str]
    action_items: List[ActionItem]
    next_steps: List[str]


class ExtractTasksRequest(BaseModel):
    text: str = Field(..., min_length=1)


class ExtractedTask(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Literal["high", "medium", "low"] = "medium"
    category: Optional[str] = None
    due_date: Optional[str] = None  # ISO date string if detected


class ExtractTasksResponse(BaseModel):
    tasks: List[ExtractedTask]


class StudyPlanRequest(BaseModel):
    """Optional — if omitted, backend loads user's courses/assignments from DB."""
    pass


class StudyPlanResponse(BaseModel):
    recommendations: List[str]
    weekly_plan: Dict[str, List[str]]   # day -> list of study activities
    priority_courses: List[str]

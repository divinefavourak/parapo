"""Pydantic schemas for Task."""

from __future__ import annotations
from datetime import datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, Field


KanbanColumn = Literal["backlog", "in_progress", "done"]
Priority = Literal["high", "medium", "low"]


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = None
    column: KanbanColumn = "backlog"
    priority: Priority = "medium"
    assignee_name: Optional[str] = None
    assignee_initials: Optional[str] = None
    progress: int = Field(0, ge=0, le=100)
    due_date: Optional[datetime] = None
    is_ai_suggested: bool = False


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = None
    column: Optional[KanbanColumn] = None
    priority: Optional[Priority] = None
    assignee_name: Optional[str] = None
    assignee_initials: Optional[str] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None


class TaskMoveRequest(BaseModel):
    """Move a task to a different kanban column."""
    column: KanbanColumn


class TaskOut(TaskBase):
    id: UUID
    user_id: UUID
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KanbanBoard(BaseModel):
    backlog: list[TaskOut]
    in_progress: list[TaskOut]
    done: list[TaskOut]

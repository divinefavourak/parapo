"""Tasks router: full CRUD + kanban column move endpoint."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import get_current_user
from models.task import Task
from models.user import User
from schemas.task import TaskCreate, TaskUpdate, TaskOut, TaskMoveRequest, KanbanBoard

router = APIRouter(prefix="/tasks", tags=["tasks"])


# ── Helper ────────────────────────────────────────────────────────────────────

def _get_task_or_404(task_id: UUID, user_id: UUID, db: Session) -> Task:
    """Fetch a task belonging to the user or raise 404."""
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == user_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    return task


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/board", response_model=KanbanBoard)
def get_kanban_board(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> KanbanBoard:
    """Return all tasks organised into kanban columns."""
    tasks = db.query(Task).filter(Task.user_id == current_user.id).order_by(Task.created_at.desc()).all()

    return KanbanBoard(
        backlog=[TaskOut.model_validate(t) for t in tasks if t.column == "backlog"],
        in_progress=[TaskOut.model_validate(t) for t in tasks if t.column == "in_progress"],
        done=[TaskOut.model_validate(t) for t in tasks if t.column == "done"],
    )


@router.get("/", response_model=List[TaskOut])
def list_tasks(
    column: Optional[str] = Query(None, description="Filter by kanban column"),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    is_completed: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[TaskOut]:
    """List all tasks for the current user with optional filters."""
    query = db.query(Task).filter(Task.user_id == current_user.id)

    if column:
        query = query.filter(Task.column == column)
    if priority:
        query = query.filter(Task.priority == priority)
    if category:
        query = query.filter(Task.category == category)
    if is_completed is not None:
        query = query.filter(Task.is_completed == is_completed)

    tasks = query.order_by(Task.created_at.desc()).all()
    return [TaskOut.model_validate(t) for t in tasks]


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskOut:
    """Create a new task for the current user."""
    task = Task(
        user_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskOut.model_validate(task)


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskOut:
    """Get a single task by ID."""
    task = _get_task_or_404(task_id, current_user.id, db)
    return TaskOut.model_validate(task)


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: UUID,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskOut:
    """Partially update a task."""
    task = _get_task_or_404(task_id, current_user.id, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    # Auto-mark completed when moved to done column
    if payload.column == "done":
        task.is_completed = True
    elif payload.column in ("backlog", "in_progress") and task.is_completed:
        task.is_completed = False

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return TaskOut.model_validate(task)


@router.post("/{task_id}/move", response_model=TaskOut)
def move_task(
    task_id: UUID,
    payload: TaskMoveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskOut:
    """Move a task to a different kanban column.

    Automatically updates is_completed when moved to/from 'done'.
    """
    task = _get_task_or_404(task_id, current_user.id, db)
    task.column = payload.column
    task.is_completed = payload.column == "done"
    task.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(task)
    return TaskOut.model_validate(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a task permanently."""
    task = _get_task_or_404(task_id, current_user.id, db)
    db.delete(task)
    db.commit()
    return None

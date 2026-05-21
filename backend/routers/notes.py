"""Notes router: full CRUD for user notes."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import get_current_user
from models.note import Note
from models.user import User
from schemas.note import NoteCreate, NoteUpdate, NoteOut

router = APIRouter(prefix="/notes", tags=["notes"])


def _get_note_or_404(note_id: UUID, user_id: UUID, db: Session) -> Note:
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    return note


@router.get("/", response_model=List[NoteOut])
def list_notes(
    folder: Optional[str] = Query(None),
    is_pinned: Optional[bool] = Query(None),
    search: Optional[str] = Query(None, description="Search in title and content"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[NoteOut]:
    """List all notes for the current user.

    Pinned notes are returned first, then by updated_at descending.
    Supports filtering by folder, pinned status, and full-text search.
    """
    query = db.query(Note).filter(Note.user_id == current_user.id)

    if folder:
        query = query.filter(Note.folder == folder)
    if is_pinned is not None:
        query = query.filter(Note.is_pinned == is_pinned)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            Note.title.ilike(pattern) | Note.content.ilike(pattern)
        )

    notes = query.order_by(Note.is_pinned.desc(), Note.updated_at.desc()).all()
    return [NoteOut.model_validate(n) for n in notes]


@router.post("/", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteOut:
    """Create a new note."""
    note = Note(user_id=current_user.id, **payload.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return NoteOut.model_validate(note)


@router.get("/{note_id}", response_model=NoteOut)
def get_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteOut:
    """Get a single note by ID."""
    return NoteOut.model_validate(_get_note_or_404(note_id, current_user.id, db))


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: UUID,
    payload: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteOut:
    """Partially update a note."""
    note = _get_note_or_404(note_id, current_user.id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    return NoteOut.model_validate(note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a note permanently."""
    note = _get_note_or_404(note_id, current_user.id, db)
    db.delete(note)
    db.commit()
    return None


@router.get("/folders/list", response_model=List[str])
def list_folders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[str]:
    """Return a unique list of folder names used by the current user's notes."""
    rows = (
        db.query(Note.folder)
        .filter(Note.user_id == current_user.id, Note.folder.isnot(None))
        .distinct()
        .order_by(Note.folder.asc())
        .all()
    )
    return [row.folder for row in rows if row.folder]

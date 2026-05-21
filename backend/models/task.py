"""Task model for kanban board."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)      # e.g. "Academic", "Leadership"

    # Kanban column: backlog | in_progress | done
    column = Column(String(50), nullable=False, default="backlog")

    # Priority: high | medium | low
    priority = Column(String(20), nullable=False, default="medium")

    # Optional assignee info (for delegation / team tasks displayed in personal board)
    assignee_name = Column(String(255), nullable=True)
    assignee_initials = Column(String(10), nullable=True)

    # Progress percentage 0-100
    progress = Column(Integer, default=0, nullable=False)

    due_date = Column(DateTime, nullable=True)
    is_ai_suggested = Column(Boolean, default=False, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="tasks")

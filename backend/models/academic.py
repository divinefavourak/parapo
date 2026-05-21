"""Academic models: Course, Assignment, StudyGoal."""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    code = Column(String(20), nullable=False)         # e.g. "CSC 301"
    title = Column(String(255), nullable=False)
    instructor = Column(String(255), nullable=True)
    credits = Column(Integer, default=3, nullable=False)

    # Grade tracking
    current_grade = Column(Float, nullable=True)      # percentage 0-100
    grade_point = Column(Float, nullable=True)        # 0.0 - 5.0 (or 4.0 depending on scale)

    # Progress percentage
    progress = Column(Integer, default=0, nullable=False)

    # UI theming
    color = Column(String(20), default="#4F46E5", nullable=False)

    # Status: active | completed | dropped
    status = Column(String(20), default="active", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="courses")
    assignments = relationship("Assignment", back_populates="course", cascade="all, delete-orphan")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(500), nullable=False)
    due_date = Column(DateTime, nullable=True)

    # Status: pending | submitted | graded | overdue
    status = Column(String(20), default="pending", nullable=False)

    # Priority: high | medium | low
    priority = Column(String(20), default="medium", nullable=False)

    # Weight in course grade (0-100)
    percent_of_grade = Column(Float, nullable=True)

    score = Column(Float, nullable=True)              # actual score if graded

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    course = relationship("Course", back_populates="assignments")
    user = relationship("User", back_populates="assignments")


class StudyGoal(Base):
    __tablename__ = "study_goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    label = Column(String(255), nullable=False)          # e.g. "Study 10 hrs/week"
    target_hours = Column(Float, default=10.0, nullable=False)
    completed_hours = Column(Float, default=0.0, nullable=False)
    week_start = Column(Date, default=date.today, nullable=False)  # ISO Monday of the target week

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="study_goals")

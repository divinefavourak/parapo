"""Academic router: courses, assignments, study goals, GPA."""

from datetime import datetime, date, timedelta
from typing import List, Optional, Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import get_current_user
from models.academic import Course, Assignment, StudyGoal
from models.user import User
from schemas.academic import (
    CourseCreate, CourseUpdate, CourseOut,
    AssignmentCreate, AssignmentUpdate, AssignmentOut,
    StudyGoalCreate, StudyGoalUpdate, StudyGoalOut,
    GPAResponse,
)
from services.analytics_service import calculate_gpa

router = APIRouter(prefix="/academic", tags=["academic"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_course_or_404(course_id: UUID, user_id: UUID, db: Session) -> Course:
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == user_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")
    return course


def _get_assignment_or_404(assignment_id: UUID, user_id: UUID, db: Session) -> Assignment:
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id, Assignment.user_id == user_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")
    return assignment


def _get_goal_or_404(goal_id: UUID, user_id: UUID, db: Session) -> StudyGoal:
    goal = db.query(StudyGoal).filter(StudyGoal.id == goal_id, StudyGoal.user_id == user_id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study goal not found.")
    return goal


# ── Overview ─────────────────────────────────────────────────────────────────

@router.get("/overview")
def get_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Return a single aggregated payload matching the frontend AcademicData shape."""
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    courses = db.query(Course).filter(Course.user_id == current_user.id).order_by(Course.code).all()
    assignments = db.query(Assignment).filter(Assignment.user_id == current_user.id).order_by(Assignment.due_date.asc().nullslast()).all()
    study_goals = db.query(StudyGoal).filter(
        StudyGoal.user_id == current_user.id,
        StudyGoal.week_start == week_start,
    ).all()

    course_map: Dict[UUID, str] = {c.id: c.code for c in courses}
    active_courses = [c for c in courses if c.status == "active"]
    graded = [c for c in active_courses if c.grade_point is not None and c.credits]
    gpa = (sum(c.grade_point * c.credits for c in graded) / sum(c.credits for c in graded)) if graded else 0.0

    total_a = len(assignments)
    completed_a = sum(1 for a in assignments if a.status in ("submitted", "graded"))
    study_hours = sum(g.completed_hours for g in study_goals)

    def _due_label(a: Assignment) -> str:
        if not a.due_date:
            return "No due date"
        delta = (a.due_date.date() - today).days
        if delta < 0:
            return f"Overdue {abs(delta)}d"
        if delta == 0:
            return "Due today"
        if delta == 1:
            return "Due tomorrow"
        return f"Due in {delta}d"

    return {
        "semesterLabel": f"Semester · {today.strftime('%b %Y')}",
        "stats": {
            "currentGPA": round(gpa, 2),
            "targetGPA": 4.5,
            "creditsCompleted": sum(c.credits for c in courses if c.status == "completed"),
            "creditsEnrolled": sum(c.credits for c in active_courses),
            "totalAssignments": total_a,
            "completedAssignments": completed_a,
            "studyHoursThisWeek": round(study_hours, 1),
        },
        "courses": [
            {
                "id": str(c.id),
                "code": c.code,
                "title": c.title,
                "instructor": c.instructor or "",
                "credits": c.credits,
                "currentGrade": f"{c.current_grade:.0f}%" if c.current_grade is not None else "N/A",
                "gradePoint": c.grade_point or 0.0,
                "progress": (c.progress or 0) / 100,
                "color": c.color,
                "status": c.status,
            }
            for c in courses
        ],
        "assignments": [
            {
                "id": str(a.id),
                "courseCode": course_map.get(a.course_id, ""),
                "title": a.title,
                "dueDate": a.due_date.isoformat() if a.due_date else None,
                "dueTimeLabel": _due_label(a),
                "status": a.status,
                "priority": a.priority,
                "percentOfGrade": a.percent_of_grade or 0,
            }
            for a in assignments
        ],
        "studyGoals": [
            {
                "id": str(g.id),
                "label": g.label,
                "targetHours": g.target_hours,
                "completedHours": g.completed_hours,
            }
            for g in study_goals
        ],
    }


# ── Courses ───────────────────────────────────────────────────────────────────

@router.get("/courses", response_model=List[CourseOut])
def list_courses(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[CourseOut]:
    """List all courses for the current user."""
    query = db.query(Course).filter(Course.user_id == current_user.id)
    if status:
        query = query.filter(Course.status == status)
    return [CourseOut.model_validate(c) for c in query.order_by(Course.code).all()]


@router.post("/courses", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
def create_course(
    payload: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CourseOut:
    """Add a new course."""
    course = Course(user_id=current_user.id, **payload.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return CourseOut.model_validate(course)


@router.get("/courses/{course_id}", response_model=CourseOut)
def get_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CourseOut:
    """Get a single course."""
    return CourseOut.model_validate(_get_course_or_404(course_id, current_user.id, db))


@router.patch("/courses/{course_id}", response_model=CourseOut)
def update_course(
    course_id: UUID,
    payload: CourseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CourseOut:
    """Update course details."""
    course = _get_course_or_404(course_id, current_user.id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(course, field, value)
    course.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(course)
    return CourseOut.model_validate(course)


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a course and all its assignments."""
    course = _get_course_or_404(course_id, current_user.id, db)
    db.delete(course)
    db.commit()
    return None


# ── GPA ───────────────────────────────────────────────────────────────────────

@router.get("/gpa", response_model=GPAResponse)
def get_gpa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GPAResponse:
    """Calculate and return the current GPA from all graded courses."""
    courses = db.query(Course).filter(Course.user_id == current_user.id).all()
    gpa_data = calculate_gpa(courses)
    return GPAResponse(**gpa_data)


# ── Assignments ───────────────────────────────────────────────────────────────

@router.get("/assignments", response_model=List[AssignmentOut])
def list_assignments(
    course_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[AssignmentOut]:
    """List assignments for the current user, with optional filters."""
    query = db.query(Assignment).filter(Assignment.user_id == current_user.id)
    if course_id:
        query = query.filter(Assignment.course_id == course_id)
    if status:
        query = query.filter(Assignment.status == status)
    if priority:
        query = query.filter(Assignment.priority == priority)
    return [AssignmentOut.model_validate(a) for a in query.order_by(Assignment.due_date.asc().nullslast()).all()]


@router.post("/assignments", response_model=AssignmentOut, status_code=status.HTTP_201_CREATED)
def create_assignment(
    payload: AssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AssignmentOut:
    """Create a new assignment. The course must belong to the current user."""
    # Verify course ownership
    _get_course_or_404(payload.course_id, current_user.id, db)

    assignment = Assignment(
        user_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return AssignmentOut.model_validate(assignment)


@router.get("/assignments/{assignment_id}", response_model=AssignmentOut)
def get_assignment(
    assignment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AssignmentOut:
    """Get a single assignment."""
    return AssignmentOut.model_validate(_get_assignment_or_404(assignment_id, current_user.id, db))


@router.patch("/assignments/{assignment_id}", response_model=AssignmentOut)
def update_assignment(
    assignment_id: UUID,
    payload: AssignmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AssignmentOut:
    """Update an assignment."""
    assignment = _get_assignment_or_404(assignment_id, current_user.id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(assignment, field, value)
    assignment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assignment)
    return AssignmentOut.model_validate(assignment)


@router.patch("/assignments/{assignment_id}/submit", response_model=AssignmentOut)
def submit_assignment(
    assignment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AssignmentOut:
    """Mark an assignment as submitted."""
    assignment = _get_assignment_or_404(assignment_id, current_user.id, db)
    assignment.status = "submitted"
    assignment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assignment)
    return AssignmentOut.model_validate(assignment)


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete an assignment."""
    assignment = _get_assignment_or_404(assignment_id, current_user.id, db)
    db.delete(assignment)
    db.commit()
    return None


# ── Study Goals ───────────────────────────────────────────────────────────────

@router.get("/study-goals", response_model=List[StudyGoalOut])
def list_study_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[StudyGoalOut]:
    """List study goals for the current user."""
    goals = db.query(StudyGoal).filter(StudyGoal.user_id == current_user.id).order_by(StudyGoal.week_start.desc()).all()
    return [StudyGoalOut.model_validate(g) for g in goals]


@router.post("/study-goals", response_model=StudyGoalOut, status_code=status.HTTP_201_CREATED)
def create_study_goal(
    payload: StudyGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyGoalOut:
    """Create a new weekly study goal."""
    goal = StudyGoal(user_id=current_user.id, **payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return StudyGoalOut.model_validate(goal)


@router.patch("/study-goals/{goal_id}", response_model=StudyGoalOut)
def update_study_goal(
    goal_id: UUID,
    payload: StudyGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyGoalOut:
    """Update a study goal's progress or target."""
    goal = _get_goal_or_404(goal_id, current_user.id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    goal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(goal)
    return StudyGoalOut.model_validate(goal)


@router.delete("/study-goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_goal(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a study goal."""
    goal = _get_goal_or_404(goal_id, current_user.id, db)
    db.delete(goal)
    db.commit()
    return None

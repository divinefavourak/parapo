"""Leadership router: teams, meetings, delegations."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import get_current_user
from models.leadership import Team, TeamMember, Meeting, Delegation
from models.user import User
from schemas.leadership import (
    TeamCreate, TeamUpdate, TeamOut, TeamWithMembers,
    TeamMemberAdd, TeamMemberUpdate, TeamMemberOut,
    MeetingCreate, MeetingUpdate, MeetingOut,
    DelegationCreate, DelegationUpdate, DelegationOut,
)

router = APIRouter(prefix="/leadership", tags=["leadership"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_team_or_404(team_id: UUID, db: Session) -> Team:
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")
    return team


def _assert_team_member(team_id: UUID, user_id: UUID, db: Session) -> TeamMember:
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id, TeamMember.user_id == user_id
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this team.")
    return membership


# ── Teams ─────────────────────────────────────────────────────────────────────

@router.get("/teams", response_model=List[TeamOut])
def list_teams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[TeamOut]:
    """List all teams the current user is a member of."""
    memberships = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).all()
    team_ids = [m.team_id for m in memberships]
    teams = db.query(Team).filter(Team.id.in_(team_ids)).order_by(Team.name).all()
    return [TeamOut.model_validate(t) for t in teams]


@router.post("/teams", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def create_team(
    payload: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TeamOut:
    """Create a new team. The creator is automatically added as a member."""
    team = Team(created_by=current_user.id, **payload.model_dump())
    db.add(team)
    db.flush()  # get the team.id before commit

    # Add creator as first member with default role
    member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role=current_user.role or "Leader",
    )
    db.add(member)
    db.commit()
    db.refresh(team)
    return TeamOut.model_validate(team)


@router.get("/teams/{team_id}", response_model=TeamWithMembers)
def get_team(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TeamWithMembers:
    """Get a team with its member list. User must be a team member."""
    _assert_team_member(team_id, current_user.id, db)
    team = _get_team_or_404(team_id, db)
    members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    result = TeamWithMembers.model_validate(team)
    result.members = [TeamMemberOut.model_validate(m) for m in members]
    return result


@router.patch("/teams/{team_id}", response_model=TeamOut)
def update_team(
    team_id: UUID,
    payload: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TeamOut:
    """Update team details. Only members can update."""
    _assert_team_member(team_id, current_user.id, db)
    team = _get_team_or_404(team_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(team, field, value)
    team.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(team)
    return TeamOut.model_validate(team)


@router.delete("/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a team. Only the creator can delete it."""
    team = _get_team_or_404(team_id, db)
    if team.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the team creator can delete it.")
    db.delete(team)
    db.commit()
    return None


# ── Team Members ──────────────────────────────────────────────────────────────

@router.post("/teams/{team_id}/members", response_model=TeamMemberOut, status_code=status.HTTP_201_CREATED)
def add_team_member(
    team_id: UUID,
    payload: TeamMemberAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TeamMemberOut:
    """Add a user to a team. The requestor must already be a member."""
    _assert_team_member(team_id, current_user.id, db)
    _get_team_or_404(team_id, db)

    existing = db.query(TeamMember).filter(
        TeamMember.team_id == team_id, TeamMember.user_id == payload.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a team member.")

    target_user = db.query(User).filter(User.id == payload.user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found.")

    member = TeamMember(team_id=team_id, user_id=payload.user_id, role=payload.role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return TeamMemberOut.model_validate(member)


@router.patch("/teams/{team_id}/members/{user_id}", response_model=TeamMemberOut)
def update_team_member(
    team_id: UUID,
    user_id: UUID,
    payload: TeamMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TeamMemberOut:
    """Update a team member's role or activity status."""
    _assert_team_member(team_id, current_user.id, db)
    member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id, TeamMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    db.commit()
    db.refresh(member)
    return TeamMemberOut.model_validate(member)


@router.delete("/teams/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    team_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Remove a member from a team. Members can remove themselves; creator can remove anyone."""
    team = _get_team_or_404(team_id, db)
    is_self = user_id == current_user.id
    is_creator = team.created_by == current_user.id
    if not is_self and not is_creator:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot remove this member.")

    member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id, TeamMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found.")
    db.delete(member)
    db.commit()
    return None


# ── Meetings ──────────────────────────────────────────────────────────────────

@router.get("/meetings", response_model=List[MeetingOut])
def list_meetings(
    team_id: Optional[UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[MeetingOut]:
    """List meetings for all teams the user belongs to, with optional filters."""
    memberships = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).all()
    team_ids = [m.team_id for m in memberships]

    query = db.query(Meeting).filter(Meeting.team_id.in_(team_ids))
    if team_id:
        query = query.filter(Meeting.team_id == team_id)
    if status_filter:
        query = query.filter(Meeting.status == status_filter)

    return [MeetingOut.model_validate(m) for m in query.order_by(Meeting.scheduled_time.asc()).all()]


@router.post("/meetings", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
def create_meeting(
    payload: MeetingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeetingOut:
    """Create a meeting for a team the user belongs to."""
    _assert_team_member(payload.team_id, current_user.id, db)
    meeting = Meeting(**payload.model_dump())
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return MeetingOut.model_validate(meeting)


@router.get("/meetings/{meeting_id}", response_model=MeetingOut)
def get_meeting(
    meeting_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeetingOut:
    """Get a single meeting."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    _assert_team_member(meeting.team_id, current_user.id, db)
    return MeetingOut.model_validate(meeting)


@router.patch("/meetings/{meeting_id}", response_model=MeetingOut)
def update_meeting(
    meeting_id: UUID,
    payload: MeetingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeetingOut:
    """Update meeting details, status, or notes."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    _assert_team_member(meeting.team_id, current_user.id, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(meeting, field, value)
    meeting.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(meeting)
    return MeetingOut.model_validate(meeting)


@router.delete("/meetings/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a meeting."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    _assert_team_member(meeting.team_id, current_user.id, db)
    db.delete(meeting)
    db.commit()
    return None


# ── Delegations ───────────────────────────────────────────────────────────────

@router.get("/delegations", response_model=List[DelegationOut])
def list_delegations(
    team_id: Optional[UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[DelegationOut]:
    """List delegations for all teams the user belongs to."""
    memberships = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).all()
    team_ids = [m.team_id for m in memberships]

    query = db.query(Delegation).filter(Delegation.team_id.in_(team_ids))
    if team_id:
        query = query.filter(Delegation.team_id == team_id)
    if status_filter:
        query = query.filter(Delegation.status == status_filter)

    return [DelegationOut.model_validate(d) for d in query.order_by(Delegation.created_at.desc()).all()]


@router.post("/delegations", response_model=DelegationOut, status_code=status.HTTP_201_CREATED)
def create_delegation(
    payload: DelegationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DelegationOut:
    """Create a delegation task within a team."""
    _assert_team_member(payload.team_id, current_user.id, db)
    delegation = Delegation(**payload.model_dump())
    db.add(delegation)
    db.commit()
    db.refresh(delegation)
    return DelegationOut.model_validate(delegation)


@router.get("/delegations/{delegation_id}", response_model=DelegationOut)
def get_delegation(
    delegation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DelegationOut:
    """Get a single delegation."""
    delegation = db.query(Delegation).filter(Delegation.id == delegation_id).first()
    if not delegation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delegation not found.")
    _assert_team_member(delegation.team_id, current_user.id, db)
    return DelegationOut.model_validate(delegation)


@router.patch("/delegations/{delegation_id}", response_model=DelegationOut)
def update_delegation(
    delegation_id: UUID,
    payload: DelegationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DelegationOut:
    """Update a delegation's status, progress, or assignment."""
    delegation = db.query(Delegation).filter(Delegation.id == delegation_id).first()
    if not delegation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delegation not found.")
    _assert_team_member(delegation.team_id, current_user.id, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(delegation, field, value)
    delegation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(delegation)
    return DelegationOut.model_validate(delegation)


@router.delete("/delegations/{delegation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_delegation(
    delegation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a delegation."""
    delegation = db.query(Delegation).filter(Delegation.id == delegation_id).first()
    if not delegation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delegation not found.")
    _assert_team_member(delegation.team_id, current_user.id, db)
    db.delete(delegation)
    db.commit()
    return None

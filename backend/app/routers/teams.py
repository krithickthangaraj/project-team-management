from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import asyncio

from app.core.database import get_db
from app.models.team import Team, team_members
from app.models.project import Project
from app.models.user import User
from app.schemas.team_schema import TeamCreate, AddMember, RemoveMember, TeamResponse
from app.utils.role_checker import get_current_user
from app.services.websocket_manager import manager

router = APIRouter(prefix="/teams", tags=["teams"])

# ---------------- CREATE TEAM ----------------
@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Team:
    if current_user.role not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized to create teams")

    owner_id = payload.owner_id if current_user.role == "admin" else current_user.id

    team = Team(name=payload.name, project_id=payload.project_id, owner_id=owner_id)
    db.add(team)
    db.commit()
    db.refresh(team)

    # Collect initial member ids, ensure owner(s) are included
    initial_member_ids = set(payload.member_ids or [])

    # Include project owner by default (if exists)
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if project and project.owner_id:
        initial_member_ids.add(project.owner_id)

    # Include selected team owner by default (if provided)
    if payload.owner_id:
        initial_member_ids.add(payload.owner_id)

    if initial_member_ids:
        users = db.query(User).filter(User.id.in_(list(initial_member_ids))).all()
        for user in users:
            if user not in team.members:
                team.members.append(user)
        db.commit()
        db.refresh(team)

    # WebSocket broadcast: team created
    await manager.broadcast(team.project_id, {
        "event": "team_created",
        "team_id": team.id,
        "owner_id": team.owner_id,
        "members": [u.id for u in team.members]
    })

    return team


# ---------------- ADD MEMBER ----------------
@router.post("/add_member", status_code=status.HTTP_200_OK)
async def add_member(
    payload: AddMember,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if current_user.role not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized to add members")

    team = db.query(Team).filter(Team.id == payload.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user in team.members:
        raise HTTPException(status_code=400, detail="User already in team")

    team.members.append(user)
    db.commit()

    # WebSocket broadcast: member added
    await manager.broadcast(team.project_id, {
        "event": "team_member_added",
        "team_id": team.id,
        "user_id": user.id,
        "user_name": user.name
    })

    return {"message": f"User {user.id} added to team {team.id}"}


# ---------------- REMOVE MEMBER ----------------
@router.post("/remove_member", status_code=status.HTTP_200_OK)
async def remove_member(
    payload: RemoveMember,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if current_user.role not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized to remove members")

    team = db.query(Team).filter(Team.id == payload.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user or user not in team.members:
        raise HTTPException(status_code=404, detail="User not found in team")

    team.members.remove(user)
    db.commit()

    # WebSocket broadcast: member removed
    await manager.broadcast(team.project_id, {
        "event": "team_member_removed",
        "team_id": team.id,
        "user_id": user.id,
        "user_name": user.name
    })

    return {"message": f"User {user.id} removed from team {team.id}"}


# ---------------- LIST TEAMS ----------------
@router.get("/", response_model=List[TeamResponse])
def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Team]:
    def serialize(team: Team) -> TeamResponse:
        return TeamResponse(
            id=team.id,
            name=team.name,
            project_id=team.project_id,
            owner_id=team.owner_id,
            member_ids=[m.id for m in team.members],
        )

    if current_user.role == "admin":
        teams = db.query(Team).all()
        return [serialize(t) for t in teams]
    if current_user.role == "owner":
        teams = db.query(Team).filter(Team.owner_id == current_user.id).all()
        return [serialize(t) for t in teams]
    teams = (
        db.query(Team)
        .join(team_members, team_members.c.team_id == Team.id)
        .filter(team_members.c.user_id == current_user.id)
        .all()
    )
    return [serialize(t) for t in teams]


# ---------------- GET PROJECT TEAMS (FOR OWNERS) ----------------
@router.get("/project/{project_id}", response_model=List[TeamResponse])
def get_project_teams(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Team]:
    """Get all teams for a specific project (owner access)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Verify owner access
    if current_user.role == "owner" and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this project's teams")
    elif current_user.role not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    def serialize(team: Team) -> TeamResponse:
        return TeamResponse(
            id=team.id,
            name=team.name,
            project_id=team.project_id,
            owner_id=team.owner_id,
            member_ids=[m.id for m in team.members],
        )
    
    teams = db.query(Team).filter(Team.project_id == project_id).all()
    return [serialize(t) for t in teams]


# ---------------- GET PROJECT MEMBERS (FOR OWNERS) ----------------
@router.get("/project/{project_id}/members", response_model=List[dict])
def get_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all members of a project (from teams) for owners."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Verify owner access
    if current_user.role == "owner" and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this project's members")
    elif current_user.role not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all teams in this project
    teams = db.query(Team).filter(Team.project_id == project_id).all()
    
    members = []
    for team in teams:
        for member in team.members:
            members.append({
                "id": member.id,
                "name": member.name,
                "email": member.email,
                "role": member.role,
                "team_id": team.id,
                "team_name": team.name
            })
    
    return members


# ---------------- GET AVAILABLE USERS (FOR OWNERS) ----------------
@router.get("/project/{project_id}/available-users", response_model=List[dict])
def get_available_users(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all users available to be added to the project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Verify owner access
    if current_user.role == "owner" and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this project")
    elif current_user.role not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all users who are not already in this project
    existing_member_ids = db.query(team_members.c.user_id)\
        .join(Team, Team.id == team_members.c.team_id)\
        .filter(Team.project_id == project_id)\
        .all()
    
    existing_ids = [row[0] for row in existing_member_ids]
    
    available_users = db.query(User)\
        .filter(User.id.notin_(existing_ids), User.role == "member")\
        .all()
    
    return [{"id": user.id, "name": user.name, "email": user.email} for user in available_users]

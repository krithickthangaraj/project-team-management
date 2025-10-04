from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.team import Team, team_members
from app.models.user import User
from app.schemas.team_schema import TeamCreate, AddMember, RemoveMember, TeamResponse
from app.utils.role_checker import get_current_user

router = APIRouter(prefix="/teams", tags=["teams"])

# ---------------- CREATE TEAM ----------------
@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Team:
    if current_user.role not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized to create teams")

    # Determine owner
    if current_user.role == "admin":
        if not payload.owner_id:
            raise HTTPException(status_code=400, detail="Admin must specify owner_id")
        owner_id = payload.owner_id
    else:
        owner_id = current_user.id

    # Create Team
    team = Team(name=payload.name, project_id=payload.project_id, owner_id=owner_id)
    db.add(team)
    db.commit()
    db.refresh(team)

    # Add initial members if provided
    if payload.member_ids:
        users = db.query(User).filter(User.id.in_(payload.member_ids)).all()
        for user in users:
            team.members.append(user)
        db.commit()
        db.refresh(team)

    return team

# ---------------- ADD MEMBER ----------------
@router.post("/add_member", status_code=status.HTTP_200_OK)
def add_member(
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
    return {"message": f"User {user.id} added to team {team.id}"}

# ---------------- REMOVE MEMBER ----------------
@router.post("/remove_member", status_code=status.HTTP_200_OK)
def remove_member(
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
    return {"message": f"User {user.id} removed from team {team.id}"}

# ---------------- LIST TEAMS ----------------
@router.get("/", response_model=List[TeamResponse])
def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Team]:
    if current_user.role == "admin":
        return db.query(Team).all()
    elif current_user.role == "owner":
        return db.query(Team).filter(Team.owner_id == current_user.id).all()
    else:
        return (
            db.query(Team)
            .join(team_members, team_members.c.team_id == Team.id)
            .filter(team_members.c.user_id == current_user.id)
            .all()
        )

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import asyncio

from app.core.database import get_db
from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskStatus
from app.models.team import Team, team_members
from app.models.user import User
from app.schemas.project_schema import ProjectCreate, ProjectUpdate, ProjectResponse
from app.utils.role_checker import get_current_user, require_role
from app.services.websocket_manager import manager

router = APIRouter(prefix="/projects", tags=["projects"])

# ---------------- CREATE PROJECT ----------------
@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin"))],
)
async def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Project:
    """Admin creates a project and optionally assigns an owner."""
    if payload.owner_id:
        owner = db.query(User).filter(User.id == payload.owner_id, User.role == "owner").first()
        if not owner:
            raise HTTPException(status_code=400, detail="Invalid owner_id")

    project = Project(
        name=payload.name,
        description=payload.description,
        admin_id=current_user.id,
        owner_id=payload.owner_id,
        status=ProjectStatus.active,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # WebSocket broadcast: project created
    await manager.broadcast(project.id, {
        "event": "project_created",
        "project_id": project.id,
        "name": project.name,
        "status": project.status
    })

    return project


# ---------------- READ ALL PROJECTS ----------------
@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> List[Project]:
    """List projects based on user role."""
    if current_user.role == "admin":
        return db.query(Project).all()
    if current_user.role == "owner":
        return db.query(Project).filter(Project.owner_id == current_user.id).all()

    # member: only projects where user is in a team
    return (
        db.query(Project)
        .join(Team, Team.project_id == Project.id)
        .join(team_members, team_members.c.team_id == Team.id)
        .filter(team_members.c.user_id == current_user.id)
        .all()
    )


# ---------------- READ SINGLE PROJECT ----------------
@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Project:
    """Get a single project with role-based access."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role == "admin":
        return project
    if current_user.role == "owner" and project.owner_id == current_user.id:
        return project
    if current_user.role == "member":
        is_member = (
            db.query(Team)
            .join(team_members, team_members.c.team_id == Team.id)
            .filter(Team.project_id == project.id, team_members.c.user_id == current_user.id)
            .first()
        )
        if is_member:
            return project

    raise HTTPException(status_code=403, detail="Not authorized to view this project")


# ---------------- UPDATE PROJECT ----------------
@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Project:
    """Update project details. Only admin can update all fields."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update project")

    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    if payload.status is not None:
        project.status = payload.status
        if payload.status == ProjectStatus.inactive:
            tasks: List[Task] = db.query(Task).filter(Task.project_id == project.id).all()
            for t in tasks:
                t.status = TaskStatus.incomplete

    if payload.owner_id is not None:
        owner = db.query(User).filter(User.id == payload.owner_id, User.role == "owner").first()
        if not owner:
            raise HTTPException(status_code=400, detail="Invalid owner_id")
        project.owner_id = payload.owner_id

    db.commit()
    db.refresh(project)

    # WebSocket broadcast: project updated
    await manager.broadcast(project.id, {
        "event": "project_updated",
        "project_id": project.id,
        "name": project.name,
        "status": project.status
    })

    return project


# ---------------- DELETE PROJECT ----------------
@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a project and all related tasks and teams. Admin only."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete project")

    # Delete related tasks and teams
    db.query(Task).filter(Task.project_id == project.id).delete(synchronize_session=False)
    db.query(Team).filter(Team.project_id == project.id).delete(synchronize_session=False)

    db.delete(project)
    db.commit()

    # WebSocket broadcast: project deleted
    await manager.broadcast(project.id, {
        "event": "project_deleted",
        "project_id": project.id
    })

    return {"detail": "Project deleted successfully"}

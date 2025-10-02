# backend/app/routers/projects.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import or_

from app.core.database import get_db
from app.models.project import Project, ProjectStatus
from app.models.user import User
from app.schemas.project_schema import ProjectCreate, ProjectResponse
from app.utils.role_checker import get_current_user, require_role

router = APIRouter(prefix="/projects", tags=["projects"])

# Admin-only create
@router.post(
    "/",
    response_model=ProjectResponse,
    dependencies=[Depends(require_role("admin"))]
)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = Project(
        name=payload.name,
        description=payload.description,
        admin_id=payload.admin_id or current_user.id,
        owner_id=payload.owner_id,
        status=ProjectStatus.active  # use enum value
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

# Role-based listing
@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        projects = db.query(Project).all()
    elif current_user.role == "owner":
        projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
    else:  # member
        # Show projects where the user is admin or owner (for now)
        projects = db.query(Project).filter(
            or_(
                Project.owner_id == current_user.id,
                Project.admin_id == current_user.id
            )
        ).all()
    return projects

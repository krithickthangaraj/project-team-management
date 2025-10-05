from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.models.project import Project
from app.models.team import Team, team_members
from app.schemas.task_schema import TaskCreate, TaskUpdate, TaskResponse, TaskStatusUpdate
from app.utils.role_checker import get_current_user
from app.services.email_service import (
    send_task_assigned_email,
    send_task_status_update_email
)
from app.services.websocket_manager import manager

router = APIRouter(prefix="/tasks", tags=["tasks"])


# ---------------- Helper Function ----------------
def verify_permission(user: User, project: Project, action: str):
    """
    Verify whether the current user is allowed to perform an action on a project.
    action = "manage" (create/update/delete) or "update_status"
    """
    if user.role == "admin":
        return True
    if project.owner_id == user.id:
        return True
    if action == "update_status":
        return True
    raise HTTPException(status_code=403, detail="Not authorized for this action")


# ---------------- CREATE TASK ----------------
@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new task (Admin/Owner only) and notify members."""
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    verify_permission(current_user, project, "manage")

    task = Task(
        title=payload.title,
        description=payload.description,
        status=payload.status or TaskStatus.in_progress,
        project_id=payload.project_id,
        assigned_to_id=payload.assigned_to_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # ---- Email Notifications ----
    assigned_user = db.query(User).filter(User.id == task.assigned_to_id).first()
    owner = db.query(User).filter(User.id == project.owner_id).first()
    admins = db.query(User).filter(User.role == "admin").all()

    recipients = []
    if assigned_user and assigned_user.email:
        recipients.append(assigned_user.email)
    if owner and owner.email:
        recipients.append(owner.email)
    recipients.extend([a.email for a in admins if a.email])

    # Send email
    for r in list(set(recipients)):
        send_task_assigned_email(
            member_email=r,
            project_name=project.name,
            task_title=task.title,
            assigned_by=current_user.name
        )

    # ---- WebSocket Broadcast ----
    await manager.broadcast(project.id, {
        "event": "task_created",
        "task_id": task.id,
        "title": task.title,
        "assigned_to": task.assigned_to_id,
        "status": task.status.value
    })

    return task


# ---------------- GET ALL TASKS ----------------
@router.get("/", response_model=List[TaskResponse])
async def get_all_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return all tasks based on user role."""
    if current_user.role == "admin":
        return db.query(Task).all()

    if current_user.role == "owner":
        return (
            db.query(Task)
            .join(Project)
            .filter(Project.owner_id == current_user.id)
            .all()
        )

    # Member: only tasks in their teams
    return (
        db.query(Task)
        .join(Project, Task.project_id == Project.id)
        .join(Team, Team.project_id == Project.id)
        .join(team_members, team_members.c.team_id == Team.id)
        .filter(team_members.c.user_id == current_user.id)
        .all()
    )


# ---------------- GET SINGLE TASK ----------------
@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific task by ID."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == "admin":
        return task
    if current_user.role == "owner" and task.project.owner_id == current_user.id:
        return task

    # Member can view if part of project’s team
    is_member = (
        db.query(Task)
        .join(Project, Task.project_id == Project.id)
        .join(Team, Team.project_id == Project.id)
        .join(team_members, team_members.c.team_id == Team.id)
        .filter(Task.id == task_id, team_members.c.user_id == current_user.id)
        .first()
    )
    if is_member:
        return task

    raise HTTPException(status_code=403, detail="Not authorized to view this task")


# ---------------- UPDATE TASK ----------------
@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a task (Admin/Owner only)."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    verify_permission(current_user, task.project, "manage")

    # Apply updates
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)

    await manager.broadcast(task.project_id, {
        "event": "task_updated",
        "task_id": task.id,
        "title": task.title,
        "assigned_to": task.assigned_to_id,
        "status": task.status.value
    })

    return task


# ---------------- DELETE TASK ----------------
@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a task (Admin/Owner only)."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    verify_permission(current_user, task.project, "manage")

    db.delete(task)
    db.commit()

    await manager.broadcast(task.project_id, {
        "event": "task_deleted",
        "task_id": task_id
    })

    return {"detail": "Task deleted successfully"}


# ---------------- UPDATE TASK STATUS ----------------
@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update task status (Admin/Owner/member of assigned task)."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Member can update only their own tasks
    if current_user.role == "member" and task.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")

    task.status = payload.status
    db.commit()
    db.refresh(task)

    # ---- Email Notifications ----
    assigned_user = db.query(User).filter(User.id == task.assigned_to_id).first()
    owner = db.query(User).filter(User.id == task.project.owner_id).first()
    admins = db.query(User).filter(User.role == "admin").all()

    recipients = []
    if assigned_user and assigned_user.email:
        recipients.append(assigned_user.email)
    if owner and owner.email:
        recipients.append(owner.email)
    recipients.extend([a.email for a in admins if a.email])

    for r in list(set(recipients)):
        send_task_status_update_email(
            recipients=[r],
            project_name=task.project.name,
            task_title=task.title,
            new_status=task.status.value,
            updated_by=current_user.name
        )

    await manager.broadcast(task.project_id, {
        "event": "task_status_updated",
        "task_id": task.id,
        "status": task.status.value,
        "updated_by": current_user.name
    })

    return task

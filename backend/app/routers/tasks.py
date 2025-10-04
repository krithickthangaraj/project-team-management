from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.models.project import Project
from app.schemas.task_schema import TaskCreate, TaskUpdate, TaskResponse, TaskStatusUpdate
from app.utils.role_checker import get_current_user, require_role

router = APIRouter(prefix="/tasks", tags=["tasks"])


# ---------------- CREATE TASK ----------------
@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Admin or Owner can create tasks.
    """
    if current_user.role not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized to create tasks")

    # Validate project exists
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Owner can only create tasks for their projects
    if current_user.role == "owner" and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot create task for this project")

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
    return task


# ---------------- READ ALL TASKS ----------------
@router.get("/", response_model=List[TaskResponse])
def get_all_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Admin sees all tasks, Owner sees their project tasks, Member sees assigned tasks.
    """
    if current_user.role == "admin":
        return db.query(Task).all()
    elif current_user.role == "owner":
        return db.query(Task).join(Project).filter(Project.owner_id == current_user.id).all()
    else:  # member
        return db.query(Task).filter(Task.assigned_to_id == current_user.id).all()


# ---------------- READ SINGLE TASK ----------------
@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Role-based access
    if current_user.role == "admin":
        return task
    elif current_user.role == "owner" and task.project.owner_id == current_user.id:
        return task
    elif current_user.role == "member" and task.assigned_to_id == current_user.id:
        return task

    raise HTTPException(status_code=403, detail="Not authorized to view this task")


# ---------------- UPDATE TASK ----------------
@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Only Admin or Project Owner can update
    if current_user.role not in ["admin", "owner"] or (current_user.role == "owner" and task.project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this task")

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.status is not None:
        task.status = payload.status
    if payload.assigned_to_id is not None:
        task.assigned_to_id = payload.assigned_to_id

    db.commit()
    db.refresh(task)
    return task


# ---------------- DELETE TASK ----------------
@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role not in ["admin", "owner"] or (current_user.role == "owner" and task.project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")

    db.delete(task)
    db.commit()
    return {"detail": "Task deleted successfully"}


# ---------------- UPDATE TASK STATUS (ASSIGNED MEMBER) ----------------
@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Assigned member can update status only for their task.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == "member" and task.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task status")

    # Admin and Owner can also update any task status
    task.status = payload.status
    db.commit()
    db.refresh(task)
    return task

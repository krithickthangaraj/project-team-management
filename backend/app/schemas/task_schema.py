from pydantic import BaseModel
from typing import Optional
from enum import Enum

class TaskStatus(str, Enum):
    in_progress = "in_progress"
    incomplete = "incomplete"
    completed = "completed"

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: int
    assigned_to_id: Optional[int] = None
    status: Optional[TaskStatus] = TaskStatus.in_progress    

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    assigned_to_id: Optional[int] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    project_id: int
    assigned_to_id: Optional[int]

    class Config:
        from_attributes = True

class TaskStatusUpdate(BaseModel):
    status: TaskStatus

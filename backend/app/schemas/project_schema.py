from pydantic import BaseModel
from typing import Optional
from enum import Enum


class ProjectStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    completed = "completed"


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    admin_id: Optional[int] = None  # default to current user if not provided
    owner_id: Optional[int] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    admin_id: int
    owner_id: Optional[int]
    status: ProjectStatus

    class Config:
        from_attributes = True  # allows ORM -> Pydantic conversion

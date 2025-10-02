from pydantic import BaseModel
from typing import List, Optional


class TeamCreate(BaseModel):
    name: str
    project_id: int
    member_ids: Optional[List[int]] = []  # users to add to the team


class TeamResponse(BaseModel):
    id: int
    name: str
    project_id: int
    member_ids: List[int]

    class Config:
        from_attributes = True

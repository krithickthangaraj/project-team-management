from pydantic import BaseModel
from typing import List, Optional

# ---------------- CREATE TEAM ----------------
class TeamCreate(BaseModel):
    name: str
    project_id: int
    member_ids: Optional[List[int]] = []   # optional initial members
    owner_id: Optional[int] = None         # required for admin creation

# ---------------- ADD / REMOVE MEMBER ----------------
class AddMember(BaseModel):
    team_id: int
    user_id: int

class RemoveMember(BaseModel):
    team_id: int
    user_id: int

# ---------------- RESPONSE ----------------
class TeamResponse(BaseModel):
    id: int
    name: str
    project_id: int
    owner_id: int
    member_ids: List[int]

    class Config:
        from_attributes = True

# Optional: detailed member info
class TeamMemberResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

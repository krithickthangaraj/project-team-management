from sqlalchemy import Column, Integer, String, Boolean, Enum
from sqlalchemy.orm import relationship
from .base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(
        Enum("admin", "owner", "member", name="user_roles"),
        default="member",
        nullable=False
    )
    is_active = Column(Boolean, default=True)

    # Relationships
    projects_owned = relationship(
        "Project",
        back_populates="owner",
        foreign_keys="Project.owner_id"
    )
    projects_admined = relationship(
        "Project",
        back_populates="admin",
        foreign_keys="Project.admin_id"
    )
    tasks_assigned = relationship(
        "Task",
        back_populates="assigned_to"
    )
    teams = relationship(
        "Team",
        secondary="team_members",
        back_populates="members"
    )

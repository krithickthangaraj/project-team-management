from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="member")
    is_active = Column(Boolean, default=True)  # ✅ Added this line

    # Relationships
    projects_owned = relationship("Project", back_populates="owner", foreign_keys="Project.owner_id")
    projects_admin = relationship("Project", back_populates="admin", foreign_keys="Project.admin_id")
    teams = relationship("Team", secondary="team_members", back_populates="members")
    tasks_assigned = relationship("Task", back_populates="assigned_to")

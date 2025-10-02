from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .base import Base
import enum

class ProjectStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    completed = "completed"

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    admin_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.active, nullable=False)

    # Relationships
    admin = relationship("User", back_populates="projects_admined", foreign_keys=[admin_id])
    owner = relationship("User", back_populates="projects_owned", foreign_keys=[owner_id])
    teams = relationship("Team", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

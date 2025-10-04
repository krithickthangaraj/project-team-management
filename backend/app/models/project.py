from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class ProjectStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.active)

    # Relationships
    admin = relationship("User", foreign_keys=[admin_id], back_populates="projects_admin")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="projects_owned")
    teams = relationship("Team", back_populates="project")
    tasks = relationship("Task", back_populates="project")

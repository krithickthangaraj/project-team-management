from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from .base import Base
import enum

class TaskStatus(str, enum.Enum):
    in_progress = "in_progress"
    incomplete = "incomplete"
    completed = "completed"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.in_progress)

    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assigned_to = relationship("User", back_populates="tasks_assigned")

from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from .base import Base

# Association table for Team <-> User
team_members = Table(
    "team_members",
    Base.metadata,
    Column("team_id", Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="teams")
    members = relationship("User", secondary=team_members, back_populates="teams")

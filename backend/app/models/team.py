from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

# Association table for many-to-many relation between Team and User
team_members = Table(
    "team_members",
    Base.metadata,
    Column("team_id", Integer, ForeignKey("teams.id")),
    Column("user_id", Integer, ForeignKey("users.id")),
)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # ✅ ensure this exists in DB

    members = relationship("User", secondary=team_members, back_populates="teams")
    project = relationship("Project", back_populates="teams")
    owner = relationship("User", foreign_keys=[owner_id])

    @property
    def member_ids(self):
        return [member.id for member in self.members]
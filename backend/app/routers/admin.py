from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.utils.role_checker import get_current_user, require_role
from app.models.user import User as UserModel
from app.models.project import Project as ProjectModel
from app.models.team import Team as TeamModel
from app.models.task import Task as TaskModel


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_role("admin"))])


@router.get("/metrics", status_code=status.HTTP_200_OK)
def get_metrics(db: Session = Depends(get_db), user=Depends(get_current_user)) -> dict:
    """Return high-level system metrics for the admin dashboard."""
    users_count = db.query(UserModel).count()
    projects_count = db.query(ProjectModel).count()
    teams_count = db.query(TeamModel).count()
    tasks_count = db.query(TaskModel).count()

    return {
        "users": users_count,
        "projects": projects_count,
        "teams": teams_count,
        "tasks": tasks_count,
    }



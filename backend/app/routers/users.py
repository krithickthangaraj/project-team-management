from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.models.user import User
from app.schemas.user_schema import UserResponse
from app.utils.role_checker import get_current_user, require_role
from app.core.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/users", tags=["users"])


# ---------------- GET CURRENT USER ----------------
@router.get("/me", response_model=UserResponse)
def read_me(user: User = Depends(get_current_user)) -> User:
    """
    Get current logged-in user.
    """
    return user


# ---------------- ADMIN-ONLY ----------------
@router.get("/admin", response_model=dict, dependencies=[Depends(require_role("admin"))])
def admin_only(user: User = Depends(get_current_user)) -> dict:
    """
    Access restricted to admins.
    """
    return {"message": f"Hello Admin {user.name}, you have admin access!"}


# ---------------- OWNER OR ADMIN ----------------
@router.get("/owner-or-admin", response_model=dict, dependencies=[Depends(require_role("admin", "owner"))])
def owner_or_admin(user: User = Depends(get_current_user)) -> dict:
    """
    Access restricted to owners and admins.
    """
    return {"message": f"Hello {user.role.capitalize()} {user.name}, you have privileged access!"}


# ---------------- MEMBER-ONLY ----------------
@router.get("/member", response_model=dict, dependencies=[Depends(require_role("member"))])
def member_only(user: User = Depends(get_current_user)) -> dict:
    """
    Access restricted to members.
    """
    return {"message": f"Hello Member {user.name}, welcome to the members-only area!"}


# ---------------- LIST ALL USERS (ADMIN ONLY) ----------------
@router.get("/", response_model=List[UserResponse], dependencies=[Depends(require_role("admin"))])
def list_users(db: Session = Depends(get_db)) -> List[User]:
    """
    List all users in the system (admin only).
    """
    return db.query(User).all()

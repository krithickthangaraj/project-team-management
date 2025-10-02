from fastapi import APIRouter, Depends
from app.utils.role_checker import get_current_user, require_role
from app.schemas.user_schema import UserResponse
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

# ✅ Get current logged-in user
@router.get("/me", response_model=UserResponse)
def read_me(user: User = Depends(get_current_user)):
    return user

# ✅ Admin-only route
@router.get("/admin", response_model=dict)
def admin_only(user: User = Depends(require_role("admin"))):
    return {"message": f"Hello Admin {user.name}, you have admin access!"}

# ✅ Owner or Admin route
@router.get("/owner-or-admin", response_model=dict)
def owner_or_admin(user: User = Depends(require_role("admin", "owner"))):
    return {"message": f"Hello {user.role.capitalize()} {user.name}, you have privileged access!"}

# ✅ Member-only route
@router.get("/member", response_model=dict)
def member_only(user: User = Depends(require_role("member"))):
    return {"message": f"Hello Member {user.name}, welcome to the members-only area!"}

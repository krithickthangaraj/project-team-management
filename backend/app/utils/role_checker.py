from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.utils.auth_utils import decode_access_token
from app.core.database import get_db
from app.models.user import User

# Token retrieval (FastAPI will auto-validate Authorization: Bearer <token>)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return user


def require_role(*roles):
    """
    Restrict endpoint access to users with given roles.
    Example:
        @router.get("/admin", dependencies=[Depends(require_role("admin"))])
    """
    def role_checker(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: insufficient role"
            )
        return user
    return role_checker

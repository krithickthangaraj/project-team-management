from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "member"

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
      from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

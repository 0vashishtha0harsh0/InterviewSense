from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: str
    role: str
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

"""User-related Pydantic models"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str = "buyer"
    address: Optional[str] = None
    profile_photo: Optional[str] = None
    verification_level: int = 0
    verified: bool = False

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    role: str = "buyer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: str
    address: Optional[str] = None
    profile_photo: Optional[str] = None
    verification_level: int = 0
    verified: bool = False
    created_at: Optional[str] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_photo: Optional[str] = None

"""User routes"""
from fastapi import APIRouter, HTTPException, Request, Depends
from typing import List, Optional
from database import db
from models.user import UserResponse
from utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
async def get_users(
    role: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(require_admin)
):
    """Get all users (admin only)"""
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).limit(limit).to_list(limit)
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, request: Request):
    """Get user by ID"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.put("/{user_id}")
async def update_user(user_id: str, request: Request):
    """Update user profile"""
    current_user = await get_current_user(request)
    
    if current_user["user_id"] != user_id and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    body = await request.json()
    allowed_fields = ["name", "phone", "address", "profile_photo"]
    update_data = {k: v for k, v in body.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one({"user_id": user_id}, {"$set": update_data})
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return user

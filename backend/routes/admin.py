"""Admin routes"""
from fastapi import APIRouter, HTTPException, Request, Depends
from typing import List, Optional
from datetime import datetime, timezone

from database import db
from utils.auth import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard")
async def admin_dashboard(request: Request):
    """Get admin dashboard stats"""
    user = await require_admin(request)
    
    total_users = await db.users.count_documents({})
    total_lands = await db.lands.count_documents({})
    pending_lands = await db.lands.count_documents({"status": "pending"})
    total_transactions = await db.transactions.count_documents({})
    
    # Recent activity
    recent_lands = await db.lands.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    recent_transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "stats": {
            "total_users": total_users,
            "total_lands": total_lands,
            "pending_lands": pending_lands,
            "total_transactions": total_transactions
        },
        "recent_lands": recent_lands,
        "recent_transactions": recent_transactions
    }

@router.get("/lands/pending")
async def get_pending_lands(request: Request):
    """Get pending lands for verification"""
    user = await require_admin(request)
    
    pipeline = [
        {"$match": {"status": "pending", "verified": False}},
        {"$sort": {"created_at": -1}},
        {
            "$lookup": {
                "from": "users",
                "localField": "owner_id",
                "foreignField": "user_id",
                "as": "owner_info"
            }
        },
        {
            "$addFields": {
                "owner_name": {"$arrayElemAt": ["$owner_info.name", 0]},
                "owner_phone": {"$arrayElemAt": ["$owner_info.phone", 0]}
            }
        },
        {"$project": {"_id": 0, "owner_info": 0}}
    ]
    
    lands = await db.lands.aggregate(pipeline).to_list(100)
    return lands

@router.post("/lands/{land_id}/verify")
async def admin_verify_land(land_id: str, request: Request):
    """Verify a land listing"""
    user = await require_admin(request)
    
    body = await request.json()
    verifier_name = body.get("verifier_name", user["name"])
    verifier_title = body.get("verifier_title", "Administrateur")
    verification_level = body.get("verification_level", 1)
    
    land = await db.lands.find_one({"land_id": land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    await db.lands.update_one(
        {"land_id": land_id},
        {"$set": {
            "verified": True,
            "verification_level": verification_level,
            "verifier_name": verifier_name,
            "verifier_title": verifier_title,
            "status": "available",
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "verified_by": user["user_id"]
        }}
    )
    
    return {"message": "Terrain vérifié avec succès", "land_id": land_id}

@router.post("/lands/{land_id}/reject")
async def admin_reject_land(land_id: str, request: Request):
    """Reject a land listing"""
    user = await require_admin(request)
    
    body = await request.json()
    reason = body.get("reason", "Non conforme aux critères")
    
    land = await db.lands.find_one({"land_id": land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    await db.lands.update_one(
        {"land_id": land_id},
        {"$set": {
            "status": "rejected",
            "rejection_reason": reason,
            "rejected_at": datetime.now(timezone.utc).isoformat(),
            "rejected_by": user["user_id"]
        }}
    )
    
    return {"message": "Terrain rejeté", "land_id": land_id}

@router.get("/users")
async def admin_get_users(
    role: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    request: Request = None
):
    """Get users (admin)"""
    user = await require_admin(request)
    
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total}

@router.put("/users/{user_id}/role")
async def admin_update_user_role(user_id: str, request: Request):
    """Update user role"""
    admin = await require_admin(request)
    
    body = await request.json()
    new_role = body.get("role")
    
    if new_role not in ["buyer", "seller", "agent", "admin"]:
        raise HTTPException(status_code=400, detail="Rôle invalide")
    
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    await db.users.update_one({"user_id": user_id}, {"$set": {"role": new_role}})
    
    return {"message": "Rôle mis à jour", "user_id": user_id, "new_role": new_role}

@router.get("/feedback")
async def admin_get_feedback(
    status: Optional[str] = None,
    limit: int = 50,
    request: Request = None
):
    """Get user feedback"""
    user = await require_admin(request)
    
    query = {}
    if status:
        query["status"] = status
    
    feedback = await db.feedback.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return feedback

@router.put("/feedback/{feedback_id}/respond")
async def admin_respond_feedback(feedback_id: str, request: Request):
    """Respond to feedback"""
    user = await require_admin(request)
    
    body = await request.json()
    response_text = body.get("response")
    
    await db.feedback.update_one(
        {"feedback_id": feedback_id},
        {"$set": {
            "response": response_text,
            "status": "resolved",
            "responded_by": user["user_id"],
            "responded_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Réponse enregistrée"}

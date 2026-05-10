"""Land routes"""
from fastapi import APIRouter, HTTPException, Request, Depends, Query
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from database import db
from models.land import LandCreate, LandUpdate, LandResponse, ReviewCreate, ReviewResponse, VerificationRequest
from utils.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/lands", tags=["Lands"])

@router.post("", response_model=LandResponse)
async def create_land(land: LandCreate, request: Request):
    """Create a new land listing"""
    user = await get_current_user(request)
    
    land_id = str(uuid.uuid4())
    land_data = {
        "land_id": land_id,
        "owner_id": user["user_id"],
        **land.model_dump(),
        "status": "pending",
        "verified": False,
        "verification_level": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.lands.insert_one(land_data)
    
    # Get owner info
    owner = await db.users.find_one({"user_id": user["user_id"]})
    
    return LandResponse(
        **{k: v for k, v in land_data.items() if k != "_id"},
        owner_name=owner.get("name") if owner else None,
        owner_phone=owner.get("phone") if owner else None
    )

@router.get("", response_model=List[LandResponse])
async def get_lands(
    region: Optional[str] = None,
    land_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_size: Optional[float] = None,
    max_size: Optional[float] = None,
    status: Optional[str] = None,
    owner_id: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    limit: int = Query(default=50, le=200),
    skip: int = 0
):
    """Get all lands with filters"""
    query = {}
    
    if region:
        query["region"] = region
    if land_type:
        query["land_type"] = land_type
    if status:
        query["status"] = status
    else:
        query["status"] = {"$in": ["available", "pending"]}
    if owner_id:
        query["owner_id"] = owner_id
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    if min_size is not None:
        query["size"] = {"$gte": min_size}
    if max_size is not None:
        query.setdefault("size", {})["$lte"] = max_size
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"commune": {"$regex": search, "$options": "i"}}
        ]
    
    sort_direction = -1 if sort_order == "desc" else 1
    
    # Get lands with owner info
    pipeline = [
        {"$match": query},
        {"$sort": {sort_by: sort_direction}},
        {"$skip": skip},
        {"$limit": limit},
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
    
    lands = await db.lands.aggregate(pipeline).to_list(limit)
    
    # Convert datetime objects to ISO strings
    for land in lands:
        for key in ["created_at", "updated_at", "verified_at"]:
            if key in land and hasattr(land[key], 'isoformat'):
                land[key] = land[key].isoformat()
    
    return lands

@router.get("/{land_id}", response_model=LandResponse)
async def get_land(land_id: str):
    """Get land by ID"""
    pipeline = [
        {"$match": {"land_id": land_id}},
        {
            "$lookup": {
                "from": "users",
                "localField": "owner_id",
                "foreignField": "user_id",
                "as": "owner_info"
            }
        },
        {
            "$lookup": {
                "from": "reviews",
                "localField": "land_id",
                "foreignField": "land_id",
                "as": "reviews"
            }
        },
        {
            "$addFields": {
                "owner_name": {"$arrayElemAt": ["$owner_info.name", 0]},
                "owner_phone": {"$arrayElemAt": ["$owner_info.phone", 0]},
                "avg_rating": {"$avg": "$reviews.rating"},
                "review_count": {"$size": "$reviews"}
            }
        },
        {"$project": {"_id": 0, "owner_info": 0, "reviews": 0}}
    ]
    
    result = await db.lands.aggregate(pipeline).to_list(1)
    if not result:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    land = result[0]
    
    # Convert datetime objects to ISO strings
    for key in ["created_at", "updated_at", "verified_at"]:
        if key in land and hasattr(land[key], 'isoformat'):
            land[key] = land[key].isoformat()
    
    return land

@router.put("/{land_id}", response_model=LandResponse)
async def update_land(land_id: str, land_update: LandUpdate, request: Request):
    """Update land listing"""
    user = await get_current_user(request)
    land = await db.lands.find_one({"land_id": land_id})
    
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    if land["owner_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    update_data = {k: v for k, v in land_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.lands.update_one({"land_id": land_id}, {"$set": update_data})
    
    return await get_land(land_id)

@router.delete("/{land_id}")
async def delete_land(land_id: str, request: Request):
    """Delete land listing"""
    user = await get_current_user(request)
    land = await db.lands.find_one({"land_id": land_id})
    
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    if land["owner_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.lands.delete_one({"land_id": land_id})
    return {"message": "Terrain supprimé"}

# Reviews
@router.post("/{land_id}/reviews", response_model=ReviewResponse)
async def create_review(land_id: str, review: ReviewCreate, request: Request):
    """Create a review for a land"""
    user = await get_current_user(request)
    
    land = await db.lands.find_one({"land_id": land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    existing = await db.reviews.find_one({"land_id": land_id, "user_id": user["user_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà donné un avis")
    
    review_id = str(uuid.uuid4())
    review_data = {
        "review_id": review_id,
        "land_id": land_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "rating": review.rating,
        "comment": review.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "helpful_count": 0,
        "verified_purchase": False
    }
    
    await db.reviews.insert_one(review_data)
    return ReviewResponse(**{k: v for k, v in review_data.items() if k != "_id"})

@router.get("/{land_id}/reviews", response_model=List[ReviewResponse])
async def get_land_reviews(land_id: str):
    """Get reviews for a land"""
    reviews = await db.reviews.find(
        {"land_id": land_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return reviews

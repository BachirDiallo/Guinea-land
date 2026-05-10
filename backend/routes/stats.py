"""Stats and general routes"""
from fastapi import APIRouter, Request
from typing import Optional
from database import db
from config import GUINEA_REGIONS
from utils.auth import get_optional_user

router = APIRouter(tags=["Stats"])

@router.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Guinea Land Hub API", "status": "running"}

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@router.get("/stats")
async def get_stats(request: Request):
    """Get platform statistics"""
    total_lands = await db.lands.count_documents({"status": {"$in": ["available", "pending"]}})
    total_transactions = await db.transactions.count_documents({})
    total_users = await db.users.count_documents({})
    
    # Region stats
    region_stats = await db.lands.aggregate([
        {"$match": {"status": {"$in": ["available", "pending"]}}},
        {"$group": {"_id": "$region", "count": {"$sum": 1}}}
    ]).to_list(20)
    
    regions = [{"name": r["_id"], "count": r["count"]} for r in region_stats if r["_id"]]
    
    return {
        "total_lands": total_lands,
        "total_transactions": total_transactions,
        "total_users": total_users,
        "regions": regions
    }

@router.get("/regions")
async def get_regions():
    """Get all Guinea regions"""
    return GUINEA_REGIONS

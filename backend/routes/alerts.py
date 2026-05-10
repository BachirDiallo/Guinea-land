"""Alerts and notifications routes"""
from fastapi import APIRouter, HTTPException, Request, Depends
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from database import db
from models.common import ZoneAlertCreate, ZoneAlertResponse, SavedSearchCreate, SavedSearchResponse
from utils.auth import get_current_user
from utils.email import send_zone_alert_email
from utils.sms import send_sms_notification, get_sms_status
from config import FRONTEND_URL

router = APIRouter(tags=["Alerts"])

# ==================== ZONE ALERTS ====================

@router.post("/zone-alerts", response_model=ZoneAlertResponse)
async def create_zone_alert(alert: ZoneAlertCreate, request: Request):
    """Create a zone alert"""
    user = await get_current_user(request)
    
    alert_id = str(uuid.uuid4())
    alert_data = {
        "alert_id": alert_id,
        "user_id": user["user_id"],
        **alert.model_dump(),
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.zone_alerts.insert_one(alert_data)
    return ZoneAlertResponse(**{k: v for k, v in alert_data.items() if k != "_id"})

@router.get("/zone-alerts", response_model=List[ZoneAlertResponse])
async def get_zone_alerts(request: Request):
    """Get user's zone alerts"""
    user = await get_current_user(request)
    
    alerts = await db.zone_alerts.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    return alerts

@router.put("/zone-alerts/{alert_id}")
async def update_zone_alert(alert_id: str, request: Request):
    """Update a zone alert"""
    user = await get_current_user(request)
    
    alert = await db.zone_alerts.find_one({"alert_id": alert_id})
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    
    if alert["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    body = await request.json()
    allowed_fields = ["name", "region", "commune", "land_types", "min_price", "max_price", 
                      "min_size", "max_size", "notify_email", "notify_sms", "active"]
    update_data = {k: v for k, v in body.items() if k in allowed_fields}
    
    if update_data:
        await db.zone_alerts.update_one({"alert_id": alert_id}, {"$set": update_data})
    
    updated = await db.zone_alerts.find_one({"alert_id": alert_id}, {"_id": 0})
    return updated

@router.delete("/zone-alerts/{alert_id}")
async def delete_zone_alert(alert_id: str, request: Request):
    """Delete a zone alert"""
    user = await get_current_user(request)
    
    alert = await db.zone_alerts.find_one({"alert_id": alert_id})
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    
    if alert["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.zone_alerts.delete_one({"alert_id": alert_id})
    return {"message": "Alerte supprimée"}

# ==================== SAVED SEARCHES ====================

@router.post("/saved-searches", response_model=SavedSearchResponse)
async def create_saved_search(search: SavedSearchCreate, request: Request):
    """Create a saved search"""
    user = await get_current_user(request)
    
    search_id = str(uuid.uuid4())
    search_data = {
        "search_id": search_id,
        "user_id": user["user_id"],
        **search.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.saved_searches.insert_one(search_data)
    return SavedSearchResponse(**{k: v for k, v in search_data.items() if k != "_id"})

@router.get("/saved-searches", response_model=List[SavedSearchResponse])
async def get_saved_searches(request: Request):
    """Get user's saved searches"""
    user = await get_current_user(request)
    
    searches = await db.saved_searches.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    return searches

@router.delete("/saved-searches/{search_id}")
async def delete_saved_search(search_id: str, request: Request):
    """Delete a saved search"""
    user = await get_current_user(request)
    
    search = await db.saved_searches.find_one({"search_id": search_id})
    if not search:
        raise HTTPException(status_code=404, detail="Recherche non trouvée")
    
    if search["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.saved_searches.delete_one({"search_id": search_id})
    return {"message": "Recherche supprimée"}

# ==================== NOTIFICATIONS ====================

@router.get("/notifications")
async def get_notifications(request: Request, limit: int = 50):
    """Get user's notifications"""
    user = await get_current_user(request)
    
    notifications = await db.notifications.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return notifications

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    """Mark notification as read"""
    user = await get_current_user(request)
    
    await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user["user_id"]},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Notification marquée comme lue"}

@router.post("/notifications/mark-all-read")
async def mark_all_notifications_read(request: Request):
    """Mark all notifications as read"""
    user = await get_current_user(request)
    
    await db.notifications.update_many(
        {"user_id": user["user_id"], "read": False},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Toutes les notifications marquées comme lues"}

# ==================== SMS ====================

@router.post("/sms/test")
async def test_sms(request: Request):
    """Test SMS sending"""
    user = await get_current_user(request)
    
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin requis")
    
    body = await request.json()
    phone = body.get("phone")
    message = body.get("message", "Test SMS from Guinea Land Hub")
    
    if not phone:
        raise HTTPException(status_code=400, detail="Numéro de téléphone requis")
    
    success = await send_sms_notification(phone, message)
    
    return {"success": success, "phone": phone}

@router.get("/sms/status")
async def sms_status():
    """Get SMS configuration status"""
    return get_sms_status()

# ==================== HELPER: Trigger alerts for new land ====================

async def trigger_zone_alerts_for_new_land(land: dict):
    """Trigger zone alerts when a new land is published"""
    # Find matching alerts
    query = {
        "active": True,
        "region": land.get("region")
    }
    
    alerts = await db.zone_alerts.find(query).to_list(100)
    
    for alert in alerts:
        # Check filters
        if alert.get("commune") and alert["commune"] != land.get("commune"):
            continue
        if alert.get("land_types") and land.get("land_type") not in alert["land_types"]:
            continue
        if alert.get("min_price") and land.get("price", 0) < alert["min_price"]:
            continue
        if alert.get("max_price") and land.get("price", 0) > alert["max_price"]:
            continue
        if alert.get("min_size") and land.get("size", 0) < alert["min_size"]:
            continue
        if alert.get("max_size") and land.get("size", 0) > alert["max_size"]:
            continue
        
        # Get user
        user = await db.users.find_one({"user_id": alert["user_id"]})
        if not user:
            continue
        
        land_url = f"{FRONTEND_URL}/lands/{land['land_id']}"
        
        # Send email notification
        if alert.get("notify_email") and user.get("email"):
            await send_zone_alert_email(user["email"], user.get("name", ""), land, land_url)
        
        # Send SMS notification
        if alert.get("notify_sms") and user.get("phone"):
            sms_message = f"Nouveau terrain à {land.get('commune', land.get('region'))}: {land.get('title')} - {land.get('price', 0):,.0f} GNF. Voir: {land_url}"
            await send_sms_notification(user["phone"], sms_message)
        
        # Create in-app notification
        notification = {
            "notification_id": str(uuid.uuid4()),
            "user_id": alert["user_id"],
            "type": "zone_alert",
            "title": f"Nouveau terrain à {land.get('commune', land.get('region'))}",
            "message": f"{land.get('title')} - {land.get('price', 0):,.0f} GNF",
            "land_id": land["land_id"],
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
        
        # Update alert last triggered
        await db.zone_alerts.update_one(
            {"alert_id": alert["alert_id"]},
            {"$set": {"last_triggered": datetime.now(timezone.utc).isoformat()}}
        )

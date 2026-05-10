"""Trust, fraud prevention, and due diligence routes"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import hashlib
import math

from database import db
from models.common import DuplicateCheckResult, CommunityVerificationRequest, CommunityVerificationSubmission, OwnershipTransfer, DisputeReport
from utils.auth import get_current_user

router = APIRouter(tags=["Trust & Security"])

# ==================== FRAUD PREVENTION ====================

def generate_land_fingerprint(latitude: float, longitude: float, size: float) -> str:
    """Generate a fingerprint for duplicate detection"""
    # Round coordinates to ~100m precision
    lat_rounded = round(latitude, 3) if latitude else 0
    lng_rounded = round(longitude, 3) if longitude else 0
    size_bucket = round(size / 100) * 100  # 100m² buckets
    
    fingerprint_string = f"{lat_rounded}:{lng_rounded}:{size_bucket}"
    return hashlib.md5(fingerprint_string.encode()).hexdigest()

def calculate_distance_km(lat1, lng1, lat2, lng2):
    """Calculate distance between two points in km"""
    R = 6371  # Earth radius in km
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

@router.post("/lands/check-duplicate")
async def check_duplicate_land(
    latitude: float,
    longitude: float,
    size: float,
    region: str,
    exclude_land_id: Optional[str] = None
):
    """Check for potential duplicate land listings"""
    fingerprint = generate_land_fingerprint(latitude, longitude, size)
    
    # Find lands in same region with similar properties
    query = {"region": region, "status": {"$in": ["available", "pending"]}}
    if exclude_land_id:
        query["land_id"] = {"$ne": exclude_land_id}
    
    similar_lands = []
    confidence = 0.0
    
    lands = await db.lands.find(query, {"_id": 0}).to_list(100)
    
    for land in lands:
        if not land.get("latitude") or not land.get("longitude"):
            continue
        
        distance = calculate_distance_km(latitude, longitude, land["latitude"], land["longitude"])
        size_diff = abs(land.get("size", 0) - size) / max(size, 1) * 100
        
        # Check for potential duplicates
        if distance < 0.1 and size_diff < 10:  # Within 100m and 10% size difference
            similar_lands.append({
                "land_id": land["land_id"],
                "title": land.get("title"),
                "distance_meters": round(distance * 1000),
                "size_difference_percent": round(size_diff, 1),
                "price": land.get("price"),
                "owner_id": land.get("owner_id")
            })
            confidence = max(confidence, 0.9 - distance * 5)
    
    is_duplicate = len(similar_lands) > 0 and confidence > 0.5
    
    warning_message = None
    if is_duplicate:
        warning_message = f"Attention: {len(similar_lands)} terrain(s) similaire(s) trouvé(s) dans cette zone. Vérifiez qu'il ne s'agit pas d'un doublon."
    
    return DuplicateCheckResult(
        is_potential_duplicate=is_duplicate,
        confidence=round(confidence, 2),
        similar_lands=similar_lands,
        warning_message=warning_message
    )

@router.get("/lands/{land_id}/duplicate-alerts")
async def get_land_duplicate_alerts(land_id: str):
    """Get duplicate alerts for a land"""
    land = await db.lands.find_one({"land_id": land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    if not land.get("latitude") or not land.get("longitude"):
        return {"alerts": [], "message": "Coordonnées non disponibles"}
    
    result = await check_duplicate_land(
        land["latitude"], land["longitude"], land.get("size", 0),
        land.get("region", ""), land_id
    )
    
    return result

# ==================== COMMUNITY VERIFICATION ====================

@router.post("/lands/{land_id}/verification-request")
async def request_community_verification(
    land_id: str,
    request: CommunityVerificationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Request community verification for a land"""
    land = await db.lands.find_one({"land_id": land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    verification_id = str(uuid.uuid4())
    verification_code = str(uuid.uuid4())[:8].upper()
    
    verification = {
        "verification_id": verification_id,
        "land_id": land_id,
        "requested_by": current_user["user_id"],
        "verification_type": request.verification_type,
        "verifier_name": request.verifier_name,
        "verifier_contact": request.verifier_contact,
        "relationship": request.relationship,
        "notes": request.notes,
        "verification_code": verification_code,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.community_verifications.insert_one(verification)
    
    return {
        "verification_id": verification_id,
        "verification_code": verification_code,
        "message": f"Demande de vérification créée. Partagez le code {verification_code} avec {request.verifier_name}."
    }

@router.post("/verification/submit")
async def submit_community_verification(submission: CommunityVerificationSubmission):
    """Submit a community verification"""
    verification = await db.community_verifications.find_one({
        "verification_id": submission.verification_request_id,
        "verification_code": submission.verification_code
    })
    
    if not verification:
        raise HTTPException(status_code=404, detail="Vérification non trouvée ou code invalide")
    
    if verification["status"] != "pending":
        raise HTTPException(status_code=400, detail="Cette vérification a déjà été soumise")
    
    await db.community_verifications.update_one(
        {"verification_id": submission.verification_request_id},
        {"$set": {
            "status": "completed",
            "verifier_statement": submission.statement,
            "confirms_ownership": submission.confirms_ownership,
            "additional_notes": submission.additional_notes,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update land trust score
    land = await db.lands.find_one({"land_id": verification["land_id"]})
    if land and submission.confirms_ownership:
        current_level = land.get("verification_level", 0)
        await db.lands.update_one(
            {"land_id": verification["land_id"]},
            {"$set": {"verification_level": min(current_level + 1, 5)}}
        )
    
    return {"message": "Vérification soumise avec succès", "confirms_ownership": submission.confirms_ownership}

@router.get("/lands/{land_id}/community-verifications")
async def get_land_community_verifications(land_id: str):
    """Get community verifications for a land"""
    verifications = await db.community_verifications.find(
        {"land_id": land_id},
        {"_id": 0, "verification_code": 0}
    ).to_list(20)
    
    summary = {
        "total": len(verifications),
        "confirmed": len([v for v in verifications if v.get("confirms_ownership")]),
        "denied": len([v for v in verifications if v.get("status") == "completed" and not v.get("confirms_ownership")]),
        "pending": len([v for v in verifications if v.get("status") == "pending"])
    }
    
    return {"verifications": verifications, "summary": summary}

# ==================== OWNERSHIP HISTORY ====================

@router.post("/lands/{land_id}/ownership-history")
async def add_ownership_history(
    land_id: str,
    transfer: OwnershipTransfer,
    current_user: dict = Depends(get_current_user)
):
    """Add ownership history record"""
    land = await db.lands.find_one({"land_id": land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    if land["owner_id"] != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    history_id = str(uuid.uuid4())
    history_record = {
        "history_id": history_id,
        "land_id": land_id,
        **transfer.model_dump(),
        "added_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ownership_history.insert_one(history_record)
    
    return {"history_id": history_id, "message": "Historique ajouté"}

@router.get("/lands/{land_id}/ownership-history")
async def get_ownership_history(land_id: str):
    """Get ownership history for a land"""
    history = await db.ownership_history.find(
        {"land_id": land_id},
        {"_id": 0}
    ).sort("transfer_date", -1).to_list(50)
    
    return {"history": history, "total_transfers": len(history)}

# ==================== TRUST SCORE ====================

@router.get("/lands/{land_id}/trust-score")
async def get_land_trust_score(land_id: str):
    """Calculate comprehensive trust score for a land"""
    land = await db.lands.find_one({"land_id": land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    score_components = {}
    max_score = 100
    
    # Owner verification (25 points)
    owner = await db.users.find_one({"user_id": land["owner_id"]})
    owner_score = 0
    if owner:
        if owner.get("verified"):
            owner_score += 10
        if owner.get("phone"):
            owner_score += 5
        if owner.get("verification_level", 0) > 0:
            owner_score += min(owner.get("verification_level", 0) * 2, 10)
    score_components["owner_verification"] = {"score": owner_score, "max": 25}
    
    # Document completeness (25 points)
    doc_score = 0
    if land.get("photos") and len(land["photos"]) > 0:
        doc_score += min(len(land["photos"]) * 3, 10)
    if land.get("documents") and len(land["documents"]) > 0:
        doc_score += min(len(land["documents"]) * 5, 15)
    score_components["documentation"] = {"score": doc_score, "max": 25}
    
    # Location accuracy (15 points)
    loc_score = 0
    if land.get("latitude") and land.get("longitude"):
        loc_score += 10
    if land.get("boundaries") and len(land.get("boundaries", [])) >= 3:
        loc_score += 5
    score_components["location_accuracy"] = {"score": loc_score, "max": 15}
    
    # Community verifications (20 points)
    verifications = await db.community_verifications.find({
        "land_id": land_id,
        "status": "completed"
    }).to_list(10)
    
    confirmed = len([v for v in verifications if v.get("confirms_ownership")])
    community_score = min(confirmed * 5, 20)
    score_components["community_verification"] = {"score": community_score, "max": 20}
    
    # Platform verification (15 points)
    platform_score = 0
    if land.get("verified"):
        platform_score += 10
    platform_score += min(land.get("verification_level", 0) * 2, 5)
    score_components["platform_verification"] = {"score": platform_score, "max": 15}
    
    # Calculate total
    total_score = sum(c["score"] for c in score_components.values())
    
    # Determine trust level
    if total_score >= 80:
        trust_level = "excellent"
        trust_label = "Très fiable"
    elif total_score >= 60:
        trust_level = "good"
        trust_label = "Fiable"
    elif total_score >= 40:
        trust_level = "moderate"
        trust_label = "Modéré"
    else:
        trust_level = "low"
        trust_label = "À vérifier"
    
    return {
        "land_id": land_id,
        "total_score": total_score,
        "max_score": max_score,
        "percentage": round(total_score / max_score * 100),
        "trust_level": trust_level,
        "trust_label": trust_label,
        "components": score_components,
        "recommendations": _get_trust_recommendations(score_components)
    }

def _get_trust_recommendations(components: dict) -> list:
    """Generate recommendations to improve trust score"""
    recommendations = []
    
    if components["owner_verification"]["score"] < 15:
        recommendations.append("Vérifiez votre compte et ajoutez un numéro de téléphone")
    
    if components["documentation"]["score"] < 15:
        recommendations.append("Ajoutez plus de photos et documents officiels")
    
    if components["location_accuracy"]["score"] < 10:
        recommendations.append("Définissez les coordonnées exactes et les délimitations")
    
    if components["community_verification"]["score"] < 10:
        recommendations.append("Demandez des vérifications communautaires (voisins, chef de quartier)")
    
    return recommendations

# ==================== RISK ASSESSMENT ====================

@router.get("/lands/{land_id}/risk-assessment")
async def get_land_risk_assessment(land_id: str):
    """Get risk assessment for a land"""
    land = await db.lands.find_one({"land_id": land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    risks = []
    risk_score = 0
    
    # Check for duplicates
    if land.get("latitude") and land.get("longitude"):
        duplicate_check = await check_duplicate_land(
            land["latitude"], land["longitude"],
            land.get("size", 0), land.get("region", ""), land_id
        )
        if duplicate_check.is_potential_duplicate:
            risks.append({
                "type": "duplicate",
                "severity": "high",
                "description": "Terrains similaires détectés dans la zone",
                "similar_lands": len(duplicate_check.similar_lands)
            })
            risk_score += 30
    
    # Check disputes
    disputes = await db.disputes.find({"land_id": land_id, "status": "open"}).to_list(10)
    if disputes:
        risks.append({
            "type": "dispute",
            "severity": "high",
            "description": f"{len(disputes)} litige(s) en cours",
            "disputes": len(disputes)
        })
        risk_score += 40
    
    # Check owner history
    owner = await db.users.find_one({"user_id": land["owner_id"]})
    if owner:
        owner_lands = await db.lands.count_documents({"owner_id": owner["user_id"]})
        if owner_lands > 20:
            risks.append({
                "type": "high_volume_seller",
                "severity": "medium",
                "description": "Vendeur avec beaucoup de propriétés",
                "lands_count": owner_lands
            })
            risk_score += 15
    
    # Price analysis
    avg_price = await db.lands.aggregate([
        {"$match": {"region": land.get("region"), "status": {"$in": ["available", "sold"]}}},
        {"$group": {"_id": None, "avg": {"$avg": {"$divide": ["$price", "$size"]}}}}
    ]).to_list(1)
    
    if avg_price and land.get("size", 0) > 0:
        land_price_per_sqm = land.get("price", 0) / land.get("size")
        regional_avg = avg_price[0].get("avg", 0)
        if regional_avg > 0:
            price_ratio = land_price_per_sqm / regional_avg
            if price_ratio < 0.5:
                risks.append({
                    "type": "price_anomaly",
                    "severity": "medium",
                    "description": "Prix significativement inférieur à la moyenne régionale",
                    "ratio": round(price_ratio, 2)
                })
                risk_score += 20
    
    # Determine overall risk level
    if risk_score >= 50:
        risk_level = "high"
        risk_label = "Risque élevé"
    elif risk_score >= 25:
        risk_level = "medium"
        risk_label = "Risque modéré"
    else:
        risk_level = "low"
        risk_label = "Risque faible"
    
    return {
        "land_id": land_id,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_label": risk_label,
        "risks": risks,
        "assessment_date": datetime.now(timezone.utc).isoformat()
    }

# ==================== DISPUTES ====================

@router.post("/disputes/report")
async def report_land_dispute(
    report: DisputeReport,
    current_user: dict = Depends(get_current_user)
):
    """Report a land dispute"""
    land = await db.lands.find_one({"land_id": report.land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    dispute_id = str(uuid.uuid4())
    dispute = {
        "dispute_id": dispute_id,
        "land_id": report.land_id,
        "reported_by": current_user["user_id"],
        "dispute_type": report.dispute_type,
        "description": report.description,
        "evidence_urls": report.evidence_urls,
        "parties_involved": report.parties_involved,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.disputes.insert_one(dispute)
    
    return {"dispute_id": dispute_id, "message": "Litige signalé"}

@router.get("/disputes/area/{region}")
async def get_area_disputes(region: str):
    """Get disputes in a region"""
    # Get lands in region
    land_ids = await db.lands.distinct("land_id", {"region": region})
    
    disputes = await db.disputes.find(
        {"land_id": {"$in": land_ids}},
        {"_id": 0}
    ).to_list(100)
    
    return {
        "region": region,
        "total_disputes": len(disputes),
        "open_disputes": len([d for d in disputes if d.get("status") == "open"]),
        "disputes": disputes
    }

@router.get("/lands/{land_id}/disputes")
async def get_land_disputes(land_id: str):
    """Get disputes for a land"""
    disputes = await db.disputes.find(
        {"land_id": land_id},
        {"_id": 0}
    ).to_list(50)
    
    return {"disputes": disputes, "total": len(disputes)}

# ==================== CADASTRE CHECK ====================

@router.get("/lands/{land_id}/cadastre-check")
async def check_cadastre_status(land_id: str):
    """Check cadastre registration status (simulated)"""
    land = await db.lands.find_one({"land_id": land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    # Simulated cadastre check
    has_documents = len(land.get("documents", [])) > 0
    has_coordinates = land.get("latitude") and land.get("longitude")
    
    if has_documents and has_coordinates:
        status = "registered"
        message = "Terrain enregistré au cadastre"
    elif has_coordinates:
        status = "pending"
        message = "En attente d'enregistrement"
    else:
        status = "unknown"
        message = "Statut cadastral inconnu"
    
    return {
        "land_id": land_id,
        "cadastre_status": status,
        "message": message,
        "has_title_document": has_documents,
        "has_coordinates": has_coordinates,
        "checked_at": datetime.now(timezone.utc).isoformat()
    }

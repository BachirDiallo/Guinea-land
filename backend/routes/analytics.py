"""Analytics routes - Market trends, prices, comparisons, infrastructure"""
from fastapi import APIRouter, HTTPException, Request, Query
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import math

from database import db
from utils.auth import get_optional_user
from config import GUINEA_REGIONS

router = APIRouter(tags=["Analytics"])

# ==================== MARKET TRENDS ====================

@router.get("/market/trends")
async def get_market_trends(
    region: Optional[str] = None,
    land_type: Optional[str] = None,
    period: str = "6m"
):
    """Get market trends data"""
    # Calculate date range
    periods = {"1m": 30, "3m": 90, "6m": 180, "1y": 365}
    days = periods.get(period, 180)
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Build query
    match_query = {"status": {"$in": ["available", "sold"]}}
    if region:
        match_query["region"] = region
    if land_type:
        match_query["land_type"] = land_type
    
    # Get price trends by month
    pipeline = [
        {"$match": match_query},
        {
            "$addFields": {
                "month": {"$substr": ["$created_at", 0, 7]}
            }
        },
        {
            "$group": {
                "_id": "$month",
                "avg_price": {"$avg": "$price"},
                "avg_price_per_sqm": {"$avg": {"$divide": ["$price", "$size"]}},
                "count": {"$sum": 1},
                "total_value": {"$sum": "$price"}
            }
        },
        {"$sort": {"_id": 1}},
        {"$limit": 12}
    ]
    
    trends = await db.lands.aggregate(pipeline).to_list(12)
    
    # Get regional breakdown
    regional_pipeline = [
        {"$match": {"status": {"$in": ["available", "sold"]}}},
        {
            "$group": {
                "_id": "$region",
                "count": {"$sum": 1},
                "avg_price": {"$avg": "$price"},
                "avg_price_per_sqm": {"$avg": {"$divide": ["$price", "$size"]}},
                "total_size": {"$sum": "$size"}
            }
        },
        {"$sort": {"count": -1}}
    ]
    
    regional = await db.lands.aggregate(regional_pipeline).to_list(20)
    
    # Get type breakdown
    type_pipeline = [
        {"$match": {"status": {"$in": ["available", "sold"]}}},
        {
            "$group": {
                "_id": "$land_type",
                "count": {"$sum": 1},
                "avg_price": {"$avg": "$price"},
                "avg_price_per_sqm": {"$avg": {"$divide": ["$price", "$size"]}}
            }
        }
    ]
    
    by_type = await db.lands.aggregate(type_pipeline).to_list(10)
    
    return {
        "trends": trends,
        "by_region": regional,
        "by_type": by_type,
        "period": period,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

@router.get("/market/top-sellers")
async def get_top_sellers(limit: int = 10):
    """Get top sellers leaderboard"""
    pipeline = [
        {"$match": {"status": "completed"}},
        {
            "$group": {
                "_id": "$seller_id",
                "transactions": {"$sum": 1},
                "total_value": {"$sum": "$price"}
            }
        },
        {"$sort": {"transactions": -1}},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "users",
                "localField": "_id",
                "foreignField": "user_id",
                "as": "seller_info"
            }
        },
        {
            "$addFields": {
                "seller_name": {"$arrayElemAt": ["$seller_info.name", 0]},
                "verified": {"$arrayElemAt": ["$seller_info.verified", 0]}
            }
        },
        {"$project": {"seller_info": 0}}
    ]
    
    sellers = await db.transactions.aggregate(pipeline).to_list(limit)
    return sellers

# ==================== PRICE COMPARISON ====================

@router.get("/prices/region/{region}")
async def get_regional_prices(region: str, land_type: Optional[str] = None):
    """Get price statistics for a region"""
    query = {"region": region, "status": {"$in": ["available", "sold"]}}
    if land_type:
        query["land_type"] = land_type
    
    pipeline = [
        {"$match": query},
        {
            "$group": {
                "_id": "$commune",
                "avg_price": {"$avg": "$price"},
                "min_price": {"$min": "$price"},
                "max_price": {"$max": "$price"},
                "avg_price_per_sqm": {"$avg": {"$divide": ["$price", "$size"]}},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}}
    ]
    
    prices = await db.lands.aggregate(pipeline).to_list(50)
    
    # Overall stats
    overall = await db.lands.aggregate([
        {"$match": query},
        {
            "$group": {
                "_id": None,
                "avg_price": {"$avg": "$price"},
                "avg_price_per_sqm": {"$avg": {"$divide": ["$price", "$size"]}},
                "total_lands": {"$sum": 1}
            }
        }
    ]).to_list(1)
    
    return {
        "region": region,
        "land_type": land_type,
        "overall": overall[0] if overall else {},
        "by_commune": prices
    }

@router.get("/prices/nearby/{land_id}")
async def get_nearby_prices(land_id: str, radius_km: float = 5.0):
    """Get nearby land prices for comparison"""
    land = await db.lands.find_one({"land_id": land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    if not land.get("latitude") or not land.get("longitude"):
        return {"nearby": [], "message": "Coordonnées non disponibles"}
    
    # Get lands in same region
    nearby_lands = await db.lands.find({
        "land_id": {"$ne": land_id},
        "region": land.get("region"),
        "latitude": {"$exists": True},
        "longitude": {"$exists": True}
    }, {"_id": 0}).to_list(100)
    
    # Filter by distance
    def calc_distance(lat1, lng1, lat2, lng2):
        R = 6371
        lat1_rad, lat2_rad = math.radians(lat1), math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    nearby = []
    for nl in nearby_lands:
        dist = calc_distance(land["latitude"], land["longitude"], nl["latitude"], nl["longitude"])
        if dist <= radius_km:
            nl["distance_km"] = round(dist, 2)
            nearby.append(nl)
    
    nearby.sort(key=lambda x: x["distance_km"])
    
    # Calculate stats
    if nearby:
        prices = [n.get("price", 0) for n in nearby if n.get("price")]
        sizes = [n.get("size", 0) for n in nearby if n.get("size")]
        stats = {
            "avg_price": sum(prices) / len(prices) if prices else 0,
            "avg_size": sum(sizes) / len(sizes) if sizes else 0,
            "count": len(nearby)
        }
    else:
        stats = {"avg_price": 0, "avg_size": 0, "count": 0}
    
    return {
        "land_id": land_id,
        "radius_km": radius_km,
        "nearby": nearby[:20],
        "stats": stats
    }

# ==================== LAND COMPARISON ====================

@router.post("/compare")
async def compare_lands(request: Request):
    """Compare multiple lands"""
    body = await request.json()
    land_ids = body.get("land_ids", [])
    
    if len(land_ids) < 2:
        raise HTTPException(status_code=400, detail="Au moins 2 terrains requis")
    if len(land_ids) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 terrains")
    
    pipeline = [
        {"$match": {"land_id": {"$in": land_ids}}},
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
                "avg_rating": {"$avg": "$reviews.rating"},
                "review_count": {"$size": "$reviews"},
                "price_per_sqm": {"$divide": ["$price", "$size"]}
            }
        },
        {"$project": {"_id": 0, "owner_info": 0, "reviews": 0}}
    ]
    
    lands = await db.lands.aggregate(pipeline).to_list(4)
    
    if not lands:
        raise HTTPException(status_code=404, detail="Terrains non trouvés")
    
    # Calculate comparison metrics
    prices = [l.get("price", 0) for l in lands]
    sizes = [l.get("size", 0) for l in lands]
    
    comparison = {
        "lands": lands,
        "metrics": {
            "price": {
                "min": min(prices),
                "max": max(prices),
                "avg": sum(prices) / len(prices),
                "lowest_id": lands[prices.index(min(prices))]["land_id"]
            },
            "size": {
                "min": min(sizes),
                "max": max(sizes),
                "avg": sum(sizes) / len(sizes),
                "largest_id": lands[sizes.index(max(sizes))]["land_id"]
            }
        }
    }
    
    return comparison

# ==================== INFRASTRUCTURE SCORE ====================

INFRASTRUCTURE_DATA = {
    "Conakry": {"water": 85, "electricity": 90, "roads": 80, "schools": 85, "hospitals": 90, "markets": 95, "development": "rapid"},
    "Kindia": {"water": 70, "electricity": 75, "roads": 65, "schools": 70, "hospitals": 65, "markets": 75, "development": "moderate"},
    "Boké": {"water": 65, "electricity": 70, "roads": 60, "schools": 60, "hospitals": 55, "markets": 65, "development": "moderate"},
    "Mamou": {"water": 60, "electricity": 65, "roads": 55, "schools": 60, "hospitals": 50, "markets": 60, "development": "slow"},
    "Labé": {"water": 65, "electricity": 70, "roads": 60, "schools": 65, "hospitals": 55, "markets": 65, "development": "moderate"},
    "Faranah": {"water": 55, "electricity": 60, "roads": 50, "schools": 55, "hospitals": 45, "markets": 55, "development": "slow"},
    "Kankan": {"water": 60, "electricity": 65, "roads": 55, "schools": 60, "hospitals": 50, "markets": 60, "development": "slow"},
    "N'Zérékoré": {"water": 55, "electricity": 60, "roads": 50, "schools": 55, "hospitals": 50, "markets": 55, "development": "slow"}
}

@router.get("/lands/{land_id}/infrastructure-score")
async def get_infrastructure_score(land_id: str):
    """Get infrastructure score for a land"""
    land = await db.lands.find_one({"land_id": land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    region = land.get("region", "")
    land_type = land.get("land_type", "residential")
    
    region_data = INFRASTRUCTURE_DATA.get(region, INFRASTRUCTURE_DATA["Conakry"])
    
    # Calculate weighted score based on land type
    if land_type == "residential":
        weights = {"water": 0.2, "electricity": 0.2, "roads": 0.15, "schools": 0.2, "hospitals": 0.15, "markets": 0.1}
    elif land_type == "commercial":
        weights = {"water": 0.1, "electricity": 0.25, "roads": 0.25, "schools": 0.05, "hospitals": 0.05, "markets": 0.3}
    else:  # agricultural
        weights = {"water": 0.35, "electricity": 0.15, "roads": 0.25, "schools": 0.05, "hospitals": 0.1, "markets": 0.1}
    
    total_score = sum(region_data.get(k, 50) * v for k, v in weights.items())
    
    if total_score >= 75:
        grade = "A"
        label = "Excellent"
    elif total_score >= 60:
        grade = "B"
        label = "Bon"
    elif total_score >= 45:
        grade = "C"
        label = "Moyen"
    else:
        grade = "D"
        label = "À améliorer"
    
    return {
        "land_id": land_id,
        "region": region,
        "land_type": land_type,
        "total_score": round(total_score),
        "grade": grade,
        "label": label,
        "breakdown": {k: region_data.get(k, 50) for k in weights.keys()},
        "development_status": region_data.get("development", "unknown")
    }

# ==================== FAIR PRICE ESTIMATOR ====================

@router.get("/lands/{land_id}/price-estimate")
async def get_fair_price_estimate(land_id: str):
    """Get fair price estimate for a land"""
    land = await db.lands.find_one({"land_id": land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    region = land.get("region", "")
    land_type = land.get("land_type", "residential")
    size = land.get("size", 0)
    
    # Get comparable sales
    comparables = await db.lands.aggregate([
        {
            "$match": {
                "region": region,
                "land_type": land_type,
                "status": {"$in": ["available", "sold"]},
                "land_id": {"$ne": land_id},
                "size": {"$gte": size * 0.5, "$lte": size * 2}
            }
        },
        {"$limit": 20}
    ]).to_list(20)
    
    if not comparables:
        return {
            "land_id": land_id,
            "estimated_price": None,
            "confidence": "low",
            "message": "Pas assez de données comparables"
        }
    
    # Calculate average price per sqm
    prices_per_sqm = [c.get("price", 0) / c.get("size", 1) for c in comparables if c.get("size", 0) > 0]
    avg_price_per_sqm = sum(prices_per_sqm) / len(prices_per_sqm) if prices_per_sqm else 0
    
    # Apply adjustments
    adjustments = {}
    adjustment_factor = 1.0
    
    # Location adjustment
    if land.get("latitude") and land.get("longitude"):
        adjustments["location_verified"] = 1.05
        adjustment_factor *= 1.05
    
    # Documentation adjustment
    if land.get("documents") and len(land["documents"]) > 0:
        adjustments["documents"] = 1.03
        adjustment_factor *= 1.03
    
    # Verification adjustment
    if land.get("verified"):
        adjustments["verified"] = 1.02
        adjustment_factor *= 1.02
    
    estimated_price = avg_price_per_sqm * size * adjustment_factor
    current_price = land.get("price", 0)
    
    # Calculate price assessment
    if current_price > 0:
        ratio = current_price / estimated_price
        if ratio < 0.8:
            assessment = "below_market"
            assessment_label = "En dessous du marché"
        elif ratio > 1.2:
            assessment = "above_market"
            assessment_label = "Au dessus du marché"
        else:
            assessment = "fair"
            assessment_label = "Prix juste"
    else:
        assessment = "unknown"
        assessment_label = "Prix non défini"
    
    return {
        "land_id": land_id,
        "current_price": current_price,
        "estimated_price": round(estimated_price),
        "price_range": {
            "low": round(estimated_price * 0.9),
            "high": round(estimated_price * 1.1)
        },
        "price_per_sqm": round(avg_price_per_sqm),
        "comparable_count": len(comparables),
        "adjustments": adjustments,
        "assessment": assessment,
        "assessment_label": assessment_label,
        "confidence": "high" if len(comparables) >= 5 else "medium" if len(comparables) >= 2 else "low"
    }

# ==================== INVESTMENT ANALYSIS ====================

@router.get("/lands/{land_id}/investment-analysis")
async def get_investment_analysis(land_id: str):
    """Get investment analysis for a land"""
    land = await db.lands.find_one({"land_id": land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    region = land.get("region", "")
    land_type = land.get("land_type", "residential")
    
    region_data = INFRASTRUCTURE_DATA.get(region, INFRASTRUCTURE_DATA["Conakry"])
    
    # Growth potential
    growth_rates = {"rapid": 15, "moderate": 8, "slow": 3}
    annual_growth = growth_rates.get(region_data.get("development", "slow"), 5)
    
    price = land.get("price", 0)
    projections = {
        "1_year": round(price * (1 + annual_growth/100)),
        "3_years": round(price * (1 + annual_growth/100) ** 3),
        "5_years": round(price * (1 + annual_growth/100) ** 5)
    }
    
    # Risk factors
    risks = []
    opportunities = []
    
    if not land.get("verified"):
        risks.append("Terrain non vérifié")
    if not land.get("documents") or len(land.get("documents", [])) == 0:
        risks.append("Pas de documents officiels")
    
    if region_data.get("development") == "rapid":
        opportunities.append("Zone en développement rapide")
    if land_type == "residential" and region == "Conakry":
        opportunities.append("Forte demande locative")
    if land_type == "agricultural" and region in ["Kindia", "N'Zérékoré"]:
        opportunities.append("Potentiel agricole")
    
    return {
        "land_id": land_id,
        "current_price": price,
        "annual_growth_rate": annual_growth,
        "projections": projections,
        "roi_5_years": round((projections["5_years"] - price) / price * 100) if price > 0 else 0,
        "risks": [r for r in risks if r],
        "opportunities": [o for o in opportunities if o],
        "investment_grade": "A" if annual_growth >= 10 else "B" if annual_growth >= 5 else "C"
    }

# ==================== FEEDBACK ====================

@router.post("/feedback")
async def submit_feedback(request: Request):
    """Submit user feedback"""
    user = await get_optional_user(request)
    body = await request.json()
    
    feedback_id = str(uuid.uuid4())
    feedback = {
        "feedback_id": feedback_id,
        "user_id": user["user_id"] if user else None,
        "category": body.get("category", "general"),
        "subject": body.get("subject", ""),
        "message": body.get("message", ""),
        "rating": body.get("rating"),
        "contact_email": body.get("contact_email"),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.feedback.insert_one(feedback)
    
    return {"feedback_id": feedback_id, "message": "Merci pour votre feedback!"}

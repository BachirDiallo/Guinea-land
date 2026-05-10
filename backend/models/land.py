"""Land-related Pydantic models"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class LandBase(BaseModel):
    title: str
    description: str
    price: float
    size: float
    region: str
    commune: str
    address: str
    land_type: str = "residential"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    boundaries: Optional[List[List[float]]] = []
    photos: Optional[List[str]] = []
    documents: Optional[List[str]] = []
    reference_price: Optional[float] = None
    market_price: Optional[float] = None
    price_source: Optional[str] = None

class LandCreate(LandBase):
    pass

class LandUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    size: Optional[float] = None
    region: Optional[str] = None
    commune: Optional[str] = None
    address: Optional[str] = None
    land_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    boundaries: Optional[List[List[float]]] = None
    photos: Optional[List[str]] = None
    documents: Optional[List[str]] = None
    status: Optional[str] = None
    reference_price: Optional[float] = None
    market_price: Optional[float] = None
    price_source: Optional[str] = None

class LandResponse(LandBase):
    land_id: str
    owner_id: str
    status: str = "pending"
    verified: bool = False
    verification_level: int = 0
    verifier_name: Optional[str] = None
    verifier_title: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    avg_rating: Optional[float] = None
    review_count: Optional[int] = 0

class ReviewCreate(BaseModel):
    land_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    review_id: str
    land_id: str
    user_id: str
    user_name: str
    rating: int
    comment: Optional[str] = None
    created_at: str
    helpful_count: int = 0
    verified_purchase: bool = False

class VerificationRequest(BaseModel):
    verifier_name: str
    verifier_title: str

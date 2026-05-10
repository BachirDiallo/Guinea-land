"""Common/shared Pydantic models"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class NeighborhoodPriceCreate(BaseModel):
    region: str
    commune: str
    land_type: str
    price_per_sqm: float
    sample_size: int = 1
    recorded_by: Optional[str] = None
    notes: Optional[str] = None

class NeighborhoodPriceResponse(BaseModel):
    price_id: str
    region: str
    commune: str
    land_type: str
    price_per_sqm: float
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    sample_size: int
    last_updated: str
    verified: bool = False

class FeedbackCreate(BaseModel):
    category: str
    subject: str
    message: str
    rating: Optional[int] = None
    contact_email: Optional[str] = None

class FeedbackResponse(BaseModel):
    feedback_id: str
    user_id: Optional[str] = None
    category: str
    subject: str
    message: str
    rating: Optional[int] = None
    status: str = "pending"
    created_at: str
    response: Optional[str] = None

class SavedSearchCreate(BaseModel):
    name: str
    filters: dict
    notify_new_listings: bool = True

class SavedSearchResponse(BaseModel):
    search_id: str
    user_id: str
    name: str
    filters: dict
    notify_new_listings: bool
    created_at: str
    last_checked: Optional[str] = None

class ZoneAlertCreate(BaseModel):
    name: str
    region: str
    commune: Optional[str] = None
    land_types: List[str] = []
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_size: Optional[float] = None
    max_size: Optional[float] = None
    notify_email: bool = True
    notify_sms: bool = False

class ZoneAlertResponse(BaseModel):
    alert_id: str
    user_id: str
    name: str
    region: str
    commune: Optional[str] = None
    land_types: List[str]
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_size: Optional[float] = None
    max_size: Optional[float] = None
    notify_email: bool
    notify_sms: bool
    active: bool = True
    created_at: str
    last_triggered: Optional[str] = None

class DuplicateCheckResult(BaseModel):
    is_potential_duplicate: bool
    confidence: float
    similar_lands: List[dict]
    warning_message: Optional[str] = None

class CommunityVerificationRequest(BaseModel):
    verification_type: str  # neighbor, chief, authority
    verifier_name: str
    verifier_contact: str
    relationship: str
    notes: Optional[str] = None

class CommunityVerificationSubmission(BaseModel):
    verification_request_id: str
    verifier_name: str
    verifier_contact: str
    verification_code: str
    statement: str
    confirms_ownership: bool
    additional_notes: Optional[str] = None

class OwnershipTransfer(BaseModel):
    previous_owner_name: str
    transfer_date: str
    transfer_type: str  # inheritance, sale, gift, government_grant
    price: Optional[float] = None
    witnesses: List[str] = []
    documents: List[str] = []
    notes: Optional[str] = None

class DisputeReport(BaseModel):
    land_id: str
    dispute_type: str  # boundary, ownership, fraud, document
    description: str
    evidence_urls: List[str] = []
    parties_involved: List[str] = []

class AIMessageRequest(BaseModel):
    message: str
    session_id: str
    language: str = "fr"

class AIMessageResponse(BaseModel):
    response: str
    session_id: str

class AIDescriptionRequest(BaseModel):
    title: str = ""
    size: float
    region: str
    commune: str
    land_type: str
    address: str = ""
    price: float = 0

class AIDescriptionResponse(BaseModel):
    description: str
    success: bool

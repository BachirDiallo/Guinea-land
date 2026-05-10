"""Transaction-related Pydantic models"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class TransactionBase(BaseModel):
    land_id: str
    buyer_email: str
    buyer_name: str
    buyer_phone: str
    price: float
    notes: Optional[str] = None
    documents: Optional[List[str]] = []

class TransactionCreate(BaseModel):
    land_id: str
    buyer_email: str
    buyer_name: str
    buyer_phone: str
    price: float
    notes: Optional[str] = None

class TransactionResponse(BaseModel):
    transaction_id: str
    land_id: str
    seller_id: str
    buyer_id: Optional[str] = None
    buyer_email: str
    buyer_name: str
    buyer_phone: str
    price: float
    status: str = "pending"
    notes: Optional[str] = None
    documents: Optional[List[str]] = []
    created_at: str
    completed_at: Optional[str] = None
    land_title: Optional[str] = None
    land_region: Optional[str] = None
    seller_name: Optional[str] = None

class EscrowCreateRequest(BaseModel):
    land_id: str
    buyer_id: str
    amount: float
    terms: str
    release_conditions: List[str]

class EscrowAction(BaseModel):
    action: str  # fund, release, dispute, cancel

class WitnessInvitation(BaseModel):
    land_id: str
    transaction_id: Optional[str] = None
    witness_email: str
    witness_name: str
    witness_role: str  # notary, chief, family, neighbor

class WitnessSignature(BaseModel):
    witness_id: str
    signature_token: str
    statement: str
    verification_code: str

class DocumentUpload(BaseModel):
    land_id: str
    transaction_id: Optional[str] = None
    document_type: str  # title, cadastre, agreement, photo, id_card
    file_url: str
    description: Optional[str] = None
    is_certified: bool = False

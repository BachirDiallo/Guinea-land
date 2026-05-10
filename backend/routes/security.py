"""Transaction security routes - Escrow, Witnesses, Document Vault"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from database import db
from models.transaction import EscrowCreateRequest, EscrowAction, WitnessInvitation, WitnessSignature, DocumentUpload
from utils.auth import get_current_user

router = APIRouter(tags=["Security"])

# ==================== ESCROW ====================

@router.post("/escrow/create")
async def create_escrow(
    request: EscrowCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create an escrow for a land transaction"""
    land = await db.lands.find_one({"land_id": request.land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    if land["owner_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Seul le propriétaire peut créer un escrow")
    
    escrow_id = str(uuid.uuid4())
    escrow = {
        "escrow_id": escrow_id,
        "land_id": request.land_id,
        "seller_id": current_user["user_id"],
        "buyer_id": request.buyer_id,
        "amount": request.amount,
        "terms": request.terms,
        "release_conditions": request.release_conditions,
        "status": "created",
        "funded": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "history": [{
            "action": "created",
            "by": current_user["user_id"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }]
    }
    
    await db.escrows.insert_one(escrow)
    
    return {"escrow_id": escrow_id, "status": "created", "message": "Escrow créé"}

@router.post("/escrow/{escrow_id}/action")
async def escrow_action(
    escrow_id: str,
    action: EscrowAction,
    current_user: dict = Depends(get_current_user)
):
    """Perform action on escrow"""
    escrow = await db.escrows.find_one({"escrow_id": escrow_id})
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow non trouvé")
    
    # Check permissions
    is_seller = escrow["seller_id"] == current_user["user_id"]
    is_buyer = escrow["buyer_id"] == current_user["user_id"]
    is_admin = current_user["role"] == "admin"
    
    if not (is_seller or is_buyer or is_admin):
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    valid_actions = {
        "created": ["fund", "cancel"],
        "funded": ["release", "dispute", "cancel"],
        "disputed": ["resolve", "cancel"]
    }
    
    if action.action not in valid_actions.get(escrow["status"], []):
        raise HTTPException(status_code=400, detail=f"Action '{action.action}' non valide pour le statut '{escrow['status']}'")
    
    new_status = {
        "fund": "funded",
        "release": "released",
        "dispute": "disputed",
        "cancel": "cancelled",
        "resolve": "released"
    }.get(action.action, escrow["status"])
    
    history_entry = {
        "action": action.action,
        "by": current_user["user_id"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    update = {
        "$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()},
        "$push": {"history": history_entry}
    }
    
    if action.action == "fund":
        update["$set"]["funded"] = True
        update["$set"]["funded_at"] = datetime.now(timezone.utc).isoformat()
    elif action.action == "release":
        update["$set"]["released_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.escrows.update_one({"escrow_id": escrow_id}, update)
    
    return {"escrow_id": escrow_id, "status": new_status, "message": f"Action '{action.action}' effectuée"}

@router.get("/escrow/{escrow_id}")
async def get_escrow_details(
    escrow_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get escrow details"""
    escrow = await db.escrows.find_one({"escrow_id": escrow_id}, {"_id": 0})
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow non trouvé")
    
    if escrow["seller_id"] != current_user["user_id"] and escrow["buyer_id"] != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    return escrow

@router.get("/lands/{land_id}/escrows")
async def get_land_escrows(land_id: str):
    """Get escrows for a land"""
    escrows = await db.escrows.find(
        {"land_id": land_id},
        {"_id": 0}
    ).to_list(20)
    
    return {"escrows": escrows, "total": len(escrows)}

# ==================== DIGITAL WITNESSES ====================

@router.post("/witnesses/invite")
async def invite_witness(
    invitation: WitnessInvitation,
    current_user: dict = Depends(get_current_user)
):
    """Invite a witness to sign"""
    witness_id = str(uuid.uuid4())
    signature_token = str(uuid.uuid4())
    verification_code = str(uuid.uuid4())[:6].upper()
    
    witness = {
        "witness_id": witness_id,
        "land_id": invitation.land_id,
        "transaction_id": invitation.transaction_id,
        "invited_by": current_user["user_id"],
        "witness_email": invitation.witness_email,
        "witness_name": invitation.witness_name,
        "witness_role": invitation.witness_role,
        "signature_token": signature_token,
        "verification_code": verification_code,
        "status": "invited",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.witnesses.insert_one(witness)
    
    return {
        "witness_id": witness_id,
        "verification_code": verification_code,
        "message": f"Invitation envoyée. Partagez le code {verification_code} avec {invitation.witness_name}"
    }

@router.post("/witnesses/sign")
async def witness_sign(signature: WitnessSignature):
    """Submit witness signature"""
    witness = await db.witnesses.find_one({
        "witness_id": signature.witness_id,
        "verification_code": signature.verification_code
    })
    
    if not witness:
        raise HTTPException(status_code=404, detail="Témoin non trouvé ou code invalide")
    
    if witness["status"] == "signed":
        raise HTTPException(status_code=400, detail="Signature déjà soumise")
    
    await db.witnesses.update_one(
        {"witness_id": signature.witness_id},
        {"$set": {
            "status": "signed",
            "statement": signature.statement,
            "signed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Signature enregistrée", "witness_id": signature.witness_id}

@router.get("/lands/{land_id}/witnesses")
async def get_land_witnesses(land_id: str):
    """Get witnesses for a land"""
    witnesses = await db.witnesses.find(
        {"land_id": land_id},
        {"_id": 0, "signature_token": 0, "verification_code": 0}
    ).to_list(20)
    
    return {
        "witnesses": witnesses,
        "total": len(witnesses),
        "signed": len([w for w in witnesses if w.get("status") == "signed"])
    }

# ==================== DOCUMENT VAULT ====================

@router.post("/documents/upload")
async def upload_document(
    doc: DocumentUpload,
    current_user: dict = Depends(get_current_user)
):
    """Upload a document to the vault"""
    land = await db.lands.find_one({"land_id": doc.land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    if land["owner_id"] != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    document_id = str(uuid.uuid4())
    document = {
        "document_id": document_id,
        "land_id": doc.land_id,
        "transaction_id": doc.transaction_id,
        "document_type": doc.document_type,
        "file_url": doc.file_url,
        "description": doc.description,
        "is_certified": doc.is_certified,
        "uploaded_by": current_user["user_id"],
        "verified": False,
        "shared_with": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.document_vault.insert_one(document)
    
    return {"document_id": document_id, "message": "Document ajouté"}

@router.get("/lands/{land_id}/documents")
async def get_land_documents(
    land_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get documents from vault for a land"""
    land = await db.lands.find_one({"land_id": land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    is_owner = land["owner_id"] == current_user["user_id"]
    is_admin = current_user["role"] == "admin"
    
    # Build query based on access
    if is_owner or is_admin:
        query = {"land_id": land_id}
    else:
        query = {"land_id": land_id, "shared_with": current_user["user_id"]}
    
    documents = await db.document_vault.find(query, {"_id": 0}).to_list(50)
    
    return {
        "documents": documents,
        "total": len(documents),
        "by_type": _group_documents_by_type(documents)
    }

def _group_documents_by_type(documents: list) -> dict:
    """Group documents by type"""
    grouped = {}
    for doc in documents:
        doc_type = doc.get("document_type", "other")
        if doc_type not in grouped:
            grouped[doc_type] = []
        grouped[doc_type].append(doc)
    return grouped

@router.post("/documents/{document_id}/verify")
async def verify_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Verify a document (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin requis")
    
    document = await db.document_vault.find_one({"document_id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    await db.document_vault.update_one(
        {"document_id": document_id},
        {"$set": {
            "verified": True,
            "verified_by": current_user["user_id"],
            "verified_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Document vérifié", "document_id": document_id}

@router.post("/documents/{document_id}/share")
async def share_document(
    document_id: str,
    share_with_user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Share a document with another user"""
    document = await db.document_vault.find_one({"document_id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    if document["uploaded_by"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.document_vault.update_one(
        {"document_id": document_id},
        {"$addToSet": {"shared_with": share_with_user_id}}
    )
    
    return {"message": "Document partagé", "shared_with": share_with_user_id}

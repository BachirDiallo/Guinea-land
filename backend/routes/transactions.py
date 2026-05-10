"""Transaction routes"""
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from io import BytesIO

from database import db
from models.transaction import TransactionCreate, TransactionResponse
from utils.auth import get_current_user
from utils.email import send_transaction_email
from utils.pdf import generate_transaction_pdf

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("", response_model=TransactionResponse)
async def create_transaction(transaction: TransactionCreate, request: Request):
    """Create a new transaction"""
    user = await get_current_user(request)
    
    land = await db.lands.find_one({"land_id": transaction.land_id})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    if land["owner_id"] != user["user_id"] and user["role"] not in ["admin", "agent"]:
        raise HTTPException(status_code=403, detail="Seul le propriétaire peut créer une transaction")
    
    if land["status"] == "sold":
        raise HTTPException(status_code=400, detail="Ce terrain a déjà été vendu")
    
    # Find buyer
    buyer = await db.users.find_one({"email": transaction.buyer_email})
    
    transaction_id = str(uuid.uuid4())
    transaction_data = {
        "transaction_id": transaction_id,
        "land_id": transaction.land_id,
        "seller_id": land["owner_id"],
        "buyer_id": buyer["user_id"] if buyer else None,
        "buyer_email": transaction.buyer_email,
        "buyer_name": transaction.buyer_name,
        "buyer_phone": transaction.buyer_phone,
        "price": transaction.price,
        "status": "pending",
        "notes": transaction.notes,
        "documents": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(transaction_data)
    
    # Update land status
    await db.lands.update_one(
        {"land_id": transaction.land_id},
        {"$set": {"status": "pending"}}
    )
    
    # Get seller info
    seller = await db.users.find_one({"user_id": land["owner_id"]})
    
    # Send emails
    await send_transaction_email(
        transaction.buyer_email,
        transaction.buyer_name,
        "buyer",
        transaction_data,
        land
    )
    
    if seller and seller.get("email"):
        await send_transaction_email(
            seller["email"],
            seller.get("name", "Vendeur"),
            "seller",
            transaction_data,
            land
        )
    
    return TransactionResponse(
        **{k: v for k, v in transaction_data.items() if k != "_id"},
        land_title=land.get("title"),
        land_region=land.get("region"),
        seller_name=seller.get("name") if seller else None
    )

@router.get("", response_model=List[TransactionResponse])
async def get_transactions(
    land_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    request: Request = None
):
    """Get transactions"""
    user = await get_current_user(request)
    
    query = {}
    
    if user["role"] != "admin":
        query["$or"] = [
            {"seller_id": user["user_id"]},
            {"buyer_id": user["user_id"]},
            {"buyer_email": user["email"]}
        ]
    
    if land_id:
        query["land_id"] = land_id
    if status:
        query["status"] = status
    
    # Get transactions with land and seller info
    pipeline = [
        {"$match": query},
        {"$sort": {"created_at": -1}},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "lands",
                "localField": "land_id",
                "foreignField": "land_id",
                "as": "land_info"
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "seller_id",
                "foreignField": "user_id",
                "as": "seller_info"
            }
        },
        {
            "$addFields": {
                "land_title": {"$arrayElemAt": ["$land_info.title", 0]},
                "land_region": {"$arrayElemAt": ["$land_info.region", 0]},
                "seller_name": {"$arrayElemAt": ["$seller_info.name", 0]}
            }
        },
        {"$project": {"_id": 0, "land_info": 0, "seller_info": 0}}
    ]
    
    transactions = await db.transactions.aggregate(pipeline).to_list(limit)
    return transactions

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: str, request: Request):
    """Get transaction by ID"""
    user = await get_current_user(request)
    
    pipeline = [
        {"$match": {"transaction_id": transaction_id}},
        {
            "$lookup": {
                "from": "lands",
                "localField": "land_id",
                "foreignField": "land_id",
                "as": "land_info"
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "seller_id",
                "foreignField": "user_id",
                "as": "seller_info"
            }
        },
        {
            "$addFields": {
                "land_title": {"$arrayElemAt": ["$land_info.title", 0]},
                "land_region": {"$arrayElemAt": ["$land_info.region", 0]},
                "seller_name": {"$arrayElemAt": ["$seller_info.name", 0]}
            }
        },
        {"$project": {"_id": 0, "land_info": 0, "seller_info": 0}}
    ]
    
    result = await db.transactions.aggregate(pipeline).to_list(1)
    if not result:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")
    
    transaction = result[0]
    
    # Check access
    if user["role"] != "admin":
        if (transaction["seller_id"] != user["user_id"] and 
            transaction.get("buyer_id") != user["user_id"] and
            transaction["buyer_email"] != user["email"]):
            raise HTTPException(status_code=403, detail="Non autorisé")
    
    return transaction

@router.get("/{transaction_id}/pdf")
async def download_transaction_pdf(transaction_id: str, request: Request):
    """Download transaction PDF receipt"""
    user = await get_current_user(request)
    
    transaction = await db.transactions.find_one({"transaction_id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")
    
    # Check access
    if user["role"] != "admin":
        if (transaction["seller_id"] != user["user_id"] and 
            transaction.get("buyer_id") != user["user_id"] and
            transaction["buyer_email"] != user["email"]):
            raise HTTPException(status_code=403, detail="Non autorisé")
    
    land = await db.lands.find_one({"land_id": transaction["land_id"]})
    seller = await db.users.find_one({"user_id": transaction["seller_id"]})
    buyer = await db.users.find_one({"user_id": transaction.get("buyer_id")}) if transaction.get("buyer_id") else None
    
    buyer_data = buyer or {
        "name": transaction["buyer_name"],
        "email": transaction["buyer_email"],
        "phone": transaction["buyer_phone"]
    }
    
    pdf_buffer = generate_transaction_pdf(transaction, land, buyer_data, seller)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=transaction_{transaction_id[:8]}.pdf"
        }
    )

@router.put("/{transaction_id}/complete")
async def complete_transaction(transaction_id: str, request: Request):
    """Complete a transaction"""
    user = await get_current_user(request)
    
    transaction = await db.transactions.find_one({"transaction_id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")
    
    if transaction["seller_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.transactions.update_one(
        {"transaction_id": transaction_id},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update land status
    await db.lands.update_one(
        {"land_id": transaction["land_id"]},
        {"$set": {"status": "sold"}}
    )
    
    return {"message": "Transaction complétée"}

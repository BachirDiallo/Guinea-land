from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, Query, Header
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import bcrypt
import jwt
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'guinea-land-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# Object Storage Configuration
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "guinea-land-hub"
storage_key = None

# MIME Types
MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp", "pdf": "application/pdf",
    "json": "application/json", "csv": "text/csv", "txt": "text/plain"
}

# Create the main app
app = FastAPI(title="Guinea Land Hub API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== OBJECT STORAGE HELPERS ====================

def init_storage():
    """Initialize storage - call once at startup"""
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_KEY:
        logger.warning("EMERGENT_LLM_KEY not set - file uploads disabled")
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Object storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to storage"""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Storage not available")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    """Download file from storage"""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Storage not available")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "buyer"  # buyer, seller, agent, admin
    phone: Optional[str] = None
    address: Optional[str] = None
    picture: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "buyer"
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    address: Optional[str] = None
    picture: Optional[str] = None
    created_at: datetime

class LandBase(BaseModel):
    title: str
    description: str
    price: float
    size: float  # in square meters
    region: str
    commune: str
    address: str
    latitude: float
    longitude: float
    boundaries: Optional[List[List[float]]] = None  # GeoJSON polygon coordinates
    photos: List[str] = []
    land_type: str = "residential"  # residential, commercial, agricultural
    status: str = "available"  # available, pending, sold
    documents: List[str] = []

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
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    boundaries: Optional[List[List[float]]] = None
    photos: Optional[List[str]] = None
    land_type: Optional[str] = None
    status: Optional[str] = None
    documents: Optional[List[str]] = None

class LandResponse(LandBase):
    model_config = ConfigDict(extra="ignore")
    land_id: str
    owner_id: str
    owner_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    verified: bool = False

class TransactionBase(BaseModel):
    land_id: str
    buyer_id: str
    seller_id: str
    price: float
    transaction_date: datetime
    notes: Optional[str] = None
    documents: List[str] = []

class TransactionCreate(BaseModel):
    land_id: str
    buyer_id: str
    price: float
    notes: Optional[str] = None
    documents: List[str] = []

class TransactionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    transaction_id: str
    land_id: str
    land_title: Optional[str] = None
    buyer_id: str
    buyer_name: Optional[str] = None
    seller_id: str
    seller_name: Optional[str] = None
    price: float
    transaction_date: datetime
    notes: Optional[str] = None
    documents: List[str] = []
    status: str = "completed"
    created_at: datetime


# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {
        "user_id": user_id,
        "exp": expiration,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(request: Request) -> dict:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Then check Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a session token (Google OAuth)
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if session:
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user = await db.users.find_one(
            {"user_id": session["user_id"]},
            {"_id": 0, "password_hash": 0}
        )
        if user:
            return user
    
    # Check if it's a JWT token
    payload = decode_jwt_token(session_token)
    if payload:
        user = await db.users.find_one(
            {"user_id": payload["user_id"]},
            {"_id": 0, "password_hash": 0}
        )
        if user:
            return user
    
    raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "role": user_data.role,
        "phone": user_data.phone,
        "address": None,
        "picture": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    return UserResponse(
        user_id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        phone=user_data.phone,
        created_at=user_doc["created_at"]
    )

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"])
    
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRATION_DAYS * 24 * 60 * 60
    )
    
    return {
        "token": token,
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "phone": user.get("phone"),
            "picture": user.get("picture")
        }
    }

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Google OAuth session_id for user data"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get session data
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=500, detail="Auth service unavailable")
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Find or create user
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if user:
        user_id = user["user_id"]
        # Update user info if needed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": "buyer",
            "picture": picture,
            "phone": None,
            "address": None,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user)
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "session_token": session_token,
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "user": {
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": user.get("role", "buyer"),
            "picture": picture
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(request: Request):
    user = await get_current_user(request)
    return UserResponse(**user)

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}


# ==================== USER ROUTES ====================

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(
    request: Request,
    role: Optional[str] = None,
    limit: int = Query(default=50, le=100)
):
    await get_current_user(request)  # Require auth
    
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).limit(limit).to_list(limit)
    return [UserResponse(**u) for u in users]

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, request: Request):
    await get_current_user(request)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(**user)

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, request: Request):
    current_user = await get_current_user(request)
    
    if current_user["user_id"] != user_id and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    body = await request.json()
    allowed_fields = ["name", "phone", "address", "picture"]
    update_data = {k: v for k, v in body.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one({"user_id": user_id}, {"$set": update_data})
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return user


# ==================== LAND ROUTES ====================

@api_router.post("/lands", response_model=LandResponse)
async def create_land(land: LandCreate, request: Request):
    user = await get_current_user(request)
    
    land_id = f"land_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    land_doc = {
        "land_id": land_id,
        "owner_id": user["user_id"],
        **land.model_dump(),
        "verified": False,
        "created_at": now,
        "updated_at": now
    }
    
    await db.lands.insert_one(land_doc)
    
    return LandResponse(
        **land_doc,
        owner_name=user["name"]
    )

@api_router.get("/lands", response_model=List[LandResponse])
async def get_lands(
    region: Optional[str] = None,
    land_type: Optional[str] = None,
    status: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_size: Optional[float] = None,
    max_size: Optional[float] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    skip: int = 0
):
    query = {}
    
    if region:
        query["region"] = region
    if land_type:
        query["land_type"] = land_type
    if status:
        query["status"] = status
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
            {"address": {"$regex": search, "$options": "i"}}
        ]
    
    lands = await db.lands.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Get owner names
    owner_ids = list(set(l["owner_id"] for l in lands))
    owners = await db.users.find(
        {"user_id": {"$in": owner_ids}},
        {"_id": 0, "user_id": 1, "name": 1}
    ).to_list(len(owner_ids))
    owner_map = {o["user_id"]: o["name"] for o in owners}
    
    result = []
    for land in lands:
        land["owner_name"] = owner_map.get(land["owner_id"])
        result.append(LandResponse(**land))
    
    return result

@api_router.get("/lands/{land_id}", response_model=LandResponse)
async def get_land(land_id: str):
    land = await db.lands.find_one({"land_id": land_id}, {"_id": 0})
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    
    owner = await db.users.find_one(
        {"user_id": land["owner_id"]},
        {"_id": 0, "name": 1}
    )
    land["owner_name"] = owner["name"] if owner else None
    
    return LandResponse(**land)

@api_router.put("/lands/{land_id}", response_model=LandResponse)
async def update_land(land_id: str, land_update: LandUpdate, request: Request):
    user = await get_current_user(request)
    
    land = await db.lands.find_one({"land_id": land_id}, {"_id": 0})
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    
    if land["owner_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in land_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.lands.update_one({"land_id": land_id}, {"$set": update_data})
    
    updated = await db.lands.find_one({"land_id": land_id}, {"_id": 0})
    owner = await db.users.find_one({"user_id": updated["owner_id"]}, {"_id": 0, "name": 1})
    updated["owner_name"] = owner["name"] if owner else None
    
    return LandResponse(**updated)

@api_router.delete("/lands/{land_id}")
async def delete_land(land_id: str, request: Request):
    user = await get_current_user(request)
    
    land = await db.lands.find_one({"land_id": land_id}, {"_id": 0})
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    
    if land["owner_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.lands.delete_one({"land_id": land_id})
    return {"message": "Land deleted successfully"}

@api_router.post("/lands/{land_id}/verify")
async def verify_land(land_id: str, request: Request):
    user = await get_current_user(request)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.lands.update_one(
        {"land_id": land_id},
        {"$set": {"verified": True, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Land not found")
    
    return {"message": "Land verified successfully"}


# ==================== TRANSACTION ROUTES ====================

@api_router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(transaction: TransactionCreate, request: Request):
    user = await get_current_user(request)
    
    # Get the land
    land = await db.lands.find_one({"land_id": transaction.land_id}, {"_id": 0})
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    
    if land["status"] != "available":
        raise HTTPException(status_code=400, detail="Land is not available")
    
    seller_id = land["owner_id"]
    
    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    transaction_doc = {
        "transaction_id": transaction_id,
        "land_id": transaction.land_id,
        "buyer_id": transaction.buyer_id,
        "seller_id": seller_id,
        "price": transaction.price,
        "transaction_date": now,
        "notes": transaction.notes,
        "documents": transaction.documents,
        "status": "completed",
        "created_at": now
    }
    
    await db.transactions.insert_one(transaction_doc)
    
    # Update land status and owner
    await db.lands.update_one(
        {"land_id": transaction.land_id},
        {
            "$set": {
                "status": "sold",
                "owner_id": transaction.buyer_id,
                "updated_at": now
            }
        }
    )
    
    # Get names for response
    buyer = await db.users.find_one({"user_id": transaction.buyer_id}, {"_id": 0, "name": 1})
    seller = await db.users.find_one({"user_id": seller_id}, {"_id": 0, "name": 1})
    
    return TransactionResponse(
        **transaction_doc,
        land_title=land["title"],
        buyer_name=buyer["name"] if buyer else None,
        seller_name=seller["name"] if seller else None
    )

@api_router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    request: Request,
    land_id: Optional[str] = None,
    buyer_id: Optional[str] = None,
    seller_id: Optional[str] = None,
    limit: int = Query(default=50, le=100)
):
    user = await get_current_user(request)
    
    query = {}
    if land_id:
        query["land_id"] = land_id
    if buyer_id:
        query["buyer_id"] = buyer_id
    if seller_id:
        query["seller_id"] = seller_id
    
    # Non-admins can only see their own transactions
    if user.get("role") != "admin":
        query["$or"] = [
            {"buyer_id": user["user_id"]},
            {"seller_id": user["user_id"]}
        ]
    
    transactions = await db.transactions.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    # Enrich with names
    result = []
    for t in transactions:
        land = await db.lands.find_one({"land_id": t["land_id"]}, {"_id": 0, "title": 1})
        buyer = await db.users.find_one({"user_id": t["buyer_id"]}, {"_id": 0, "name": 1})
        seller = await db.users.find_one({"user_id": t["seller_id"]}, {"_id": 0, "name": 1})
        
        t["land_title"] = land["title"] if land else None
        t["buyer_name"] = buyer["name"] if buyer else None
        t["seller_name"] = seller["name"] if seller else None
        result.append(TransactionResponse(**t))
    
    return result

@api_router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: str, request: Request):
    user = await get_current_user(request)
    
    transaction = await db.transactions.find_one({"transaction_id": transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Check access
    if user.get("role") != "admin":
        if transaction["buyer_id"] != user["user_id"] and transaction["seller_id"] != user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    land = await db.lands.find_one({"land_id": transaction["land_id"]}, {"_id": 0, "title": 1})
    buyer = await db.users.find_one({"user_id": transaction["buyer_id"]}, {"_id": 0, "name": 1})
    seller = await db.users.find_one({"user_id": transaction["seller_id"]}, {"_id": 0, "name": 1})
    
    transaction["land_title"] = land["title"] if land else None
    transaction["buyer_name"] = buyer["name"] if buyer else None
    transaction["seller_name"] = seller["name"] if seller else None
    
    return TransactionResponse(**transaction)


# ==================== STATS ROUTES ====================

@api_router.get("/stats")
async def get_stats(request: Request):
    user = await get_optional_user(request)
    
    total_lands = await db.lands.count_documents({})
    available_lands = await db.lands.count_documents({"status": "available"})
    sold_lands = await db.lands.count_documents({"status": "sold"})
    total_transactions = await db.transactions.count_documents({})
    total_users = await db.users.count_documents({})
    
    # Get regions
    regions = await db.lands.distinct("region")
    
    return {
        "total_lands": total_lands,
        "available_lands": available_lands,
        "sold_lands": sold_lands,
        "total_transactions": total_transactions,
        "total_users": total_users,
        "regions": regions
    }

@api_router.get("/regions")
async def get_regions():
    regions = [
        {"code": "conakry", "name": "Conakry", "center": [-13.6785, 9.6412]},
        {"code": "kindia", "name": "Kindia", "center": [-12.8667, 10.0667]},
        {"code": "boke", "name": "Boké", "center": [-14.3, 10.9333]},
        {"code": "mamou", "name": "Mamou", "center": [-12.0833, 10.3833]},
        {"code": "labe", "name": "Labé", "center": [-12.2833, 11.3167]},
        {"code": "faranah", "name": "Faranah", "center": [-10.7333, 10.0333]},
        {"code": "kankan", "name": "Kankan", "center": [-9.3, 10.3833]},
        {"code": "nzerekore", "name": "N'Zérékoré", "center": [-8.8167, 7.7667]}
    ]
    return regions


# ==================== ROOT ROUTE ====================

@api_router.get("/")
async def root():
    return {"message": "Guinea Land Hub API", "version": "1.0.0"}


# ==================== FILE UPLOAD ROUTES ====================

@api_router.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    file_type: str = Query(default="photo", description="photo or document")
):
    """Upload a photo or document"""
    user = await get_current_user(request)
    
    # Validate file type
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    allowed_photo_exts = ["jpg", "jpeg", "png", "gif", "webp"]
    allowed_doc_exts = ["pdf", "jpg", "jpeg", "png"]
    
    if file_type == "photo" and ext not in allowed_photo_exts:
        raise HTTPException(status_code=400, detail=f"Invalid photo format. Allowed: {allowed_photo_exts}")
    if file_type == "document" and ext not in allowed_doc_exts:
        raise HTTPException(status_code=400, detail=f"Invalid document format. Allowed: {allowed_doc_exts}")
    
    # Read file
    data = await file.read()
    
    # Check file size (max 10MB)
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB")
    
    # Generate storage path
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/{file_type}s/{user['user_id']}/{file_id}.{ext}"
    
    # Get content type
    content_type = MIME_TYPES.get(ext, file.content_type or "application/octet-stream")
    
    # Upload to storage
    try:
        result = put_object(path, data, content_type)
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")
    
    # Store reference in DB
    file_doc = {
        "file_id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "file_type": file_type,
        "uploaded_by": user["user_id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.files.insert_one(file_doc)
    
    return {
        "file_id": file_id,
        "path": result["path"],
        "original_filename": file.filename,
        "size": file_doc["size"],
        "url": f"/api/files/{file_id}"
    }

@api_router.get("/files/{file_id}")
async def get_file(
    file_id: str,
    request: Request,
    authorization: str = Header(None),
    auth: str = Query(None)
):
    """Download a file by ID"""
    # Get file record
    file_record = await db.files.find_one(
        {"file_id": file_id, "is_deleted": False},
        {"_id": 0}
    )
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get file from storage
    try:
        data, content_type = get_object(file_record["storage_path"])
    except Exception as e:
        logger.error(f"File download failed: {e}")
        raise HTTPException(status_code=500, detail="File download failed")
    
    return Response(
        content=data,
        media_type=file_record.get("content_type", content_type),
        headers={
            "Content-Disposition": f'inline; filename="{file_record["original_filename"]}"'
        }
    )

@api_router.delete("/files/{file_id}")
async def delete_file(file_id: str, request: Request):
    """Soft delete a file"""
    user = await get_current_user(request)
    
    file_record = await db.files.find_one({"file_id": file_id}, {"_id": 0})
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Only owner or admin can delete
    if file_record["uploaded_by"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.files.update_one(
        {"file_id": file_id},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "File deleted successfully"}


# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/dashboard")
async def admin_dashboard(request: Request):
    """Get admin dashboard stats"""
    user = await get_current_user(request)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get stats
    total_users = await db.users.count_documents({})
    total_lands = await db.lands.count_documents({})
    pending_verification = await db.lands.count_documents({"verified": False})
    verified_lands = await db.lands.count_documents({"verified": True})
    total_transactions = await db.transactions.count_documents({})
    
    # Get recent unverified lands
    unverified_lands = await db.lands.find(
        {"verified": False},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Get user breakdown by role
    user_stats = await db.users.aggregate([
        {"$group": {"_id": "$role", "count": {"$sum": 1}}}
    ]).to_list(10)
    
    return {
        "total_users": total_users,
        "total_lands": total_lands,
        "pending_verification": pending_verification,
        "verified_lands": verified_lands,
        "total_transactions": total_transactions,
        "unverified_lands": unverified_lands,
        "user_stats": {item["_id"]: item["count"] for item in user_stats}
    }

@api_router.get("/admin/lands/pending")
async def get_pending_lands(request: Request):
    """Get all lands pending verification"""
    user = await get_current_user(request)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    lands = await db.lands.find(
        {"verified": False},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrich with owner info
    for land in lands:
        owner = await db.users.find_one(
            {"user_id": land["owner_id"]},
            {"_id": 0, "name": 1, "email": 1, "phone": 1}
        )
        land["owner"] = owner
    
    return lands

@api_router.post("/admin/lands/{land_id}/verify")
async def admin_verify_land(land_id: str, request: Request):
    """Verify a land listing (admin only)"""
    user = await get_current_user(request)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    body = {}
    try:
        body = await request.json()
    except:
        pass
    notes = body.get("notes", "")
    
    result = await db.lands.update_one(
        {"land_id": land_id},
        {
            "$set": {
                "verified": True,
                "verified_by": user["user_id"],
                "verified_at": datetime.now(timezone.utc),
                "verification_notes": notes,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Land not found")
    
    return {"message": "Land verified successfully", "land_id": land_id}

@api_router.post("/admin/lands/{land_id}/reject")
async def admin_reject_land(land_id: str, request: Request):
    """Reject a land listing (admin only)"""
    user = await get_current_user(request)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    body = await request.json()
    reason = body.get("reason", "No reason provided")
    
    result = await db.lands.update_one(
        {"land_id": land_id},
        {
            "$set": {
                "status": "rejected",
                "rejected_by": user["user_id"],
                "rejected_at": datetime.now(timezone.utc),
                "rejection_reason": reason,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Land not found")
    
    return {"message": "Land rejected", "land_id": land_id, "reason": reason}

@api_router.get("/admin/users")
async def admin_get_users(
    request: Request,
    role: Optional[str] = None,
    limit: int = Query(default=50, le=100)
):
    """Get all users (admin only)"""
    user = await get_current_user(request)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).limit(limit).to_list(limit)
    return users

@api_router.put("/admin/users/{user_id}/role")
async def admin_update_user_role(user_id: str, request: Request):
    """Update a user's role (admin only)"""
    admin = await get_current_user(request)
    
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    body = await request.json()
    new_role = body.get("role")
    
    if new_role not in ["buyer", "seller", "agent", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"role": new_role}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User role updated", "user_id": user_id, "new_role": new_role}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize storage on startup"""
    try:
        init_storage()
    except Exception as e:
        logger.error(f"Startup storage init failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

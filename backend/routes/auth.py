"""Authentication routes"""
from fastapi import APIRouter, HTTPException, Request, Response
from datetime import datetime, timezone
import uuid
import httpx

from database import db
from models.user import UserCreate, UserLogin, UserResponse
from utils.auth import hash_password, verify_password, create_jwt_token, get_current_user
from config import EMERGENT_KEY

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    user_id = str(uuid.uuid4())
    user = {
        "user_id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "phone": user_data.phone,
        "role": user_data.role,
        "verified": False,
        "verification_level": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    return UserResponse(
        user_id=user_id,
        email=user["email"],
        name=user["name"],
        phone=user.get("phone"),
        role=user["role"],
        verified=user["verified"],
        verification_level=user.get("verification_level", 0),
        created_at=user["created_at"]
    )

@router.post("/login")
async def login(credentials: UserLogin, response: Response):
    """Login and get JWT token"""
    user = await db.users.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    token = create_jwt_token(user["user_id"])
    
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "message": "Connexion réussie",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "phone": user.get("phone"),
            "role": user["role"],
            "verified": user.get("verified", False),
            "verification_level": user.get("verification_level", 0)
        }
    }

@router.post("/session")
async def exchange_session(request: Request, response: Response):
    """Exchange OAuth session for JWT token"""
    try:
        body = await request.json()
        session_id = body.get("session_id")
    except:
        session_id = request.query_params.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Verify session with Emergent OAuth
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://oauth.emergent.sh/api/session/{session_id}",
                headers={"Authorization": f"Bearer {EMERGENT_KEY}"},
                timeout=10
            )
            
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Session invalide")
            
            session_data = resp.json()
            
            if session_data.get("status") != "active":
                raise HTTPException(status_code=401, detail="Session expirée")
            
            user_info = session_data.get("user", {})
            email = user_info.get("email")
            name = user_info.get("name", email.split("@")[0] if email else "User")
            
            if not email:
                raise HTTPException(status_code=400, detail="Email non disponible")
            
            # Find or create user
            existing_user = await db.users.find_one({"email": email})
            
            if existing_user:
                user_id = existing_user["user_id"]
                # Update name if changed
                if name and name != existing_user.get("name"):
                    await db.users.update_one(
                        {"user_id": user_id},
                        {"$set": {"name": name}}
                    )
            else:
                user_id = str(uuid.uuid4())
                new_user = {
                    "user_id": user_id,
                    "email": email,
                    "name": name,
                    "password_hash": "",
                    "role": "buyer",
                    "verified": True,
                    "verification_level": 1,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "oauth_provider": "google"
                }
                await db.users.insert_one(new_user)
            
            # Create JWT
            token = create_jwt_token(user_id)
            
            response.set_cookie(
                key="auth_token",
                value=token,
                httponly=True,
                secure=True,
                samesite="none",
                max_age=7 * 24 * 60 * 60
            )
            
            user = await db.users.find_one({"user_id": user_id})
            
            return {
                "message": "Connexion réussie",
                "user": {
                    "user_id": user["user_id"],
                    "email": user["email"],
                    "name": user["name"],
                    "phone": user.get("phone"),
                    "role": user["role"],
                    "verified": user.get("verified", False),
                    "verification_level": user.get("verification_level", 0)
                }
            }
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Erreur de vérification: {str(e)}")

@router.get("/me", response_model=UserResponse)
async def get_me(request: Request):
    """Get current user profile"""
    user = await get_current_user(request)
    return UserResponse(**user)

@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout and clear cookie"""
    response.delete_cookie(
        key="auth_token",
        httponly=True,
        secure=True,
        samesite="none"
    )
    return {"message": "Déconnexion réussie"}

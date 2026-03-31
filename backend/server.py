from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, Query, Header
from fastapi.security import HTTPBearer
from fastapi.responses import StreamingResponse
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
import asyncio
import resend
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

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

# Email Configuration (Resend)
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

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


# ==================== EMAIL HELPERS ====================

async def send_transaction_email(
    recipient_email: str,
    recipient_name: str,
    transaction_type: str,  # "buyer" or "seller"
    transaction_data: dict,
    land_data: dict
):
    """Send transaction notification email"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set - email notifications disabled")
        return None
    
    subject = f"Guinea Land Hub - Confirmation de Transaction #{transaction_data['transaction_id'][-8:]}"
    
    if transaction_type == "buyer":
        intro = f"Félicitations {recipient_name}! Votre achat de terrain a été enregistré avec succès."
    else:
        intro = f"Bonjour {recipient_name}, la vente de votre terrain a été enregistrée avec succès."
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'IBM Plex Sans', Arial, sans-serif; background-color: #F7F7F5; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border: 2px solid #133E26; }}
            .header {{ background-color: #133E26; color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ padding: 30px; }}
            .intro {{ font-size: 16px; margin-bottom: 20px; }}
            .details {{ background-color: #F7F7F5; padding: 20px; margin: 20px 0; }}
            .details h3 {{ margin-top: 0; color: #133E26; border-bottom: 2px solid #D95A2B; padding-bottom: 10px; }}
            .row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }}
            .label {{ color: #666; }}
            .value {{ font-weight: bold; }}
            .price {{ font-size: 24px; color: #D95A2B; text-align: center; margin: 20px 0; }}
            .footer {{ background-color: #133E26; color: white; padding: 20px; text-align: center; font-size: 12px; }}
            .cta {{ display: inline-block; background-color: #D95A2B; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>GUINEA LAND HUB</h1>
                <p>Confirmation de Transaction</p>
            </div>
            <div class="content">
                <p class="intro">{intro}</p>
                
                <div class="details">
                    <h3>Détails du Terrain</h3>
                    <div class="row"><span class="label">Titre:</span><span class="value">{land_data.get('title', 'N/A')}</span></div>
                    <div class="row"><span class="label">Localisation:</span><span class="value">{land_data.get('commune', '')}, {land_data.get('region', '')}</span></div>
                    <div class="row"><span class="label">Surface:</span><span class="value">{land_data.get('size', 0):,.0f} m²</span></div>
                    <div class="row"><span class="label">Type:</span><span class="value">{land_data.get('land_type', 'N/A')}</span></div>
                </div>
                
                <div class="details">
                    <h3>Détails de la Transaction</h3>
                    <div class="row"><span class="label">Référence:</span><span class="value">{transaction_data['transaction_id']}</span></div>
                    <div class="row"><span class="label">Date:</span><span class="value">{transaction_data['transaction_date'].strftime('%d/%m/%Y') if isinstance(transaction_data['transaction_date'], datetime) else transaction_data['transaction_date']}</span></div>
                    <div class="row"><span class="label">Acheteur:</span><span class="value">{transaction_data.get('buyer_name', 'N/A')}</span></div>
                    <div class="row"><span class="label">Vendeur:</span><span class="value">{transaction_data.get('seller_name', 'N/A')}</span></div>
                </div>
                
                <div class="price">
                    Prix de Vente: {transaction_data['price']:,.0f} GNF
                </div>
                
                <p style="text-align: center;">
                    <a href="https://guinea-land-hub.preview.emergentagent.com/transactions" class="cta">Voir mes transactions</a>
                </p>
                
                <p style="font-size: 12px; color: #666; margin-top: 30px;">
                    Ce document constitue une preuve d'enregistrement de transaction sur la plateforme Guinea Land Hub. 
                    Pour toute question, contactez-nous.
                </p>
            </div>
            <div class="footer">
                <p>© 2024 Guinea Land Hub - Transactions Foncières en Guinée</p>
                <p>Conakry, République de Guinée</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    params = {
        "from": SENDER_EMAIL,
        "to": [recipient_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        email_result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Transaction email sent to {recipient_email}, id: {email_result.get('id')}")
        return email_result
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {e}")
        return None


# ==================== PDF GENERATION HELPERS ====================

def generate_transaction_pdf(transaction_data: dict, land_data: dict, buyer_data: dict, seller_data: dict) -> BytesIO:
    """Generate PDF document for transaction"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm, leftMargin=2*cm, rightMargin=2*cm)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#133E26'),
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#666666'),
        alignment=TA_CENTER,
        spaceAfter=30
    )
    
    section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#133E26'),
        spaceBefore=20,
        spaceAfter=10
    )
    
    elements = []
    
    # Header
    elements.append(Paragraph("GUINEA LAND HUB", title_style))
    elements.append(Paragraph("Certificat de Transaction Foncière", subtitle_style))
    elements.append(Spacer(1, 20))
    
    # Transaction Reference
    ref_data = [
        ["Référence de Transaction:", transaction_data['transaction_id']],
        ["Date d'émission:", datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')],
    ]
    ref_table = Table(ref_data, colWidths=[5*cm, 10*cm])
    ref_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#133E26')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(ref_table)
    elements.append(Spacer(1, 30))
    
    # Land Details Section
    elements.append(Paragraph("DÉTAILS DU TERRAIN", section_title))
    
    land_info = [
        ["Titre:", land_data.get('title', 'N/A')],
        ["Région:", land_data.get('region', 'N/A')],
        ["Commune:", land_data.get('commune', 'N/A')],
        ["Adresse:", land_data.get('address', 'N/A')],
        ["Surface:", f"{land_data.get('size', 0):,.0f} m²"],
        ["Type:", land_data.get('land_type', 'N/A').capitalize()],
        ["Coordonnées GPS:", f"{land_data.get('latitude', 'N/A')}, {land_data.get('longitude', 'N/A')}"],
    ]
    
    land_table = Table(land_info, colWidths=[4*cm, 11*cm])
    land_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F7F7F5')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(land_table)
    elements.append(Spacer(1, 20))
    
    # Parties Section
    elements.append(Paragraph("PARTIES IMPLIQUÉES", section_title))
    
    parties_data = [
        ["", "VENDEUR", "ACHETEUR"],
        ["Nom:", seller_data.get('name', 'N/A'), buyer_data.get('name', 'N/A')],
        ["Email:", seller_data.get('email', 'N/A'), buyer_data.get('email', 'N/A')],
        ["Téléphone:", seller_data.get('phone', 'N/A') or 'N/A', buyer_data.get('phone', 'N/A') or 'N/A'],
    ]
    
    parties_table = Table(parties_data, colWidths=[3*cm, 6*cm, 6*cm])
    parties_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#133E26')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F7F7F5')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(parties_table)
    elements.append(Spacer(1, 20))
    
    # Transaction Details Section
    elements.append(Paragraph("DÉTAILS DE LA TRANSACTION", section_title))
    
    txn_date = transaction_data.get('transaction_date')
    if isinstance(txn_date, str):
        txn_date_str = txn_date[:10]
    elif isinstance(txn_date, datetime):
        txn_date_str = txn_date.strftime('%d/%m/%Y')
    else:
        txn_date_str = 'N/A'
    
    txn_info = [
        ["Date de transaction:", txn_date_str],
        ["Statut:", transaction_data.get('status', 'N/A').upper()],
        ["Notes:", transaction_data.get('notes', '-') or '-'],
    ]
    
    txn_table = Table(txn_info, colWidths=[4*cm, 11*cm])
    txn_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F7F7F5')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(txn_table)
    elements.append(Spacer(1, 30))
    
    # Price Section (Highlighted)
    price_data = [
        ["PRIX DE VENTE", f"{transaction_data['price']:,.0f} GNF"],
    ]
    
    price_table = Table(price_data, colWidths=[7.5*cm, 7.5*cm])
    price_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, 0), 14),
        ('FONTSIZE', (1, 0), (1, 0), 18),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#133E26')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor('#D95A2B')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 15),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
    ]))
    elements.append(price_table)
    elements.append(Spacer(1, 40))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#666666'),
        alignment=TA_CENTER
    )
    
    elements.append(Paragraph(
        "Ce document est généré par Guinea Land Hub et constitue une preuve d'enregistrement de transaction.<br/>"
        "Il ne remplace pas les documents officiels requis par la législation guinéenne.<br/><br/>"
        f"Document généré le {datetime.now(timezone.utc).strftime('%d/%m/%Y à %H:%M UTC')}<br/>"
        "Guinea Land Hub - Conakry, République de Guinée",
        footer_style
    ))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer


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
    role: str = "buyer"  # buyer, seller, agent, admin, chef_quartier, chef_secteur, chef_village, maire, prefet, gouverneur
    phone: Optional[str] = None
    address: Optional[str] = None
    picture: Optional[str] = None
    # For administrative roles
    admin_level: Optional[str] = None  # quartier, secteur, village, commune, prefecture, region
    admin_area: Optional[str] = None  # Name of their jurisdiction

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "buyer"
    phone: Optional[str] = None
    admin_level: Optional[str] = None
    admin_area: Optional[str] = None

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
    admin_level: Optional[str] = None
    admin_area: Optional[str] = None
    rating_average: Optional[float] = None
    rating_count: Optional[int] = None
    created_at: datetime

class LandBase(BaseModel):
    title: str
    description: str
    price: float
    size: float  # in square meters
    region: str
    prefecture: Optional[str] = None
    commune: str
    quartier: Optional[str] = None
    secteur: Optional[str] = None
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
    prefecture: Optional[str] = None
    commune: Optional[str] = None
    quartier: Optional[str] = None
    secteur: Optional[str] = None
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
    owner_phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    verified: bool = False
    verification_level: Optional[str] = None
    verifications: Optional[List[dict]] = None
    price_per_m2: Optional[float] = None

# ==================== NEW MODELS FOR FEATURES ====================

class ReviewCreate(BaseModel):
    transaction_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    review_id: str
    transaction_id: str
    reviewer_id: str
    reviewer_name: str
    reviewed_id: str
    reviewed_name: str
    review_type: str  # buyer_reviewing_seller, seller_reviewing_buyer
    rating: int
    comment: Optional[str] = None
    status: str = "approved"
    created_at: datetime

class NeighborhoodPriceCreate(BaseModel):
    region: str
    commune: str
    quartier: Optional[str] = None
    secteur: Optional[str] = None
    land_type: str = "residential"
    price_per_m2_min: float
    price_per_m2_max: float
    price_per_m2_avg: float

class NeighborhoodPriceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    price_id: str
    region: str
    commune: str
    quartier: Optional[str] = None
    secteur: Optional[str] = None
    land_type: str
    price_per_m2_min: float
    price_per_m2_max: float
    price_per_m2_avg: float
    sample_size: int = 0
    last_updated: datetime
    updated_by: Optional[str] = None

class FeedbackCreate(BaseModel):
    type: str = "suggestion"  # suggestion, bug, complaint, other
    category: str = "general"  # ui, map, transactions, general
    title: str
    description: str
    user_email: Optional[str] = None

class FeedbackResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    feedback_id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    type: str
    category: str
    title: str
    description: str
    status: str = "new"
    priority: str = "medium"
    admin_notes: Optional[str] = None
    created_at: datetime

class VerificationRequest(BaseModel):
    notes: Optional[str] = None

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
    owner_ids = list(set(land["owner_id"] for land in lands))
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
    
    # Get full user info for emails and response
    buyer = await db.users.find_one({"user_id": transaction.buyer_id}, {"_id": 0})
    seller = await db.users.find_one({"user_id": seller_id}, {"_id": 0})
    
    # Prepare transaction data with names for emails
    transaction_with_names = {
        **transaction_doc,
        "buyer_name": buyer["name"] if buyer else "N/A",
        "seller_name": seller["name"] if seller else "N/A"
    }
    
    # Send email notifications (non-blocking)
    if buyer and buyer.get("email"):
        asyncio.create_task(send_transaction_email(
            recipient_email=buyer["email"],
            recipient_name=buyer["name"],
            transaction_type="buyer",
            transaction_data=transaction_with_names,
            land_data=land
        ))
    
    if seller and seller.get("email"):
        asyncio.create_task(send_transaction_email(
            recipient_email=seller["email"],
            recipient_name=seller["name"],
            transaction_type="seller",
            transaction_data=transaction_with_names,
            land_data=land
        ))
    
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


@api_router.get("/transactions/{transaction_id}/pdf")
async def download_transaction_pdf(transaction_id: str, request: Request):
    """Download PDF receipt for a transaction"""
    user = await get_current_user(request)
    
    # Get transaction
    transaction = await db.transactions.find_one({"transaction_id": transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Check access
    if user.get("role") != "admin":
        if transaction["buyer_id"] != user["user_id"] and transaction["seller_id"] != user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get related data
    land = await db.lands.find_one({"land_id": transaction["land_id"]}, {"_id": 0})
    buyer = await db.users.find_one({"user_id": transaction["buyer_id"]}, {"_id": 0, "password_hash": 0})
    seller = await db.users.find_one({"user_id": transaction["seller_id"]}, {"_id": 0, "password_hash": 0})
    
    if not land or not buyer or not seller:
        raise HTTPException(status_code=404, detail="Transaction data incomplete")
    
    # Generate PDF
    pdf_buffer = generate_transaction_pdf(transaction, land, buyer, seller)
    
    filename = f"transaction_{transaction_id}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


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
    except Exception:
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
    admin_level = body.get("admin_level")
    admin_area = body.get("admin_area")
    
    valid_roles = ["buyer", "seller", "agent", "admin", "chef_quartier", "chef_secteur", "chef_village", "maire", "prefet", "gouverneur"]
    if new_role not in valid_roles:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    update_data = {"role": new_role}
    if admin_level:
        update_data["admin_level"] = admin_level
    if admin_area:
        update_data["admin_area"] = admin_area
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User role updated", "user_id": user_id, "new_role": new_role}


# ==================== MULTI-LEVEL VERIFICATION SYSTEM ====================

ADMIN_ROLES = ["chef_quartier", "chef_secteur", "chef_village", "maire", "prefet", "gouverneur", "admin"]
VERIFICATION_HIERARCHY = {
    "chef_quartier": "quartier",
    "chef_secteur": "secteur", 
    "chef_village": "village",
    "maire": "commune",
    "prefet": "prefecture",
    "gouverneur": "region",
    "admin": "platform"
}

@api_router.post("/lands/{land_id}/verify")
async def verify_land_multilevel(land_id: str, request: Request):
    """Verify a land listing (administrative users only)"""
    user = await get_current_user(request)
    user_role = user.get("role")
    
    if user_role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Seuls les utilisateurs administratifs peuvent vérifier les terrains")
    
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    notes = body.get("notes", "")
    
    # Get the land
    land = await db.lands.find_one({"land_id": land_id}, {"_id": 0})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    # Determine verification level
    verification_level = VERIFICATION_HIERARCHY.get(user_role, "unknown")
    
    # Create verification record
    verification_record = {
        "verified_by": user["user_id"],
        "verifier_name": user.get("name", ""),
        "verifier_role": user_role,
        "verification_level": verification_level,
        "admin_area": user.get("admin_area", ""),
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "notes": notes
    }
    
    # Update land with verification
    existing_verifications = land.get("verifications", [])
    existing_verifications.append(verification_record)
    
    await db.lands.update_one(
        {"land_id": land_id},
        {
            "$set": {
                "verified": True,
                "verification_level": verification_level,
                "verifications": existing_verifications,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "message": "Terrain vérifié avec succès",
        "land_id": land_id,
        "verification_level": verification_level,
        "verifier": user.get("name"),
        "verifier_role": user_role
    }

@api_router.get("/lands/{land_id}/verifications")
async def get_land_verifications(land_id: str):
    """Get all verifications for a land"""
    land = await db.lands.find_one({"land_id": land_id}, {"_id": 0, "verifications": 1, "verified": 1, "verification_level": 1})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    return {
        "land_id": land_id,
        "verified": land.get("verified", False),
        "verification_level": land.get("verification_level"),
        "verifications": land.get("verifications", [])
    }


# ==================== RATINGS & REVIEWS SYSTEM ====================

@api_router.post("/reviews", response_model=ReviewResponse)
async def create_review(review_data: ReviewCreate, request: Request):
    """Create a review for a completed transaction"""
    user = await get_current_user(request)
    
    # Get the transaction
    transaction = await db.transactions.find_one(
        {"transaction_id": review_data.transaction_id},
        {"_id": 0}
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")
    
    if transaction.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Seules les transactions complétées peuvent être évaluées")
    
    # Determine who is reviewing whom
    reviewer_id = user["user_id"]
    if reviewer_id == transaction["buyer_id"]:
        review_type = "buyer_reviewing_seller"
        reviewed_id = transaction["seller_id"]
        reviewed_name = transaction.get("seller_name", "")
    elif reviewer_id == transaction["seller_id"]:
        review_type = "seller_reviewing_buyer"
        reviewed_id = transaction["buyer_id"]
        reviewed_name = transaction.get("buyer_name", "")
    else:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas partie à cette transaction")
    
    # Check if already reviewed
    existing_review = await db.reviews.find_one({
        "transaction_id": review_data.transaction_id,
        "reviewer_id": reviewer_id
    })
    if existing_review:
        raise HTTPException(status_code=400, detail="Vous avez déjà évalué cette transaction")
    
    # Create review
    review_id = f"review_{uuid.uuid4().hex[:12]}"
    review_doc = {
        "review_id": review_id,
        "transaction_id": review_data.transaction_id,
        "reviewer_id": reviewer_id,
        "reviewer_name": user.get("name", ""),
        "reviewed_id": reviewed_id,
        "reviewed_name": reviewed_name,
        "review_type": review_type,
        "rating": review_data.rating,
        "comment": review_data.comment,
        "status": "approved",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Update user's average rating
    all_reviews = await db.reviews.find({"reviewed_id": reviewed_id, "status": "approved"}).to_list(1000)
    if all_reviews:
        avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
        await db.users.update_one(
            {"user_id": reviewed_id},
            {"$set": {"rating_average": round(avg_rating, 2), "rating_count": len(all_reviews)}}
        )
    
    return ReviewResponse(**{k: v for k, v in review_doc.items() if k != "_id"})

@api_router.get("/reviews/user/{user_id}")
async def get_user_reviews(user_id: str, limit: int = Query(default=20, le=100)):
    """Get reviews for a user"""
    reviews = await db.reviews.find(
        {"reviewed_id": user_id, "status": "approved"},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "rating_average": 1, "rating_count": 1, "name": 1})
    
    return {
        "user_id": user_id,
        "user_name": user.get("name") if user else None,
        "rating_average": user.get("rating_average", 0) if user else 0,
        "rating_count": user.get("rating_count", 0) if user else 0,
        "reviews": reviews
    }

@api_router.get("/reviews/transaction/{transaction_id}")
async def get_transaction_reviews(transaction_id: str):
    """Get reviews for a transaction"""
    reviews = await db.reviews.find(
        {"transaction_id": transaction_id},
        {"_id": 0}
    ).to_list(10)
    
    return {"transaction_id": transaction_id, "reviews": reviews}


# ==================== NEIGHBORHOOD PRICING SYSTEM ====================

@api_router.get("/prices/neighborhood")
async def get_neighborhood_prices(
    region: Optional[str] = None,
    commune: Optional[str] = None,
    quartier: Optional[str] = None,
    land_type: Optional[str] = None
):
    """Get reference prices per square meter by neighborhood"""
    query = {}
    if region:
        query["region"] = region
    if commune:
        query["commune"] = commune
    if quartier:
        query["quartier"] = quartier
    if land_type:
        query["land_type"] = land_type
    
    prices = await db.neighborhood_prices.find(query, {"_id": 0}).to_list(100)
    return prices

@api_router.post("/prices/neighborhood", response_model=NeighborhoodPriceResponse)
async def create_neighborhood_price(price_data: NeighborhoodPriceCreate, request: Request):
    """Create or update neighborhood price reference (admin only)"""
    user = await get_current_user(request)
    
    if user.get("role") not in ["admin", "maire", "prefet", "gouverneur"]:
        raise HTTPException(status_code=403, detail="Seuls les administrateurs peuvent définir les prix de référence")
    
    # Check if price exists for this location
    existing = await db.neighborhood_prices.find_one({
        "region": price_data.region,
        "commune": price_data.commune,
        "quartier": price_data.quartier,
        "secteur": price_data.secteur,
        "land_type": price_data.land_type
    })
    
    if existing:
        # Update existing
        await db.neighborhood_prices.update_one(
            {"price_id": existing["price_id"]},
            {
                "$set": {
                    "price_per_m2_min": price_data.price_per_m2_min,
                    "price_per_m2_max": price_data.price_per_m2_max,
                    "price_per_m2_avg": price_data.price_per_m2_avg,
                    "last_updated": datetime.now(timezone.utc),
                    "updated_by": user["user_id"]
                }
            }
        )
        price_id = existing["price_id"]
    else:
        # Create new
        price_id = f"price_{uuid.uuid4().hex[:12]}"
        price_doc = {
            "price_id": price_id,
            "region": price_data.region,
            "commune": price_data.commune,
            "quartier": price_data.quartier,
            "secteur": price_data.secteur,
            "land_type": price_data.land_type,
            "price_per_m2_min": price_data.price_per_m2_min,
            "price_per_m2_max": price_data.price_per_m2_max,
            "price_per_m2_avg": price_data.price_per_m2_avg,
            "sample_size": 0,
            "last_updated": datetime.now(timezone.utc),
            "updated_by": user["user_id"],
            "created_at": datetime.now(timezone.utc)
        }
        await db.neighborhood_prices.insert_one(price_doc)
    
    # Fetch and return
    result = await db.neighborhood_prices.find_one({"price_id": price_id}, {"_id": 0})
    return NeighborhoodPriceResponse(**result)

@api_router.get("/prices/compare/{land_id}")
async def compare_land_price(land_id: str):
    """Compare a land's price per m² with neighborhood reference"""
    land = await db.lands.find_one({"land_id": land_id}, {"_id": 0})
    if not land:
        raise HTTPException(status_code=404, detail="Terrain non trouvé")
    
    # Calculate land's price per m²
    land_price_per_m2 = land["price"] / land["size"] if land["size"] > 0 else 0
    
    # Find neighborhood reference price
    ref_price = await db.neighborhood_prices.find_one({
        "region": land.get("region"),
        "commune": land.get("commune"),
        "land_type": land.get("land_type", "residential")
    }, {"_id": 0})
    
    if not ref_price:
        # Try just region
        ref_price = await db.neighborhood_prices.find_one({
            "region": land.get("region"),
            "land_type": land.get("land_type", "residential")
        }, {"_id": 0})
    
    comparison = {
        "land_id": land_id,
        "land_price": land["price"],
        "land_size": land["size"],
        "land_price_per_m2": round(land_price_per_m2, 2),
        "reference_available": ref_price is not None
    }
    
    if ref_price:
        comparison["reference"] = {
            "price_per_m2_min": ref_price["price_per_m2_min"],
            "price_per_m2_max": ref_price["price_per_m2_max"],
            "price_per_m2_avg": ref_price["price_per_m2_avg"]
        }
        
        avg_ref = ref_price["price_per_m2_avg"]
        if avg_ref > 0:
            diff_percent = ((land_price_per_m2 - avg_ref) / avg_ref) * 100
            comparison["price_assessment"] = {
                "difference_percent": round(diff_percent, 1),
                "status": "above_market" if diff_percent > 15 else ("below_market" if diff_percent < -15 else "fair_market")
            }
    
    return comparison


# ==================== FEEDBACK & SUGGESTIONS SYSTEM ====================

@api_router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(feedback_data: FeedbackCreate, request: Request):
    """Submit feedback or suggestion (can be anonymous)"""
    user = await get_optional_user(request)
    
    feedback_id = f"feedback_{uuid.uuid4().hex[:12]}"
    feedback_doc = {
        "feedback_id": feedback_id,
        "user_id": user["user_id"] if user else None,
        "user_name": user.get("name") if user else None,
        "user_email": feedback_data.user_email or (user.get("email") if user else None),
        "type": feedback_data.type,
        "category": feedback_data.category,
        "title": feedback_data.title,
        "description": feedback_data.description,
        "status": "new",
        "priority": "medium",
        "admin_notes": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.feedback.insert_one(feedback_doc)
    
    return FeedbackResponse(**{k: v for k, v in feedback_doc.items() if k != "_id"})

@api_router.get("/feedback")
async def get_feedback(
    request: Request,
    type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=50, le=100)
):
    """Get feedback (admin sees all, users see their own)"""
    user = await get_optional_user(request)
    
    query = {}
    if user and user.get("role") != "admin":
        query["user_id"] = user["user_id"]
    
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    
    feedback_list = await db.feedback.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return feedback_list

@api_router.put("/feedback/{feedback_id}")
async def update_feedback(feedback_id: str, request: Request):
    """Update feedback status (admin only)"""
    user = await get_current_user(request)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    body = await request.json()
    
    update_data = {}
    if "status" in body:
        update_data["status"] = body["status"]
    if "priority" in body:
        update_data["priority"] = body["priority"]
    if "admin_notes" in body:
        update_data["admin_notes"] = body["admin_notes"]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.feedback.update_one(
        {"feedback_id": feedback_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return {"message": "Feedback updated", "feedback_id": feedback_id}


# ==================== ADMIN STATISTICS ENHANCED ====================

@api_router.get("/admin/feedback-stats")
async def get_feedback_stats(request: Request):
    """Get feedback statistics (admin only)"""
    user = await get_current_user(request)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Count by status
    new_count = await db.feedback.count_documents({"status": "new"})
    in_progress_count = await db.feedback.count_documents({"status": "in_progress"})
    resolved_count = await db.feedback.count_documents({"status": "resolved"})
    
    # Count by type
    suggestions = await db.feedback.count_documents({"type": "suggestion"})
    bugs = await db.feedback.count_documents({"type": "bug"})
    complaints = await db.feedback.count_documents({"type": "complaint"})
    
    return {
        "by_status": {
            "new": new_count,
            "in_progress": in_progress_count,
            "resolved": resolved_count
        },
        "by_type": {
            "suggestions": suggestions,
            "bugs": bugs,
            "complaints": complaints
        },
        "total": new_count + in_progress_count + resolved_count
    }


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

"""
Configuration settings for Guinea Land Hub API
"""
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET') or 'guinea-land-secret-key-2024'
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# Object Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "guinea-land-hub"

# Email (Resend)
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL") or "noreply@guinealandhub.com"

# Twilio SMS
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")

# Frontend URL
FRONTEND_URL = os.environ.get("FRONTEND_URL") or os.environ.get("REACT_APP_BACKEND_URL", "").replace("/api", "") or "https://guinealandhub.com"

# CORS
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

# MIME Types
MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp", "pdf": "application/pdf",
    "json": "application/json", "csv": "text/csv", "txt": "text/plain"
}

# Guinea Regions
GUINEA_REGIONS = [
    {"code": "CKY", "name": "Conakry", "center": [-13.6773, 9.6412]},
    {"code": "KND", "name": "Kindia", "center": [-12.8566, 10.0566]},
    {"code": "BOK", "name": "Boké", "center": [-14.2833, 10.9333]},
    {"code": "MAM", "name": "Mamou", "center": [-12.0833, 10.3833]},
    {"code": "LAB", "name": "Labé", "center": [-12.2833, 11.3167]},
    {"code": "FAR", "name": "Faranah", "center": [-10.7333, 10.0333]},
    {"code": "KAN", "name": "Kankan", "center": [-9.3000, 10.3833]},
    {"code": "NZR", "name": "N'Zérékoré", "center": [-8.8167, 7.7500]},
]

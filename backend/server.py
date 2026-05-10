"""
Guinea Land Hub API - Main Server
Refactored modular architecture
"""
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import logging

from config import CORS_ORIGINS
from database import db, close_db
from utils.storage import init_storage

# Import all routers
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.lands import router as lands_router
from routes.transactions import router as transactions_router
from routes.admin import router as admin_router
from routes.files import router as files_router
from routes.stats import router as stats_router
from routes.alerts import router as alerts_router
from routes.trust import router as trust_router
from routes.security import router as security_router
from routes.analytics import router as analytics_router
from routes.ai import router as ai_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(
    title="Guinea Land Hub API",
    description="API for land transactions in Guinea",
    version="2.0.0"
)

# Include all routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(lands_router, prefix="/api")
app.include_router(transactions_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(files_router, prefix="/api")
app.include_router(stats_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(trust_router, prefix="/api")
app.include_router(security_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(ai_router, prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        init_storage()
        logger.info("Server started successfully")
    except Exception as e:
        logger.error(f"Startup error: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await close_db()
    logger.info("Server shutdown complete")

"""Object Storage utilities"""
import httpx
import logging
from config import STORAGE_URL, EMERGENT_KEY, APP_NAME

logger = logging.getLogger(__name__)

storage_key = None

def init_storage():
    """Initialize object storage"""
    global storage_key
    if not EMERGENT_KEY:
        logger.warning("EMERGENT_LLM_KEY not set - object storage disabled")
        return
    
    try:
        resp = httpx.post(
            f"{STORAGE_URL}/get_or_create_key",
            headers={"Authorization": f"Bearer {EMERGENT_KEY}"},
            json={"app_name": APP_NAME},
            timeout=30
        )
        if resp.status_code == 200:
            storage_key = resp.json().get("storage_key")
            logger.info("Object storage initialized successfully")
        else:
            logger.error(f"Failed to initialize storage: {resp.text}")
    except Exception as e:
        logger.error(f"Storage initialization error: {e}")

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload object to storage"""
    if not storage_key:
        raise Exception("Storage not initialized")
    
    resp = httpx.put(
        f"{STORAGE_URL}/object/{path}",
        headers={
            "Authorization": f"Bearer {storage_key}",
            "Content-Type": content_type
        },
        content=data,
        timeout=60
    )
    return resp.json() if resp.status_code == 200 else {"error": resp.text}

def get_object(path: str) -> tuple:
    """Get object from storage"""
    if not storage_key:
        raise Exception("Storage not initialized")
    
    resp = httpx.get(
        f"{STORAGE_URL}/object/{path}",
        headers={"Authorization": f"Bearer {storage_key}"},
        timeout=30
    )
    return resp.content, resp.headers.get("content-type", "application/octet-stream")

def get_storage_key():
    """Get current storage key"""
    return storage_key

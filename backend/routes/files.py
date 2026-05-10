"""File upload and storage routes"""
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import Response
from datetime import datetime, timezone
import uuid

from database import db
from utils.auth import get_current_user
from utils.storage import put_object, get_object, get_storage_key
from config import MIME_TYPES

router = APIRouter(tags=["Files"])

@router.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    file_type: str = "photo"
):
    """Upload a file"""
    user = await get_current_user(request)
    
    if not get_storage_key():
        raise HTTPException(status_code=503, detail="Service de stockage non disponible")
    
    # Validate file
    max_size = 10 * 1024 * 1024  # 10MB
    content = await file.read()
    
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 10MB)")
    
    # Get extension and content type
    ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else ""
    
    allowed_types = {
        "photo": ["jpg", "jpeg", "png", "gif", "webp"],
        "document": ["pdf", "jpg", "jpeg", "png"]
    }
    
    if ext not in allowed_types.get(file_type, []):
        raise HTTPException(status_code=400, detail=f"Type de fichier non autorisé pour {file_type}")
    
    content_type = MIME_TYPES.get(ext, "application/octet-stream")
    
    # Generate unique file ID
    file_id = str(uuid.uuid4())
    path = f"files/{file_id}.{ext}"
    
    # Upload to storage
    result = put_object(path, content, content_type)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail="Erreur lors du téléchargement")
    
    # Store metadata
    file_record = {
        "file_id": file_id,
        "original_filename": file.filename,
        "path": path,
        "content_type": content_type,
        "size": len(content),
        "uploaded_by": user["user_id"],
        "file_type": file_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.files.insert_one(file_record)
    
    return {
        "file_id": file_id,
        "original_filename": file.filename,
        "content_type": content_type,
        "size": len(content)
    }

@router.get("/files/{file_id}")
async def get_file(file_id: str):
    """Get a file by ID"""
    file_record = await db.files.find_one({"file_id": file_id})
    
    if not file_record:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    if not get_storage_key():
        raise HTTPException(status_code=503, detail="Service de stockage non disponible")
    
    try:
        content, content_type = get_object(file_record["path"])
        
        return Response(
            content=content,
            media_type=content_type,
            headers={
                "Content-Disposition": f"inline; filename=\"{file_record.get('original_filename', 'file')}\""
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération du fichier")

@router.delete("/files/{file_id}")
async def delete_file(file_id: str, request: Request):
    """Delete a file"""
    user = await get_current_user(request)
    
    file_record = await db.files.find_one({"file_id": file_id})
    
    if not file_record:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    if file_record["uploaded_by"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.files.delete_one({"file_id": file_id})
    
    return {"message": "Fichier supprimé"}

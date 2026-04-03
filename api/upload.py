"""
upload.py — Manshot
Serviço de upload de anexos.
Imagens seguem para o ImgBB e outros arquivos ficam em /uploads.
"""

import base64
import httpx
from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from core.config import settings
from core.auth import get_current_user

router = APIRouter(
    prefix="/upload",
    tags=["Upload"],
    dependencies=[Depends(get_current_user)],
)


UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".csv",
    ".txt",
    ".zip",
    ".rar",
}

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB


async def upload_to_imgbb(image_bytes: bytes) -> str:
    """
    Envia uma imagem para o ImgBB e retorna a URL pública.
    """
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.imgbb.com/1/upload",
            data={
                "key": settings.IMGBB_API_KEY,
                "image": image_b64,
            },
            timeout=30,
        )

    data = response.json()

    if not data.get("success"):
        raise HTTPException(status_code=400, detail="Erro ao fazer upload da imagem")

    return data["data"]["display_url"]


@router.post("/file")
async def upload_file(request: Request, file: UploadFile = File(...)):
    """
    Endpoint para upload de arquivo.
    - Imagens: ImgBB (URL pública)
    - Outros tipos permitidos: armazenamento local em /uploads
    """
    filename = (file.filename or "arquivo").strip()
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Tipo de arquivo não permitido",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Arquivo excede o limite de 15MB",
        )

    if (
        extension in IMAGE_EXTENSIONS
        and file.content_type
        and file.content_type.startswith("image/")
    ):
        url = await upload_to_imgbb(file_bytes)
        return {
            "url": url,
            "filename": filename,
            "kind": "image",
        }

    generated_name = f"{uuid4().hex}{extension}"
    saved_path = UPLOADS_DIR / generated_name
    saved_path.write_bytes(file_bytes)

    url = f"{request.base_url}uploads/{generated_name}"
    return {
        "url": url,
        "filename": filename,
        "kind": "file",
    }


@router.post("/image")
async def upload_image_legacy(request: Request, file: UploadFile = File(...)):
    """Compatibilidade com clients antigos que chamam /upload/image."""
    return await upload_file(request=request, file=file)

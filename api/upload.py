"""
upload.py — Manshot
Serviço de upload de anexos.
Imagens seguem para o ImgBB e outros arquivos ficam em /uploads.
"""

import base64
import httpx
import re
import unicodedata
from pathlib import Path
from uuid import uuid4
from urllib.parse import quote
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from core.config import settings
from core.auth import get_current_user

router = APIRouter(
    prefix="/upload",
    tags=["Upload"],
    dependencies=[Depends(get_current_user)],
)


UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"
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


def _sanitize_filename(filename: str) -> str:
    """Normaliza nome para armazenamento seguro sem perder legibilidade."""
    base = Path(filename or "arquivo").name.strip()
    if not base:
        base = "arquivo"

    normalized = unicodedata.normalize("NFKD", base)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    safe = re.sub(r"\s+", "_", ascii_name)
    safe = re.sub(r"[^A-Za-z0-9._-]", "", safe)
    safe = safe.strip("._") or "arquivo"

    # Evita nome enorme no filesystem.
    if len(safe) > 120:
        stem = Path(safe).stem[:100] or "arquivo"
        suffix = Path(safe).suffix[:20]
        safe = f"{stem}{suffix}"

    return safe


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
    original_filename = (file.filename or "arquivo").strip()
    extension = Path(original_filename).suffix.lower()

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
            "filename": original_filename,
            "kind": "image",
        }

    safe_filename = _sanitize_filename(original_filename)
    generated_name = f"{uuid4().hex[:8]}_{safe_filename}"
    saved_path = UPLOADS_DIR / generated_name
    saved_path.write_bytes(file_bytes)

    encoded_name = quote(generated_name)
    url = f"{request.base_url}uploads/{encoded_name}"
    return {
        "url": url,
        "filename": original_filename,
        "kind": "file",
    }


@router.post("/image")
async def upload_image_legacy(request: Request, file: UploadFile = File(...)):
    """Compatibilidade com clients antigos que chamam /upload/image."""
    return await upload_file(request=request, file=file)

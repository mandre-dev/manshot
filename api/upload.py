"""
upload.py — Manshot
Serviço de upload de imagens via ImgBB.
Recebe uma imagem, envia para o ImgBB e retorna a URL pública.
"""

import httpx
import base64
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from core.config import settings
from core.auth import get_current_user

router = APIRouter(
    prefix="/upload",
    tags=["Upload"],
    dependencies=[Depends(get_current_user)],
)


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
            timeout=30
        )

    data = response.json()

    if not data.get("success"):
        raise HTTPException(status_code=400, detail="Erro ao fazer upload da imagem")

    return data["data"]["display_url"]


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """
    Endpoint para upload de imagem.
    Recebe um arquivo e retorna a URL pública no ImgBB.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")

    image_bytes = await file.read()
    url = await upload_to_imgbb(image_bytes)

    return {"url": url}

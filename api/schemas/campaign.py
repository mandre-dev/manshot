"""
schemas/campaign.py — Manshot
Define o formato dos dados de campanha que a API aceita e retorna.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from api.models.campaign import StatusEnum


class CampaignCreate(BaseModel):
    """Dados necessários para criar uma campanha."""

    name: str
    email_subject: Optional[str] = None
    sms_from: Optional[str] = None
    message: str
    image_url: Optional[str] = None
    use_email: bool = False
    use_sms: bool = False
    use_telegram: bool = False


class CampaignResponse(BaseModel):
    """Dados retornados pela API ao consultar uma campanha."""

    id: int
    name: str
    email_subject: Optional[str] = None
    sms_from: Optional[str] = None
    message: str
    image_url: Optional[str] = None
    use_email: bool
    use_sms: bool
    use_telegram: bool
    status: StatusEnum
    total: int
    success: int
    failed: int
    created_at: datetime

    class Config:
        from_attributes = True

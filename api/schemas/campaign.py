"""
schemas/campaign.py — Manshot
Define o formato dos dados de campanha que a API aceita e retorna.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from api.models.campaign import StatusEnum


class AttachmentItem(BaseModel):
    url: str
    filename: str
    kind: Optional[str] = None


class CampaignCreate(BaseModel):
    """Dados necessários para criar uma campanha."""

    name: str
    email_subject: Optional[str] = None
    sms_from: Optional[str] = None
    telegram_signature: Optional[str] = None
    message: str
    image_url: Optional[str] = None
    attachments: list[AttachmentItem] = Field(default_factory=list)
    use_email: bool = False
    use_sms: bool = False
    use_telegram: bool = False


class CampaignResponse(BaseModel):
    """Dados retornados pela API ao consultar uma campanha."""

    id: int
    name: str
    email_subject: Optional[str] = None
    sms_from: Optional[str] = None
    telegram_signature: Optional[str] = None
    message: str
    image_url: Optional[str] = None
    attachments: list[AttachmentItem] = Field(default_factory=list)
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


class CampaignSendRequest(BaseModel):
    """Payload para disparo de campanha com filtros e intervalo."""

    ids: Optional[list[int]] = None
    interval_seconds: float = Field(default=0, ge=0)

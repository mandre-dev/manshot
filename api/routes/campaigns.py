"""
routes/campaigns.py — Manshot
Endpoints para gerenciar e disparar campanhas.
Agora o disparo é assíncrono via Celery com suporte a imagem.
"""

from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api.models.campaign import Campaign, StatusEnum
from api.models.contact import Contact
from api.schemas.campaign import (
    CampaignCreate,
    CampaignPinRequest,
    CampaignResponse,
    CampaignSendRequest,
)
from api.tasks import dispatch_campaign
from typing import List
from core.auth import get_current_user

router = APIRouter(
    prefix="/campaigns",
    tags=["Campanhas"],
    dependencies=[Depends(get_current_user)],
)


IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg")


def _attachment_filename_from_url(url: str) -> str:
    return Path(urlparse(url or "").path).name or "anexo"


def _is_image_url(url: str) -> bool:
    if not url:
        return False

    return url.lower().split("?")[0].endswith(IMAGE_EXTENSIONS)


def _normalize_attachments(payload: CampaignCreate) -> list[dict]:
    attachments = [item.model_dump() for item in payload.attachments]
    if attachments:
        return attachments

    if payload.image_url:
        return [
            {
                "url": payload.image_url,
                "filename": _attachment_filename_from_url(payload.image_url),
                "kind": "image" if _is_image_url(payload.image_url) else "file",
            }
        ]

    return []


def _release_stale_running_campaign(campaign: Campaign) -> bool:
    if campaign.status == StatusEnum.running and not (campaign.task_id or "").strip():
        campaign.status = StatusEnum.pending
        return True
    return False


@router.post("/", response_model=CampaignResponse)
def create_campaign(
    campaign: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Cria uma nova campanha."""
    owner_email = current_user.strip().lower()
    campaign_data = campaign.model_dump()
    attachments = _normalize_attachments(campaign)
    campaign_data["attachments"] = attachments
    campaign_data["image_url"] = (
        attachments[0]["url"] if attachments else campaign_data.get("image_url")
    )
    db_campaign = Campaign(owner_email=owner_email, **campaign_data)
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign


@router.get("/", response_model=List[CampaignResponse])
def list_campaigns(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Lista todas as campanhas."""
    owner_email = current_user.strip().lower()
    campaigns = db.query(Campaign).filter(Campaign.owner_email == owner_email).all()
    changed = False
    for campaign in campaigns:
        changed = _release_stale_running_campaign(campaign) or changed

    if changed:
        db.commit()

    return campaigns


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Busca uma campanha pelo ID."""
    owner_email = current_user.strip().lower()
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.owner_email == owner_email)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    if _release_stale_running_campaign(campaign):
        db.commit()
        db.refresh(campaign)
    return campaign


@router.post("/{campaign_id}/send", response_model=CampaignResponse)
def send_campaign(
    campaign_id: int,
    payload: CampaignSendRequest | None = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    Enfileira a campanha para disparo assíncrono.
    Responde imediatamente com status 'running'.
    O Celery processa em background com suporte a imagem.

    Se contact_ids for fornecido, usa apenas esses contatos.
    Caso contrário, usa todos os contatos.
    """
    owner_email = current_user.strip().lower()
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.owner_email == owner_email)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")

    if _release_stale_running_campaign(campaign):
        db.commit()
        db.refresh(campaign)

    if campaign.status == StatusEnum.running:
        raise HTTPException(status_code=400, detail="Campanha já está em execução")

    # Se ids foi fornecido, usa apenas esses contatos
    if payload and payload.ids is not None:
        if len(payload.ids) == 0:
            raise HTTPException(status_code=400, detail="Nenhum contato selecionado")
        contacts = (
            db.query(Contact)
            .filter(
                Contact.owner_email == owner_email,
                Contact.id.in_(payload.ids),
            )
            .all()
        )
    else:
        contacts = db.query(Contact).filter(Contact.owner_email == owner_email).all()

    if not contacts:
        raise HTTPException(status_code=400, detail="Nenhum contato selecionado")

    contacts_data = [
        {
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "telegram_id": c.telegram_id,
        }
        for c in contacts
    ]

    campaign.status = StatusEnum.running
    db.commit()
    db.refresh(campaign)

    # SMTP customizado: repassa se vier no payload, senão None
    smtp_kwargs = {}
    if payload:
        for field in [
            "email_smtp_host",
            "email_smtp_port",
            "email_user",
            "email_password",
            "email_from_name",
        ]:
            value = getattr(payload, field, None)
            if value is not None:
                smtp_kwargs[field] = value

    async_result = dispatch_campaign.delay(
        campaign_id=campaign.id,
        owner_email=owner_email,
        contacts=contacts_data,
        message=campaign.message,
        use_email=campaign.use_email,
        use_sms=campaign.use_sms,
        use_telegram=campaign.use_telegram,
        image_url=campaign.image_url,
        attachments=campaign.attachments
        or (
            [
                {
                    "url": campaign.image_url,
                    "filename": _attachment_filename_from_url(campaign.image_url),
                    "kind": "image" if _is_image_url(campaign.image_url) else "file",
                }
            ]
            if campaign.image_url
            else []
        ),
        email_subject=campaign.email_subject,
        sms_from=campaign.sms_from,
        telegram_signature=campaign.telegram_signature,
        interval_seconds=payload.interval_seconds if payload else 0,
        **smtp_kwargs,
    )

    campaign.task_id = async_result.id
    db.commit()
    db.refresh(campaign)

    return campaign


@router.delete("/{campaign_id}")
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Remove uma campanha."""
    owner_email = current_user.strip().lower()
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.owner_email == owner_email)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    db.delete(campaign)
    db.commit()
    return {"message": "Campanha removida com sucesso"}


@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: int,
    data: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Atualiza uma campanha."""
    owner_email = current_user.strip().lower()
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.owner_email == owner_email)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    _release_stale_running_campaign(campaign)
    for key, value in data.model_dump().items():
        setattr(campaign, key, value)
    attachments = _normalize_attachments(data)
    campaign.attachments = attachments
    campaign.image_url = attachments[0]["url"] if attachments else data.image_url
    db.commit()
    db.refresh(campaign)
    return campaign


@router.post("/{campaign_id}/reset", response_model=CampaignResponse)
def reset_campaign_status(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Destrava uma campanha presa em running e a devolve para pending."""
    owner_email = current_user.strip().lower()
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.owner_email == owner_email)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")

    campaign.status = StatusEnum.pending
    db.commit()
    db.refresh(campaign)
    return campaign


@router.post("/{campaign_id}/pin", response_model=CampaignResponse)
def pin_campaign(
    campaign_id: int,
    payload: CampaignPinRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Fixa ou desafixa campanha no topo da fila."""
    owner_email = current_user.strip().lower()
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.owner_email == owner_email)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")

    campaign.pinned = bool(payload.pinned)
    db.commit()
    db.refresh(campaign)
    return campaign

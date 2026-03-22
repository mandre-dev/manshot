"""
routes/campaigns.py — Manshot
Endpoints para gerenciar e disparar campanhas.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api.models.campaign import Campaign, StatusEnum
from api.models.contact import Contact
from api.schemas.campaign import CampaignCreate, CampaignResponse
from core import EmailChannel, SMSChannel, TelegramChannel
from core.base import Contact as CoreContact
from typing import List

router = APIRouter(prefix="/campaigns", tags=["Campanhas"])


@router.post("/", response_model=CampaignResponse)
def create_campaign(campaign: CampaignCreate, db: Session = Depends(get_db)):
    """Cria uma nova campanha."""
    db_campaign = Campaign(**campaign.model_dump())
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign


@router.get("/", response_model=List[CampaignResponse])
def list_campaigns(db: Session = Depends(get_db)):
    """Lista todas as campanhas."""
    return db.query(Campaign).all()


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Busca uma campanha pelo ID."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    return campaign


@router.post("/{campaign_id}/send", response_model=CampaignResponse)
def send_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Dispara uma campanha para todos os contatos."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")

    if campaign.status == StatusEnum.running:
        raise HTTPException(status_code=400, detail="Campanha já está em execução")

    contacts = db.query(Contact).all()
    if not contacts:
        raise HTTPException(status_code=400, detail="Nenhum contato cadastrado")

    # Atualiza status para running
    campaign.status = StatusEnum.running
    db.commit()

    total = 0
    success = 0
    failed = 0

    for contact in contacts:
        # Disparo via Email
        if campaign.use_email and contact.email:
            core_contact = CoreContact(name=contact.name, destination=contact.email)
            result = EmailChannel().send(core_contact, campaign.message)
            total += 1
            success += 1 if result.success else 0
            failed += 1 if not result.success else 0

        # Disparo via SMS
        if campaign.use_sms and contact.phone:
            core_contact = CoreContact(name=contact.name, destination=contact.phone)
            result = SMSChannel().send(core_contact, campaign.message)
            total += 1
            success += 1 if result.success else 0
            failed += 1 if not result.success else 0

        # Disparo via Telegram
        if campaign.use_telegram and contact.telegram_id:
            core_contact = CoreContact(name=contact.name, destination=contact.telegram_id)
            result = TelegramChannel().send(core_contact, campaign.message)
            total += 1
            success += 1 if result.success else 0
            failed += 1 if not result.success else 0

    # Atualiza métricas
    campaign.total = total
    campaign.success = success
    campaign.failed = failed
    campaign.status = StatusEnum.done
    db.commit()
    db.refresh(campaign)

    return campaign

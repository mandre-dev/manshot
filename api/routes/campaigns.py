"""
routes/campaigns.py — Manshot
Endpoints para gerenciar e disparar campanhas.
Agora o disparo é assíncrono via Celery com suporte a imagem.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api.models.campaign import Campaign, StatusEnum
from api.models.contact import Contact
from api.schemas.campaign import CampaignCreate, CampaignResponse
from api.tasks import dispatch_campaign
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
def send_campaign(
    campaign_id: int, contact_ids: dict = None, db: Session = Depends(get_db)
):
    """
    Enfileira a campanha para disparo assíncrono.
    Responde imediatamente com status 'running'.
    O Celery processa em background com suporte a imagem.

    Se contact_ids for fornecido, usa apenas esses contatos.
    Caso contrário, usa todos os contatos.
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")

    if campaign.status == StatusEnum.running:
        raise HTTPException(status_code=400, detail="Campanha já está em execução")

    # Se contact_ids foi fornecido, usa apenas esses contatos
    if contact_ids and "ids" in contact_ids:
        contacts = db.query(Contact).filter(Contact.id.in_(contact_ids["ids"])).all()
    else:
        contacts = db.query(Contact).all()

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

    dispatch_campaign.delay(
        campaign_id=campaign.id,
        contacts=contacts_data,
        message=campaign.message,
        use_email=campaign.use_email,
        use_sms=campaign.use_sms,
        use_telegram=campaign.use_telegram,
        image_url=campaign.image_url,
        email_subject=campaign.email_subject,
        sms_from=campaign.sms_from,
    )

    return campaign


@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Remove uma campanha."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    db.delete(campaign)
    db.commit()
    return {"message": "Campanha removida com sucesso"}


@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: int, data: CampaignCreate, db: Session = Depends(get_db)
):
    """Atualiza uma campanha."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    for key, value in data.model_dump().items():
        setattr(campaign, key, value)
    db.commit()
    db.refresh(campaign)
    return campaign

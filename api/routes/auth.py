"""
routes/auth.py — Manshot
Endpoints de autenticação para login e sessão.
"""

import json
import secrets
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.database import get_db
from api.models.user import User
from api.schemas.auth import (
    CredentialsCheckResponse,
    GoogleLoginRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from core.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from core.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])


def has_valid_credentials(email: str, password: str, db: Session) -> bool:
    if email == settings.ADMIN_EMAIL.lower() and password == settings.ADMIN_PASSWORD:
        return True

    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False

    return verify_password(password, user.password_hash)


def fetch_google_profile(access_token: str) -> dict:
    try:
        tokeninfo_request = Request(
            f"https://oauth2.googleapis.com/tokeninfo?{urlencode({'access_token': access_token})}"
        )
        with urlopen(tokeninfo_request, timeout=10) as response:
            token_info = json.loads(response.read().decode("utf-8"))

        if settings.google_client_id:
            audience = token_info.get("audience") or token_info.get("aud")
            if audience and audience != settings.google_client_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token do Google inválido",
                )

        userinfo_request = Request(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        with urlopen(userinfo_request, timeout=10) as response:
            profile = json.loads(response.read().decode("utf-8"))

        email = (profile.get("email") or "").strip().lower()
        if not email or not profile.get("verified_email", False):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Conta Google não verificada",
            )

        return profile
    except HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falha ao validar conta Google",
        ) from exc
    except (URLError, ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falha ao validar conta Google",
        ) from exc


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    if not has_valid_credentials(email, payload.password, db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    token = create_access_token(email)
    return TokenResponse(access_token=token)


@router.post("/check-credentials", response_model=CredentialsCheckResponse)
def check_credentials(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    return CredentialsCheckResponse(
        valid=has_valid_credentials(email, payload.password, db)
    )


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    profile = fetch_google_profile(payload.access_token)
    email = (profile.get("email") or "").strip().lower()

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail do Google não encontrado",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            password_hash=hash_password(secrets.token_urlsafe(32)),
        )
        db.add(user)
        db.commit()

    token = create_access_token(email)
    return TokenResponse(access_token=token)


@router.post(
    "/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    if email == settings.ADMIN_EMAIL.lower():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este e-mail é reservado ao administrador",
        )

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail já cadastrado",
        )

    new_user = User(
        email=email,
        password_hash=hash_password(payload.password),
    )
    db.add(new_user)
    db.commit()

    token = create_access_token(email)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    current_email = current_user.strip().lower()

    if current_email == settings.ADMIN_EMAIL.lower():
        return UserResponse(email=current_email, is_admin=True)

    user = db.query(User).filter(User.email == current_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
        )

    return UserResponse(email=user.email, is_admin=False)

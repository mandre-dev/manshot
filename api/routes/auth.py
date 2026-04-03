"""
routes/auth.py — Manshot
Endpoints de autenticação para login e sessão.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.database import get_db
from api.models.user import User
from api.schemas.auth import (
    CredentialsCheckResponse,
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

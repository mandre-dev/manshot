"""
routes/auth.py — Manshot
Endpoints de autenticação para login e sessão.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from api.schemas.auth import LoginRequest, TokenResponse, UserResponse
from core.auth import create_access_token, get_current_user
from core.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    if (
        payload.email.lower() != settings.ADMIN_EMAIL.lower()
        or payload.password != settings.ADMIN_PASSWORD
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    token = create_access_token(payload.email)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(current_user: str = Depends(get_current_user)):
    return UserResponse(email=current_user)
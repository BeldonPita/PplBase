from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import requests
import os
import secrets

from app.database import get_db
from app.models import Usuario
from app.auth import criar_access_token, hash_senha

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://pplbase-frontend.onrender.com/auth/google/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://pplbase-frontend.onrender.com")

@router.get("/google/login")
def google_login():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID não configurado")
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "email profile",
        "access_type": "offline",
        "prompt": "select_account"
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{requests.compat.urlencode(params)}"
    return RedirectResponse(url=url)

@router.get("/google/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Credenciais Google não configuradas")
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    token_response = requests.post(token_url, data=token_data)
    token_json = token_response.json()
    if "error" in token_json:
        raise HTTPException(status_code=400, detail=token_json.get("error_description", "Erro ao obter token"))
    access_token = token_json.get("access_token")
    user_info_response = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    user_info = user_info_response.json()
    if "error" in user_info:
        raise HTTPException(status_code=400, detail=user_info.get("error_description", "Erro ao obter informações"))
    email = user_info.get("email")
    nome = user_info.get("name")
    foto_url = user_info.get("picture")
    if not email:
        raise HTTPException(status_code=400, detail="Email não encontrado")
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario:
        username = email.split("@")[0]
        existing = db.query(Usuario).filter(Usuario.username == username).first()
        if existing:
            username = f"{username}_{secrets.token_hex(3)}"
        usuario = Usuario(
            nome=nome or username,
            username=username,
            email=email,
            senha_hash=hash_senha(secrets.token_hex(16)),
            foto_url=foto_url,
            verificado=True,
            ativo=True
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
    token = criar_access_token(data={"sub": usuario.username})
    return RedirectResponse(url=f"{FRONTEND_URL}/auth/success?token={token}")

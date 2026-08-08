from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario
from app.schemas import UsuarioCreate, Token, LoginRequest
from app.auth import hash_senha, verificar_senha, criar_access_token

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.username == usuario.username).first():
        raise HTTPException(status_code=400, detail="Username já está em uso")
    if db.query(Usuario).filter(Usuario.email == usuario.email).first():
        raise HTTPException(status_code=400, detail="Email já está em uso")
    
    novo_usuario = Usuario(
        nome=usuario.nome,
        username=usuario.username,
        email=usuario.email,
        senha_hash=hash_senha(usuario.senha),
        bio=usuario.bio,
        localizacao=usuario.localizacao,
        foto_url=usuario.foto_url
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    access_token = criar_access_token(data={"sub": novo_usuario.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.username == login_data.username).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")
    if not verificar_senha(login_data.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")
    if not usuario.ativo:
        raise HTTPException(status_code=400, detail="Usuário inativo")
    access_token = criar_access_token(data={"sub": usuario.username})
    return {"access_token": access_token, "token_type": "bearer"}

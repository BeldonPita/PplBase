from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Usuario, Conexao
from app.schemas import UsuarioResponse, ConexaoResponse
from app.auth import get_usuario_atual

router = APIRouter()

@router.post("/seguir/{username}")
def seguir_usuario(
    username: str,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    """Seguir um usuário"""
    
    if usuario_atual.username == username:
        raise HTTPException(status_code=400, detail="Não pode seguir a si mesmo")
    
    alvo = db.query(Usuario).filter(Usuario.username == username).first()
    if not alvo:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verificar se já segue
    existe = db.query(Conexao).filter(
        Conexao.seguidor_id == usuario_atual.id,
        Conexao.seguido_id == alvo.id
    ).first()
    
    if existe:
        raise HTTPException(status_code=400, detail="Você já segue este usuário")
    
    nova_conexao = Conexao(
        seguidor_id=usuario_atual.id,
        seguido_id=alvo.id
    )
    db.add(nova_conexao)
    db.commit()
    
    return {"message": f"Você agora segue {username}"}

@router.delete("/deixar-seguir/{username}")
def deixar_seguir(
    username: str,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    """Deixar de seguir um usuário"""
    
    alvo = db.query(Usuario).filter(Usuario.username == username).first()
    if not alvo:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    conexao = db.query(Conexao).filter(
        Conexao.seguidor_id == usuario_atual.id,
        Conexao.seguido_id == alvo.id
    ).first()
    
    if not conexao:
        raise HTTPException(status_code=400, detail="Você não segue este usuário")
    
    db.delete(conexao)
    db.commit()
    
    return {"message": f"Você deixou de seguir {username}"}

@router.get("/seguidores", response_model=List[UsuarioResponse])
def listar_seguidores(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    """Listar pessoas que seguem o usuário atual"""
    seguidores = db.query(Usuario).join(
        Conexao, Conexao.seguidor_id == Usuario.id
    ).filter(Conexao.seguido_id == usuario_atual.id).all()
    return seguidores

@router.get("/seguindo", response_model=List[UsuarioResponse])
def listar_seguindo(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    """Listar pessoas que o usuário atual segue"""
    seguindo = db.query(Usuario).join(
        Conexao, Conexao.seguido_id == Usuario.id
    ).filter(Conexao.seguidor_id == usuario_atual.id).all()
    return seguindo

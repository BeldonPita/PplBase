from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import Optional, List

from app.database import get_db
from app.models import Usuario, Habilidade
from app.schemas import UsuarioResponse
from app.auth import get_usuario_atual

router = APIRouter()

@router.get("/pessoas", response_model=List[UsuarioResponse])
def buscar_pessoas(
    q: Optional[str] = Query(None, description="Termo de busca (nome, bio, localização)"),
    habilidade: Optional[str] = Query(None, description="Nome da habilidade"),
    localizacao: Optional[str] = Query(None, description="Localização do usuário"),
    ordenar: Optional[str] = Query("nome", description="Ordenar por: nome, recente, localizacao"),
    limit: Optional[int] = Query(20, description="Número de resultados por página"),
    offset: Optional[int] = Query(0, description="Página (offset)"),
    db: Session = Depends(get_db)
):
    query = db.query(Usuario).filter(Usuario.ativo == True)
    
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                Usuario.nome.ilike(search_term),
                Usuario.bio.ilike(search_term),
                Usuario.localizacao.ilike(search_term)
            )
        )
    
    if habilidade:
        query = query.filter(
            Usuario.habilidades.any(Habilidade.nome.ilike(f"%{habilidade}%"))
        )
    
    if localizacao:
        query = query.filter(Usuario.localizacao.ilike(f"%{localizacao}%"))
    
    if ordenar == "nome":
        query = query.order_by(Usuario.nome)
    elif ordenar == "recente":
        query = query.order_by(desc(Usuario.criado_em))
    elif ordenar == "localizacao":
        query = query.order_by(Usuario.localizacao)
    
    query = query.offset(offset).limit(limit)
    resultados = query.all()
    return resultados

@router.get("/habilidades", response_model=List[str])
def listar_habilidades(db: Session = Depends(get_db)):
    habilidades = db.query(Habilidade.nome).order_by(Habilidade.nome).all()
    return [h[0] for h in habilidades]

@router.get("/localizacoes", response_model=List[str])
def listar_localizacoes(db: Session = Depends(get_db)):
    localizacoes = db.query(Usuario.localizacao).filter(Usuario.localizacao.isnot(None)).distinct().order_by(Usuario.localizacao).all()
    return [l[0] for l in localizacoes if l[0]]

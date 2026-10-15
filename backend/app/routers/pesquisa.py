from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
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
    ordenar: Optional[str] = Query("relevancia", description="nome, recente, localizacao, relevancia"),
    limit: Optional[int] = Query(20, description="Resultados por página"),
    offset: Optional[int] = Query(0, description="Página (offset)"),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    query = db.query(Usuario).filter(
        Usuario.ativo == True,
        Usuario.id != usuario_atual.id
    )
    
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                Usuario.nome.ilike(search_term),
                Usuario.username.ilike(search_term),
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
    
    resultados = query.offset(offset).limit(limit).all()
    return resultados

@router.get("/habilidades", response_model=List[str])
def listar_habilidades(db: Session = Depends(get_db)):
    habilidades = db.query(Habilidade.nome).order_by(Habilidade.nome).all()
    return [h[0] for h in habilidades]

@router.get("/localizacoes", response_model=List[str])
def listar_localizacoes(db: Session = Depends(get_db)):
    localizacoes = (
        db.query(Usuario.localizacao)
        .filter(Usuario.localizacao.isnot(None))
        .distinct()
        .order_by(Usuario.localizacao)
        .all()
    )
    return [l[0] for l in localizacoes if l[0]]

@router.get("/recomendacoes", response_model=List[UsuarioResponse])
def recomendacoes(
    limit: int = Query(5, description="Número de recomendações"),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    minhas_habilidades = {h.nome for h in usuario_atual.habilidades}
    seguindo = {u.id for u in usuario_atual.seguindo} if hasattr(usuario_atual, 'seguindo') else set()
    
    candidatos = (
        db.query(Usuario)
        .filter(
            Usuario.ativo == True,
            Usuario.id != usuario_atual.id,
            ~Usuario.id.in_(seguindo) if seguindo else True
        )
        .limit(50)
        .all()
    )
    
    def pontuacao(u):
        score = 0
        habs_comum = len({h.nome for h in u.habilidades} & minhas_habilidades)
        score += habs_comum * 3
        if u.localizacao and usuario_atual.localizacao and u.localizacao == usuario_atual.localizacao:
            score += 2
        if u.bio:
            score += 1
        return score
    
    candidatos.sort(key=pontuacao, reverse=True)
    return candidatos[:limit]

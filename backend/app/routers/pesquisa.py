from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
from typing import Optional, List
from difflib import get_close_matches

from app.database import get_db
from app.models import Usuario, Habilidade
from app.schemas import UsuarioResponse
from app.auth import get_usuario_atual

router = APIRouter()

PROVINCIAS_MOCAMBIQUE = [
    "Cabo Delgado (Pemba)",
    "Gaza (Xai-Xai)",
    "Inhambane (Inhambane)",
    "Manica (Chimoio)",
    "Maputo Província (Matola)",
    "Maputo Cidade (Maputo)",
    "Nampula (Nampula)",
    "Niassa (Lichinga)",
    "Sofala (Beira)",
    "Tete (Tete)",
    "Zambézia (Quelimane)",
]

@router.get("/pessoas", response_model=List[UsuarioResponse])
def buscar_pessoas(
    q: Optional[str] = Query(None, description="Nome ou username do agente"),
    habilidade: Optional[str] = Query(None),
    localizacao: Optional[str] = Query(None),
    ordenar: Optional[str] = Query("relevancia"),
    limit: Optional[int] = Query(20),
    offset: Optional[int] = Query(0),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    if not q and not habilidade and not localizacao:
        return []
    
    query = db.query(Usuario).filter(
        Usuario.ativo == True,
        Usuario.id != usuario_atual.id
    )
    
    if q:
        search_term = f"%{q}%"
        query = query.filter(or_(
            Usuario.nome.ilike(search_term),
            Usuario.username.ilike(search_term)
        ))
    
    if habilidade:
        habilidade_corrigida = sugerir_habilidade(habilidade, db)
        query = query.filter(
            Usuario.habilidades.any(Habilidade.nome.ilike(f"%{habilidade_corrigida}%"))
        )
    
    if localizacao:
        query = query.filter(Usuario.localizacao.ilike(f"%{localizacao}%"))
    
    if ordenar == "nome":
        query = query.order_by(Usuario.nome)
    elif ordenar == "recente":
        query = query.order_by(desc(Usuario.criado_em))
    elif ordenar == "localizacao":
        query = query.order_by(Usuario.localizacao)
    
    return query.offset(offset).limit(limit).all()

def sugerir_habilidade(termo: str, db: Session) -> str:
    todas = [h[0] for h in db.query(Habilidade.nome).all()]
    if not todas:
        return termo
    matches = get_close_matches(termo, todas, n=1, cutoff=0.6)
    return matches[0] if matches else termo

@router.get("/sugerir-habilidade")
def sugerir_habilidade_endpoint(
    termo: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    todas = [h[0] for h in db.query(Habilidade.nome).all()]
    if not todas:
        return {"sugestoes": []}
    # Match parcial (contém)
    parciais = [h for h in todas if termo.lower() in h.lower()]
    # Match ortográfico
    proximos = get_close_matches(termo, todas, n=5, cutoff=0.4)
    sugestoes = list(dict.fromkeys(parciais + proximos))[:8]
    return {"sugestoes": sugestoes}

@router.get("/habilidades", response_model=List[str])
def listar_habilidades(db: Session = Depends(get_db)):
    return [h[0] for h in db.query(Habilidade.nome).order_by(Habilidade.nome).all()]

@router.get("/localizacoes", response_model=List[str])
def listar_localizacoes():
    return PROVINCIAS_MOCAMBIQUE

@router.get("/recomendacoes", response_model=List[UsuarioResponse])
def recomendacoes(
    limit: int = Query(5),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    minhas = {h.nome for h in usuario_atual.habilidades}
    candidatos = db.query(Usuario).filter(
        Usuario.ativo == True,
        Usuario.id != usuario_atual.id
    ).limit(50).all()
    
    def pontuacao(u):
        score = len({h.nome for h in u.habilidades} & minhas) * 3
        if u.localizacao and usuario_atual.localizacao and u.localizacao == usuario_atual.localizacao:
            score += 2
        if u.bio:
            score += 1
        return score
    
    candidatos.sort(key=pontuacao, reverse=True)
    return candidatos[:limit]

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

# =========================================================
# PROVÍNCIAS DE MOÇAMBIQUE (com capitais)
# =========================================================

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

# =========================================================
# BUSCA DE PESSOAS
# =========================================================

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
    # Se não houver termo de busca, retorna vazio
    if not q and not habilidade and not localizacao:
        return []
    
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
        # Correção ortográfica automática
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
    
    resultados = query.offset(offset).limit(limit).all()
    return resultados

# =========================================================
# CORREÇÃO ORTOGRÁFICA DE HABILIDADES
# =========================================================

def sugerir_habilidade(termo: str, db: Session) -> str:
    """Sugere a habilidade mais próxima ortograficamente"""
    todas = [h[0] for h in db.query(Habilidade.nome).all()]
    
    if not todas:
        return termo
    
    # Procura matches exatos primeiro
    matches = get_close_matches(termo, todas, n=1, cutoff=0.6)
    
    if matches:
        return matches[0]
    
    return termo

@router.get("/sugerir-habilidade")
def sugerir_habilidade_endpoint(
    termo: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """Sugere habilidades com base no termo digitado"""
    todas = [h[0] for h in db.query(Habilidade.nome).all()]
    
    if not todas:
        return {"sugestoes": []}
    
    # Match exato parcial (contém)
    parciais = [h for h in todas if termo.lower() in h.lower()]
    
    # Match por semelhança ortográfica
    proximos = get_close_matches(termo, todas, n=5, cutoff=0.4)
    
    # Combinar e remover duplicados
    sugestoes = list(dict.fromkeys(parciais + proximos))[:8]
    
    return {"sugestoes": sugestoes}

# =========================================================
# LISTAR HABILIDADES E LOCALIZAÇÕES
# =========================================================

@router.get("/habilidades", response_model=List[str])
def listar_habilidades(db: Session = Depends(get_db)):
    habilidades = db.query(Habilidade.nome).order_by(Habilidade.nome).all()
    return [h[0] for h in habilidades]

@router.get("/localizacoes", response_model=List[str])
def listar_localizacoes():
    """Lista todas as províncias de Moçambique com capitais"""
    return PROVINCIAS_MOCAMBIQUE

# =========================================================
# RECOMENDAÇÕES DE PERFIS
# =========================================================

@router.get("/recomendacoes", response_model=List[UsuarioResponse])
def recomendacoes(
    limit: int = Query(5, description="Número de recomendações"),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    minhas_habilidades = {h.nome for h in usuario_atual.habilidades}
    
    candidatos = (
        db.query(Usuario)
        .filter(
            Usuario.ativo == True,
            Usuario.id != usuario_atual.id
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

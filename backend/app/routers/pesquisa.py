from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional, List
from difflib import get_close_matches

from app.database import get_db
from app.models import Usuario, Habilidade
from app.schemas import UsuarioResponse
from app.auth import get_usuario_atual

router = APIRouter()

# =========================================================
# LISTA FIXA DE HABILIDADES COMUNS (para autocomplete)
# =========================================================

HABILIDADES_COMUNS = [
    # Programação
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "PHP", "Ruby", "Go", "Rust",
    "HTML", "CSS", "React", "Vue", "Angular", "Node.js", "Django", "Flask", "FastAPI",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes",
    "Git", "GitHub", "Linux", "AWS", "Azure", "Google Cloud", "DevOps",
    
    # Design
    "Design Gráfico", "UI/UX", "Figma", "Photoshop", "Illustrator", "Canva",
    "Design de Produto", "Design de Marca", "Motion Design",
    
    # Marketing
    "Marketing Digital", "SEO", "SEM", "Redes Sociais", "Copywriting",
    "Email Marketing", "Google Ads", "Facebook Ads", "Marketing de Conteúdo",
    
    # Gestão
    "Gestão de Projetos", "Scrum", "Agile", "Product Management", "Liderança",
    "Gestão Financeira", "Recursos Humanos", "Vendas", "Atendimento ao Cliente",
    
    # Dados
    "Análise de Dados", "Data Science", "Machine Learning", "Inteligência Artificial",
    "Power BI", "Tableau", "Excel", "Estatística", "Big Data",
    
    # Idiomas
    "Inglês", "Espanhol", "Francês", "Português", "Alemão",
    
    # Outros
    "Fotografia", "Vídeo", "Edição de Vídeo", "Redação", "Tradução",
    "Contabilidade", "Direito", "Medicina", "Educação", "Engenharia",
]

@router.get("/sugerir-habilidade")
def sugerir_habilidade_endpoint(
    termo: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """Sugere habilidades com base no termo digitado (funciona mesmo sem base de dados)"""
    
    termo_lower = termo.lower()
    
    # 1. Habilidades já registadas na base
    da_base = [h[0] for h in db.query(Habilidade.nome).all()]
    
    # 2. Combinar lista fixa + base (sem duplicados)
    todas = list(dict.fromkeys(HABILIDADES_COMUNS + da_base))
    
    # 3. Filtrar por match parcial (contém o termo)
    parciais = [h for h in todas if termo_lower in h.lower()]
    
    # 4. Match ortográfico (correção de erros)
    proximos = get_close_matches(termo, todas, n=5, cutoff=0.4)
    
    # 5. Combinar e remover duplicados
    sugestoes = list(dict.fromkeys(parciais + proximos))[:8]
    
    return {"sugestoes": sugestoes}

# =========================================================
# BUSCAR PESSOAS
# =========================================================

@router.get("/pessoas", response_model=List[UsuarioResponse])
def buscar_pessoas(
    q: Optional[str] = Query(None),
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
    
    return query.offset(offset).limit(limit).all()

@router.get("/habilidades", response_model=List[str])
def listar_habilidades(db: Session = Depends(get_db)):
    """Lista todas as habilidades disponíveis"""
    da_base = [h[0] for h in db.query(Habilidade.nome).all()]
    todas = list(dict.fromkeys(HABILIDADES_COMUNS + da_base))
    return sorted(todas)

@router.get("/localizacoes", response_model=List[str])
def listar_localizacoes():
    return [
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

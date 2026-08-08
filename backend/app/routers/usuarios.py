from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import Usuario, Habilidade, Experiencia
from app.schemas import (
    UsuarioResponse, 
    UsuarioUpdate, 
    HabilidadeCreate, 
    HabilidadeResponse,
    ExperienciaCreate,
    ExperienciaResponse
)
from app.auth import get_usuario_atual

router = APIRouter()

# =========================================================
# PERFIL DO USUÁRIO
# =========================================================

@router.get("/me", response_model=UsuarioResponse)
def get_me(usuario_atual: Usuario = Depends(get_usuario_atual)):
    """Obter perfil do usuário logado"""
    return usuario_atual

@router.put("/me", response_model=UsuarioResponse)
def update_me(
    usuario_update: UsuarioUpdate,
    usuario_atual: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db)
):
    """Atualizar perfil do usuário logado"""
    
    for key, value in usuario_update.dict(exclude_unset=True).items():
        setattr(usuario_atual, key, value)
    
    db.commit()
    db.refresh(usuario_atual)
    return usuario_atual

@router.get("/{username}", response_model=UsuarioResponse)
def get_usuario_publico(username: str, db: Session = Depends(get_db)):
    """Ver perfil público de qualquer usuário"""
    usuario = db.query(Usuario).filter(Usuario.username == username).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario

# =========================================================
# CRUD DE HABILIDADES
# =========================================================

@router.post("/habilidades", response_model=dict)
def adicionar_habilidade(
    habilidade: HabilidadeCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    """Adicionar uma habilidade ao perfil do usuário"""
    
    # Verificar se a habilidade já existe no banco
    hab = db.query(Habilidade).filter(Habilidade.nome == habilidade.nome).first()
    if not hab:
        hab = Habilidade(nome=habilidade.nome, descricao=habilidade.descricao)
        db.add(hab)
        db.commit()
        db.refresh(hab)
    
    # Verificar se o usuário já tem essa habilidade
    if hab in usuario_atual.habilidades:
        raise HTTPException(status_code=400, detail="Você já possui esta habilidade")
    
    usuario_atual.habilidades.append(hab)
    db.commit()
    return {"message": "Habilidade adicionada com sucesso", "habilidade": hab.nome}

@router.delete("/habilidades/{habilidade_id}", response_model=dict)
def remover_habilidade(
    habilidade_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    """Remover uma habilidade do perfil do usuário"""
    
    hab = db.query(Habilidade).filter(Habilidade.id == habilidade_id).first()
    if not hab:
        raise HTTPException(status_code=404, detail="Habilidade não encontrada")
    
    if hab not in usuario_atual.habilidades:
        raise HTTPException(status_code=400, detail="Você não possui esta habilidade")
    
    usuario_atual.habilidades.remove(hab)
    db.commit()
    return {"message": "Habilidade removida com sucesso"}

# =========================================================
# CRUD DE EXPERIÊNCIAS
# =========================================================

@router.post("/experiencias", response_model=ExperienciaResponse)
def adicionar_experiencia(
    experiencia: ExperienciaCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    """Adicionar uma experiência ao perfil do usuário"""
    
    nova_exp = Experiencia(
        usuario_id=usuario_atual.id,
        titulo=experiencia.titulo,
        empresa=experiencia.empresa,
        descricao=experiencia.descricao,
        localizacao=experiencia.localizacao,
        data_inicio=experiencia.data_inicio,
        data_fim=experiencia.data_fim,
        atual=experiencia.atual
    )
    db.add(nova_exp)
    db.commit()
    db.refresh(nova_exp)
    return nova_exp

@router.delete("/experiencias/{experiencia_id}", response_model=dict)
def remover_experiencia(
    experiencia_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    """Remover uma experiência do perfil do usuário"""
    
    exp = db.query(Experiencia).filter(
        Experiencia.id == experiencia_id,
        Experiencia.usuario_id == usuario_atual.id
    ).first()
    
    if not exp:
        raise HTTPException(status_code=404, detail="Experiência não encontrada")
    
    db.delete(exp)
    db.commit()
    return {"message": "Experiência removida com sucesso"}

# ===== CRUD DE HABILIDADES =====

@router.post("/habilidades")
def adicionar_habilidade(
    habilidade: HabilidadeCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    # Verificar se a habilidade já existe
    hab = db.query(Habilidade).filter(Habilidade.nome == habilidade.nome).first()
    if not hab:
        hab = Habilidade(nome=habilidade.nome, descricao=habilidade.descricao)
        db.add(hab)
        db.commit()
        db.refresh(hab)
    
    # Verificar se o usuário já tem essa habilidade
    if hab in usuario_atual.habilidades:
        raise HTTPException(status_code=400, detail="Você já possui esta habilidade")
    
    usuario_atual.habilidades.append(hab)
    db.commit()
    return {"message": "Habilidade adicionada com sucesso"}

@router.delete("/habilidades/{habilidade_id}")
def remover_habilidade(
    habilidade_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    hab = db.query(Habilidade).filter(Habilidade.id == habilidade_id).first()
    if not hab:
        raise HTTPException(status_code=404, detail="Habilidade não encontrada")
    
    if hab not in usuario_atual.habilidades:
        raise HTTPException(status_code=400, detail="Você não possui esta habilidade")
    
    usuario_atual.habilidades.remove(hab)
    db.commit()
    return {"message": "Habilidade removida com sucesso"}

# ===== CRUD DE EXPERIÊNCIAS =====

@router.post("/experiencias")
def adicionar_experiencia(
    experiencia: ExperienciaCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    nova_exp = Experiencia(
        usuario_id=usuario_atual.id,
        titulo=experiencia.titulo,
        empresa=experiencia.empresa,
        descricao=experiencia.descricao,
        localizacao=experiencia.localizacao,
        data_inicio=experiencia.data_inicio,
        data_fim=experiencia.data_fim,
        atual=experiencia.atual
    )
    db.add(nova_exp)
    db.commit()
    db.refresh(nova_exp)
    return nova_exp

@router.delete("/experiencias/{experiencia_id}")
def remover_experiencia(
    experiencia_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    exp = db.query(Experiencia).filter(
        Experiencia.id == experiencia_id,
        Experiencia.usuario_id == usuario_atual.id
    ).first()
    
    if not exp:
        raise HTTPException(status_code=404, detail="Experiência não encontrada")
    
    db.delete(exp)
    db.commit()
    return {"message": "Experiência removida com sucesso"}

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
import os

from app.database import get_db
from app.models import Usuario, Habilidade, Experiencia
from app.schemas import (
    UsuarioResponse,
    UsuarioUpdate,
    HabilidadeCreate,
    ExperienciaCreate,
    ExperienciaResponse
)
from app.auth import get_usuario_atual

router = APIRouter()

# =========================================================
# PERFIL
# =========================================================

@router.get("/me", response_model=UsuarioResponse)
def get_me(usuario_atual: Usuario = Depends(get_usuario_atual)):
    return usuario_atual

@router.put("/me", response_model=UsuarioResponse)
def update_me(
    usuario_update: UsuarioUpdate,
    usuario_atual: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db)
):
    for key, value in usuario_update.dict(exclude_unset=True).items():
        setattr(usuario_atual, key, value)
    db.commit()
    db.refresh(usuario_atual)
    return usuario_atual

@router.get("/{username}", response_model=UsuarioResponse)
def get_usuario_publico(username: str, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.username == username).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario

# =========================================================
# UPLOAD DE FOTO
# =========================================================

@router.post("/upload-foto")
async def upload_foto(
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    if not foto.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O ficheiro deve ser uma imagem")
    
    conteudo = await foto.read()
    if len(conteudo) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="A imagem não pode ter mais de 5MB")
    
    extensao = foto.filename.split(".")[-1]
    nome_ficheiro = f"{usuario_atual.id}_{uuid.uuid4().hex}.{extensao}"
    caminho = f"uploads/fotos/{nome_ficheiro}"
    
    with open(caminho, "wb") as buffer:
        buffer.write(conteudo)
    
    foto_url = f"https://pplbase.onrender.com/uploads/fotos/{nome_ficheiro}"
    usuario_atual.foto_url = foto_url
    db.commit()
    db.refresh(usuario_atual)
    
    return {"message": "Foto atualizada com sucesso", "foto_url": foto_url}

# =========================================================
# HABILIDADES
# =========================================================

@router.post("/habilidades")
def adicionar_habilidade(
    habilidade: HabilidadeCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    hab = db.query(Habilidade).filter(Habilidade.nome == habilidade.nome).first()
    if not hab:
        hab = Habilidade(nome=habilidade.nome, descricao=habilidade.descricao)
        db.add(hab)
        db.commit()
        db.refresh(hab)
    
    if hab in usuario_atual.habilidades:
        raise HTTPException(status_code=400, detail="Já possui esta habilidade")
    
    usuario_atual.habilidades.append(hab)
    db.commit()
    return {"message": "Habilidade adicionada", "habilidade": hab.nome}

@router.delete("/habilidades/{habilidade_id}")
def remover_habilidade(
    habilidade_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    hab = db.query(Habilidade).filter(Habilidade.id == habilidade_id).first()
    if not hab or hab not in usuario_atual.habilidades:
        raise HTTPException(status_code=404, detail="Habilidade não encontrada")
    usuario_atual.habilidades.remove(hab)
    db.commit()
    return {"message": "Habilidade removida"}

# =========================================================
# EXPERIÊNCIAS
# =========================================================

@router.post("/experiencias", response_model=ExperienciaResponse)
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

@router.put("/experiencias/{experiencia_id}", response_model=ExperienciaResponse)
def editar_experiencia(
    experiencia_id: int,
    experiencia: ExperienciaCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual)
):
    exp = db.query(Experiencia).filter(
        Experiencia.id == experiencia_id,
        Experiencia.usuario_id == usuario_atual.id
    ).first()
    
    if not exp:
        raise HTTPException(status_code=404, detail="Experiência não encontrada")
    
    exp.titulo = experiencia.titulo
    exp.empresa = experiencia.empresa
    exp.descricao = experiencia.descricao
    exp.localizacao = experiencia.localizacao
    exp.data_inicio = experiencia.data_inicio
    exp.data_fim = experiencia.data_fim
    exp.atual = experiencia.atual
    
    db.commit()
    db.refresh(exp)
    return exp

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
    return {"message": "Experiência removida"}
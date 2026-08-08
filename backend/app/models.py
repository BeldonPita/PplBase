from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

# Tabela de associação: usuários <-> habilidades
usuario_habilidades = Table(
    "usuario_habilidades",
    Base.metadata,
    Column("usuario_id", Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True),
    Column("habilidade_id", Integer, ForeignKey("habilidades.id", ondelete="CASCADE"), primary_key=True),
)

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    localizacao = Column(String(150), nullable=True)
    foto_url = Column(String(500), nullable=True)
    verificado = Column(Boolean, default=False)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    habilidades = relationship("Habilidade", secondary=usuario_habilidades, back_populates="usuarios")
    experiencias = relationship("Experiencia", back_populates="usuario", cascade="all, delete-orphan")
    
    # Conexões: usuários que eu sigo
    seguindo = relationship(
        "Usuario",
        secondary="conexoes",
        primaryjoin="Usuario.id == Conexao.seguidor_id",
        secondaryjoin="Usuario.id == Conexao.seguido_id",
        backref="seguidores"
    )

class Habilidade(Base):
    __tablename__ = "habilidades"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), unique=True, nullable=False, index=True)
    descricao = Column(Text, nullable=True)
    usuarios = relationship("Usuario", secondary=usuario_habilidades, back_populates="habilidades")

class Experiencia(Base):
    __tablename__ = "experiencias"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    titulo = Column(String(150), nullable=False)
    empresa = Column(String(150), nullable=True)
    descricao = Column(Text, nullable=True)
    localizacao = Column(String(150), nullable=True)
    data_inicio = Column(DateTime, nullable=True)
    data_fim = Column(DateTime, nullable=True)
    atual = Column(Boolean, default=False)
    criado_em = Column(DateTime, default=datetime.utcnow)
    usuario = relationship("Usuario", back_populates="experiencias")

class Conexao(Base):
    __tablename__ = "conexoes"
    id = Column(Integer, primary_key=True, index=True)
    seguidor_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    seguido_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    criado_em = Column(DateTime, default=datetime.utcnow)

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

# =========================================================
# SCHEMAS DE USUÁRIO
# =========================================================

class UsuarioBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    bio: Optional[str] = None
    localizacao: Optional[str] = None
    foto_url: Optional[str] = None

class UsuarioCreate(UsuarioBase):
    senha: str = Field(..., min_length=6)

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=100)
    bio: Optional[str] = None
    localizacao: Optional[str] = None
    foto_url: Optional[str] = None

class UsuarioResponse(UsuarioBase):
    id: int
    verificado: bool
    ativo: bool
    criado_em: datetime
    habilidades: List["HabilidadeResponse"] = []
    experiencias: List["ExperienciaResponse"] = []

    class Config:
        from_attributes = True

# =========================================================
# SCHEMAS DE HABILIDADE
# =========================================================

class HabilidadeBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    descricao: Optional[str] = None

class HabilidadeCreate(HabilidadeBase):
    pass

class HabilidadeResponse(HabilidadeBase):
    id: int

    class Config:
        from_attributes = True

# =========================================================
# SCHEMAS DE EXPERIÊNCIA
# =========================================================

class ExperienciaBase(BaseModel):
    titulo: str = Field(..., min_length=2, max_length=150)
    empresa: Optional[str] = Field(None, max_length=150)
    descricao: Optional[str] = None
    localizacao: Optional[str] = Field(None, max_length=150)
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    atual: bool = False

class ExperienciaCreate(ExperienciaBase):
    pass

class ExperienciaUpdate(ExperienciaBase):
    titulo: Optional[str] = Field(None, min_length=2, max_length=150)

class ExperienciaResponse(ExperienciaBase):
    id: int
    usuario_id: int
    criado_em: datetime

    class Config:
        from_attributes = True

# =========================================================
# SCHEMAS DE AUTENTICAÇÃO
# =========================================================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    senha: str
class ConexaoResponse(BaseModel):
    id: int
    seguidor_id: int
    seguido_id: int
    criado_em: datetime
    
    class Config:
        from_attributes = True

# =========================================================
# SCHEMAS PARA HABILIDADES E EXPERIÊNCIAS (CRUD)
# =========================================================

class HabilidadeCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    descricao: Optional[str] = None

class HabilidadeResponse(BaseModel):
    id: int
    nome: str
    descricao: Optional[str] = None
    
    class Config:
        from_attributes = True

class ExperienciaCreate(BaseModel):
    titulo: str = Field(..., min_length=2, max_length=150)
    empresa: Optional[str] = Field(None, max_length=150)
    descricao: Optional[str] = None
    localizacao: Optional[str] = Field(None, max_length=150)
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    atual: bool = False

class ExperienciaResponse(BaseModel):
    id: int
    usuario_id: int
    titulo: str
    empresa: Optional[str] = None
    descricao: Optional[str] = None
    localizacao: Optional[str] = None
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    atual: bool = False
    criado_em: datetime
    
    class Config:
        from_attributes = True

class ConexaoResponse(BaseModel):
    id: int
    seguidor_id: int
    seguido_id: int
    criado_em: datetime
    
    class Config:
        from_attributes = True

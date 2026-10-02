from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import engine, Base
from app.routers import auth, usuarios, pesquisa, conexoes, google

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PplBase API",
    description="API para conectar pessoas e habilidades",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar pasta de uploads
if not os.path.exists("uploads"):
    os.makedirs("uploads/fotos")

# Servir ficheiros estáticos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuários"])
app.include_router(pesquisa.router, prefix="/pesquisa", tags=["Pesquisa"])
app.include_router(conexoes.router, prefix="/conexoes", tags=["Conexões"])
app.include_router(google.router, prefix="/auth", tags=["Google"])

@app.get("/")
def root():
    return {"message": "Bem-vindo à PplBase API!", "docs": "/docs", "status": "online"}

@app.get("/health")
def health():
   return {"status": "healthy"}
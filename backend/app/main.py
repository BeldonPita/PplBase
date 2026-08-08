from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, usuarios, pesquisa, conexoes

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

app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuários"])
app.include_router(pesquisa.router, prefix="/pesquisa", tags=["Pesquisa"])
app.include_router(conexoes.router, prefix="/conexoes", tags=["Conexões"])

@app.get("/")
def root():
    return {"message": "Bem-vindo à PplBase API!", "docs": "/docs", "status": "online"}

@app.get("/health")
def health():
    return {"status": "healthy"}

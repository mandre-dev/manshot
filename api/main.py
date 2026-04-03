from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.database import engine, Base
from api.routes import contacts_router, campaigns_router, auth_router
from api.upload import router as upload_router

# Cria as tabelas no banco de dados automaticamente
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Manshot API",
    description="Ferramenta de disparo em massa multi-canal — Email, SMS e Telegram",
    version="1.0.0",
)

# CORS — permite o dashboard React fazer requisições para a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra as rotas
app.include_router(contacts_router)
app.include_router(campaigns_router)
app.include_router(upload_router)
app.include_router(auth_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def root():
    return {"app": "Manshot", "version": "1.0.0", "docs": "/docs", "status": "online"}

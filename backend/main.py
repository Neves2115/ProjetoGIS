# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import municipios, indicadores, pois

app = FastAPI(title="GIS API")

# CORS (dev: allow all; lock down in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(municipios.router, prefix="/municipios", tags=["municipios"])
app.include_router(indicadores.router, prefix="/indicadores", tags=["indicadores"])
app.include_router(pois.router, prefix="/pois", tags=["pois"])

@app.get("/")
def root():
    return {"status":"ok", "service":"gis-api"}

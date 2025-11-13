# api/routes/municipios.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
import json
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..db import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.MunicipioOut])
def read_municipios(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    return crud.list_municipios(db, skip=skip, limit=limit)

@router.get("/geojson")
def get_municipios_geojson(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    """
    Retorna um FeatureCollection GeoJSON com os municípios.
    Cada feature contém `geometry` (objeto GeoJSON) e `properties` com id, nome e ibge_code.
    """
    municipios = crud.list_municipios(db, skip=skip, limit=limit)
    features = []
    for m in municipios:
        if not m.geometry:
            continue
        try:
            geom = json.loads(m.geometry) if isinstance(m.geometry, str) else m.geometry
        except Exception as e:
            continue

        features.append({
            "type": "Feature",
            "geometry": geom,
            "properties": {
                "id": m.id,
                "nome": m.nome,
                "ibge_code": m.ibge_code
            }
        })

    return {"type": "FeatureCollection", "features": features}

@router.get("/{ibge_code}", response_model=schemas.MunicipioOut)
def read_municipio(ibge_code: str, db: Session = Depends(get_db)):
    m = crud.get_municipio_by_ibge(db, ibge_code)
    if not m:
        raise HTTPException(status_code=404, detail="Municipio not found")
    return m


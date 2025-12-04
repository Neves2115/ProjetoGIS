# api/routes/pois.py
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..db import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.POIOut])
def get_pois(skip:int=0, limit:int=200, db: Session = Depends(get_db)):
    return crud.list_pois(db, skip=skip, limit=limit)

@router.get("/tipos")
def get_poi_types(db: Session = Depends(get_db)):
    """
    Retorna lista de tipos/categorias de POIs disponíveis no banco de dados.
    Útil para popular dropdowns de filtro no frontend.
    """
    tipos = crud.get_poi_types(db)
    return {"tipos": tipos}

@router.get("/tipo/{tipo}", response_model=List[schemas.POIOut])
def get_pois_by_type(tipo: str, skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    return crud.list_pois_by_type(db, tipo=tipo, skip=skip, limit=limit)

@router.get("/municipio/{ibge_code}", response_model=List[schemas.POIOut])
def get_pois_by_municipio(ibge_code: str, skip: int = 0, limit: int = 2000, db: Session = Depends(get_db)):
    """
    Filtra POIs por município usando o código IBGE.
    Retorna todos os POIs cadastrados naquele município.
    """
    return crud.list_pois_by_municipio(db, ibge_code=ibge_code, skip=skip, limit=limit)

@router.get("/bbox", response_model=List[schemas.POIOut])
def get_pois_bbox(bbox: str = Query(..., example="-46.7,-23.7,-46.4,-23.5"), tipo: Optional[str] = None, db: Session = Depends(get_db)):
    # bbox format: "minlon,minlat,maxlon,maxlat"
    parts = bbox.split(",")
    if len(parts) != 4:
        raise HTTPException(status_code=400, detail="bbox must be minlon,minlat,maxlon,maxlat")
    min_lon, min_lat, max_lon, max_lat = map(float, parts)
    return crud.list_pois_in_bbox(db, min_lon, min_lat, max_lon, max_lat, tipo=tipo)

@router.post("/", response_model=schemas.POIOut)
def create_poi(poi_in: schemas.POICreate, db: Session = Depends(get_db)):
    return crud.create_poi(db, poi_in)

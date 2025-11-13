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

@router.get("/tipo/{tipo}", response_model=List[schemas.POIOut])
def get_pois_by_type(tipo: str, skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    return crud.list_pois_by_type(db, tipo=tipo, skip=skip, limit=limit)


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

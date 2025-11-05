# crud.py
from typing import List, Optional
from sqlalchemy.orm import Session
from . import models, schemas

# Municipios
def list_municipios(db: Session, skip: int = 0, limit: int = 100) -> List[models.Municipio]:
    return db.query(models.Municipio).offset(skip).limit(limit).all()

def get_municipio_by_ibge(db: Session, ibge_code: str) -> Optional[models.Municipio]:
    return db.query(models.Municipio).filter(models.Municipio.ibge_code == ibge_code).first()

# Indicadores
def get_indicador_by_ibge(db: Session, ibge_code: str):
    return db.query(models.Indicador).filter(models.Indicador.ibge_code == ibge_code).first()

# POIs
def list_pois(db: Session, skip:int=0, limit:int=100):
    return db.query(models.POI).offset(skip).limit(limit).all()

def list_pois_in_bbox(db: Session, min_lon: float, min_lat: float, max_lon: float, max_lat: float, tipo: Optional[str]=None):
    q = db.query(models.POI).filter(
        models.POI.longitude >= min_lon,
        models.POI.longitude <= max_lon,
        models.POI.latitude >= min_lat,
        models.POI.latitude <= max_lat
    )
    if tipo:
        q = q.filter(models.POI.tipo == tipo)
    return q.all()

def create_poi(db: Session, poi_in: schemas.POICreate):
    poi = models.POI(
        municipio_id = poi_in.municipio_id,
        tipo = poi_in.tipo,
        nome = poi_in.nome,
        latitude = poi_in.latitude,
        longitude = poi_in.longitude
    )
    db.add(poi)
    db.commit()
    db.refresh(poi)
    return poi

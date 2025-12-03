from typing import List, Optional
from sqlalchemy.orm import Session
from . import models, schemas

def list_municipios(db: Session, skip: int = 0, limit: int = 100) -> List[models.Municipio]:
    return db.query(models.Municipio).offset(skip).limit(limit).all()

def get_municipio_by_ibge(db: Session, ibge_code: str) -> Optional[models.Municipio]:
    return db.query(models.Municipio).filter(models.Municipio.ibge_code == ibge_code).first()

# Indicadores
def get_indicador_by_ibge(db: Session, ibge_code: str):
    return db.query(models.Indicador).filter(models.Indicador.ibge_code == ibge_code).first()

def list_indicadores(db: Session, skip: int = 0, limit: int = 100) -> List[models.Indicador]:
    return db.query(models.Indicador).offset(skip).limit(limit).all()

# POIs
def list_pois(db: Session, skip:int=0, limit:int=100):
    return db.query(models.POI).offset(skip).limit(limit).all()

def list_pois_by_type(db: Session, tipo: str, skip:int=0, limit:int=100):
    return db.query(models.POI).filter(models.POI.tipo == tipo).offset(skip).limit(limit).all()

def list_pois_by_municipio(db: Session, ibge_code: str, skip: int = 0, limit: int = 500):
    """
    Filtra POIs por município (via ibge_code).
    Busca o municipio pelo ibge_code e depois lista POIs com seu ID.
    """
    municipio = db.query(models.Municipio).filter(
        models.Municipio.ibge_code == ibge_code
    ).first()
    
    if not municipio:
        return []
    
    return db.query(models.POI).filter(
        models.POI.municipio_id == municipio.id
    ).offset(skip).limit(limit).all()

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

def get_poi_types(db: Session) -> List[str]:
    """
    Retorna lista de tipos de POIs únicos no banco de dados.
    """
    results = db.query(models.POI.tipo).distinct().filter(models.POI.tipo.isnot(None)).all()
    return sorted([r[0] for r in results if r[0]])

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

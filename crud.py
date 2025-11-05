# app/crud.py
from sqlalchemy.orm import Session
from . import models

def get_pois_filtered(db: Session, category: str = None, municipality_id: int = None, bbox: tuple = None, limit: int = 100):
    q = db.query(models.POI)
    if category:
        q = q.filter(models.POI.category == category)
    if municipality_id:
        q = q.filter(models.POI.municipality_id == municipality_id)
    if bbox:
        minx,miny,maxx,maxy = bbox
        q = q.filter(models.POI.lon >= minx, models.POI.lon <= maxx,
                     models.POI.lat >= miny, models.POI.lat <= maxy)
    return q.limit(limit).all()

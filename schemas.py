# app/schemas.py
from pydantic import BaseModel
from typing import Optional, List, Dict

class POIBase(BaseModel):
    id: int
    category: str
    name: Optional[str]
    lat: Optional[float]
    lon: Optional[float]
    municipality_id: Optional[int]

class POICreate(POIBase):
    pass

class POIOut(POIBase):
    id: int
    class Config:
        orm_mode = True

class MunicipalityOut(BaseModel):
    id: int
    name: str
    lat: Optional[float]
    lon: Optional[float]
    geom: Optional[Dict]  # decode GeoJSON string to dict before returning
    class Config:
        orm_mode = True

class IndicatorOut(BaseModel):
    municipality_id: int
    idh: Optional[float]
    saneamento: Optional[float]
    renda_per_capita: Optional[float]
    class Config:
        orm_mode = True

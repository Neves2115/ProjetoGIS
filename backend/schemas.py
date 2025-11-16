# schemas.py
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


# ----------------------------
# Municipio
# ----------------------------
class MunicipioBase(BaseModel):
    ibge_code: str = Field(..., example="3500105")
    nome: str = Field(..., example="Adamantina")
    geometry: Optional[Any] = Field(None, description="GeoJSON")

class MunicipioCreate(MunicipioBase):
    pass

class MunicipioUpdate(BaseModel):
    nome: Optional[str] = None
    geometry: Optional[Any] = None

class MunicipioOut(MunicipioBase):
    id: int

    class Config:
        orm_mode = True


# ----------------------------
# Indicador
# ----------------------------
class IndicadorBase(BaseModel):
    ibge_code: str = Field(..., example="3500105")
    idh: Optional[float] = Field(None, example=0.754)
    idh_renda: Optional[float] = Field(None, example=0.754)
    idh_longevidade: Optional[float] = Field(None, example=0.754)
    idh_educacao: Optional[float] = Field(None, example=0.754)
    renda_per_capita: Optional[float] = Field(None, example=457517.7)
    saneamento: Optional[float] = Field(None, example=97.36)

class IndicadorCreate(IndicadorBase):
    pass

class IndicadorUpdate(BaseModel):
    idh: Optional[float] = None
    idh_renda: Optional[float] = None
    idh_longevidade: Optional[float] = None
    idh_educacao: Optional[float] = None
    renda_per_capita: Optional[float] = None
    saneamento: Optional[float] = None

class IndicadorOut(IndicadorBase):
    id: int

    class Config:
        orm_mode = True


# ----------------------------
# POI
# ----------------------------
class POIBase(BaseModel):
    municipio_id: Optional[int] = Field(None, description="FK to municipios.id")
    tipo: Optional[str] = Field(None, example="hospital")
    nome: Optional[str] = Field(None, example="Hospital Central")
    latitude: float = Field(..., example=-23.5101097)
    longitude: float = Field(..., example=-46.4983227)


class POICreate(POIBase):
    pass

class POIUpdate(BaseModel):
    tipo: Optional[str] = None
    nome: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    properties: Optional[Dict[str, Any]] = None

class POIOut(POIBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# ----------------------------
# Convenience response schemas
# ----------------------------
class MunicipioList(BaseModel):
    total: int
    items: List[MunicipioOut]

class POIList(BaseModel):
    total: int
    items: List[POIOut]

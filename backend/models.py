from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class Municipio(Base):
    __tablename__ = "municipios"
    id = Column(Integer, primary_key=True)
    ibge_code = Column(String, unique=True, index=True, nullable=False)
    nome = Column(String, nullable=False)
    geometry = Column(String)  

class Indicador(Base):
    __tablename__ = "indicadores"
    id = Column(Integer, primary_key=True)
    ibge_code = Column(String, index=True, nullable=False)
    idh = Column(Float)
    idh_renda = Column(Float)         
    idh_longevidade = Column(Float)   
    idh_educacao = Column(Float)      
    renda_per_capita = Column(Float)
    saneamento = Column(Float)


class POI(Base):
    __tablename__ = "pois"
    id = Column(Integer, primary_key=True)
    municipio_id = Column(Integer, index=True)       # FK lógica com municipios.id
    tipo = Column(String, index=True)                 # e.g. 'hospital','park'
    nome = Column(String, nullable=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    created_at = Column(DateTime, default=func.now()) 
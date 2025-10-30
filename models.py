# app/models.py
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db import Base

class Municipality(Base):
    __tablename__ = "municipalities"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    lat = Column(Float)
    lon = Column(Float)
    geom = Column(Text)   # GeoJSON string or WKT (we'll treat as GeoJSON text)

    pois = relationship("POI", back_populates="municipality")
    indicator = relationship("Indicator", uselist=False, back_populates="municipality")

class POI(Base):
    __tablename__ = "pois"
    id = Column(Integer, primary_key=True)
    category = Column(String, nullable=False)    # saúde, educacao, seguranca, parques, centros_sociais
    name = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=True)

    municipality = relationship("Municipality", back_populates="pois")

class Indicator(Base):
    __tablename__ = "indicators"
    id = Column(Integer, primary_key=True)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), unique=True)
    idh = Column(Float)
    saneamento = Column(Float)
    renda_per_capita = Column(Float)

    municipality = relationship("Municipality", back_populates="indicator")

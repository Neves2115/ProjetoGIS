# api/routes/municipios.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..db import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.MunicipioOut])
def read_municipios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.list_municipios(db, skip=skip, limit=limit)

@router.get("/{ibge_code}", response_model=schemas.MunicipioOut)
def read_municipio(ibge_code: str, db: Session = Depends(get_db)):
    m = crud.get_municipio_by_ibge(db, ibge_code)
    if not m:
        raise HTTPException(status_code=404, detail="Municipio not found")
    return m

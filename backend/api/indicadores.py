# api/routes/indicadores.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..db import get_db

router = APIRouter()

@router.get("/{ibge_code}", response_model=schemas.IndicadorOut)
def get_indicador(ibge_code: str, db: Session = Depends(get_db)):
    ind = crud.get_indicador_by_ibge(db, ibge_code)
    if not ind:
        raise HTTPException(status_code=404, detail="Indicador not found")
    return ind

# backend/db.py (exemplo)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from pathlib import Path
from typing import Generator

# determina o path absoluto da raiz do projeto a partir de backend/
BASE_DIR = Path(__file__).resolve().parent      # backend/
PROJECT_ROOT = BASE_DIR.parent                   # pasta projeto (uma acima)
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)     # garante que data/ exista

DB_PATH = DATA_DIR / "db.sqlite"
DB_URL = f"sqlite:///{DB_PATH}"

# opcional: debug
print("Using SQLite DB at:", DB_PATH)

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

# dependency for FastAPI
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

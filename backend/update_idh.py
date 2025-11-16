import csv
import sqlite3
import pandas as pd
import re
from unidecode import unidecode
from pathlib import Path

DB_PATH = Path("../data/db.sqlite")
IDH_CSV = Path("../data/idh.csv")   # ajuste se necessário
OUT_UNMATCHED = Path("../data/idh_unmatched.csv")

def normalize_name(s):
    s = "" if s is None else str(s)
    s = s.strip().lower()
    s = unidecode(s)
    s = re.sub(r'[^a-z0-9\s]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def parse_num_str(x):
    if pd.isna(x): return None
    s = str(x).strip()
    s = s.replace(" ", "")
    # remove thousand separators and replace decimal comma
    s = s.replace(".", "").replace(",", ".")
    s = re.sub(r'[^\d\.-]', '', s)
    try:
        return float(s)
    except:
        return None

if not DB_PATH.exists():
    raise SystemExit(f"DB not found: {DB_PATH.resolve()}")

if not IDH_CSV.exists():
    raise SystemExit(f"IDH CSV not found: {IDH_CSV.resolve()}")

# 1) Build mapping nome_norm -> ibge_code from municipios table
conn = sqlite3.connect(str(DB_PATH))
cur = conn.cursor()

cur.execute("SELECT id, ibge_code, nome FROM municipios")
mun_rows = cur.fetchall()
name_to_ibge = {}
for _id, ibge_code, nome in mun_rows:
    name_to_ibge[normalize_name(nome)] = ibge_code

# 2) Ensure indicadores table has extra columns
cur.execute("PRAGMA table_info(indicadores)")
cols = [r[1] for r in cur.fetchall()]
to_add = []
if 'idh_renda' not in cols:
    to_add.append(("idh_renda", "REAL"))
if 'idh_longevidade' not in cols:
    to_add.append(("idh_longevidade", "REAL"))
if 'idh_educacao' not in cols:
    to_add.append(("idh_educacao", "REAL"))

for col_name, col_type in to_add:
    sql = f"ALTER TABLE indicadores ADD COLUMN {col_name} {col_type}"
    cur.execute(sql)
    print(f"Added column: {col_name}")

conn.commit()

# 3) Read idh CSV robustly (skip header quirks)
# try common encodings
encodings = ["utf-8", "cp1252", "latin-1"]
df = None
for enc in encodings:
    try:
        df = pd.read_csv(IDH_CSV, encoding=enc)
        break
    except Exception:
        df = None
if df is None:
    raise SystemExit("Failed to read IDH CSV with tried encodings")

# normalize column names
cols = [c.strip() for c in df.columns]
df.columns = cols

# heuristics to find columns
col_mun = next((c for c in df.columns if 'mun' in c.lower()), None)
col_idh = next((c for c in df.columns if re.fullmatch(r'idh\b', c.strip().lower()) or c.strip().lower() == 'idh' ), None)
col_renda = next((c for c in df.columns if 'renda' in c.lower()), None)
col_long = next((c for c in df.columns if 'longev' in c.lower() or 'longevid' in c.lower()), None)
col_educ = next((c for c in df.columns if 'educ' in c.lower()), None)

if col_mun is None:
    raise SystemExit("Could not find municipality column in IDH CSV")

print("Detected columns:", dict(
    municipio=col_mun, idh=col_idh, renda=col_renda, longevidade=col_long, educacao=col_educ
))

# 4) Iterate rows, match, update DB
unmatched = []
updated = 0
inserted = 0

for _, r in df.iterrows():
    nome_raw = r[col_mun] if col_mun in r else None
    nome_norm = normalize_name(nome_raw)
    ibge = name_to_ibge.get(nome_norm)
    idh_val = parse_num_str(r[col_idh]) if col_idh else None
    idh_renda = parse_num_str(r[col_renda]) if col_renda else None
    idh_long = parse_num_str(r[col_long]) if col_long else None
    idh_educ = parse_num_str(r[col_educ]) if col_educ else None

    if not ibge:
        unmatched.append({
            "nome_original": nome_raw,
            "nome_norm": nome_norm,
            "idh": idh_val,
            "idh_renda": idh_renda,
            "idh_longevidade": idh_long,
            "idh_educacao": idh_educ
        })
        continue

    # check if existe registro em indicadores
    cur.execute("SELECT id FROM indicadores WHERE ibge_code = ?", (str(ibge),))
    row = cur.fetchone()
    if row:
        # update existing
        cur.execute("""
            UPDATE indicadores SET
                idh = COALESCE(?, idh),
                idh_renda = COALESCE(?, idh_renda),
                idh_longevidade = COALESCE(?, idh_longevidade),
                idh_educacao = COALESCE(?, idh_educacao)
            WHERE ibge_code = ?
        """, (idh_val, idh_renda, idh_long, idh_educ, str(ibge)))
        updated += 1
    else:
        # insert new row (keep other fields NULL)
        cur.execute("""
            INSERT INTO indicadores (ibge_code, idh, idh_renda, idh_longevidade, idh_educacao)
            VALUES (?, ?, ?, ?, ?)
        """, (str(ibge), idh_val, idh_renda, idh_long, idh_educ))
        inserted += 1

conn.commit()
conn.close()

# 5) write unmatched for manual review
if unmatched:
    OUT_UNMATCHED.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_UNMATCHED, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(unmatched[0].keys()))
        writer.writeheader()
        writer.writerows(unmatched)
    print(f"Wrote {len(unmatched)} unmatched rows to {OUT_UNMATCHED}")

print(f"Done. updated={updated}, inserted={inserted}, unmatched={len(unmatched)}")

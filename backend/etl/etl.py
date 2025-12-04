import json
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import re
from unidecode import unidecode
from backend.models import Base, Municipio, Indicador, POI

def normalize_name(s):
    s = "" if pd.isna(s) else str(s)
    s = s.strip().lower()
    s = unidecode(s)
    s = re.sub(r'[^a-z0-9\s]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def parse_num_str(x):
    if pd.isna(x): return None
    s = str(x).strip()
    s = s.replace(" ", "").replace(".", "")
    s = s.replace(",", ".")
    s = re.sub(r'[^\d\.-]', '', s)
    try:
        return float(s)
    except:
        return None

# ---------- CONFIG ----------
MUNICIPIOS_FILE = "data/municipios.json"
POIS_FILE =  "data/pois_sp.geojson"
INDICADORES_FILES = [
    "data/pib_per_capita.csv",   
    "data/idh.csv",
    "data/saneamento.csv"
]
DB_URL = "sqlite:///data/db.sqlite"   # cria/usa data/db.sqlite
# ----------------------------

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine)

def load_municipios():
    print("Lendo municípios:", MUNICIPIOS_FILE)
    gdf = gpd.read_file(MUNICIPIOS_FILE)
    gdf = gdf.to_crs(epsg=4326)

    ibge_col = [c for c in gdf.columns if "id" in c.lower()]
    name_col = [c for c in gdf.columns if "name" in c.lower()]

    gdf['ibge_code'] = gdf[ibge_col].astype(str)
    gdf['nome'] = gdf[name_col].astype(str)
    gdf['nome_norm'] = gdf['nome'].apply(normalize_name)    
    gdf['geometry'] = gdf.geometry.buffer(0)

    # criar DB e inserir municipios
    Base.metadata.create_all(engine)
    session = Session()
    print("Inserindo municípios no DB...")
    for _, row in gdf.iterrows():
        geom_geojson = json.dumps(row.geometry.__geo_interface__, ensure_ascii=False)
        existing = session.query(Municipio).filter_by(ibge_code=str(row['ibge_code'])).one_or_none()
        if existing:
            existing.nome = row['nome']
            existing.geometry = geom_geojson
        else:
            m = Municipio(ibge_code=str(row['ibge_code']), nome=row['nome'], geometry=geom_geojson)
            session.add(m)
    session.commit()
    session.close()
    return gdf[['ibge_code','nome','nome_norm','geometry']].copy()

from pathlib import Path

def load_indicadores(gdf_munis):
    ibge_ref = pd.DataFrame({
        'ibge_code': gdf_munis['ibge_code'].astype(str),
        'nome': gdf_munis['nome'].astype(str)
    })
    ibge_ref['nome_norm'] = ibge_ref['nome'].apply(normalize_name)

    all_rows = []
    for fpath in INDICADORES_FILES:
        f = Path(fpath)
        if not f.exists():
            print("Arquivo não encontrado:", f)
            continue

        # tenta ler CSV; saneamento pode ter separador ';'
        if "saneamento" in f.name.lower():
            for enc in ("utf-8", "cp1252", "latin-1"):
                try:
                    df = pd.read_csv(f, sep=';', encoding=enc)
                    break
                except Exception:
                    df = None
        else:
            for enc in ("utf-8", "cp1252", "latin-1"):
                try:
                    df = pd.read_csv(f, encoding=enc)
                    break
                except Exception:
                    df = None

        if df is None:
            print("Falha ao ler:", f)
            continue

        # encontra coluna do município no CSV (heurística simples)
        mun_col = next((c for c in df.columns if 'mun' in c.lower() or 'municip' in c.lower()), df.columns[0])

        # cria linhas padronizadas: nome_municipio + as colunas numéricas parseadas
        for _, r in df.iterrows():
            nome_raw = str(r[mun_col]) if not pd.isna(r[mun_col]) else ""
            nome_norm = normalize_name(nome_raw)
            # tenta extrair alguns valores comuns
            # procura por coluna com 'pib' ou 'renda' no nome
            pib_val = None
            idh_val = None
            sane_val = None
            ano_val = None
            for c in df.columns:
                lc = c.lower()
                val = r[c]
                if pd.isna(val):
                    continue
                if 'pib' in lc:
                    pib_val = parse_num_str(val)
                if 'ano' in lc:
                    ano_val = parse_num_str(val)                    
                if 'idh' in lc:
                    idh_val = parse_num_str(val)
                if 'in046' in lc  in lc:
                    sane_val = parse_num_str(val)
            all_rows.append({
                'nome_municipio': nome_raw,
                'nome_norm': nome_norm,
                'pib_per_capita': pib_val,
                'idh': idh_val,
                'saneamento': sane_val,
                'ano': ano_val,
                'source': f.name
            })

    if not all_rows:
        print("Nenhum indicador carregado.")
        return

    indicators_df = pd.DataFrame(all_rows)

    indicators_df['nome_norm'] = indicators_df['nome_norm'].astype(str)
    indicators_df = indicators_df.merge(ibge_ref[['ibge_code','nome_norm']],
                                        on='nome_norm', how='right')  # right garante manter todos IBGE

    # --- AGREGAR PARA UMA LINHA POR MUNICÍPIO ---
    # 1) saneamento mais recente
    if 'ano' in indicators_df.columns:
        sane_latest = (
            indicators_df.dropna(subset=['saneamento', 'ano'])
            .sort_values(['nome_norm', 'ano'])
            .drop_duplicates(subset='nome_norm', keep='last')
            [['nome_norm','saneamento']]
        )
    else:
        # se não temos ano, pega último saneamento não-nulo por ordem de leitura
        sane_latest = (
            indicators_df.dropna(subset=['saneamento'])
            .drop_duplicates(subset='nome_norm', keep='last')
            [['nome_norm','saneamento']]
        )

    # 2) pib_per_capita: primeiro valor não-nulo que aparecer
    pib_first = (
        indicators_df.dropna(subset=['pib_per_capita'])
        .drop_duplicates(subset='nome_norm', keep='first')
        [['nome_norm','pib_per_capita']]
    )

    # 3) idh: primeiro valor não-nulo que aparecer
    idh_first = (
        indicators_df.dropna(subset=['idh'])
        .drop_duplicates(subset='nome_norm', keep='first')
        [['nome_norm','idh']]
    )

    # 4) montar tabela final (uma linha por nome_norm / ibge_code)
    final = ibge_ref[['ibge_code','nome_norm']].merge(pib_first, on='nome_norm', how='left')
    final = final.merge(idh_first, on='nome_norm', how='left')
    final = final.merge(sane_latest, on='nome_norm', how='left')

    # salvar para inspeção
    Path("data").mkdir(exist_ok=True)
    final.to_csv("data/indicators_final.csv", index=False, encoding="utf-8")

    # inserir no DB apenas os com ibge_code
    session = Session()
    inserted = 0
    for _, row in final.dropna(subset=['ibge_code']).iterrows():
        ind = Indicador(
            ibge_code = str(row['ibge_code']),
            idh = float(row['idh']) if pd.notna(row.get('idh')) else None,
            renda_per_capita = float(row['pib_per_capita']) if pd.notna(row.get('pib_per_capita')) else None,
            saneamento = float(row['saneamento']) if pd.notna(row.get('saneamento')) else None
        )
        session.add(ind)
        inserted += 1
    session.commit()
    session.close()
    print(f"Indicadores inseridos: {inserted}")

import math
from sqlalchemy import delete

# -- substitua a função load_pois existente por esta --
def load_pois(gdf_munis, pois_file=POIS_FILE, batch_size=1000):
    print("Lendo POIs:", pois_file)
    # 1) ler geojson (pode ser grande)
    gdf = gpd.read_file(pois_file)
    gdf = gdf.to_crs(epsg=4326)

    # 2) construir dataframe com campos padronizados (tratando id/@id)
    rows = []
    for idx, row in gdf.iterrows():
        # row pode ter colunas extra; também há 'properties' flattened
        props = {}
        try:
            props = dict(row)
        except Exception:
            props = {}

        # geometry -> lat/lon
        geom = row.geometry
        if geom is None:
            continue
        if geom.geom_type == 'Point':
            lon, lat = geom.x, geom.y
        else:
            c = geom.centroid
            lon, lat = c.x, c.y

        # pegar nome / tipo (várias chaves possíveis)
        nome = props.get('name') or props.get('nome') or props.get('Name') or None

        tipo = None
        for k in ('amenity','leisure','shop','tourism','healthcare','office','craft'):
            if k in props and props.get(k) and not pd.isna(props.get(k)):
                tipo = props.get(k)
                break
        # fallback em 'properties' se presente
        if not tipo and 'properties' in props and isinstance(props['properties'], dict):
            for k in ('amenity','leisure','shop','tourism','healthcare','office','craft'):
                if props['properties'].get(k):
                    tipo = props['properties'].get(k); break

        # osm id heurístico (top-level 'id', or properties '@id', or props['@id'], or 'element')
        osm_id = None
        for cand in ('id','@id','element','osm_id','@osm_id'):
            if cand in props and props.get(cand) and not pd.isna(props.get(cand)):
                osm_id = str(props.get(cand))
                break
        # sometimes properties nested
        if not osm_id and 'properties' in props and isinstance(props['properties'], dict):
            for cand in ('@id','id','element','osm_id'):
                if props['properties'].get(cand):
                    osm_id = str(props['properties'].get(cand)); break

        # normalize osm_id (extract numeric if relation/xxxx)
        if osm_id:
            m = re.search(r'(\d+)$', osm_id)
            if m:
                osm_id = m.group(1)

        # sanity: skip invalid coordinates (nan, inf)
        if lat is None or lon is None or math.isnan(lat) or math.isnan(lon) or math.isinf(lat) or math.isinf(lon):
            continue

        rows.append({
            'osm_id': osm_id,
            'nome': nome,
            'tipo': tipo,
            'longitude': float(lon),
            'latitude': float(lat)
        })

    if not rows:
        print("Nenhum POI encontrado no arquivo.")
        return

    df_p = pd.DataFrame(rows)
    pts_gdf = gpd.GeoDataFrame(df_p,
                               geometry=[Point(xy) for xy in zip(df_p.longitude, df_p.latitude)],
                               crs="EPSG:4326")

    # 3) associar município via spatial join
    # gdf_munis deve ser GeoDataFrame com coluna 'ibge_code' e geometry
    muni_polys = gdf_munis[['ibge_code','geometry']].copy()
    if not isinstance(muni_polys, gpd.GeoDataFrame):
        muni_polys = gpd.GeoDataFrame(muni_polys, geometry=muni_polys.geometry, crs="EPSG:4326")

    joined = gpd.sjoin(pts_gdf, muni_polys, how='left', predicate='within')

    # 4) carregar mapping ibge_code -> municipio_id do DB
    session = Session()
    db_munis = session.query(Municipio).all()
    ibge_to_id = {m.ibge_code: m.id for m in db_munis}
    session.close()

    # 5) opcional: apagar POIs existentes (como você quer reinserir)
    session = Session()
    # Use delete() para compatibilidade
    session.execute(delete(POI))
    session.commit()
    print("POIs antigos removidos.")

    # 6) inserir em batches
    inserted = 0
    batch_objs = []
    for _, r in joined.iterrows():
        municipio_id = ibge_to_id.get(str(r.get('ibge_code'))) if r.get('ibge_code') is not None else None
        # construir objeto POI
        poi = POI(
            municipio_id = municipio_id,
            tipo = r.get('tipo') or None,
            nome = r.get('nome') or None,
            latitude = float(r['latitude']),
            longitude = float(r['longitude']),
        )
        batch_objs.append(poi)
        if len(batch_objs) >= batch_size:
            session.bulk_save_objects(batch_objs)
            session.commit()
            inserted += len(batch_objs)
            batch_objs = []
            print(f"Inserted {inserted} POIs...")

    # final batch
    if batch_objs:
        session.bulk_save_objects(batch_objs)
        session.commit()
        inserted += len(batch_objs)

    session.close()
    print(f"POIs inseridos no DB: {inserted}")

# -- no final do arquivo, permitir rodar só os POIs --
if __name__ == "__main__":
    import sys
    print("=== ETL iniciado ===")
    gdf_munis = load_municipios()
    if len(sys.argv) > 1 and sys.argv[1] == "--pois-only":
        load_pois(gdf_munis, pois_file=POIS_FILE)
    else:
        load_indicadores(gdf_munis)
        load_pois(gdf_munis, pois_file=POIS_FILE)
    print("=== ETL finalizado ===")

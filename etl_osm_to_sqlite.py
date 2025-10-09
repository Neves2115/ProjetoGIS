#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ETL OSM → SQLite (Sprint 0)
- Baixa POIs do OpenStreetMap via Overpass para o Estado de São Paulo (BR-SP) por padrão
- Insere no schema SQLite definido no Sprint 0 (schema.sql)
- Dedup: UNIQUE (poi_type_id, external_id) com INSERT OR IGNORE
- Loga ingestão em ingestion_batch/ingestion_log

Licença dos dados: ODbL 1.0 — © OpenStreetMap contributors
"""
import os, sys, json, time, csv, argparse, sqlite3, requests
from datetime import datetime

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
UA = "usp-gis-sprint0/1.0 (+contact: your-email@example.com)"

CATEGORY_QUERIES = {
    "SCHOOL":  '(nwr["amenity"="school"];)',
    "HOSPITAL":'(nwr["amenity"="hospital"];nwr["amenity"="clinic"];)',
    "POLICE":  '(nwr["amenity"="police"];)',
    "PARK":    '(nwr["leisure"="park"];)',
    "SANITATION_FACILITY": '(nwr["man_made"="wastewater_plant"];nwr["man_made"="water_works"];nwr["man_made"="water_tower"];)',
}

def build_area_query(body, area_key="ISO3166-2", area_val="BR-SP", wikidata=None):
    if wikidata:
        return f'[out:json][timeout:180];area["wikidata"="{wikidata}"]->.a;{body}out center tags;'
    return f'[out:json][timeout:180];area["{area_key}"="{area_val}"]->.a;{body}out center tags;'

def http_post_overpass(query, timeout, retries, sleep):
    headers = {"User-Agent": UA}
    for attempt in range(1, retries+1):
        try:
            r = requests.post(OVERPASS_URL, data={"data": query}, headers=headers, timeout=timeout)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            if attempt == retries:
                raise
            time.sleep(sleep * attempt)

def ensure_unique_index(conn):
    conn.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS ux_poi_type_external
        ON poi(poi_type_id, external_id)
        WHERE external_id IS NOT NULL
    """)
    conn.commit()

def resolve_poi_type_id(conn, poi_type_code):
    cur = conn.execute("SELECT poi_type_id FROM poi_type WHERE code=?", (poi_type_code,))
    row = cur.fetchone()
    if row: return row[0]
    conn.execute("INSERT INTO poi_type(code,label) VALUES(?,?)", (poi_type_code, poi_type_code.title()))
    conn.commit()
    return conn.execute("SELECT last_insert_rowid()").fetchone()[0]

def load_muni_lookup(csv_path):
    if not csv_path: return {}
    out = {}
    with open(csv_path, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            name = (row.get("name") or "").strip().lower()
            ibge = (row.get("ibge_code") or "").strip()
            if name and ibge:
                out[name] = ibge
    return out

def map_municipality_id(conn, ibge_code):
    if not ibge_code: return None
    cur = conn.execute("SELECT municipality_id FROM municipality WHERE ibge_code=?", (ibge_code,))
    row = cur.fetchone()
    return row[0] if row else None

def infer_city_ibge_from_tags(lookup, tags):
    city = tags.get("addr:city") or tags.get("is_in:city") or ""
    if not city: return None
    return lookup.get(city.strip().lower())

def normalize_address(tags):
    parts = []
    if "addr:street" in tags: parts.append(tags["addr:street"])
    if "addr:housenumber" in tags: parts.append(tags["addr:housenumber"])
    if "addr:city" in tags: parts.append(tags["addr:city"])
    if "addr:postcode" in tags: parts.append(tags["addr:postcode"])
    return ", ".join(parts) if parts else None

def extract_lat_lon(elem):
    if elem.get("type") == "node":
        return elem.get("lat"), elem.get("lon")
    center = elem.get("center") or {}
    return center.get("lat"), center.get("lon")

def open_batch(conn, source_note):
    cur = conn.execute("INSERT INTO ingestion_batch(source, notes) VALUES(?,?)", (source_note, "ETL OSM → SQLite"))
    conn.commit()
    return cur.lastrowid

def log_ingestion(conn, batch_id, entity, entity_id, action, details_dict):
    conn.execute("""
        INSERT INTO ingestion_log(batch_id, entity, entity_id, action, details_json)
        VALUES (?, ?, ?, ?, ?)
    """, (batch_id, entity, entity_id, action, json.dumps(details_dict, ensure_ascii=False)))
    conn.commit()

def insert_poi(conn, poi_type_id, name, address, municipality_id, lat, lon, props_json, source, external_id):
    cur = conn.cursor()
    cur.execute("""
        INSERT OR IGNORE INTO poi
        (poi_type_id, name, address, municipality_id, latitude, longitude, properties_json, source, external_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (poi_type_id, name, address, municipality_id, lat, lon, props_json, source, external_id))
    conn.commit()
    if cur.lastrowid:
        return cur.lastrowid, True
    cur = conn.execute("""SELECT poi_id FROM poi WHERE poi_type_id=? AND external_id=?""", (poi_type_id, external_id))
    row = cur.fetchone()
    return (row[0] if row else None), False

def run_etl(args):
    conn = sqlite3.connect(args.db)
    conn.execute("PRAGMA foreign_keys = ON;")
    ensure_unique_index(conn)

    muni_lookup = load_muni_lookup(args.municipality_lookup)
    source_note = f"OSM/Overpass {datetime.utcnow().date().isoformat()} area={args.area_key}:{args.area_val or ''} wikidata={args.wikidata or ''}"
    batch_id = open_batch(conn, source_note)

    categories = args.categories or list(CATEGORY_QUERIES.keys())
    for cat in categories:
        if cat not in CATEGORY_QUERIES:
            print(f"[WARN] Categoria desconhecida: {cat}. Pulando…")
            continue
        print(f"== Categoria: {cat}")
        poi_type_id = resolve_poi_type_id(conn, cat)

        query = build_area_query(CATEGORY_QUERIES[cat], area_key=args.area_key, area_val=args.area_val, wikidata=args.wikidata)
        data = http_post_overpass(query, timeout=args.timeout, retries=args.retries, sleep=args.sleep)
        elements = data.get("elements", [])
        print(f"   • retornados: {len(elements)} elementos")

        inserted, reused = 0, 0
        for e in elements:
            tags = e.get("tags", {})

            lat, lon = extract_lat_lon(e)
            if lat is None or lon is None:
                continue

            name = tags.get("name") or f"{cat.title()} sem nome"
            address = normalize_address(tags)

            ibge_code = infer_city_ibge_from_tags(muni_lookup, tags)
            municipality_id = map_municipality_id(conn, ibge_code) if ibge_code else None

            keep = {k: tags[k] for k in tags if k.startswith(("addr:", "phone", "operator", "opening_hours", "capacity", "leitos", "website"))}
            props = {"osm_type": e.get("type"), "osm_id": e.get("id"), "tags": keep}
            ext_id = f"{e.get('type')}/{e.get('id')}"

            poi_id, did_insert = insert_poi(
                conn, poi_type_id, name, address, municipality_id, lat, lon,
                json.dumps(props, ensure_ascii=False), "OSM/Overpass", ext_id
            )
            log_ingestion(conn, batch_id, "poi", poi_id, "insert" if did_insert else "skip",
                          {"category": cat, "external_id": ext_id})
        print("   • done; respeitando rate-limit…")
        time.sleep(args.sleep)

    conn.close()
    print("ETL finalizado. Credite © OpenStreetMap contributors (ODbL 1.0).")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ETL OSM → SQLite (Sprint 0)")
    parser.add_argument("--db", required=True, help="Caminho para o SQLite (ex.: gis.db)")
    parser.add_argument("--categories", nargs="*", help="Categorias: SCHOOL HOSPITAL POLICE PARK SANITATION_FACILITY")
    parser.add_argument("--area-key", default="ISO3166-2", help='Chave da área Overpass (default: ISO3166-2)')
    parser.add_argument("--area-val", default="BR-SP", help='Valor da área Overpass (default: BR-SP)')
    parser.add_argument("--wikidata", default=None, help='Alternativa de área: QID do estado (ex.: Q175 para São Paulo)')
    parser.add_argument("--sleep", type=int, default=3, help="Segundos entre chamadas (rate limiting)")
    parser.add_argument("--retries", type=int, default=3, help="Tentativas HTTP em falha")
    parser.add_argument("--timeout", type=int, default=300, help="Timeout Overpass (s)")
    parser.add_argument("--municipality-lookup", default=None, help="CSV com colunas name,ibge_code")
    args = parser.parse_args()
    run_etl(args)

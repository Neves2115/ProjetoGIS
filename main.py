# gis_osm_sp.py
import time
import json
import requests
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
# Timeout/pausa para ser gentil com o servidor
SLEEP_BETWEEN_REQUESTS = 1.0

Base = declarative_base()

class POI(Base):
    __tablename__ = "pois"
    id = Column(Integer, primary_key=True)
    osm_id = Column(String, nullable=False)
    osm_type = Column(String, nullable=False)  # node/way/relation
    category = Column(String, nullable=False)  # our mapped category (park,hospital,...)
    name = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    tags = Column(Text)  # json string
    __table_args__ = (UniqueConstraint('osm_id', 'osm_type', 'category', name='_osm_uc'),)

def make_overpass_query(tag_filters):
    # tag_filters = list of (key,value,category_name) tuples
    tags_clause = []
    for k,v,_cat in tag_filters:
        tags_clause.append(f'node["{k}"="{v}"](area.searchArea);')
        tags_clause.append(f'way["{k}"="{v}"](area.searchArea);')
        tags_clause.append(f'relation["{k}"="{v}"](area.searchArea);')
    inner = "\n".join(tags_clause)
    # Query area by name 'São Paulo' (admin_level 4 usually for states in Brazil)
    q = f"""
[out:json][timeout:180];
area["name"="São Paulo"]["admin_level"="4"]->.searchArea;
(
{inner}
);
out center;  // center gives lat/lon for ways/relations
"""
    return q

def fetch_pois(tag_filters):
    query = make_overpass_query(tag_filters)
    r = requests.post(OVERPASS_URL, data={'data': query})
    r.raise_for_status()
    time.sleep(SLEEP_BETWEEN_REQUESTS)
    return r.json()

def parse_and_store(data_json, tag_filters, session):
    # build mapping from tag (k,v) to category
    map_kv_to_cat = {(k,v):cat for k,v,cat in tag_filters}
    elements = data_json.get("elements", [])
    inserted = 0
    for el in elements:
        osm_type = el.get("type")            # node, way, relation
        osm_id = str(el.get("id"))
        tags = el.get("tags", {}) or {}
        # Determine category by matching any tag in our list (first match)
        category = None
        for k,v,cat in tag_filters:
            if tags.get(k) == v:
                category = cat
                break
        if category is None:
            continue
        # get coordinates
        if osm_type == "node":
            lat = el.get("lat")
            lon = el.get("lon")
        else:
            center = el.get("center") or {}
            lat = center.get("lat")
            lon = center.get("lon")
        # name may be absent
        name = tags.get("name")
        # store (ignore duplicates by unique constraint)
        poi = POI(osm_id=osm_id, osm_type=osm_type, category=category,
                  name=name, lat=lat, lon=lon, tags=json.dumps(tags, ensure_ascii=False))
        try:
            session.add(poi)
            session.commit()
            inserted += 1
        except Exception as e:
            session.rollback()  # likely duplicate or other DB constraint
    return inserted

def main(db_path="sqlite:///pois_sp.db"):
    # define which tags to fetch and the category we assign
    tag_filters = [
        ("leisure", "park", "park"),
        ("amenity", "hospital", "hospital"),
        ("healthcare", "clinic", "hospital"),
        ("amenity", "clinic", "clinic"),
        ("amenity", "police", "police"),
        ("amenity", "school", "school"),
        ("amenity", "social_facility", "social_facility"),
    ]

    engine = create_engine(db_path, echo=False, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    print("Consultando Overpass (pode demorar alguns segundos/minutos)...")
    data = fetch_pois(tag_filters)
    count = parse_and_store(data, tag_filters, session)
    print(f"{count} POIs inseridos no banco.")

if __name__ == "__main__":
    main()

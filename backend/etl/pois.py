# instala: pip install osmnx geopandas
import osmnx as ox

# tags que queremos (hospitais, escolas, delegacias, centros sociais e parques)
tags = {
  "amenity": ["hospital","school","police","social_facility"],
  "leisure": ["park"]
}

# busca por "São Paulo, Brazil" (pode usar bbox ou nome de cidade/estado)
gdf = ox.features_from_place("São Paulo, Brazil", tags)

# garante WGS84 e salva em GeoJSON
gdf = gdf.to_crs(epsg=4326)
gdf.to_file("data/pois_sp.geojson", driver="GeoJSON")
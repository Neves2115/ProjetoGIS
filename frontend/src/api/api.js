const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

export async function fetchPOIsGeoJSON({ bbox, category } = {}) {
  const params = new URLSearchParams()
  if (bbox) params.set('bbox', bbox)
  if (category) params.set('category', category)
  const url = `${API_BASE}/pois/?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar POIs')
  return res.json()
}

export async function fetchMunicipalities(q='') {
  const url = `${API_BASE}/municipios?q=${encodeURIComponent(q)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar municípios')
  return res.json()
}

export async function fetchMunicipalitiesGeoJSON() {
  const url = `${API_BASE}/municipios/geojson`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar municípios')
  return res.json() // já retorna { type: "FeatureCollection", features: [...] }
}

export async function fetchIndicadorByIbge(ibge_code) {
  const url = `${API_BASE}/indicadores/${encodeURIComponent(ibge_code)}`
  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('Erro ao buscar indicador')
  }
  return res.json()
}

export async function fetchAllIndicadores() {
  const url = `${API_BASE}/indicadores`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar todos os indicadores')
  return res.json() // espera array [{ ibge_code, idh, idh_renda, ... }, ...]
}

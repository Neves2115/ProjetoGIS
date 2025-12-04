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

// ===================== POI FILTERING =====================

export async function fetchPOITypes() {
  const url = `${API_BASE}/pois/tipos`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar tipos de POIs')
  return res.json() // { tipos: [...] }
}

/**
 * Filtra POIs por município (usando código IBGE).
 * limit padrão reduzido para 500 para evitar sobrecarga (ajuste conforme precisar).
 */
export async function fetchPOIsByMunicipio(ibgeCode, limit = 500) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  const url = `${API_BASE}/pois/municipio/${encodeURIComponent(ibgeCode)}?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar POIs do município')
  return res.json() // array de POIs
}

/**
 * Filtra POIs por bbox (minLon,minLat,maxLon,maxLat) e opcionalmente por tipo.
 */
export async function fetchPOIsByBbox(minLon, minLat, maxLon, maxLat, tipo = null, limit = 500) {
  const bboxStr = `${minLon},${minLat},${maxLon},${maxLat}`
  const params = new URLSearchParams()
  params.set('bbox', bboxStr)
  if (tipo) params.set('tipo', tipo)
  if (limit) params.set('limit', String(limit))

  const url = `${API_BASE}/pois/bbox?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar POIs na área')
  return res.json()
}

export async function createPOI(payload) {
  const res = await fetch(`${API_BASE}/pois/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to create POI: ${res.status} ${txt}`)
  }
  return res.json()
}

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

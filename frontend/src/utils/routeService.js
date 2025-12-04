/**
 * routeService.js
 * Serviço para gerenciar rotas usando OpenRouteService API
 * Responsável por chamar a API e fornecer funções para desenhar rotas
 */

const OPENROUTE_API_KEY = "5b3ce3597851110001cf624844382de8ef884a54805f919a2573dd35"
const OPENROUTE_BASE_URL = "https://api.openrouteservice.org/v2/directions/foot-walking"

/**
 * Busca rota entre dois pontos usando a API OpenRouteService
 * @param {Object} origin - {lat: number, lng: number}
 * @param {Object} destination - {lat: number, lng: number}
 * @returns {Promise<Array>} Array de coordenadas [lat, lng]
 */
export async function fetchRoute(origin, destination) {
  try {
    const url = `${OPENROUTE_BASE_URL}?api_key=${OPENROUTE_API_KEY}&start=${origin.lng},${origin.lat}&end=${destination.lng},${destination.lat}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Erro ao buscar rota: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.features || !data.features[0] || !data.features[0].geometry) {
      throw new Error('Resposta inválida da API')
    }
    
    // Converte coordenadas de [lng, lat] para [lat, lng]
    const coords = data.features[0].geometry.coordinates.map(c => [c[1], c[0]])
    
    return coords
  } catch (error) {
    console.error('Erro ao buscar rota:', error)
    throw error
  }
}

/**
 * Retorna o objeto de estilo para polyline de rota
 * @returns {Object} Objeto de configuração do Leaflet polyline
 */
export function getRouteStyle() {
  return {
    color: '#0b5ed7',
    weight: 5,
    opacity: 0.8,
    lineCap: 'round',
    lineJoin: 'round',
  }
}

/**
 * Formata distância em km para exibição
 * @param {number} meters - Distância em metros
 * @returns {string} Distância formatada
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(2)}km`
}

/**
 * Formata duração em segundos para exibição
 * @param {number} seconds - Duração em segundos
 * @returns {string} Duração formatada
 */
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`
  }
  return `${minutes}min`
}

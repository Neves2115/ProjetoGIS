import React, { useState } from 'react'
import MunicipalitiesMap from './components/MapView'
import Sidebar from './components/Sidebar'
import POIDetail from './components/POIDetail'
import RouteModal from './components/RouteModal'
import { fetchIndicadorByIbge, fetchAllIndicadores, fetchPOIsByMunicipio, fetchPOIsByBbox } from './api/api'

export default function App(){
  const [selectedMunicipio, setSelectedMunicipio] = useState(null)
  const [indicador, setIndicador] = useState(null)
  const [loadingIndicador, setLoadingIndicador] = useState(false)

  const [choroplethActive, setChoroplethActive] = useState(false)
  const [choroplethIndicator, setChoroplethIndicator] = useState('idh') 
  const [indicatorsMap, setIndicatorsMap] = useState({}) 

  // POI Filtering States
  const [poisMode, setPoisMode] = useState(false)           // está em modo de filtro POIs
  const [pois, setPois] = useState([])                      // POIs filtrados
  const [selectedPOI, setSelectedPOI] = useState(null)       // POI selecionado para detalhe
  const [loadingPois, setLoadingPois] = useState(false)
  const [selectedBbox, setSelectedBbox] = useState(null)     // bbox desenhado no mapa
  const [selectedPoiType, setSelectedPoiType] = useState('')  // tipo de POI selecionado

  // Sidebar resize state
  const [sidebarWidth, setSidebarWidth] = useState(330)

  // ----- NOVOS: criar POI -----
  const [creatingPoiMode, setCreatingPoiMode] = useState(false)
  const [mapClickData, setMapClickData] = useState(null)

  // ----- NOVOS: gerar rotas -----
  const [routeMode, setRouteMode] = useState(false) // true quando aguardando clique para destino
  const [routeOrigin, setRouteOrigin] = useState(null) // POI selecionado como origem
  const [routeSummary, setRouteSummary] = useState(null) // Resumo da rota (distância, tempos)

  // Handler para zerar rota
  function handleResetRoute() {
    setRouteMode(false)
    setRouteOrigin(null)
    setRouteSummary(null)
    setMapClickData(null)
  }

  async function handleSelectMunicipio(props){
    setChoroplethActive(false)
    setSelectedMunicipio(props)
    setIndicador(null)
    setPoisMode(false)
    setPois([])
    if (!props?.ibge_code) return
    setLoadingIndicador(true)
    try{
      const ind = await fetchIndicadorByIbge(props.ibge_code)
      setIndicador(ind)
    }catch(err){
      console.error(err)
    }finally{
      setLoadingIndicador(false)
    }
  }

  function handleBackFromDetail(){
    setSelectedMunicipio(null)
    setIndicador(null)
    setPoisMode(false)
    setPois([])
    setSelectedPOI(null)
    handleResetRoute()
  }

  async function startChoropleth(indKey = 'idh'){
    try{
      const rows = await fetchAllIndicadores()
      const map = {}
      rows.forEach(r => {
        const code = String(r.ibge_code ?? r.ibge ?? '').trim()
        if (code) map[code] = r
      })
      setIndicatorsMap(map)
      setChoroplethIndicator(indKey)
      setChoroplethActive(true)
    }catch(err){
      console.error('Erro ao buscar indicadores para coroplético', err)
    }
  }

  function changeChoroplethIndicator(indKey){
    if (!choroplethActive) {
      setChoroplethIndicator(indKey)
      return
    }
    setChoroplethIndicator(indKey)
  }

  function closeChoropleth(){
    setChoroplethActive(false)
    setChoroplethIndicator('idh')
    setIndicatorsMap({})
  }

  // ----- NOVOS: handlers para criar POI -----
  function startCreatePoi() {
    setCreatingPoiMode(true)
    setMapClickData(null)
  }
  function cancelCreatePoi() {
    setCreatingPoiMode(false)
    setMapClickData(null)
  }

  // recebe do MunicipalitiesMap: { lat, lon, matchedFeature }
  function handleMapClick(payload) {
    // Se estamos em modo rota, gerar rota e sair do modo
    if (routeMode && routeOrigin) {
      generateRoute(routeOrigin, payload)
      setRouteMode(false)
      setRouteOrigin(null)
    } else {
      // Modo normal: criar POI
      setMapClickData(payload)
    }
  }

  async function generateRoute(origin, destination) {
    try {
      const apiKey = "5b3ce3597851110001cf624844382de8ef884a54805f919a2573dd35"
      const url = `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${apiKey}&start=${destination.lon},${destination.lat}&end=${origin.longitude},${origin.latitude}`
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Erro na API')
      
      const data = await response.json()
      const coords = data.features[0].geometry.coordinates.map(c => [c[1], c[0]])
      
      // Extrair distância (em metros) e duração (em segundos)
      const distance = data.features[0].properties.segments[0].distance || 0 // metros
      const duration = data.features[0].properties.segments[0].duration || 0 // segundos
      
      // Calcular tempos aproximados
      // A pé: 1.4 m/s (5 km/h) - velocidade média de caminhada
      // Carro: 15 m/s (54 km/h) - velocidade média urbana
      const walkingTime = Math.round(distance / 1.4) // em segundos
      const drivingTime = Math.round(distance / 15) // em segundos
      
      // Converter para minutos/horas
      const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        if (hours > 0) {
          return `${hours}h ${minutes}min`
        }
        return `${minutes}min`
      }
      
      // Emitir evento para MapView desenhar
      setMapClickData({
        lat: destination.lat,
        lon: destination.lon,
        routeCoords: coords,
        routeOrigin: origin,
        isRoute: true
      })
      
      // Mostrar resumo da rota
      setRouteSummary({
        distance: (distance / 1000).toFixed(2), // em km
        walkingTime: formatTime(walkingTime),
        drivingTime: formatTime(drivingTime),
        originName: origin.nome,
        destinationLat: destination.lat,
        destinationLon: destination.lon
      })
    } catch (error) {
      console.error('Erro ao gerar rota:', error)
      alert('Erro ao gerar rota')
    }
  }

  // POI Filtering Functions
  async function handleFilterPoisByMunicipio(ibgeCode) {
    setLoadingPois(true)
    setPoisMode(true)
    try {
      const filtered = await fetchPOIsByMunicipio(ibgeCode)
      setPois(filtered || [])
    } catch (err) {
      console.error(err)
      setPois([])
    } finally {
      setLoadingPois(false)
    }
  }

  async function handleFilterPoisByBbox(minLon, minLat, maxLon, maxLat, tipo) {
    setLoadingPois(true)
    setPoisMode(true)
    try {
      const filtered = await fetchPOIsByBbox(minLon, minLat, maxLon, maxLat, tipo)
      setPois(filtered || [])
      setSelectedBbox({ minLon, minLat, maxLon, maxLat })
    } catch (err) {
      console.error(err)
      setPois([])
    } finally {
      setLoadingPois(false)
    }
  }

  function handleSelectPOI(poi) {
    setSelectedPOI(poi)
  }

  function closePois() {
  setPoisMode(false)
  setPois([])
  setSelectedPoiType('') // limpa filtro de tipo também
  setSelectedBbox(null)
}

  function handleClosePOIDetail() {
    setSelectedPOI(null)
  }

  function handleStartRoute(poiData) {
    // Fechar modal e ativar modo rota
    setSelectedPOI(null)
    setRouteMode(true)
    setRouteOrigin(poiData)
  }

  const handleMouseDown = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidth

    const handleMouseMove = (moveEvent) => {
      const diff = moveEvent.clientX - startX
      const newWidth = Math.max(250, Math.min(600, startWidth + diff)) // min 250px, max 600px
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // quando um POI é criado com sucesso, opcionalmente re-carregar os POIs do município atual
  async function handlePoiCreated(newPoi) {
    // se estivermos em modo de filtro por município, re-carrega
    if (selectedMunicipio?.ibge_code) {
      try {
        const filtered = await fetchPOIsByMunicipio(selectedMunicipio.ibge_code)
        setPois(filtered || [])
      } catch (err) {
        console.error('Erro ao recarregar POIs após criação', err)
      }
    }
    // fechar modo criar (se aberto)
    setCreatingPoiMode(false)
    setMapClickData(null)
  }

  return (
    <div style={{display:'flex', height:'100vh'}}>
      <div style={{width: sidebarWidth, position: 'relative', display: 'flex', flexDirection: 'column'}}>
        <Sidebar
          selectedMunicipio={selectedMunicipio}
          indicador={indicador}
          loadingIndicador={loadingIndicador}
          onBack={handleBackFromDetail}
          onStartChoropleth={startChoropleth}
          onChangeChoroplethIndicator={changeChoroplethIndicator}
          onCloseChoropleth={closeChoropleth}
          choroplethActive={choroplethActive}
          currentIndicator={choroplethIndicator}
          poisMode={poisMode}
          pois={pois}
          loadingPois={loadingPois}
          selectedPoiType={selectedPoiType}
          onFilterPoisByMunicipio={handleFilterPoisByMunicipio}
          onFilterPoisByBbox={handleFilterPoisByBbox}
          onSetSelectedPoiType={setSelectedPoiType}

          // novos props
          creatingPoiMode={creatingPoiMode}
          onStartCreatePoi={startCreatePoi}
          onCancelCreatePoi={cancelCreatePoi}
          mapClickData={mapClickData}
          onPoiCreated={handlePoiCreated}
          onClosePois={closePois}
          
          // route props
          routeMode={routeMode}
          onResetRoute={handleResetRoute}
        />
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: 6,
            height: '100%',
            position: 'absolute',
            right: -3,
            top: 0,
            cursor: 'col-resize',
            backgroundColor: 'transparent',
            borderRight: '3px solid transparent',
            transition: 'border-color 0.2s',
            userSelect: 'none',
            zIndex: 1000
          }}
          onMouseEnter={(e) => {
            e.target.style.borderRightColor = '#0b5ed7'
          }}
          onMouseLeave={(e) => {
            e.target.style.borderRightColor = 'transparent'
          }}
        />
      </div>
      <div style={{flex:1, display: 'flex', flexDirection: 'column'}}>
        <MunicipalitiesMap
          onSelectMunicipio={handleSelectMunicipio}
          choroplethActive={choroplethActive}
          choroplethIndicator={choroplethIndicator}
          indicatorsMap={indicatorsMap}
          pois={poisMode ? (selectedPoiType ? pois.filter(p => p.tipo === selectedPoiType) : pois) : []}
          onSelectPOI={handleSelectPOI}
          selectedMunicipio={selectedMunicipio}

          // novos props
          creatingPoiMode={creatingPoiMode}
          onMapClick={handleMapClick}
          routeMode={routeMode}
          routeData={mapClickData?.isRoute ? mapClickData : null}
        />
        {selectedPOI && <POIDetail poi={selectedPOI} onClose={handleClosePOIDetail} onStartRoute={handleStartRoute} />}
        {routeSummary && <RouteModal routeSummary={routeSummary} onClose={() => setRouteSummary(null)} />}
        {routeMode && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 9999
          }}>
            🗺️ Clique no mapa para selecionar o ponto de destino
          </div>
        )}
      </div>
    </div>
  )
}

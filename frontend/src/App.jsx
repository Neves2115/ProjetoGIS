import React, { useState } from 'react'
import MunicipalitiesMap from './components/MapView'
import Sidebar from './components/Sidebar'
import POIDetail from './components/POIDetail'
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
  const [creatingPoiMode, setCreatingPoiMode] = useState(false) // quando true, clique no mapa preenche lat/lon
  const [mapClickData, setMapClickData] = useState(null) // { lat, lon, matchedFeature }

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
    setMapClickData(payload)
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
        />
        {selectedPOI && <POIDetail poi={selectedPOI} onClose={handleClosePOIDetail} />}
      </div>
    </div>
  )
}

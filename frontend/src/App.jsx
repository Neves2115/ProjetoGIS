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

  function handleClosePOIDetail() {
    setSelectedPOI(null)
  }

  return (
    <div style={{display:'flex', height:'100vh'}}>
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
      />
      <div style={{flex:1}}>
        <MunicipalitiesMap
          onSelectMunicipio={handleSelectMunicipio}
          choroplethActive={choroplethActive}
          choroplethIndicator={choroplethIndicator}
          indicatorsMap={indicatorsMap}
          pois={poisMode ? (selectedPoiType ? pois.filter(p => p.tipo === selectedPoiType) : pois) : []}
          onSelectPOI={handleSelectPOI}
        />
        {selectedPOI && <POIDetail poi={selectedPOI} onClose={handleClosePOIDetail} />}
      </div>
    </div>
  )
}
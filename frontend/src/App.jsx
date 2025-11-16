import React, { useState } from 'react'
import MunicipalitiesMap from './components/MapView'
import Sidebar from './components/Sidebar'
import { fetchIndicadorByIbge, fetchAllIndicadores } from './api/api'

export default function App(){
  const [selectedMunicipio, setSelectedMunicipio] = useState(null)
  const [indicador, setIndicador] = useState(null)
  const [loadingIndicador, setLoadingIndicador] = useState(false)

  // CHOROPLETH state
  const [choroplethActive, setChoroplethActive] = useState(false)
  const [choroplethIndicator, setChoroplethIndicator] = useState('idh') // default
  const [indicatorsMap, setIndicatorsMap] = useState({}) // { ibge_code: {...} }
  const [loadingChoro, setLoadingChoro] = useState(false)

  async function handleSelectMunicipio(props){
    // quando seleciona cidade, fecha coroplético (regra)
    setChoroplethActive(false)
    setSelectedMunicipio(props)
    setIndicador(null)
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
  }

  // abrir coroplético: busca todos indicadores (recomendado)
  async function handleStartChoropleth(indKey = 'idh') {
    if (selectedMunicipio) {
      alert('Feche a visualização da cidade antes de abrir o mapa coroplético.')
      return
    }
    setLoadingChoro(true)
    try {
      // 1) buscar todos os indicadores do backend (melhor performance)
      const rows = await fetchAllIndicadores()
      // normalizar para mapa { ibge_code: row }
      const map = {}
      rows.forEach(r => {
        const code = String(r.ibge_code ?? r.ibge ?? r.ibge_code).trim()
        map[code] = r
      })
      setIndicatorsMap(map)
      setChoroplethIndicator(indKey)
      setChoroplethActive(true)
    } catch (err) {
      console.error(err)
      alert('Erro ao buscar indicadores para o coroplético. Ver console.')
    } finally {
      setLoadingChoro(false)
    }
  }

  // fechar coroplético
  function handleCloseChoropleth(){
    setChoroplethActive(false)
    setChoroplethIndicator('idh')
    setIndicatorsMap({})
  }

  return (
    <div style={{display:'flex', height:'100vh'}}>
      <Sidebar
        selectedMunicipio={selectedMunicipio}
        indicador={indicador}
        loadingIndicador={loadingIndicador}
        onBack={handleBackFromDetail}
        // coroplético controls
        onStartChoropleth={handleStartChoropleth}
        onCloseChoropleth={handleCloseChoropleth}
        choroplethActive={choroplethActive}
      />
      <div style={{flex:1}}>
        <MunicipalitiesMap
          onSelectMunicipio={handleSelectMunicipio}
          choroplethActive={choroplethActive}
          choroplethIndicator={choroplethIndicator}
          indicatorsMap={indicatorsMap}
        />
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import MunicipalitiesMap from './components/MapView'
import Sidebar from './components/Sidebar'
import { fetchIndicadorByIbge, fetchAllIndicadores } from './api/api'

export default function App(){
  const [selectedMunicipio, setSelectedMunicipio] = useState(null)
  const [indicador, setIndicador] = useState(null)
  const [loadingIndicador, setLoadingIndicador] = useState(false)

  const [choroplethActive, setChoroplethActive] = useState(false)
  const [choroplethIndicator, setChoroplethIndicator] = useState('idh') 
  const [indicatorsMap, setIndicatorsMap] = useState({}) 

  async function handleSelectMunicipio(props){
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
    }finally{
      setLoadingChoro(false)
    }
  }

  function changeChoroplethIndicator(indKey){
    if (!choroplethActive) {r
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

import React, { useState } from 'react'
import MunicipalitiesMap from './components/MapView'
import Sidebar from './components/Sidebar'
import { fetchIndicadorByIbge } from './api/api'

export default function App(){
  const [selectedMunicipio, setSelectedMunicipio] = useState(null) 
  const [indicador, setIndicador] = useState(null)
  const [loadingIndicador, setLoadingIndicador] = useState(false)

  // chamado pelo mapa quando usuário clica numa cidade
  async function handleSelectMunicipio(props){
    setSelectedMunicipio(props)
    setIndicador(null)
    if (!props?.ibge_code) return
    setLoadingIndicador(true)
    try{
      const ind = await fetchIndicadorByIbge(props.ibge_code)
      setIndicador(ind)   // pode ser null se não existir
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

  return (
    <div style={{display:'flex', height:'100vh'}}>
      <Sidebar
        selectedMunicipio={selectedMunicipio}
        indicador={indicador}
        loadingIndicador={loadingIndicador}
        onBack={handleBackFromDetail}
      />
      <div style={{flex:1}}>
        <MunicipalitiesMap onSelectMunicipio={handleSelectMunicipio} />
      </div>
    </div>
  )
}

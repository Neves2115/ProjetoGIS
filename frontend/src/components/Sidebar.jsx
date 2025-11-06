import React, { useState } from 'react'
import { fetchPOIsGeoJSON } from '../api/api'

export default function Sidebar({ filters, setFilters, setPoisGeoJSON }){
  const [category, setCategory] = useState(filters.category || '')

  async function applyFilters(){
    setFilters(f => ({ ...f, category }))
    try{
      const geo = await fetchPOIsGeoJSON({ category })
      setPoisGeoJSON(geo)
    }catch(e){
      alert(e.message)
    }
  }

  return (
    <>
      <h3>Filtros</h3>
      <div>
        <label>Categoria</label><br/>
        <select value={category} onChange={e=>setCategory(e.target.value)}>
          <option value="">Todas</option>
          <option value="saude">Saúde</option>
          <option value="educacao">Educação</option>
          <option value="seguranca">Segurança</option>
          <option value="parques">Parques</option>
          <option value="centros_sociais">Centros sociais</option>
        </select>
      </div>
      <div style={{marginTop:8}}>
        <button onClick={applyFilters}>Aplicar</button>
      </div>
    </>
  )
}

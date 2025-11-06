import React from 'react'

export default function POIList({ poisGeoJSON, onSelect }){
  const features = poisGeoJSON?.features || []
  return (
    <div className="poi-list">
      <h4>POIs ({features.length})</h4>
      <ul>
        {features.slice(0,200).map(f => (
          <li key={f.properties.id} style={{padding:'6px 0', borderBottom:'1px solid #eee', cursor:'pointer'}} onClick={()=>onSelect(f)}>
            <strong>{f.properties.name || '—'}</strong><br/>
            <small>{f.properties.category}</small>
          </li>
        ))}
        {features.length === 0 && <li>Nenhum POI carregado.</li>}
      </ul>
    </div>
  )
}

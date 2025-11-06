import React from 'react'

export default function POIDetail({ feature, onClose }){
  if(!feature) return null
  const tags = feature.properties.tags || {}
  return (
    <div style={{position:'absolute', right:10, top:10, background:'#fff', padding:12, border:'1px solid #ddd', zIndex:1000}}>
      <button onClick={onClose}>Fechar</button>
      <h3>{feature.properties.name}</h3>
      <p>Categoria: {feature.properties.category}</p>
      <pre style={{maxWidth:300, overflow:'auto'}}>{JSON.stringify(tags, null, 2)}</pre>
    </div>
  )
}

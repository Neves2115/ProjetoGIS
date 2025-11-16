import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { fetchMunicipalitiesGeoJSON } from '../api/api'
import L from 'leaflet'

function FitToGeoJSON({ geojson }) {
  const map = useMap()
  useEffect(() => {
    if (!geojson?.features?.length) return
    const layer = L.geoJSON(geojson)
    map.fitBounds(layer.getBounds(), { padding: [40,40] })
  }, [geojson])
  return null
}

// We'll create a simple color ramp generator without external libs
function colorForRange(index, total) {
  // simple blue ramp
  const t = index / Math.max(1, total-1)
  const start = [237,248,251] // light
  const end   = [8,81,156]    // dark
  const r = Math.round(start[0] + (end[0]-start[0])*t)
  const g = Math.round(start[1] + (end[1]-start[1])*t)
  const b = Math.round(start[2] + (end[2]-start[2])*t)
  return `rgb(${r},${g},${b})`
}

export default function MunicipalitiesMap({
  onSelectMunicipio,
  choroplethActive = false,
  choroplethIndicator = 'idh',
  indicatorsMap = {}
}) {
  const [gjson, setGjson] = useState(null)
  const [selectedCode, setSelectedCode] = useState(null)
  const geoRef = useRef(null)

  useEffect(() => {
    fetchMunicipalitiesGeoJSON().then(setGjson).catch(console.error)
  }, [])

  // compute values array when indicatorsMap or gjson changes
  const values = React.useMemo(() => {
    if (!gjson) return []
    const vals = []
    for (const f of gjson.features) {
      const code = String(f.properties?.ibge_code ?? f.properties?.id ?? '').trim()
      const row = indicatorsMap[code]
      const v = row ? (row[choroplethIndicator] ?? row[choroplethIndicator.replace('pib','renda_per_capita')]) : null
      if (v != null && !isNaN(Number(v))) vals.push(Number(v))
    }
    return vals
  }, [gjson, indicatorsMap, choroplethIndicator])

  // build breaks: 5 classes equal-interval (simple)
  const breaks = React.useMemo(() => {
    if (!values.length) return []
    const min = Math.min(...values), max = Math.max(...values)
    const classes = 5
    const step = (max - min) / classes
    const arr = []
    for (let i=1;i<=classes;i++) arr.push(min + step*i)
    return arr
  }, [values])

  function getFillColorForFeature(feature) {
    if (!choroplethActive) return "#9ecae1"
    const code = String(feature.properties?.ibge_code ?? '').trim()
    const row = indicatorsMap[code]
    const v = row ? Number(row[choroplethIndicator]) : null
    if (v == null || isNaN(v)) return '#eee'
    // choose bucket
    for (let i=0;i<breaks.length;i++){
      if (v <= breaks[i]) return colorForRange(i, breaks.length)
    }
    return colorForRange(breaks.length-1, breaks.length)
  }

  function style(feature) {
    const code = String(feature.properties?.ibge_code ?? '').trim()
    const isSelected = selectedCode === code
    return {
      color: "#333",
      weight: isSelected ? 3 : 1,
      fillColor: getFillColorForFeature(feature),
      fillOpacity: choroplethActive ? 0.9 : (isSelected ? 0.6 : 0.2),
      dashArray: isSelected ? '' : '1'
    }
  }

  function highlight(e) {
    const layer = e.target
    const code = String(layer.feature.properties?.ibge_code ?? '').trim()
    if (code === selectedCode) return
    layer.setStyle({ weight: 2, color: '#333', fillOpacity: 0.6 })
    layer.bringToFront()
  }
  function resetHighlight(e) {
    const layer = e.target
    const code = String(layer.feature.properties?.ibge_code ?? '').trim()
    if (code === selectedCode) return
    try { geoRef.current.resetStyle(layer) } catch {}
  }

  function onEachFeature(feature, layer) {
    const nome = feature.properties?.nome || '—'
    layer.bindPopup(`<strong>${nome}</strong>`)
    layer.on({
      mouseover: highlight,
      mouseout: resetHighlight,
      click: () => {
        const code = String(feature.properties?.ibge_code ?? '').trim()
        setSelectedCode(code)
        onSelectMunicipio && onSelectMunicipio(feature.properties)
        try { geoRef.current.setStyle(style) } catch {}
      }
    })
  }

  // legend component
  function Legend(){
    if (!choroplethActive || !breaks.length) return null
    const items = []
    const steps = breaks.length
    for (let i=0;i<steps;i++){
      const label = (i===0) ? `<= ${breaks[i].toFixed(2)}` :
                    (i===steps-1) ? `> ${breaks[i-1].toFixed(2)}` :
                    `${breaks[i-1].toFixed(2)} - ${breaks[i].toFixed(2)}`
      items.push({ color: colorForRange(i, steps), label})
    }
    return (
      <div style={{
        position:'absolute', right:10, bottom:10, background:'#fff', padding:8, borderRadius:6, boxShadow:'0 4px 12px rgba(0,0,0,0.12)', zIndex:999
      }}>
        <strong style={{display:'block', marginBottom:6}}>Legenda</strong>
        {items.map((it,idx)=>(
          <div key={idx} style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
            <div style={{width:18, height:12, background:it.color, border:'1px solid rgba(0,0,0,0.08)'}} />
            <div style={{fontSize:12}}>{it.label}</div>
          </div>
        ))}
      </div>
    )
  }

  // force GeoJSON rerender when choroplethIndicator/active changes by changing key
  const geoKey = `muni-${choroplethActive ? 'choro-'+choroplethIndicator : 'normal'}`

  return (
    <div style={{height:'100%'}}>
      <MapContainer center={[-23.55, -46.63]} zoom={7} style={{height:'100vh', width:'100%'}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {gjson && (
          <GeoJSON
            key={geoKey}
            data={gjson}
            style={style}
            onEachFeature={onEachFeature}
            ref={geoRef}
          />
        )}
        <FitToGeoJSON geojson={gjson} />
        <Legend />
      </MapContainer>
    </div>
  )
}

import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { fetchMunicipalitiesGeoJSON } from '../api/api'

// ajusta mapa para caber o GeoJSON
function FitToGeoJSON({ geojson }) {
  const map = useMap()
  useEffect(() => {
    if (!geojson || !geojson.features?.length) return
    try {
      const layer = L.geoJSON(geojson)
      map.fitBounds(layer.getBounds(), { padding: [40,40] })
    } catch (e) { /* ignore */ }
  }, [geojson])
  return null
}

export default function MunicipalitiesMap({ onSelectMunicipio }) {
  const [gjson, setGjson] = useState(null)
  const geoRef = useRef(null)

  useEffect(() => {
    fetchMunicipalitiesGeoJSON().then(setGjson).catch(console.error)
  }, [])

  function style(feature) {
    return {
      color: "#444",
      weight: 1,
      fillColor: "#9ecae1",
      fillOpacity: 0.4
    }
  }

  function highlight(e) {
    const layer = e.target
    layer.setStyle({ weight: 2, color: '#333', fillOpacity: 0.6 })
    layer.bringToFront()
  }
  function resetHighlight(e) {
    const layer = e.target
    geoRef.current.resetStyle(layer)
  }

  function onEachFeature(feature, layer) {
    const nome = feature.properties?.nome || feature.properties?.name || '—'
    layer.bindPopup(`<strong>${nome}</strong>`)
    layer.on({
      mouseover: highlight,
      mouseout: resetHighlight,
      click: () => {
        onSelectMunicipio && onSelectMunicipio(feature.properties)
        // zoom to feature
        try { layer._map.fitBounds(layer.getBounds(), { padding: [30,30] }) } catch(e){}
      }
    })
  }

  return (
    <MapContainer center={[-23.55, -46.63]} zoom={7} style={{height:'100vh', width:'100%'}}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {gjson && (
        <GeoJSON
          data={gjson}
          style={style}
          onEachFeature={onEachFeature}
          ref={geoRef}
        />
      )}
      <FitToGeoJSON geojson={gjson} />
    </MapContainer>
  )
}

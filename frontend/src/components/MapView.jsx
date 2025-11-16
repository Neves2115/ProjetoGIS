import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { fetchMunicipalitiesGeoJSON } from '../api/api'

// Ajusta bounds ao carregar
function FitToGeoJSON({ geojson }) {
  const map = useMap()
  useEffect(() => {
    if (!geojson?.features?.length) return
    const layer = L.geoJSON(geojson)
    map.fitBounds(layer.getBounds(), { padding: [40,40] })
  }, [geojson])
  return null
}

export default function MunicipalitiesMap({ onSelectMunicipio }) {
  const [gjson, setGjson] = useState(null)
  const [selectedCode, setSelectedCode] = useState(null)
  const geoRef = useRef(null)

  useEffect(() => {
    fetchMunicipalitiesGeoJSON().then(setGjson).catch(console.error)
  }, [])

  // estilo padrão + verifica seleção
  function style(feature) {
    const code = feature.properties?.ibge_code

    const isSelected = selectedCode === code

    return {
      color: "#333",
      weight: isSelected ? 3 : 1,
      fillColor: "#9ecae1",
      fillOpacity: isSelected ? 0.6 : 0.2,
      dashArray: isSelected ? '' : '1'
    }
  }

  // hover temporário
  function highlight(e) {
    const layer = e.target
    const code = layer.feature.properties?.ibge_code

    // não modifica se já for o selecionado
    if (code === selectedCode) return

    layer.setStyle({ weight: 2, color: '#333', fillOpacity: 0.6 })
    layer.bringToFront()
  }

  // remover hover temporário
  function resetHighlight(e) {
    const layer = e.target
    const code = layer.feature.properties?.ibge_code

    // se é o selecionado, não reseta
    if (code === selectedCode) return

    geoRef.current.resetStyle(layer)
  }

  function onEachFeature(feature, layer) {
    const nome = feature.properties?.nome || '—'

    layer.bindPopup(`<strong>${nome}</strong>`)

    layer.on({
      mouseover: highlight,
      mouseout: resetHighlight,
      click: () => {
        const code = feature.properties?.ibge_code
        setSelectedCode(code)

        // update sidebar
        onSelectMunicipio && onSelectMunicipio(feature.properties)

        // update all shapes
        try {
          geoRef.current.setStyle(style)
        } catch {}

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

import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { fetchPOIsGeoJSON } from '../api/api'

// Fix default icon paths on Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

function FitBounds({ geojson }) {
  const map = useMap()
  useEffect(() => {
    if (geojson && geojson.features && geojson.features.length){
      const coords = geojson.features.map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]])
      map.fitBounds(coords, { padding: [40,40] })
    }
  }, [geojson, map])
  return null
}

export default function MapView({ filters, poisGeoJSON, setPoisGeoJSON, selectedPOI, onSelect }){
  useEffect(() => {
    // if no geojson loaded, fetch default (small area) once
    if (!poisGeoJSON) {
      fetchPOIsGeoJSON({}).then(setPoisGeoJSON).catch(e => console.error(e))
    }
  }, [])

  const features = poisGeoJSON?.features || []

  return (
    <MapContainer center={[-23.55, -46.63]} zoom={7} style={{height: '100%', width:'100%'}}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {features.map(f => {
        const [lon, lat] = f.geometry.coordinates
        return (
          <Marker key={f.properties.id} position={[lat, lon]} eventHandlers={{ click: () => onSelect(f) }}>
            <Popup>
              <strong>{f.properties.name || '—'}</strong><br/>
              {f.properties.category}
            </Popup>
          </Marker>
        )
      })}
      <FitBounds geojson={poisGeoJSON} />
    </MapContainer>
  )
}

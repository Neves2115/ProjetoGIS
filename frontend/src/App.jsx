import React, { useState } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import POIList from './components/POIList'

export default function App(){
  const [filters, setFilters] = useState({ category: '', bbox: '' })
  const [selectedPOI, setSelectedPOI] = useState(null)
  const [poisGeoJSON, setPoisGeoJSON] = useState(null)

  return (
    <div className="app">
      <div className="sidebar">
        <Sidebar filters={filters} setFilters={setFilters} setPoisGeoJSON={setPoisGeoJSON} />
        <POIList poisGeoJSON={poisGeoJSON} onSelect={setSelectedPOI} />
      </div>
      <div className="map-wrap">
        <MapView filters={filters} poisGeoJSON={poisGeoJSON} setPoisGeoJSON={setPoisGeoJSON} selectedPOI={selectedPOI} onSelect={setSelectedPOI} />
      </div>
    </div>
  )
}

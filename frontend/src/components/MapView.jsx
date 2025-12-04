// MunicipalitiesMap.jsx
import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup, useMapEvents } from 'react-leaflet'
import createColorizer from '../utils/createColorizer'   // ajuste caminho conforme sua estrutura
import { fetchMunicipalitiesGeoJSON } from '../api/api'
import L from 'leaflet'

function pointInRing(x, y, ring) {
  // ring: array de [lon, lat]
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi + 0.0) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

function pointInPolygon(lon, lat, geom) {
  if (!geom) return false
  const type = geom.type
  const coords = geom.coordinates
  if (type === 'Polygon') {
    // first ring is exterior, others are holes - check exterior and ensure not in hole
    if (!coords || !coords.length) return false
    if (!pointInRing(lon, lat, coords[0])) return false
    // ensure not in any hole
    for (let i = 1; i < coords.length; i++) {
      if (pointInRing(lon, lat, coords[i])) return false
    }
    return true
  } else if (type === 'MultiPolygon') {
    for (const poly of coords) {
      if (poly && poly.length && pointInRing(lon, lat, poly[0])) {
        // check holes in this polygon
        let inHole = false
        for (let i = 1; i < poly.length; i++) {
          if (pointInRing(lon, lat, poly[i])) { inHole = true; break }
        }
        if (!inHole) return true
      }
    }
    return false
  }
  return false
}

function findFeatureAtLatLng(gjson, lon, lat) {
  if (!gjson || !gjson.features) return null
  for (const feat of gjson.features) {
    if (feat.geometry && pointInPolygon(lon, lat, feat.geometry)) {
      return feat
    }
  }
  return null
}

function MapClickHandler({ onMapClick, creatingPoiMode }) {
  useMapEvents({
    click(e) {
      if (!creatingPoiMode) return
      const { lat, lng } = e.latlng
      // tentar achar feature localmente — precisamos do gjson; emitiremos lat/lon e deixaremos o pai decidir
      // NOTA: não temos gjson aqui; vamos delegar para prop onMapClick para o componente pai
      onMapClick && onMapClick({ lat, lon: lng })
    }
  })
  return null
}

// Fix para ícones padrão do leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Ícone customizado para POIs
const poiIcons = {
  default: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  hospital: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  school: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  police: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  park: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

function getPoiIcon(tipo) {
  return poiIcons[tipo] || poiIcons.default
}

function FitToGeoJSON({ geojson }) {
  const map = useMap()
  useEffect(() => {
    if (!geojson?.features?.length) return
    const layer = L.geoJSON(geojson)
    map.fitBounds(layer.getBounds(), { padding: [40,40] })
  }, [geojson])
  return null
}


// helper to format indicator values for tooltip
function formatValueForIndicator(value, indicatorKey) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return '—'
  const v = Number(value)
  if (indicatorKey.startsWith('idh')) {
    return v.toFixed(3) // e.g. 0.805
  }
  if (indicatorKey === 'saneamento') {
    return `${v.toFixed(2)}%`
  }
  if (indicatorKey === 'renda_per_capita' || indicatorKey.includes('pib') || indicatorKey.includes('renda')) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v)
  }
  return String(v)
}

export default function MunicipalitiesMap({
  onSelectMunicipio,
  selectedMunicipio,
  choroplethActive = false,
  choroplethIndicator = 'idh',
  indicatorsMap = {},
  pois = [],
  onSelectPOI = null,
  // novos props
  creatingPoiMode = false,
  onMapClick = null
}) {
  const [gjson, setGjson] = useState(null)
  const [selectedCode, setSelectedCode] = useState(null)
  const [selectedPOI, setSelectedPOI] = useState(null)
  const geoRef = useRef(null)

  useEffect(() => {
    const code = String(selectedMunicipio?.ibge_code ?? selectedMunicipio?.id ?? '').trim() || null
    setSelectedCode(code)
  }, [selectedMunicipio])

  // reaplica estilo em todas as layers sempre que selectedCode (ou dados relevantes) mudarem
  useEffect(() => {
    if (!geoRef.current || !gjson) return
    try {
      // se o ref for um L.GeoJSON com eachLayer -> iterar explicitamente
      if (typeof geoRef.current.eachLayer === 'function') {
        geoRef.current.eachLayer(layer => {
          // algumas layers podem não ter feature (ex.: tile layers) - proteger
          const feat = layer.feature
          if (!feat || !feat.properties) return

          const code = String(feat.properties?.ibge_code ?? feat.properties?.id ?? '').trim()
          const isSelected = code && selectedCode && code === selectedCode

          const styleObj = {
            color: "#333",
            weight: isSelected ? 3 : 1,
            fillColor: getFillColorForFeature(feat),
            fillOpacity: choroplethActive ? 0.9 : (isSelected ? 0.2 : 0.05),
            dashArray: isSelected ? '' : '1'
          }

          // aplicar estilo na layer individual
          try { layer.setStyle(styleObj) } catch (err) { /* some layers might not accept setStyle */ }

          // trazer para frente a selecionada para garantir contorno visível
          if (isSelected && typeof layer.bringToFront === 'function') {
            try { layer.bringToFront() } catch {}
          }
        })
        return
      }

      // fallback: se houver setStyle direto no ref (aceita função ou objeto)
      if (typeof geoRef.current.setStyle === 'function') {
        geoRef.current.setStyle(feature => {
          const code = String(feature.properties?.ibge_code ?? feature.properties?.id ?? '').trim()
          const isSelected = code && selectedCode && code === selectedCode
          return {
            color: "#333",
            weight: isSelected ? 3 : 1,
            fillColor: getFillColorForFeature(feature),
            fillOpacity: choroplethActive ? 0.9 : (isSelected ? 0.2 : 0.05),
            dashArray: isSelected ? '' : '1'
          }
        })
      }
    } catch (err) {
      console.warn('Erro ao aplicar estilo no GeoJSON/layes:', err)
    }
  }, [selectedCode, choroplethActive, choroplethIndicator, indicatorsMap, gjson])

  useEffect(() => {
    fetchMunicipalitiesGeoJSON().then(setGjson).catch(console.error)
  }, [])

  function handleMapClicked(payload) {
      // payload: { lat, lon } vindo do MapClickHandler
      const { lat, lon } = payload
      let matchedFeature = null
      try {
        // tente identificar entre as features carregadas
        matchedFeature = findFeatureAtLatLng(gjson, lon, lat)
      } catch (err) {
        console.warn('Erro ao verificar feature no clique', err)
        matchedFeature = null
      }
      onMapClick && onMapClick({ lat, lon, matchedFeature })
    }

  // compute values array when indicatorsMap or gjson changes
  const values = React.useMemo(() => {
    if (!gjson) return []
    const vals = []
    for (const f of gjson.features) {
      const code = String(f.properties?.ibge_code ?? f.properties?.id ?? '').trim()
      const row = indicatorsMap[code]
      const key = choroplethIndicator
      const v = row ? (row[key] ?? row[key.replace('pib','renda_per_capita')]) : null
      if (v != null && !isNaN(Number(v))) vals.push(Number(v))
    }
    return vals
  }, [gjson, indicatorsMap, choroplethIndicator])

  const colorizer = React.useMemo(() => {
    return createColorizer(choroplethIndicator, values, { nClasses: 5 })
  }, [choroplethIndicator, values])

  function getFillColorForFeature(feature) {
    if (!choroplethActive) return "#9ecae1"
    const code = String(feature.properties?.ibge_code ?? '').trim()
    const row = indicatorsMap[code]
    // tenta fallback para chaves alternativas
    const raw = row ? (row[choroplethIndicator] ?? row[choroplethIndicator.replace('pib','renda_per_capita')]) : null
    if (raw == null || isNaN(Number(raw))) return '#eee'
    return colorizer.colorFor(Number(raw))
  }


  function style(feature) {
    const code = String(feature.properties?.ibge_code ?? '').trim()
    const isSelected = selectedCode === code
    return {
      color: "#333",
      weight: isSelected ? 3 : 1,
      fillColor: getFillColorForFeature(feature),
      fillOpacity: choroplethActive ? 0.9 : (isSelected ? 0.2 : 0.05),
      dashArray: isSelected ? '' : '1'
    }
  }

  function highlight(e) {
    const layer = e.target
    const code = String(layer.feature.properties?.ibge_code ?? '').trim()
    if (code === selectedCode) return
    layer.setStyle({ weight: 2, color: '#333', fillOpacity: 0.2 })
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


    // mouse handlers
    layer.on({
      mouseover: (e) => {
        highlight(e)

        // if choropleth active, show small tooltip with name + indicator value
        if (choroplethActive) {
          const code = String(feature.properties?.ibge_code ?? '').trim()
          const row = indicatorsMap[code]
          const raw = row ? (row[choroplethIndicator] ?? row[choroplethIndicator.replace('pib','renda_per_capita')]) : null
          const formatted = (raw == null) ? 'Sem dados' : formatValueForIndicator(raw, choroplethIndicator)
          const content = `<strong>${nome}</strong><br/><small>${formatted}</small>`
          // ensure old tooltip removed
          try { layer.unbindTooltip() } catch {}
          layer.bindTooltip(content, { sticky: true, direction: 'auto', offset: [0, -10], opacity: 0.95 }).openTooltip()
        }
        else {
          const content = `<strong>${nome}</strong>`
          try { layer.unbindTooltip() } catch {}
          layer.bindTooltip(content, { sticky: true, direction: 'auto', offset: [0, -10], opacity: 0.95 }).openTooltip()
        }
      },
      mouseout: (e) => {
        // close tooltip + reset style
        try { layer.closeTooltip(); layer.unbindTooltip() } catch {}
        resetHighlight(e)
      },
      click: () => {
        const code = String(feature.properties?.ibge_code ?? feature.properties?.id ?? '').trim()
        // otimista: já marca a seleção localmente
        setSelectedCode(code)
        setSelectedPOI(null)
        // avisa o pai (que também vai setar selectedMunicipio)
        onSelectMunicipio && onSelectMunicipio(feature.properties)
        // não chamamos geoRef.current.setStyle aqui — a effect reagirá ao selectedCode
      }
    })
  }

  function Legend(){
    if (!choroplethActive || !colorizer || !colorizer.legend) return null
    const items = colorizer.legend
    return (
      <div style={{
        position:'absolute', right:10, bottom:10, background:'#fff', padding:8, borderRadius:6,
        boxShadow:'0 4px 12px rgba(0,0,0,0.12)', zIndex:999
      }}>
        <strong style={{display:'block', marginBottom:6}}>Legenda</strong>
        {items.map((it,idx)=>(
          <div key={idx} style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
            <div style={{width:18, height:12, background:it.color, border:'1px solid rgba(0,0,0,0.08)'}} />
            <div style={{fontSize:12}}>{it.label}</div>
          </div>
        ))}
        <div style={{fontSize:11, color:'#666', marginTop:6}}>Método: {choroplethIndicator}</div>
      </div>
    )
  }


  // force GeoJSON rerender when choroplethIndicator/active changes by changing key
  const geoKey = `muni-${choroplethActive ? 'choro-'+choroplethIndicator : 'normal'}`
  // normaliza diferentes formatos de POI (latitude/longitude | lat/lon | geometry.coordinates | location.coordinates)
  const normalizedPois = React.useMemo(() => {
    if (!Array.isArray(pois)) return []
    return pois.map(poi => {
      // várias possibilidades comuns
      let lat = poi.latitude ?? poi.lat ?? poi.y ?? null
      let lon = poi.longitude ?? poi.lon ?? poi.x ?? null

      // GeoJSON style: geometry.coordinates = [lon, lat]
      if ((lat == null || lon == null) && poi.geometry && Array.isArray(poi.geometry.coordinates)) {
        lon = lon ?? poi.geometry.coordinates[0]
        lat = lat ?? poi.geometry.coordinates[1]
      }

      // alternativa nome/location: { location: { coordinates: [lon, lat] } }
      if ((lat == null || lon == null) && poi.location && Array.isArray(poi.location.coordinates)) {
        lon = lon ?? poi.location.coordinates[0]
        lat = lat ?? poi.location.coordinates[1]
      }

      // tentar converter strings para número
      const nLat = lat != null ? Number(lat) : NaN
      const nLon = lon != null ? Number(lon) : NaN

      return { ...poi, __lat: Number.isFinite(nLat) ? nLat : null, __lon: Number.isFinite(nLon) ? nLon : null }
    })
  }, [pois])

  // contagem para debug (você pode remover console.log em produção)
  useEffect(() => {
    const total = Array.isArray(pois) ? pois.length : 0
    const valid = normalizedPois.filter(p => p.__lat != null && p.__lon != null).length
    const invalid = total - valid
    if (total > 0) {
      console.info(`[MapView] POIs recebidos: ${total} — válidos: ${valid} — inválidos (ignorados): ${invalid}`)
    }
  }, [pois, normalizedPois])


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

        {/* Map click handler: somente ativa para criar POI */}
        <MapClickHandler creatingPoiMode={creatingPoiMode} onMapClick={handleMapClicked} />

        {/* Markers de POIs (seu código mantido) */}
        {normalizedPois && normalizedPois.map(poi => {
          if (poi.__lat == null || poi.__lon == null) return null // pula
          return (
            <Marker
              key={poi.id ?? `${poi.__lat}-${poi.__lon}-${Math.random()}`}
              position={[poi.__lat, poi.__lon]}
              icon={getPoiIcon(poi.tipo)}
              eventHandlers={{
                click: () => {
                  setSelectedPOI(poi)
                  onSelectPOI && onSelectPOI(poi)
                }
              }}
            >
              <Popup>
                <div style={{fontWeight: 600}}>{poi.nome ?? poi.name ?? 'POI'}</div>
                <div style={{fontSize: 12, color: '#666'}}>{poi.tipo ?? poi.category ?? ''}</div>
              </Popup>
            </Marker>
          )
        })}

        <FitToGeoJSON geojson={gjson} />
        <Legend />
      </MapContainer>
    </div>
  )
}
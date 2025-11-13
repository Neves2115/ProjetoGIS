export default function SidebarMunicipios({ geojson, onSelect }) {
  const features = geojson?.features || []
  return (
    <aside style={{width:320, padding:12, overflow:'auto'}}>
      <h3>Municípios ({features.length})</h3>
      <ul style={{listStyle:'none', padding:0}}>
        {features.map(f => (
          <li key={f.properties.ibge_code} style={{padding:6, borderBottom:'1px solid #eee', cursor:'pointer'}}
              onClick={() => onSelect(f.properties)}>
            {f.properties.nome}
          </li>
        ))}
      </ul>
    </aside>
  )
}

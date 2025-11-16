import React, { useState } from 'react'

function numberFmt(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n)
}

function classifyIDH(value) {
  if (value == null) return { label: 'Sem dados', color: '#999' }
  if (value >= 0.800) return { label: 'Muito Alto', color: '#0b5ed7' }
  if (value >= 0.700) return { label: 'Alto', color: '#0a9d58' }
  if (value >= 0.600) return { label: 'Médio', color: '#c6a600' }
  return { label: 'Baixo', color: '#e67e22' }
}

export default function Sidebar({
  selectedMunicipio,
  indicador,
  loadingIndicador,
  onBack,
  onStartChoropleth,
  onCloseChoropleth,
  choroplethActive
}) {
  const [selInd, setSelInd] = useState('idh')
  const [showSaneTooltip, setShowSaneTooltip] = useState(false)

  const IND_OPTIONS = [
    { key: 'idh', label: 'IDH' },
    { key: 'idh_renda', label: 'IDH — Renda' },
    { key: 'idh_educacao', label: 'IDH — Educação' },
    { key: 'idh_longevidade', label: 'IDH — Longevidade' },
    { key: 'saneamento', label: 'Saneamento (IN046)' },
    { key: 'renda_per_capita', label: 'PIB per capita' }
  ]

  const sidebarStyle = {
    width: 330,
    padding: 18,
    borderRight: '1px solid #ddd',
    background: '#fafafa',
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    display: 'flex',
    flexDirection: 'column'
  }

  const card = {
    background: 'white',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.08)'
  }

  const infoIconStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: 999,
    background: '#eef3ff',
    color: '#0b5ed7',
    fontSize: 12,
    marginLeft: 8,
    cursor: 'pointer',
    border: '1px solid rgba(11,94,215,0.12)'
  }

  const tooltipStyle = {
    position: 'absolute',
    right: 0,
    top: '28px',
    width: 300,
    background: 'rgba(255,255,255,0.98)',
    backdropFilter: 'blur(6px)',
    color: '#222',
    borderRadius: 8,
    padding: 12,
    border: '1px solid rgba(0,0,0,0.12)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
    fontSize: 12,
    zIndex: 9999,
    lineHeight: 1.35,
    pointerEvents: 'auto' // essencial para o hover não perder foco
  }

  if (selectedMunicipio) {
    const idhClass = classifyIDH(indicador?.idh)
    return (
      <aside style={sidebarStyle}>
        <button onClick={onBack} style={{ marginBottom: 12 }}>← Voltar</button>
        <h2 style={{margin:0}}>{selectedMunicipio.nome}</h2>

        <div>
          {loadingIndicador ? <p>Carregando indicadores…</p> : (
            <>
              <div style={card}>
                <strong>IDH Geral</strong>
                <div style={{marginTop:6, fontSize:18, fontWeight:700}}>
                  {indicador?.idh ?? '—'} <span style={{color: idhClass.color}}>• {idhClass.label}</span>
                </div>
                <ul style={{listStyle:'none', padding:0, marginTop:10}}>
                  <li><strong>Renda:</strong> {indicador?.idh_renda ?? '—'}</li>
                  <li><strong>Longevidade:</strong> {indicador?.idh_longevidade ?? '—'}</li>
                  <li><strong>Educação:</strong> {indicador?.idh_educacao ?? '—'}</li>
                </ul>
              </div>

              <div style={{ ...card, position: 'relative' }}>
                <div 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div>
                    <strong>Tratamento de Esgoto - IN046</strong>
                    <div style={{ marginTop: 6, fontSize: 18, fontWeight: 600 }}>
                      {indicador?.saneamento != null ? numberFmt(indicador.saneamento) + '%' : '—'}
                    </div>
                  </div>

                  <div
                    style={{ position: 'relative', marginLeft: 10 }}
                    onMouseEnter={() => setShowSaneTooltip(true)}
                    onMouseLeave={() => setShowSaneTooltip(false)}
                  >
                    <div style={infoIconStyle}>i</div>

                    {showSaneTooltip && (
                      <div style={tooltipStyle} role="tooltip">
                        <strong>O que é o IN046?</strong>
                        <p style={{ margin: '6px 0' }}>
                          IN046 é o <em>índice de esgoto tratado referido à água consumida</em>. 
                          Representa, em percentual, quanto do esgoto gerado é efetivamente tratado 
                          considerando o volume total de água consumida no município. Quanto maior 
                          o valor, maior a eficiência no tratamento.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* --- PIB per capita --- */}
              <div style={card}>
                <strong>PIB per capita</strong>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                  {indicador?.renda_per_capita != null
                    ? 'R$ ' + numberFmt(indicador.renda_per_capita)
                    : '—'}
                </p>
              </div>

              <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
                Código IBGE: {selectedMunicipio.ibge_code}
              </div>
            </>
          )}
        </div>

        <footer style={{ fontSize: 11, color: '#666', marginTop: 18, borderTop: '1px solid #ddd', paddingTop: 8, lineHeight: '1.3em' }}>
          <strong>Fontes dos dados:</strong><br />
          • PIB per capita: IBGE (2021)<br />
          • IDH e subindicadores: IBGE / PNUD (2010)<br />
          • Saneamento (IN046): SNIS / IBGE (2021)
        </footer>
      </aside>
    )
  }

  // DEFAULT MODE (filters + choropleth controls)
  return (
    <aside style={sidebarStyle}>
      <h3>Filtros</h3>
      <div style={{marginTop:10}}>
        <label>Indicador para coroplético</label><br/>
        <select value={selInd} onChange={e=>setSelInd(e.target.value)} style={{width:'100%', padding:6, marginTop:6}}>
          {IND_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>

      <div style={{marginTop:12}}>
        {!choroplethActive ? (
          <button
            onClick={() => onStartChoropleth(selInd)}
            style={{padding:'8px 10px'}}
          >
            Abrir mapa coroplético
          </button>
        ) : (
          <button onClick={onCloseChoropleth} style={{padding:'8px 10px'}}>Fechar coroplético</button>
        )}
      </div>

      <footer style={{marginTop:'auto', fontSize:11, color:'#666'}}>Fontes: IBGE / SNIS</footer>
    </aside>
  )
}

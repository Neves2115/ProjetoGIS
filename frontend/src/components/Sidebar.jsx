// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react'
import { fetchMunicipalities, fetchIndicadorByIbge } from '../api/api'

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

/* IndicatorRow atualizado:
   - destaca automaticamente o maior valor entre A e B para qualquer indicador
   - usa grid com colunas fixas para alinhar igualmente as colunas */
function IndicatorRow({ label, a, b, fmt = v => v ?? '—' }) {
  const aVal = a ?? null
  const bVal = b ?? null

  // tenta interpretar como número para comparação; se não for número, não destaca
  const aNum = aVal == null ? null : (isNaN(Number(aVal)) ? null : Number(aVal))
  const bNum = bVal == null ? null : (isNaN(Number(bVal)) ? null : Number(bVal))

  let aStyle = {}
  let bStyle = {}
  if (aNum != null && bNum != null) {
    if (aNum > bNum) aStyle = { fontWeight: 700, color: '#0a9d58' }
    else if (bNum > aNum) bStyle = { fontWeight: 700, color: '#0a9d58' }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8
      }}
    >
    <div
      style={{
        width: '80px', 
        fontWeight: 500,
      }}
    >
  {label}
</div>
      <div style={{ textAlign: 'right', ...aStyle }}>{fmt(aVal)}</div>
      <div style={{ textAlign: 'right', ...bStyle }}>{fmt(bVal)}</div>
    </div>
  )
}

export default function Sidebar({
  selectedMunicipio,
  indicador,
  loadingIndicador,
  onBack,
  onStartChoropleth,
  onChangeChoroplethIndicator,
  onCloseChoropleth,
  choroplethActive,
  currentIndicator
}) {
  // ---------- choropleth / filtros ----------
  const [selectedIndicator, setSelectedIndicator] = useState(currentIndicator ?? 'idh')
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [showSaneTooltip, setShowSaneTooltip] = useState(false)

  const IND_OPTIONS = [
    { key: 'idh', label: 'IDH' },
    { key: 'idh_renda', label: 'IDH — Renda' },
    { key: 'idh_educacao', label: 'IDH — Educação' },
    { key: 'idh_longevidade', label: 'IDH — Longevidade' },
    { key: 'saneamento', label: 'Saneamento (IN046)' },
    { key: 'renda_per_capita', label: 'PIB per capita' }
  ]

  useEffect(() => {
    // se o coroplético está ativo, trocar a seleção atual avisa o pai
    if (choroplethActive && onChangeChoroplethIndicator) {
      onChangeChoroplethIndicator(selectedIndicator)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndicator])

  useEffect(() => {
    // manter sincronizado com prop externa
    if (currentIndicator && currentIndicator !== selectedIndicator) {
      setSelectedIndicator(currentIndicator)
    }
  }, [currentIndicator])

  // ---------- comparação ----------
  const [comparing, setComparing] = useState(false)           // modo comparar ativo
  const [municipiosList, setMunicipiosList] = useState([])    // lista para select
  const [cmpIbge, setCmpIbge] = useState('')                 // ibge do segundo município
  const [cmpMunicipio, setCmpMunicipio] = useState(null)     // objeto nome do segundo municipio
  const [cmpIndicador, setCmpIndicador] = useState(null)     // indicadores do segundo municipio
  const [loadingList, setLoadingList] = useState(false)
  const [loadingCmp, setLoadingCmp] = useState(false)
  const [cmpError, setCmpError] = useState(null)

  // buscar lista quando abrir comparar
  useEffect(() => {
    if (!comparing) return
    setLoadingList(true)
    fetchMunicipalities('')
      .then(list => {
        setMunicipiosList(list || [])
        setLoadingList(false)
      })
      .catch(err => {
        console.error(err)
        setCmpError('Erro ao carregar lista de municípios')
        setLoadingList(false)
      })
  }, [comparing])

  // reset comparação se fechar seleção de município
  useEffect(() => {
    if (!selectedMunicipio) {
      setComparing(false)
      setCmpIbge('')
      setCmpMunicipio(null)
      setCmpIndicador(null)
      setCmpError(null)
    }
  }, [selectedMunicipio])

  async function handleConfirmCompare() {
    if (!cmpIbge) return
    setLoadingCmp(true)
    setCmpError(null)
    try {
      const match = municipiosList.find(m => String(m.ibge_code) === String(cmpIbge))
      setCmpMunicipio(match || { nome: cmpIbge, ibge_code: cmpIbge })
      const ind = await fetchIndicadorByIbge(cmpIbge)
      setCmpIndicador(ind)
    } catch (err) {
      console.error(err)
      setCmpError('Erro ao buscar indicador da cidade selecionada')
      setCmpIndicador(null)
    } finally {
      setLoadingCmp(false)
    }
  }

  function handleClearCompare() {
    setComparing(false)
    setCmpIbge('')
    setCmpMunicipio(null)
    setCmpIndicador(null)
    setCmpError(null)
  }

  // ---------- estilos ----------
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
    pointerEvents: 'auto'
  }

  // ---------- RENDER ----------
  // DETAIL MODE (com possível modo comparar)
  if (selectedMunicipio) {
    const idhClass = classifyIDH(indicador?.idh)

    // se selecionado e NÃO está no modo comparar -> mostrar botão Comparar (mantendo todo o resto)
    if (!comparing) {
      return (
        <aside style={sidebarStyle}>
          <button onClick={onBack} style={{ marginBottom: 12 }}>← Voltar</button>
          <h2 style={{margin:0}}>{selectedMunicipio.nome}</h2>

          {loadingIndicador ? <p>Carregando indicadores…</p> : (
            <>
              <div style={card}>
                <strong>IDH Geral</strong>
                <div style={{marginTop:6, fontSize:18, fontWeight:700}}>
                  {indicador?.idh ?? '—'} <span style={{color: idhClass.color}}>• {idhClass.label}</span>
                </div>
                <ul style={{listStyle:'none', padding:0, marginTop:10, marginBottom: 0}}>
                  <li><strong>Renda:</strong> {indicador?.idh_renda ?? '—'}</li>
                  <li><strong>Longevidade:</strong> {indicador?.idh_longevidade ?? '—'}</li>
                  <li><strong>Educação:</strong> {indicador?.idh_educacao ?? '—'}</li>
                </ul>
              </div>

              <div style={{ ...card, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

              <div style={card}>
                <strong>PIB per capita</strong>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                  {indicador?.renda_per_capita != null ? 'R$ ' + numberFmt(indicador.renda_per_capita) : '—'}
                </p>
              </div>

              <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
                Código IBGE: {selectedMunicipio.ibge_code}
              </div>
            </>
          )}

          {/* botões: Comparar + Fechar */}
          <div style={{display:'flex', gap:8, marginTop:12}}>
            <button onClick={() => setComparing(true)} style={{flex:1, padding:8}}>Comparar</button>
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

    // modo comparar: UI para escolher segundo município + confirmar + resultado
    return (
      <aside style={sidebarStyle}>
        <button onClick={() => { setComparing(false); setCmpIbge(''); setCmpIndicador(null); setCmpMunicipio(null); setCmpError(null) }} style={{marginBottom:8}}>← Voltar (comparação)</button>
        <h3 style={{margin:0}}>Comparar: <div style={{fontWeight:700, display:'inline'}}>{selectedMunicipio.nome}</div></h3>

        <div style={card}>
          <div style={{fontSize:13, color:'#666'}}>Escolha a cidade para comparar</div>

          <div style={{marginTop:8}}>
            <select
              value={cmpIbge}
              onChange={e => setCmpIbge(e.target.value)}
              style={{width:'100%', padding:8}}
            >
              <option value=''>-- escolha --</option>
              {municipiosList.map(m => (
                <option key={m.ibge_code} value={m.ibge_code}>
                  {m.nome} ({m.ibge_code})
                </option>
              ))}
            </select>
          </div>

          <div style={{display:'flex', gap:8, marginTop:10}}>
            <button onClick={handleConfirmCompare} style={{flex:1, padding:8}} disabled={!cmpIbge || loadingCmp}>
              {loadingCmp ? 'Carregando...' : 'Confirmar comparação'}
            </button>
          </div>

          {cmpError && <div style={{color:'crimson', marginTop:8}}>{cmpError}</div>}
        </div>

        {/* se confirmado, mostrar comparação lado a lado */}
        {cmpIndicador && (
          <div style={{...card, marginTop:10}}>

            <div style={{display:'flex', gap:12, marginTop:10, alignItems:'flex-start'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12, color:'#666'}}>Município A</div>
                <div style={{fontWeight:700}}>{selectedMunicipio.nome}</div>
              </div>
              <div style={{width:140, textAlign:'right'}}>
                <div style={{fontSize:12, color:'#666'}}>Município B</div>
                <div style={{fontWeight:700}}>{cmpMunicipio?.nome ?? cmpIbge}</div>
              </div>
            </div>

            <div style={{marginTop:10}}>
              <IndicatorRow label="IDH" a={indicador?.idh} b={cmpIndicador?.idh} fmt={(v)=>v==null?'—':Number(v).toFixed(3)} />
              <IndicatorRow label="IDH — Renda" a={indicador?.idh_renda} b={cmpIndicador?.idh_renda} fmt={(v)=>v==null?'—':Number(v).toFixed(3)} />
              <IndicatorRow label="IDH — Educação" a={indicador?.idh_educacao} b={cmpIndicador?.idh_educacao} fmt={(v)=>v==null?'—':Number(v).toFixed(3)} />
              <IndicatorRow label="IDH — Longevidade" a={indicador?.idh_longevidade} b={cmpIndicador?.idh_longevidade} fmt={(v)=>v==null?'—':Number(v).toFixed(3)} />
              <IndicatorRow label="Saneamento (IN046)" a={indicador?.saneamento} b={cmpIndicador?.saneamento} fmt={(v)=>v==null?'—':numberFmt(v)+'%'} />
              <IndicatorRow label="PIB per capita" a={indicador?.renda_per_capita} b={cmpIndicador?.renda_per_capita} fmt={(v)=>v==null?'—':'R$ '+numberFmt(v)} />
            </div>

            <div style={{display:'flex', gap:8, marginTop:12}}>
              <button onClick={() => { setCmpIbge(''); setCmpIndicador(null); setCmpMunicipio(null) }} style={{flex:1}}>Trocar cidade B</button>
            </div>
          </div>
        )}

        <div style={{marginTop:'auto', fontSize:11, color:'#666'}}>
          Fontes: IBGE / SNIS
        </div>
      </aside>
    )
  }

  // DEFAULT MODE (nenhuma cidade selecionada) — mantive o controle de coroplético
  return (
    <aside style={sidebarStyle}>
      <h3>Filtros</h3>
      {choroplethActive ? (
        <div style={{marginTop:10}}>
          <label>Indicador para coroplético</label><br/>
          <select value={selectedIndicator} onChange={e=>setSelectedIndicator(e.target.value)} style={{width:'100%', padding:6, marginTop:6}}>
            {IND_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>
      ) : null}

      <div style={{marginTop:12, display:'flex', gap:8}}>
        {!choroplethActive ? (
          <button onClick={() => onStartChoropleth && onStartChoropleth(selectedIndicator)} style={{padding:'8px 10px'}}>Abrir mapa coroplético</button>
        ) : (
          <button onClick={() => onCloseChoropleth && onCloseChoropleth()} style={{padding:'8px 10px'}}>Fechar</button>
        )}
      </div>

      <footer style={{marginTop:'auto', fontSize:11, color:'#666'}}>Fontes: IBGE / SNIS</footer>
    </aside>
  )
}

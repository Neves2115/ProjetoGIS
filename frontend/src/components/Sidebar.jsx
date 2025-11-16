import React, { useState } from 'react'

function numberFmt(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n)
}

// Classifica IDH conforme PNUD (Brasil)
function classifyIDH(value) {
  if (value == null) return { label: 'Sem dados', color: '#999' }
  if (value >= 0.800) return { label: 'Muito Alto', color: '#0b5ed7' } // azul forte
  if (value >= 0.700) return { label: 'Alto', color: '#0a9d58' }       // verde
  if (value >= 0.600) return { label: 'Médio', color: '#c6a600' }      // amarelo
  return { label: 'Baixo', color: '#e67e22' }                          // laranja
}

export default function Sidebar({ selectedMunicipio, indicador, loadingIndicador, onBack }) {
  const [showSaneTooltip, setShowSaneTooltip] = useState(false)

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


  // Modo detalhe
  if (selectedMunicipio) {
    const idhClass = classifyIDH(indicador?.idh)

    return (
      <aside style={sidebarStyle}>
        <div>
          <button
            onClick={onBack}
            style={{
              marginBottom: 14,
              background: '#ddd',
              border: 'none',
              borderRadius: 6,
              padding: '6px 10px',
              cursor: 'pointer'
            }}
          >
            ← Voltar
          </button>

          <h2 style={{ margin: 0, fontSize: 22 }}>{selectedMunicipio.nome}</h2>

          {loadingIndicador ? (
            <p style={{ marginTop: 12 }}>Carregando indicadores…</p>
          ) : (
            <>
              {/* --- IDH Block --- */}
              <div style={card}>
                <strong style={{ fontSize: 16 }}>IDH Geral</strong>
                <div style={{ marginTop: 4, fontSize: 20, fontWeight: 600 }}>
                  {indicador?.idh ?? '—'}{' '}
                  <span style={{ color: idhClass.color, fontSize: 18, fontWeight: 700 }}>
                    • {idhClass.label}
                  </span>
                </div>

                {/* Subindicadores */}
                <ul style={{ listStyle: 'none', padding: 0, marginTop: 10, fontSize: 14,  marginBottom: 0 }}>
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

                  {/* Wrapper que controla todo o hover */}
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

  // Sidebar Padrão
  return (
    <aside style={sidebarStyle}>
      <div>
        <h3 style={{ marginTop: 0 }}>Filtros</h3>
        <p>Use os controles para filtrar pontos e indicadores.</p>
      </div>
      <footer style={{ fontSize: 11, color: '#666', borderTop: '1px solid #ddd', paddingTop: 8 }}>
        <strong>Fontes:</strong> IBGE 2010/2021 e SNIS 2021.
      </footer>
    </aside>
  )
}

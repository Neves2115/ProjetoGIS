import React from 'react'

/**
 * POIDetail - Modal/Painel para visualizar detalhes de um POI selecionado
 * Suporta dois formatos:
 * 1. { feature, onClose } - feature com properties (compatível com GeoJSON)
 * 2. { poi, onClose } - objeto POI direto do banco de dados
 */
export default function POIDetail({ feature, poi, onClose, onStartRoute }) {
  // Compatibilidade: se recebeu feature (GeoJSON), extrair dados
  const poiData = poi || (feature?.properties ? {
    id: feature.properties.id,
    nome: feature.properties.name || feature.properties.nome,
    tipo: feature.properties.category || feature.properties.tipo,
    latitude: feature.geometry?.coordinates?.[1],
    longitude: feature.geometry?.coordinates?.[0],
  } : null)

  if (!poiData) return null

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(2px)',
  }

  const contentStyle = {
    background: 'white',
    borderRadius: 12,
    padding: 24,
    maxWidth: 500,
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.25)',
  }

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  }

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    color: '#666',
    padding: 0,
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const titleStyle = {
    fontSize: 20,
    fontWeight: 700,
    color: '#222',
    margin: 0,
    flex: 1,
  }

  const badgeStyle = {
    display: 'inline-block',
    backgroundColor: '#e3f2fd',
    color: '#0b5ed7',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    marginTop: 8,
  }

  const fieldStyle = {
    marginTop: 16,
    paddingTop: 12,
    borderTop: '1px solid #eee',
  }

  const fieldLabelStyle = {
    fontSize: 12,
    color: '#666',
    fontWeight: 600,
    textTransform: 'uppercase',
    marginBottom: 4,
  }

  const fieldValueStyle = {
    fontSize: 14,
    color: '#222',
    wordBreak: 'break-word',
  }

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={e => e.stopPropagation()}>
        {/* Header com título e botão fechar */}
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>{poiData.nome || 'POI sem nome'}</h2>
            {poiData.tipo && <div style={badgeStyle}>{poiData.tipo}</div>}
          </div>
          <button style={closeButtonStyle} onClick={onClose} title="Fechar">
            ✕
          </button>
        </div>

        {/* Coordenadas */}
        {poiData.latitude && poiData.longitude && (
          <div style={fieldStyle}>
            <div style={fieldLabelStyle}>Localização</div>
            <div style={fieldValueStyle}>
              {parseFloat(poiData.latitude).toFixed(6)}, {parseFloat(poiData.longitude).toFixed(6)}
            </div>
          </div>
        )}

        {/* ID do POI */}
        {poiData.id && (
          <div style={fieldStyle}>
            <div style={fieldLabelStyle}>ID POI</div>
            <div style={fieldValueStyle}>#{poiData.id}</div>
          </div>
        )}

        {/* Município */}
        {poiData.municipio_id && (
          <div style={fieldStyle}>
            <div style={fieldLabelStyle}>Município ID</div>
            <div style={fieldValueStyle}>{poiData.municipio_id}</div>
          </div>
        )}

        {/* Data criação */}
        {poiData.created_at && (
          <div style={fieldStyle}>
            <div style={fieldLabelStyle}>Data de Cadastro</div>
            <div style={fieldValueStyle}>
              {new Date(poiData.created_at).toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        )}

        {/* Botões */}
        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: '#f0f0f0',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: '#333',
            }}
          >
            Fechar
          </button>
          {poiData.latitude && poiData.longitude && (
            <>
              <button
                onClick={() => {
                  if (onStartRoute) {
                    onStartRoute(poiData)
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#28a745',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'white',
                }}
                title="Criar rota a partir deste POI"
              >
                Rota
              </button>
              <button
                onClick={() => {
                  const geoUrl = `https://www.google.com/maps/@${poiData.latitude},${poiData.longitude},18z`
                  window.open(geoUrl, '_blank')
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#0b5ed7',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'white',
                }}
              >
                Maps
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


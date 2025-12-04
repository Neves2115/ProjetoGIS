import React from 'react'

export default function RouteModal({ routeSummary, onClose }) {
  if (!routeSummary) return null

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
    maxWidth: 400,
    width: '90%',
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.25)',
  }

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  }

  const titleStyle = {
    fontSize: 20,
    fontWeight: 700,
    color: '#222',
    margin: 0,
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

  const itemStyle = {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: '1px solid #eee',
  }

  const lastItemStyle = {
    marginBottom: 16,
    paddingBottom: 0,
    borderBottom: 'none',
  }

  const labelStyle = {
    fontSize: 12,
    color: '#666',
    fontWeight: 600,
    textTransform: 'uppercase',
    marginBottom: 4,
  }

  const valueStyle = {
    fontSize: 18,
    fontWeight: 700,
    color: '#0b5ed7',
  }

  const buttonStyle = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#0b5ed7',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    color: 'white',
    marginTop: 20,
  }

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>📍 Resumo da Rota</h2>
          <button style={closeButtonStyle} onClick={onClose} title="Fechar">
            ✕
          </button>
        </div>

        {/* De/Para */}
        <div style={itemStyle}>
          <div style={labelStyle}>De</div>
          <div style={{ fontSize: 14, color: '#333' }}>
            {routeSummary.originName}
          </div>
        </div>

        {/* Distância */}
        <div style={itemStyle}>
          <div style={labelStyle}>📏 Distância</div>
          <div style={valueStyle}>{routeSummary.distance} km</div>
        </div>

        {/* Tempo a pé */}
        <div style={itemStyle}>
          <div style={labelStyle}>🚶 Tempo a pé</div>
          <div style={valueStyle}>{routeSummary.walkingTime}</div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
            (velocidade média: 5 km/h)
          </div>
        </div>

        {/* Tempo de carro */}
        <div style={lastItemStyle}>
          <div style={labelStyle}>🚗 Tempo de carro</div>
          <div style={valueStyle}>{routeSummary.drivingTime}</div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
            (velocidade média: 54 km/h)
          </div>
        </div>

        {/* Botão Fechar */}
        <button style={buttonStyle} onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  )
}

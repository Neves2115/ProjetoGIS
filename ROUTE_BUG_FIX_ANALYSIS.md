# Análise e Solução - Problema de Seleção de Pontos para Rota

## Problema Identificado

Quando o usuário ativava o modo rota e tentava clicar em um ponto específico do mapa para ser o destino, o sistema estava selecionando o município inteiro em vez do ponto específico, impedindo que a rota fosse gerada.

## Raiz da Causa

O problema estava no **evento de clique da camada GeoJSON (municípios)**. 

### O que estava acontecendo:

```
Usuário clica no mapa para escolher destino
           ↓
Camada GeoJSON (município) captura o evento primeiro
           ↓
Função onEachFeature dispara seu handler de clique
           ↓
Seleciona o município inteiro
           ↓
Evento nunca chega ao MapClickHandler
           ↓
❌ Rota não é gerada (clique ignorado)
```

### Por que isso acontecia:

Na React-Leaflet, camadas GeoJSON (layer/feature) têm **maior precedência** no evento de clique do que o mapa. Quando você clica em qualquer área do município, o evento `click` registrado em `onEachFeature` era disparado antes do `MapClickHandler`.

## Solução Implementada

Modificação do handler de clique em `onEachFeature` para **detectar o modo rota** e não capturar o evento:

```javascript
// ANTES (problema)
click: () => {
  const code = String(feature.properties?.ibge_code ?? '').trim()
  setSelectedCode(code)
  setSelectedPOI(null)
  onSelectMunicipio && onSelectMunicipio(feature.properties)
  try { geoRef.current.setStyle(style) } catch {}
}

// DEPOIS (corrigido)
click: (e) => {
  // Se estamos em modo rota, não selecionar município, deixar o clique ir para o mapa
  if (routeGenerating) {
    e.originalEvent.stopImmediatePropagation()
    return
  }
  
  const code = String(feature.properties?.ibge_code ?? '').trim()
  setSelectedCode(code)
  setSelectedPOI(null)
  onSelectMunicipio && onSelectMunicipio(feature.properties)
  try { geoRef.current.setStyle(style) } catch {}
}
```

## Como Funciona Agora

```
Usuário clica no mapa para escolher destino
           ↓
Camada GeoJSON captura o evento
           ↓
onEachFeature verifica: routeGenerating === true?
           ↓
SIM → stopImmediatePropagation() + return (não faz nada)
           ↓
Evento continua até o MapClickHandler
           ↓
MapClickHandler dispara normalmente
           ↓
handleMapClicked() recebe { lat, lon, matchedFeature }
           ↓
Detecta isRouteRequest e chama drawRoute()
           ↓
✅ Rota é gerada corretamente
```

## Mudanças de Código

### Arquivo: `frontend/src/components/MapView.jsx`

**Localização:** Função `onEachFeature` (por volta da linha 326)

**O que mudou:**
1. Adicionado parâmetro `e` ao handler de clique: `click: (e) => {`
2. Adicionada verificação: `if (routeGenerating) { e.originalEvent.stopImmediatePropagation(); return }`
3. Resto do código mantido igual

## Fluxo Corrigido

### Cenário: Gerar rota com destino específico

```
1️⃣ Usuário seleciona um POI
   └─ Modal de detalhes abre

2️⃣ Clica em "Gerar Rota"
   ├─ setRouteGenerating(true)
   ├─ setRouteOrigin({lat, lon, nome})
   └─ Modal fecha (setSelectedPOI(null))

3️⃣ Usuário clica em um ponto NO MAPA para destino
   ├─ Clique na camada GeoJSON
   ├─ onEachFeature detecta routeGenerating === true
   ├─ stopImmediatePropagation() interrompe propagação
   ├─ Evento passa para MapClickHandler
   └─ ✅ handleMapClicked() é chamado

4️⃣ MapClickHandler processa o clique
   ├─ Detecta { lat, lon, routeOrigin, isRouteRequest }
   ├─ Chama drawRoute(origin, destination)
   └─ ✅ Rota é desenhada

5️⃣ Resultado Final
   ├─ Polyline azul conectando os pontos
   ├─ Marcador verde na origem
   ├─ Marcador vermelho no destino
   └─ Mapa auto-ajusta para mostrar tudo
```

## Verificação

✅ O `MapClickHandler` já estava correto:
```javascript
function MapClickHandler({ onMapClick, creatingPoiMode, routeGenerating }) {
  useMapEvents({
    click(e) {
      if (!creatingPoiMode && !routeGenerating) return
      const { lat, lng } = e.latlng
      onMapClick && onMapClick({ lat, lon: lng })
    }
  })
  return null
}
```

✅ O `handleMapClick` já estava correto:
```javascript
function handleMapClick(payload) {
  if (routeGenerating && routeOrigin) {
    const destination = { lat: payload.lat, lon: payload.lon }
    setSelectedPOI(null)
    handleRouteDestinationSelected(routeOrigin, destination)
    setRouteGenerating(false)
    setRouteOrigin(null)
  } else {
    setMapClickData(payload)
  }
}
```

A única modificação necessária foi **desbloqueando o evento de clique do mapa** durante o modo rota.

## Teste Manual

Para validar que está funcionando:

1. ✅ Selecione um município
2. ✅ Clique em "Listar POIs"
3. ✅ Selecione um POI (modal abre)
4. ✅ Clique em "Gerar Rota" (modal fecha)
5. ✅ **Clique em qualquer ponto do mapa** (não deve selecionar município)
6. ✅ Rota deve aparecer com polyline azul
7. ✅ Marcadores nas extremidades

## Tecnical Details

- **stopImmediatePropagation()**: Interrompe a propagação do evento e impede outros handlers
- **routeGenerating prop**: Flag que indica se estamos em modo de geração de rota
- **React-Leaflet event precedence**: Layers têm prioridade sobre map events

## Status

✅ **Corrigido** - O sistema agora consegue capturar cliques específicos no mapa durante modo rota

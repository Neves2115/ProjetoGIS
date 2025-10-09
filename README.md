# GIS — Cobertura de Serviços Públicos (Estado de São Paulo)

Página web com mapa interativo para visualizar e analisar cobertura de serviços públicos municipais (IDH, saneamento, renda per capita, população) e POIs.


## Dados

Granularidade: municípios do Estado de SP

POIs: Delegacias, postos de saúde, escolas, parques e centros sociais

### Diagrama Entidade - Relacionamento
<img width="471" height="451" alt="image" src="https://github.com/user-attachments/assets/0651f8a4-3239-4201-b704-5c5bdc475b14" />

## Crazy-8
![657d7170-6658-49e7-83eb-3a001798734d](https://github.com/user-attachments/assets/fb34a31d-b07b-4ae6-9e09-a166d74e6893)

## Histórias de usuário


Ver mapa coroplético por indicador

Como usuário quero ver o mapa dos municípios colorido por um indicador (ex.: IDH) para identificar padrões; critério: ao selecionar o indicador o mapa atualiza a cor dos polígonos com legenda.

Filtrar POIs por tipo

Como usuário quero filtrar POIs (escolas, postos, delegacias, parques) para visualizar só os marcadores relevantes; critério: selecionar tipos atualiza marcadores no mapa imediatamente.

Detalhe do município

Como usuário quero clicar num município e ver um painel com IDH, renda, saneamento e gráficos rápidos; critério: clique abre painel com valores e gráfico de comparação com a média estadual.

Comparar cidades

Como usuário quero comparar cidades em gráficos para avaliar diferenças; critério: seleção das cidades mostra gráficos lado a lado com os indicadores escolhidos.

Cadastrar novo POI

Como usuário quero cadastrar um POI via formulário (ou clicando no mapa) para persistir e ver o ponto; critério: envio válido salva no banco e o marcador aparece no mapa.

Alternar heatmap por tipo

Como usuário quero ativar um heatmap por tipo de POI (ex.: postos de saúde) para ver concentrações; critério: ativar heatmap substitui/acompanha marcadores e mostra intensidade por região.

Traçar rota 

Como usuário quero traçar uma rota entre dois pontos para ver uma estimativa de trajeto e distância; critério: ao fornecer dois pontos o sistema desenha a linha.

## Membros e responsabilidades
Gustavo Domingues Baeta Neves - Fullstack

Marcus Vinícius Femia - Fullstack

Jõao Paulo Gardini Vieira - Fullstack


## Backlog de funcionalidades inicial 

Mapa base com polígonos dos municípios (GeoJSON).

Choropleth por indicador (IDH, renda, saneamento).

Endpoint GET /municipalities/geojson.

Listagem e exibição de POIs no mapa (GET /pois).

CRUD básico de POIs (POST /pois, PUT /pois/{id}, DELETE /pois/{id}).

Seed script que popula data/db.sqlite3 a partir de data/*.csv/*.geojson.

Script/startup simples para rodar localmente.

Filtros no frontend por tipo de POI e por município

Painel de detalhe ao clicar em município (valores e gráficos rápidos).

Comparador de cidades (gráficos lado a lado).

Heatmap por tipo de POI.

Rotas

## Link para o figma (Protótipo Inicial):

https://www.figma.com/design/fo50pvtjyyZeJilVvtUqKu/ProjetoGIS?node-id=0-1&p=f&t=AJ3ZsxX9jrgHdzBf-0


## Tecnologias

Backend: Python 3.11+, FastAPI, Uvicorn, SQLAlchemy, Pytest.

Banco: SQLite (data/db.sqlite3) — ingestão com Pandas.

Frontend: React 


## Arquitetura

Padrão: MVC + REST

Model: SQLite + SQLAlchemy.

View: React (Mapa, painéis, forms, gráficos).

Controller: FastAPI endpoints expõem JSON / GeoJSON e operações CRUD.

Fluxo: Frontend → REST → FastAPI (controllers) → service layer → database

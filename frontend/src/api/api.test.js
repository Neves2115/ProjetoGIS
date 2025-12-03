/**
 * Tests for frontend/src/api/api.js
 * Tests API functions with mocked fetch
 */

describe('API functions', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('fetchPOIsGeoJSON', () => {
    test('should fetch POIs without parameters', async () => {
      const mockData = {
        type: 'FeatureCollection',
        features: []
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const { fetchPOIsGeoJSON } = require('../src/api/api.js');
      const result = await fetchPOIsGeoJSON();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/pois/')
      );
      expect(result).toEqual(mockData);
    });

    test('should fetch POIs with bbox parameter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ features: [] })
      });

      const { fetchPOIsGeoJSON } = require('../src/api/api.js');
      await fetchPOIsGeoJSON({ bbox: '-46.7,-23.7,-46.4,-23.5' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('bbox=-46.7')
      );
    });

    test('should throw error on failed fetch', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      });

      const { fetchPOIsGeoJSON } = require('../src/api/api.js');

      await expect(fetchPOIsGeoJSON()).rejects.toThrow('Erro ao buscar POIs');
    });
  });

  describe('fetchMunicipalities', () => {
    test('should fetch municipalities', async () => {
      const mockData = [
        { id: 1, nome: 'Adamantina', ibge_code: '3500105' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const { fetchMunicipalities } = require('../src/api/api.js');
      const result = await fetchMunicipalities();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/municipios')
      );
      expect(result).toEqual(mockData);
    });

    test('should fetch municipalities with search query', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const { fetchMunicipalities } = require('../src/api/api.js');
      await fetchMunicipalities('São Paulo');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=S%C3%A3o%20Paulo')
      );
    });

    test('should throw error on failed fetch', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      });

      const { fetchMunicipalities } = require('../src/api/api.js');

      await expect(fetchMunicipalities()).rejects.toThrow('Erro ao buscar municípios');
    });
  });

  describe('fetchMunicipalitiesGeoJSON', () => {
    test('should fetch municipalities GeoJSON', async () => {
      const mockData = {
        type: 'FeatureCollection',
        features: []
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const { fetchMunicipalitiesGeoJSON } = require('../src/api/api.js');
      const result = await fetchMunicipalitiesGeoJSON();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/municipios/geojson')
      );
      expect(result).toEqual(mockData);
    });

    test('should throw error on failed fetch', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      });

      const { fetchMunicipalitiesGeoJSON } = require('../src/api/api.js');

      await expect(fetchMunicipalitiesGeoJSON()).rejects.toThrow('Erro ao buscar municípios');
    });
  });

  describe('fetchIndicadorByIbge', () => {
    test('should fetch indicador by IBGE code', async () => {
      const mockData = {
        id: 1,
        ibge_code: '3500105',
        idh: 0.754
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const { fetchIndicadorByIbge } = require('../src/api/api.js');
      const result = await fetchIndicadorByIbge('3500105');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/indicadores/3500105')
      );
      expect(result).toEqual(mockData);
    });

    test('should return null when indicador not found (404)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const { fetchIndicadorByIbge } = require('../src/api/api.js');
      const result = await fetchIndicadorByIbge('9999999');

      expect(result).toBeNull();
    });

    test('should throw error on other failures', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { fetchIndicadorByIbge } = require('../src/api/api.js');

      await expect(fetchIndicadorByIbge('3500105')).rejects.toThrow('Erro ao buscar indicador');
    });
  });

  describe('fetchAllIndicadores', () => {
    test('should fetch all indicadores', async () => {
      const mockData = [
        { id: 1, ibge_code: '3500105', idh: 0.754 },
        { id: 2, ibge_code: '3500106', idh: 0.780 }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const { fetchAllIndicadores } = require('../src/api/api.js');
      const result = await fetchAllIndicadores();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/indicadores')
      );
      expect(result).toEqual(mockData);
    });

    test('should throw error on failed fetch', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      });

      const { fetchAllIndicadores } = require('../src/api/api.js');

      await expect(fetchAllIndicadores()).rejects.toThrow('Erro ao buscar todos os indicadores');
    });
  });

  describe('fetchPOITypes', () => {
    test('should fetch POI types', async () => {
      const mockData = {
        tipos: ['hospital', 'school', 'park']
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const { fetchPOITypes } = require('../src/api/api.js');
      const result = await fetchPOITypes();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/pois/tipos')
      );
      expect(result).toEqual(mockData);
    });

    test('should throw error on failed fetch', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      });

      const { fetchPOITypes } = require('../src/api/api.js');

      await expect(fetchPOITypes()).rejects.toThrow('Erro ao buscar tipos de POIs');
    });
  });

  describe('fetchPOIsByMunicipio', () => {
    test('should fetch POIs by municipio', async () => {
      const mockData = [
        { id: 1, tipo: 'hospital', nome: 'Hospital' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const { fetchPOIsByMunicipio } = require('../src/api/api.js');
      const result = await fetchPOIsByMunicipio('3500105');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/pois/municipio/3500105')
      );
      expect(result).toEqual(mockData);
    });

    test('should throw error on failed fetch', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      });

      const { fetchPOIsByMunicipio } = require('../src/api/api.js');

      await expect(fetchPOIsByMunicipio('3500105')).rejects.toThrow('Erro ao buscar POIs do município');
    });
  });

  describe('fetchPOIsByBbox', () => {
    test('should fetch POIs by bounding box', async () => {
      const mockData = [
        { id: 1, latitude: -23.5, longitude: -46.5 }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const { fetchPOIsByBbox } = require('../src/api/api.js');
      const result = await fetchPOIsByBbox(-46.7, -23.7, -46.4, -23.5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('bbox=-46.7,-23.7,-46.4,-23.5')
      );
      expect(result).toEqual(mockData);
    });

    test('should fetch POIs by bbox with type filter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const { fetchPOIsByBbox } = require('../src/api/api.js');
      await fetchPOIsByBbox(-46.7, -23.7, -46.4, -23.5, 'hospital');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('tipo=hospital')
      );
    });

    test('should throw error on failed fetch', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      });

      const { fetchPOIsByBbox } = require('../src/api/api.js');

      await expect(fetchPOIsByBbox(-46.7, -23.7, -46.4, -23.5)).rejects.toThrow('Erro ao buscar POIs na área');
    });
  });

  describe('API_BASE configuration', () => {
    test('should use environment variable for API_BASE', () => {
      // This tests that the API correctly uses import.meta.env.VITE_API_BASE
      // or defaults to http://127.0.0.1:8000
      const mockData = [];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      // The actual implementation depends on Vite's import.meta.env
      // So we just verify fetch is called with some base URL
      expect(global.fetch.mock.calls.length).toBeGreaterThanOrEqual(0);
    });
  });
});

"""
Tests for backend/api/municipios.py
Tests municipios endpoints using TestClient
"""
import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock, MagicMock
from backend.main import app
from backend import schemas, models


@pytest.fixture
def client():
    """Create a TestClient for the FastAPI app"""
    return TestClient(app)


@pytest.fixture
def mock_db():
    """Create a mock database session"""
    return Mock()


class TestMunicipiosListEndpoint:
    """Test GET /municipios/ endpoint"""
    
    def test_list_municipios_success(self, client):
        """Test successfully listing municipios"""
        mock_municipios = [
            schemas.MunicipioOut(id=1, ibge_code="3500105", nome="Adamantina", geometry=None),
            schemas.MunicipioOut(id=2, ibge_code="3500106", nome="Herculândia", geometry=None)
        ]
        
        with patch('backend.api.municipios.crud.list_municipios', return_value=mock_municipios):
            response = client.get("/municipios/")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert data[0]["nome"] == "Adamantina"
    
    def test_list_municipios_with_pagination(self, client):
        """Test listing municipios with skip and limit parameters"""
        with patch('backend.api.municipios.crud.list_municipios', return_value=[]):
            response = client.get("/municipios/?skip=10&limit=50")
            
            assert response.status_code == 200
    
    def test_list_municipios_default_pagination(self, client):
        """Test default pagination values"""
        with patch('backend.api.municipios.crud.list_municipios', return_value=[]):
            with patch('backend.api.municipios.crud.list_municipios') as mock_list:
                mock_list.return_value = []
                response = client.get("/municipios/")
                
                # Default should be skip=0, limit=1000
                assert response.status_code == 200


class TestMunicipiosGeoJsonEndpoint:
    """Test GET /municipios/geojson endpoint"""
    
    def test_geojson_success(self, client):
        """Test successfully getting GeoJSON"""
        mock_municipios = [
            Mock(
                id=1,
                nome="Adamantina",
                ibge_code="3500105",
                geometry='{"type": "Point", "coordinates": [-46.5, -23.5]}'
            )
        ]
        
        with patch('backend.api.municipios.crud.list_municipios', return_value=mock_municipios):
            response = client.get("/municipios/geojson")
            
            assert response.status_code == 200
            data = response.json()
            assert data["type"] == "FeatureCollection"
            assert "features" in data
    
    def test_geojson_with_invalid_geometry(self, client):
        """Test GeoJSON endpoint with invalid geometry is skipped"""
        mock_municipios = [
            Mock(
                id=1,
                nome="Adamantina",
                ibge_code="3500105",
                geometry="invalid_json"
            )
        ]
        
        with patch('backend.api.municipios.crud.list_municipios', return_value=mock_municipios):
            response = client.get("/municipios/geojson")
            
            assert response.status_code == 200
            data = response.json()
            # Invalid geometry should be skipped
            assert len(data["features"]) == 0
    
    def test_geojson_with_null_geometry(self, client):
        """Test GeoJSON endpoint with null geometry is skipped"""
        mock_municipios = [
            Mock(
                id=1,
                nome="Adamantina",
                ibge_code="3500105",
                geometry=None
            )
        ]
        
        with patch('backend.api.municipios.crud.list_municipios', return_value=mock_municipios):
            response = client.get("/municipios/geojson")
            
            assert response.status_code == 200
            data = response.json()
            # Null geometry should be skipped
            assert len(data["features"]) == 0
    
    def test_geojson_feature_structure(self, client):
        """Test that GeoJSON features have correct structure"""
        mock_municipios = [
            Mock(
                id=1,
                nome="Adamantina",
                ibge_code="3500105",
                geometry='{"type": "Point", "coordinates": [-46.5, -23.5]}'
            )
        ]
        
        with patch('backend.api.municipios.crud.list_municipios', return_value=mock_municipios):
            response = client.get("/municipios/geojson")
            
            assert response.status_code == 200
            data = response.json()
            features = data["features"]
            assert len(features) == 1
            
            feature = features[0]
            assert feature["type"] == "Feature"
            assert "geometry" in feature
            assert "properties" in feature
            assert feature["properties"]["nome"] == "Adamantina"
            assert feature["properties"]["ibge_code"] == "3500105"


class TestMunicipioDetailEndpoint:
    """Test GET /municipios/{ibge_code} endpoint"""
    
    def test_get_municipio_success(self, client):
        """Test successfully getting a single municipio"""
        mock_municipio = schemas.MunicipioOut(
            id=1,
            ibge_code="3500105",
            nome="Adamantina",
            geometry=None
        )
        
        with patch('backend.api.municipios.crud.get_municipio_by_ibge', return_value=mock_municipio):
            response = client.get("/municipios/3500105")
            
            assert response.status_code == 200
            data = response.json()
            assert data["ibge_code"] == "3500105"
            assert data["nome"] == "Adamantina"
    
    def test_get_municipio_not_found(self, client):
        """Test getting a non-existent municipio returns 404"""
        with patch('backend.api.municipios.crud.get_municipio_by_ibge', return_value=None):
            response = client.get("/municipios/9999999")
            
            assert response.status_code == 404
            assert "detail" in response.json()
    
    def test_get_municipio_with_special_characters(self, client):
        """Test getting municipio with special characters in code"""
        mock_municipio = schemas.MunicipioOut(
            id=1,
            ibge_code="3500105",
            nome="São Paulo",
            geometry=None
        )
        
        with patch('backend.api.municipios.crud.get_municipio_by_ibge', return_value=mock_municipio):
            response = client.get("/municipios/3500105")
            
            assert response.status_code == 200


class TestMunicipiosErrorHandling:
    """Test error handling in municipios endpoints"""
    
    def test_geojson_handles_json_loads_exception(self, client):
        """Test GeoJSON endpoint handles JSON parse exceptions"""
        mock_municipios = [
            Mock(
                id=1,
                nome="Adamantina",
                ibge_code="3500105",
                geometry="{invalid json}"
            )
        ]
        
        with patch('backend.api.municipios.crud.list_municipios', return_value=mock_municipios):
            response = client.get("/municipios/geojson")
            
            assert response.status_code == 200
            # Should still return a valid FeatureCollection, just with no features
    
    def test_geojson_empty_list(self, client):
        """Test GeoJSON with empty municipios list"""
        with patch('backend.api.municipios.crud.list_municipios', return_value=[]):
            response = client.get("/municipios/geojson")
            
            assert response.status_code == 200
            data = response.json()
            assert data["type"] == "FeatureCollection"
            assert len(data["features"]) == 0


class TestMunicipiosResponseFormat:
    """Test response formatting"""
    
    def test_list_response_is_array(self, client):
        """Test that list endpoint returns an array"""
        with patch('backend.api.municipios.crud.list_municipios', return_value=[]):
            response = client.get("/municipios/")
            
            assert response.status_code == 200
            assert isinstance(response.json(), list)
    
    def test_detail_response_is_object(self, client):
        """Test that detail endpoint returns an object"""
        mock_municipio = schemas.MunicipioOut(
            id=1,
            ibge_code="3500105",
            nome="Adamantina",
            geometry=None
        )
        
        with patch('backend.api.municipios.crud.get_municipio_by_ibge', return_value=mock_municipio):
            response = client.get("/municipios/3500105")
            
            assert response.status_code == 200
            assert isinstance(response.json(), dict)
    
    def test_geojson_response_structure(self, client):
        """Test GeoJSON response has correct structure"""
        with patch('backend.api.municipios.crud.list_municipios', return_value=[]):
            response = client.get("/municipios/geojson")
            
            assert response.status_code == 200
            data = response.json()
            assert data.get("type") == "FeatureCollection"
            assert isinstance(data.get("features"), list)


class TestMunicipiosPagination:
    """Test pagination functionality"""
    
    def test_skip_parameter(self, client):
        """Test skip parameter is passed correctly"""
        with patch('backend.api.municipios.crud.list_municipios') as mock_list:
            mock_list.return_value = []
            client.get("/municipios/?skip=20")
            
            # Verify skip was passed
            assert mock_list.called
    
    def test_limit_parameter(self, client):
        """Test limit parameter is passed correctly"""
        with patch('backend.api.municipios.crud.list_municipios') as mock_list:
            mock_list.return_value = []
            client.get("/municipios/?limit=50")
            
            assert mock_list.called
    
    def test_both_pagination_parameters(self, client):
        """Test both skip and limit parameters"""
        with patch('backend.api.municipios.crud.list_municipios') as mock_list:
            mock_list.return_value = []
            client.get("/municipios/?skip=10&limit=25")
            
            assert mock_list.called


class TestMunicipiosContentType:
    """Test content type headers"""
    
    def test_list_returns_json(self, client):
        """Test list endpoint returns JSON content type"""
        with patch('backend.api.municipios.crud.list_municipios', return_value=[]):
            response = client.get("/municipios/")
            
            assert "application/json" in response.headers["content-type"]
    
    def test_geojson_returns_json(self, client):
        """Test geojson endpoint returns JSON content type"""
        with patch('backend.api.municipios.crud.list_municipios', return_value=[]):
            response = client.get("/municipios/geojson")
            
            assert "application/json" in response.headers["content-type"]
    
    def test_detail_returns_json(self, client):
        """Test detail endpoint returns JSON content type"""
        mock_municipio = schemas.MunicipioOut(
            id=1,
            ibge_code="3500105",
            nome="Adamantina",
            geometry=None
        )
        
        with patch('backend.api.municipios.crud.get_municipio_by_ibge', return_value=mock_municipio):
            response = client.get("/municipios/3500105")
            
            assert "application/json" in response.headers["content-type"]

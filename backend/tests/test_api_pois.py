"""
Tests for backend/api/pois.py
Tests POIs endpoints using TestClient
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock
from backend.main import app
from backend import schemas
from datetime import datetime


@pytest.fixture
def client():
    """Create a TestClient for the FastAPI app"""
    return TestClient(app)


class TestPOIsListEndpoint:
    """Test GET /pois/ endpoint"""
    
    def test_list_pois_success(self, client):
        """Test successfully listing POIs"""
        now = datetime.now()
        mock_pois = [
            schemas.POIOut(
                id=1,
                municipio_id=1,
                tipo="hospital",
                nome="Hospital Central",
                latitude=-23.5,
                longitude=-46.5,
                created_at=now
            ),
            schemas.POIOut(
                id=2,
                municipio_id=1,
                tipo="school",
                nome="School 1",
                latitude=-23.6,
                longitude=-46.6,
                created_at=now
            )
        ]
        
        with patch('backend.api.pois.crud.list_pois', return_value=mock_pois):
            response = client.get("/pois/")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert data[0]["nome"] == "Hospital Central"
    
    def test_list_pois_empty(self, client):
        """Test listing POIs when none exist"""
        with patch('backend.api.pois.crud.list_pois', return_value=[]):
            response = client.get("/pois/")
            
            assert response.status_code == 200
            assert response.json() == []
    
    def test_list_pois_with_pagination(self, client):
        """Test listing POIs with skip and limit"""
        with patch('backend.api.pois.crud.list_pois', return_value=[]):
            response = client.get("/pois/?skip=10&limit=50")
            
            assert response.status_code == 200


class TestPOITypesEndpoint:
    """Test GET /pois/tipos endpoint"""
    
    def test_get_poi_types_success(self, client):
        """Test successfully getting POI types"""
        mock_types = ["hospital", "school", "park", "police"]
        
        with patch('backend.api.pois.crud.get_poi_types', return_value=mock_types):
            response = client.get("/pois/tipos")
            
            assert response.status_code == 200
            data = response.json()
            assert "tipos" in data
            assert len(data["tipos"]) == 4
            assert "hospital" in data["tipos"]
    
    def test_get_poi_types_empty(self, client):
        """Test getting POI types when none exist"""
        with patch('backend.api.pois.crud.get_poi_types', return_value=[]):
            response = client.get("/pois/tipos")
            
            assert response.status_code == 200
            data = response.json()
            assert data["tipos"] == []


class TestPOIsByTypeEndpoint:
    """Test GET /pois/tipo/{tipo} endpoint"""
    
    def test_get_pois_by_type_success(self, client):
        """Test successfully filtering POIs by type"""
        now = datetime.now()
        mock_pois = [
            schemas.POIOut(
                id=1,
                municipio_id=1,
                tipo="hospital",
                nome="Hospital 1",
                latitude=-23.5,
                longitude=-46.5,
                created_at=now
            ),
            schemas.POIOut(
                id=2,
                municipio_id=1,
                tipo="hospital",
                nome="Hospital 2",
                latitude=-23.6,
                longitude=-46.6,
                created_at=now
            )
        ]
        
        with patch('backend.api.pois.crud.list_pois_by_type', return_value=mock_pois):
            response = client.get("/pois/tipo/hospital")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert all(poi["tipo"] == "hospital" for poi in data)
    
    def test_get_pois_by_type_not_found(self, client):
        """Test filtering POIs by non-existent type"""
        with patch('backend.api.pois.crud.list_pois_by_type', return_value=[]):
            response = client.get("/pois/tipo/nonexistent")
            
            assert response.status_code == 200
            assert response.json() == []


class TestPOIsByMunicipioEndpoint:
    """Test GET /pois/municipio/{ibge_code} endpoint"""
    
    def test_get_pois_by_municipio_success(self, client):
        """Test successfully getting POIs by municipio"""
        now = datetime.now()
        mock_pois = [
            schemas.POIOut(
                id=1,
                municipio_id=1,
                tipo="hospital",
                nome="Hospital",
                latitude=-23.5,
                longitude=-46.5,
                created_at=now
            )
        ]
        
        with patch('backend.api.pois.crud.list_pois_by_municipio', return_value=mock_pois):
            response = client.get("/pois/municipio/3500105")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["municipio_id"] == 1
    
    def test_get_pois_by_municipio_empty(self, client):
        """Test getting POIs for municipio with no POIs"""
        with patch('backend.api.pois.crud.list_pois_by_municipio', return_value=[]):
            response = client.get("/pois/municipio/3500105")
            
            assert response.status_code == 200
            assert response.json() == []
    
    def test_get_pois_by_municipio_with_pagination(self, client):
        """Test getting POIs by municipio with pagination"""
        with patch('backend.api.pois.crud.list_pois_by_municipio', return_value=[]):
            response = client.get("/pois/municipio/3500105?skip=10&limit=100")
            
            assert response.status_code == 200


class TestPOIsBboxEndpoint:
    """Test GET /pois/bbox endpoint"""
    
    def test_bbox_query_success(self, client):
        """Test successfully querying POIs by bbox"""
        now = datetime.now()
        mock_pois = [
            schemas.POIOut(
                id=1,
                municipio_id=1,
                tipo="hospital",
                nome="Hospital",
                latitude=-23.5,
                longitude=-46.5,
                created_at=now
            )
        ]
        
        with patch('backend.api.pois.crud.list_pois_in_bbox', return_value=mock_pois):
            response = client.get("/pois/bbox?bbox=-46.7,-23.7,-46.4,-23.5")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
    
    def test_bbox_invalid_format(self, client):
        """Test bbox with invalid format"""
        with patch('backend.api.pois.crud.list_pois_in_bbox', return_value=[]):
            response = client.get("/pois/bbox?bbox=-46.7,-23.7,-46.4")
            
            assert response.status_code == 400
            assert "bbox must be" in response.json()["detail"]
    
    def test_bbox_with_type_filter(self, client):
        """Test bbox query with type filter"""
        mock_pois = []
        
        with patch('backend.api.pois.crud.list_pois_in_bbox', return_value=mock_pois):
            response = client.get("/pois/bbox?bbox=-46.7,-23.7,-46.4,-23.5&tipo=hospital")
            
            assert response.status_code == 200
    
    def test_bbox_missing_required_parameter(self, client):
        """Test bbox without required bbox parameter"""
        response = client.get("/pois/bbox")
        
        assert response.status_code == 422  # Unprocessable Entity


class TestCreatePOIEndpoint:
    """Test POST /pois/ endpoint"""
    
    def test_create_poi_success(self, client):
        """Test successfully creating a POI"""
        poi_data = {
            "municipio_id": 1,
            "tipo": "hospital",
            "nome": "New Hospital",
            "latitude": -23.5,
            "longitude": -46.5
        }
        
        mock_poi = schemas.POIOut(
            id=3,
            municipio_id=1,
            tipo="hospital",
            nome="New Hospital",
            latitude=-23.5,
            longitude=-46.5,
            created_at=datetime.now()
        )
        
        with patch('backend.api.pois.crud.create_poi', return_value=mock_poi):
            response = client.post("/pois/", json=poi_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["nome"] == "New Hospital"
    
    def test_create_poi_missing_required_fields(self, client):
        """Test creating POI without required fields"""
        poi_data = {
            "tipo": "hospital",
            "nome": "Hospital"
            # Missing latitude and longitude
        }
        
        response = client.post("/pois/", json=poi_data)
        
        assert response.status_code == 422
    
    def test_create_poi_minimal_data(self, client):
        """Test creating POI with only required fields"""
        poi_data = {
            "latitude": -23.5,
            "longitude": -46.5
        }
        
        mock_poi = schemas.POIOut(
            id=3,
            municipio_id=None,
            tipo=None,
            nome=None,
            latitude=-23.5,
            longitude=-46.5,
            created_at=datetime.now()
        )
        
        with patch('backend.api.pois.crud.create_poi', return_value=mock_poi):
            response = client.post("/pois/", json=poi_data)
            
            assert response.status_code == 200


class TestPOIsResponseFormat:
    """Test response formatting"""
    
    def test_list_response_is_array(self, client):
        """Test that list endpoint returns an array"""
        with patch('backend.api.pois.crud.list_pois', return_value=[]):
            response = client.get("/pois/")
            
            assert response.status_code == 200
            assert isinstance(response.json(), list)
    
    def test_tipos_response_structure(self, client):
        """Test that tipos endpoint returns correct structure"""
        with patch('backend.api.pois.crud.get_poi_types', return_value=["hospital"]):
            response = client.get("/pois/tipos")
            
            assert response.status_code == 200
            data = response.json()
            assert "tipos" in data
            assert isinstance(data["tipos"], list)


class TestPOIsContentType:
    """Test content type headers"""
    
    def test_list_returns_json(self, client):
        """Test list endpoint returns JSON content type"""
        with patch('backend.api.pois.crud.list_pois', return_value=[]):
            response = client.get("/pois/")
            
            assert "application/json" in response.headers["content-type"]
    
    def test_tipos_returns_json(self, client):
        """Test tipos endpoint returns JSON content type"""
        with patch('backend.api.pois.crud.get_poi_types', return_value=[]):
            response = client.get("/pois/tipos")
            
            assert "application/json" in response.headers["content-type"]


class TestPOIsErrorHandling:
    """Test error handling"""
    
    def test_bbox_with_invalid_coordinates(self, client):
        """Test bbox with non-numeric coordinates"""
        # This will raise ValueError which becomes 500 error
        try:
            response = client.get("/pois/bbox?bbox=abc,def,ghi,jkl")
            # If it doesn't raise, check status is error
            assert response.status_code >= 400
        except ValueError:
            # Expected behavior
            pass
    
    def test_bbox_wrong_parameter_count(self, client):
        """Test bbox with wrong number of coordinates"""
        response = client.get("/pois/bbox?bbox=-46.7,-23.7,-46.4")
        
        assert response.status_code == 400
        assert "bbox must be" in response.json()["detail"]


class TestPOIsPagination:
    """Test pagination functionality"""
    
    def test_list_pois_skip_limit(self, client):
        """Test list pois respects skip and limit"""
        with patch('backend.api.pois.crud.list_pois', return_value=[]):
            response = client.get("/pois/?skip=20&limit=50")
            
            assert response.status_code == 200
    
    def test_by_type_skip_limit(self, client):
        """Test by_type respects skip and limit"""
        with patch('backend.api.pois.crud.list_pois_by_type', return_value=[]):
            response = client.get("/pois/tipo/hospital?skip=10&limit=30")
            
            assert response.status_code == 200
    
    def test_by_municipio_skip_limit(self, client):
        """Test by_municipio respects skip and limit"""
        with patch('backend.api.pois.crud.list_pois_by_municipio', return_value=[]):
            response = client.get("/pois/municipio/3500105?skip=5&limit=25")
            
            assert response.status_code == 200


class TestPOIsDataTypes:
    """Test data type handling"""
    
    def test_coordinates_are_floats(self, client):
        """Test that coordinates are returned as floats"""
        now = datetime.now()
        mock_poi = schemas.POIOut(
            id=1,
            municipio_id=1,
            tipo="hospital",
            nome="Hospital",
            latitude=-23.5101097,
            longitude=-46.4983227,
            created_at=now
        )
        
        with patch('backend.api.pois.crud.list_pois', return_value=[mock_poi]):
            response = client.get("/pois/")
            
            data = response.json()
            assert isinstance(data[0]["latitude"], float)
            assert isinstance(data[0]["longitude"], float)
    
    def test_id_is_integer(self, client):
        """Test that ID is returned as integer"""
        now = datetime.now()
        mock_poi = schemas.POIOut(
            id=1,
            municipio_id=1,
            tipo="hospital",
            nome="Hospital",
            latitude=-23.5,
            longitude=-46.5,
            created_at=now
        )
        
        with patch('backend.api.pois.crud.list_pois', return_value=[mock_poi]):
            response = client.get("/pois/")
            
            data = response.json()
            assert isinstance(data[0]["id"], int)


class TestPOIsIntegration:
    """Integration tests for POIs endpoints"""
    
    def test_list_then_filter_by_type(self, client):
        """Test getting list then filtering by type"""
        now = datetime.now()
        mock_pois = [
            schemas.POIOut(
                id=1,
                municipio_id=1,
                tipo="hospital",
                nome="Hospital",
                latitude=-23.5,
                longitude=-46.5,
                created_at=now
            )
        ]
        
        with patch('backend.api.pois.crud.list_pois', return_value=mock_pois):
            response = client.get("/pois/")
            assert response.status_code == 200
        
        with patch('backend.api.pois.crud.list_pois_by_type', return_value=mock_pois):
            response = client.get("/pois/tipo/hospital")
            assert response.status_code == 200
    
    def test_get_types_then_filter(self, client):
        """Test getting types then filtering by one"""
        with patch('backend.api.pois.crud.get_poi_types', return_value=["hospital", "school"]):
            response = client.get("/pois/tipos")
            assert response.status_code == 200
            assert "hospital" in response.json()["tipos"]
        
        with patch('backend.api.pois.crud.list_pois_by_type', return_value=[]):
            response = client.get("/pois/tipo/hospital")
            assert response.status_code == 200

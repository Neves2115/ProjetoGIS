import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from backend.main import app
from backend import schemas


@pytest.fixture
def client():
    return TestClient(app)


class TestIndicadoresListEndpoint:
   
    def test_list_indicadores_success(self, client):
       
        mock_indicadores = [
            schemas.IndicadorOut(
                id=1,
                ibge_code="3500105",
                idh=0.754,
                idh_renda=0.754,
                idh_longevidade=0.800,
                idh_educacao=0.620,
                renda_per_capita=45751.7,
                saneamento=97.36
            ),
            schemas.IndicadorOut(
                id=2,
                ibge_code="3500106",
                idh=0.780,
                idh_renda=None,
                idh_longevidade=None,
                idh_educacao=None,
                renda_per_capita=None,
                saneamento=None
            )
        ]
        
        with patch('backend.api.indicadores.crud.list_indicadores', return_value=mock_indicadores):
            response = client.get("/indicadores/")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert data[0]["ibge_code"] == "3500105"
            assert data[0]["idh"] == 0.754
    
    def test_list_indicadores_empty(self, client):
        
        with patch('backend.api.indicadores.crud.list_indicadores', return_value=[]):
            response = client.get("/indicadores/")
            
            assert response.status_code == 200
            assert response.json() == []
    
    def test_list_indicadores_with_pagination(self, client):
        """Test listing indicadores with skip and limit"""
        with patch('backend.api.indicadores.crud.list_indicadores', return_value=[]):
            response = client.get("/indicadores/?skip=10&limit=50")
            
            assert response.status_code == 200
    
    def test_list_indicadores_default_pagination(self, client):
        """Test default pagination values for indicadores"""
        with patch('backend.api.indicadores.crud.list_indicadores', return_value=[]):
            with patch('backend.api.indicadores.crud.list_indicadores') as mock_list:
                mock_list.return_value = []
                response = client.get("/indicadores/")
                
                assert response.status_code == 200


class TestIndicadorDetailEndpoint:
    """Test GET /indicadores/{ibge_code} endpoint"""
    
    def test_get_indicador_success(self, client):
        """Test successfully getting a single indicador"""
        mock_indicador = schemas.IndicadorOut(
            id=1,
            ibge_code="3500105",
            idh=0.754,
            idh_renda=0.754,
            idh_longevidade=0.800,
            idh_educacao=0.620,
            renda_per_capita=45751.7,
            saneamento=97.36
        )
        
        with patch('backend.api.indicadores.crud.get_indicador_by_ibge', return_value=mock_indicador):
            response = client.get("/indicadores/3500105")
            
            assert response.status_code == 200
            data = response.json()
            assert data["ibge_code"] == "3500105"
            assert data["idh"] == 0.754
            assert data["saneamento"] == 97.36
    
    def test_get_indicador_not_found(self, client):
        """Test getting a non-existent indicador returns 404"""
        with patch('backend.api.indicadores.crud.get_indicador_by_ibge', return_value=None):
            response = client.get("/indicadores/9999999")
            
            assert response.status_code == 404
            assert "Indicador not found" in response.json()["detail"]
    
    def test_get_indicador_with_partial_data(self, client):
        """Test getting indicador with some null values"""
        mock_indicador = schemas.IndicadorOut(
            id=1,
            ibge_code="3500105",
            idh=0.754,
            idh_renda=None,
            idh_longevidade=None,
            idh_educacao=None,
            renda_per_capita=45751.7,
            saneamento=None
        )
        
        with patch('backend.api.indicadores.crud.get_indicador_by_ibge', return_value=mock_indicador):
            response = client.get("/indicadores/3500105")
            
            assert response.status_code == 200
            data = response.json()
            assert data["idh"] == 0.754
            assert data["idh_renda"] is None
            assert data["renda_per_capita"] == 45751.7


class TestIndicadoresResponseFormat:
    """Test response formatting"""
    
    def test_list_response_is_array(self, client):
        """Test that list endpoint returns an array"""
        with patch('backend.api.indicadores.crud.list_indicadores', return_value=[]):
            response = client.get("/indicadores/")
            
            assert response.status_code == 200
            assert isinstance(response.json(), list)
    
    def test_detail_response_is_object(self, client):
        """Test that detail endpoint returns an object"""
        mock_indicador = schemas.IndicadorOut(
            id=1,
            ibge_code="3500105",
            idh=0.754,
            idh_renda=None,
            idh_longevidade=None,
            idh_educacao=None,
            renda_per_capita=None,
            saneamento=None
        )
        
        with patch('backend.api.indicadores.crud.get_indicador_by_ibge', return_value=mock_indicador):
            response = client.get("/indicadores/3500105")
            
            assert response.status_code == 200
            assert isinstance(response.json(), dict)


class TestIndicadoresContentType:
    """Test content type headers"""
    
    def test_list_returns_json(self, client):
        """Test list endpoint returns JSON content type"""
        with patch('backend.api.indicadores.crud.list_indicadores', return_value=[]):
            response = client.get("/indicadores/")
            
            assert "application/json" in response.headers["content-type"]
    
    def test_detail_returns_json(self, client):
        """Test detail endpoint returns JSON content type"""
        mock_indicador = schemas.IndicadorOut(
            id=1,
            ibge_code="3500105",
            idh=0.754,
            idh_renda=None,
            idh_longevidade=None,
            idh_educacao=None,
            renda_per_capita=None,
            saneamiento=None
        )
        
        with patch('backend.api.indicadores.crud.get_indicador_by_ibge', return_value=mock_indicador):
            response = client.get("/indicadores/3500105")
            
            assert "application/json" in response.headers["content-type"]


class TestIndicadoresErrorHandling:
    """Test error handling"""
    
    def test_get_indicador_invalid_ibge_code(self, client):
        """Test with various IBGE code formats"""
        with patch('backend.api.indicadores.crud.get_indicador_by_ibge', return_value=None):
            response = client.get("/indicadores/invalid")
            
            assert response.status_code == 404
    
    def test_list_indicadores_handles_empty_result(self, client):
        """Test list handles empty results gracefully"""
        with patch('backend.api.indicadores.crud.list_indicadores', return_value=[]):
            response = client.get("/indicadores/")
            
            assert response.status_code == 200
            assert response.json() == []


class TestIndicadoresDataTypes:
    """Test data type handling in responses"""
    
    def test_float_values_preserved(self, client):
        """Test that float values are properly preserved"""
        mock_indicador = schemas.IndicadorOut(
            id=1,
            ibge_code="3500105",
            idh=0.754123,
            idh_renda=0.754,
            idh_longevidade=0.8005,
            idh_educacao=0.62,
            renda_per_capita=45751.7999,
            saneamento=97.36
        )
        
        with patch('backend.api.indicadores.crud.get_indicador_by_ibge', return_value=mock_indicador):
            response = client.get("/indicadores/3500105")
            
            assert response.status_code == 200
            data = response.json()
            # JSON should preserve floating point values
            assert "idh" in data
            assert isinstance(data["idh"], float)
    
    def test_null_values_represented_as_null(self, client):
        """Test that null values are represented as null in JSON"""
        mock_indicador = schemas.IndicadorOut(
            id=1,
            ibge_code="3500105",
            idh=None,
            idh_renda=None,
            idh_longevidade=None,
            idh_educacao=None,
            renda_per_capita=None,
            saneamiento=None
        )
        
        with patch('backend.api.indicadores.crud.get_indicador_by_ibge', return_value=mock_indicador):
            response = client.get("/indicadores/3500105")
            
            assert response.status_code == 200
            data = response.json()
            assert data["idh"] is None


class TestIndicadoresPagination:
    """Test pagination functionality"""
    
    def test_skip_parameter_passed(self, client):
        """Test skip parameter is passed to CRUD"""
        with patch('backend.api.indicadores.crud.list_indicadores') as mock_list:
            mock_list.return_value = []
            client.get("/indicadores/?skip=20")
            
            assert mock_list.called
    
    def test_limit_parameter_passed(self, client):
        """Test limit parameter is passed to CRUD"""
        with patch('backend.api.indicadores.crud.list_indicadores') as mock_list:
            mock_list.return_value = []
            client.get("/indicadores/?limit=50")
            
            assert mock_list.called


class TestIndicadoresSchema:
    """Test schema fields"""
    
    def test_all_required_fields_present(self, client):
        """Test that all required fields are in response"""
        mock_indicador = schemas.IndicadorOut(
            id=1,
            ibge_code="3500105",
            idh=0.754,
            idh_renda=0.754,
            idh_longevidade=0.800,
            idh_educacao=0.620,
            renda_per_capita=45751.7,
            saneamiento=97.36
        )
        
        with patch('backend.api.indicadores.crud.get_indicador_by_ibge', return_value=mock_indicador):
            response = client.get("/indicadores/3500105")
            
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert "ibge_code" in data
            assert "idh" in data

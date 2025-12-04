"""
Tests for backend/crud.py
Tests CRUD operations with mocked database sessions
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from backend import crud, models, schemas


@pytest.fixture
def mock_session():
    """Create a mock database session"""
    return Mock()


class TestMunicipiosCrud:
    """Test Municipio CRUD operations"""
    
    def test_list_municipios(self, mock_session):
        """Test listing municipios with pagination"""
        mock_municipios = [
            Mock(id=1, ibge_code="3500105", nome="Adamantina"),
            Mock(id=2, ibge_code="3500106", nome="Herculândia")
        ]
        mock_session.query.return_value.offset.return_value.limit.return_value.all.return_value = mock_municipios
        
        result = crud.list_municipios(mock_session, skip=0, limit=100)
        
        assert len(result) == 2
        assert result[0].nome == "Adamantina"
        mock_session.query.assert_called_once_with(models.Municipio)
    
    def test_list_municipios_with_skip_limit(self, mock_session):
        """Test list_municipios respects skip and limit parameters"""
        mock_session.query.return_value.offset.return_value.limit.return_value.all.return_value = []
        
        crud.list_municipios(mock_session, skip=10, limit=50)
        
        mock_session.query.return_value.offset.assert_called_once_with(10)
        mock_session.query.return_value.offset.return_value.limit.assert_called_once_with(50)
    
    def test_get_municipio_by_ibge(self, mock_session):
        """Test getting municipio by ibge_code"""
        mock_municipio = Mock(id=1, ibge_code="3500105", nome="Adamantina")
        mock_session.query.return_value.filter.return_value.first.return_value = mock_municipio
        
        result = crud.get_municipio_by_ibge(mock_session, "3500105")
        
        assert result.ibge_code == "3500105"
        assert result.nome == "Adamantina"
    
    def test_get_municipio_not_found(self, mock_session):
        """Test get_municipio returns None when not found"""
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = crud.get_municipio_by_ibge(mock_session, "9999999")
        
        assert result is None


class TestIndicadoresCrud:
    """Test Indicador CRUD operations"""
    
    def test_list_indicadores(self, mock_session):
        """Test listing indicadores"""
        mock_indicadores = [
            Mock(id=1, ibge_code="3500105", idh=0.754),
            Mock(id=2, ibge_code="3500106", idh=0.780)
        ]
        mock_session.query.return_value.offset.return_value.limit.return_value.all.return_value = mock_indicadores
        
        result = crud.list_indicadores(mock_session, skip=0, limit=100)
        
        assert len(result) == 2
        assert result[0].idh == 0.754
    
    def test_get_indicador_by_ibge(self, mock_session):
        """Test getting indicador by ibge_code"""
        mock_indicador = Mock(id=1, ibge_code="3500105", idh=0.754)
        mock_session.query.return_value.filter.return_value.first.return_value = mock_indicador
        
        result = crud.get_indicador_by_ibge(mock_session, "3500105")
        
        assert result.ibge_code == "3500105"
        assert result.idh == 0.754
    
    def test_get_indicador_not_found(self, mock_session):
        """Test get_indicador returns None when not found"""
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = crud.get_indicador_by_ibge(mock_session, "9999999")
        
        assert result is None


class TestPOIsCrud:
    """Test POI CRUD operations"""
    
    def test_list_pois(self, mock_session):
        """Test listing POIs"""
        mock_pois = [
            Mock(id=1, tipo="hospital", nome="Hospital Central"),
            Mock(id=2, tipo="school", nome="School 1")
        ]
        mock_session.query.return_value.offset.return_value.limit.return_value.all.return_value = mock_pois
        
        result = crud.list_pois(mock_session, skip=0, limit=100)
        
        assert len(result) == 2
        assert result[0].tipo == "hospital"
    
    def test_list_pois_by_type(self, mock_session):
        """Test filtering POIs by type"""
        mock_pois = [
            Mock(id=1, tipo="hospital", nome="Hospital Central"),
            Mock(id=2, tipo="hospital", nome="Hospital 2")
        ]
        mock_session.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value = mock_pois
        
        result = crud.list_pois_by_type(mock_session, tipo="hospital", skip=0, limit=100)
        
        assert len(result) == 2
        assert all(poi.tipo == "hospital" for poi in result)
    
    def test_list_pois_by_municipio(self, mock_session):
        """Test filtering POIs by municipio via ibge_code"""
        mock_municipio = Mock(id=1, ibge_code="3500105", nome="Adamantina")
        mock_pois = [
            Mock(id=1, municipio_id=1, tipo="hospital"),
            Mock(id=2, municipio_id=1, tipo="school")
        ]
        
        # First call returns the municipio
        # Second call returns the POIs
        mock_session.query.return_value.filter.return_value.first.return_value = mock_municipio
        mock_session.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value = mock_pois
        
        result = crud.list_pois_by_municipio(mock_session, ibge_code="3500105", skip=0, limit=500)
        
        assert len(result) == 2
    
    def test_list_pois_by_municipio_not_found(self, mock_session):
        """Test list_pois_by_municipio returns empty when municipio not found"""
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = crud.list_pois_by_municipio(mock_session, ibge_code="9999999")
        
        assert result == []
    
    def test_list_pois_in_bbox(self, mock_session):
        """Test filtering POIs in bounding box"""
        mock_pois = [
            Mock(id=1, latitude=-23.5, longitude=-46.5),
            Mock(id=2, latitude=-23.55, longitude=-46.55)
        ]
        # Setup the chain of mocks properly
        query_mock = Mock()
        mock_session.query.return_value = query_mock
        filter_mock = Mock()
        query_mock.filter.return_value = filter_mock
        
        # Each subsequent filter call needs to return itself
        def filter_chain(x):
            return filter_mock
        
        filter_mock.filter.side_effect = filter_chain
        filter_mock.all.return_value = mock_pois
        
        result = crud.list_pois_in_bbox(
            mock_session, 
            min_lon=-46.7, min_lat=-23.7, 
            max_lon=-46.4, max_lat=-23.5
        )
        
        assert result == mock_pois
    
    def test_list_pois_in_bbox_with_type_filter(self, mock_session):
        """Test filtering POIs in bbox with type filter"""
        mock_pois = [
            Mock(id=1, latitude=-23.5, longitude=-46.5, tipo="hospital")
        ]
        # Setup the chain of mocks properly
        query_mock = Mock()
        mock_session.query.return_value = query_mock
        filter_mock = Mock()
        query_mock.filter.return_value = filter_mock
        
        # Each subsequent filter call needs to return itself
        def filter_chain(x):
            return filter_mock
        
        filter_mock.filter.side_effect = filter_chain
        filter_mock.all.return_value = mock_pois
        
        result = crud.list_pois_in_bbox(
            mock_session, 
            min_lon=-46.7, min_lat=-23.7, 
            max_lon=-46.4, max_lat=-23.5,
            tipo="hospital"
        )
        
        assert result == mock_pois
    
    def test_get_poi_types(self, mock_session):
        """Test getting unique POI types"""
        mock_results = [("hospital",), ("school",), ("park",)]
        mock_session.query.return_value.distinct.return_value.filter.return_value.all.return_value = mock_results
        
        result = crud.get_poi_types(mock_session)
        
        assert len(result) == 3
        assert "hospital" in result
        assert "school" in result
        assert "park" in result
    
    def test_get_poi_types_sorted(self, mock_session):
        """Test that get_poi_types returns sorted results"""
        mock_results = [("school",), ("hospital",), ("park",)]
        mock_session.query.return_value.distinct.return_value.filter.return_value.all.return_value = mock_results
        
        result = crud.get_poi_types(mock_session)
        
        assert result == sorted(result)
    
    def test_get_poi_types_empty(self, mock_session):
        """Test get_poi_types with no types"""
        mock_session.query.return_value.distinct.return_value.filter.return_value.all.return_value = []
        
        result = crud.get_poi_types(mock_session)
        
        assert result == []
    
    def test_create_poi(self, mock_session):
        """Test creating a POI"""
        poi_in = schemas.POICreate(
            municipio_id=1,
            tipo="hospital",
            nome="Hospital Central",
            latitude=-23.5,
            longitude=-46.5
        )
        
        mock_poi = Mock(
            id=1,
            municipio_id=1,
            tipo="hospital",
            nome="Hospital Central",
            latitude=-23.5,
            longitude=-46.5
        )
        mock_session.add = Mock()
        mock_session.commit = Mock()
        mock_session.refresh = Mock()
        
        # Mock the POI constructor
        with patch('backend.crud.models.POI') as mock_poi_class:
            mock_poi_class.return_value = mock_poi
            result = crud.create_poi(mock_session, poi_in)
            
            mock_session.add.assert_called_once()
            mock_session.commit.assert_called_once()
            mock_session.refresh.assert_called_once_with(mock_poi)


class TestCrudPagination:
    """Test pagination in CRUD operations"""
    
    def test_list_municipios_default_pagination(self, mock_session):
        """Test default pagination values"""
        mock_session.query.return_value.offset.return_value.limit.return_value.all.return_value = []
        
        crud.list_municipios(mock_session)
        
        mock_session.query.return_value.offset.assert_called_with(0)
        mock_session.query.return_value.offset.return_value.limit.assert_called_with(100)
    
    def test_list_pois_default_pagination(self, mock_session):
        """Test default pagination for POIs"""
        mock_session.query.return_value.offset.return_value.limit.return_value.all.return_value = []
        
        crud.list_pois(mock_session)
        
        mock_session.query.return_value.offset.assert_called_with(0)
        mock_session.query.return_value.offset.return_value.limit.assert_called_with(100)


class TestCrudErrorHandling:
    """Test error handling in CRUD operations"""
    
    def test_list_pois_by_municipio_handles_none_municipio(self, mock_session):
        """Test that function handles None municipio gracefully"""
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = crud.list_pois_by_municipio(mock_session, "invalid_code")
        
        assert isinstance(result, list)
        assert len(result) == 0
    
    def test_get_poi_types_filters_none_values(self, mock_session):
        """Test that get_poi_types filters out None values"""
        mock_results = [("hospital",), (None,), ("park",)]
        mock_session.query.return_value.distinct.return_value.filter.return_value.all.return_value = mock_results
        
        result = crud.get_poi_types(mock_session)
        
        # None should be filtered out (through the filter in the function)
        assert None not in result

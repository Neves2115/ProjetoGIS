"""
Tests for backend/schemas.py
Tests Pydantic schema validation and serialization
"""
import pytest
from datetime import datetime
from pydantic import ValidationError
from backend.schemas import (
    MunicipioBase, MunicipioCreate, MunicipioUpdate, MunicipioOut,
    IndicadorBase, IndicadorCreate, IndicadorUpdate, IndicadorOut,
    POIBase, POICreate, POIUpdate, POIOut,
    MunicipioList, IndicadoresList, POIList
)


class TestMunicipioSchemas:
    """Test Municipio schema classes"""
    
    def test_municipio_base_valid(self):
        """Test MunicipioBase with valid data"""
        data = {
            "ibge_code": "3500105",
            "nome": "Adamantina",
            "geometry": {"type": "Point", "coordinates": [-46.5, -23.5]}
        }
        schema = MunicipioBase(**data)
        assert schema.ibge_code == "3500105"
        assert schema.nome == "Adamantina"
    
    def test_municipio_base_required_fields(self):
        """Test MunicipioBase requires ibge_code and nome"""
        with pytest.raises(ValidationError):
            MunicipioBase(ibge_code="3500105")
        
        with pytest.raises(ValidationError):
            MunicipioBase(nome="Adamantina")
    
    def test_municipio_base_nullable_geometry(self):
        """Test MunicipioBase with null geometry"""
        schema = MunicipioBase(ibge_code="3500105", nome="Adamantina", geometry=None)
        assert schema.geometry is None
    
    def test_municipio_create(self):
        """Test MunicipioCreate schema"""
        data = {
            "ibge_code": "3500105",
            "nome": "Adamantina",
            "geometry": None
        }
        schema = MunicipioCreate(**data)
        assert schema.ibge_code == "3500105"
    
    def test_municipio_update(self):
        """Test MunicipioUpdate schema"""
        schema = MunicipioUpdate(nome="Novo Nome", geometry=None)
        assert schema.nome == "Novo Nome"
        assert schema.geometry is None
    
    def test_municipio_update_partial(self):
        """Test MunicipioUpdate with partial data"""
        schema = MunicipioUpdate(nome="Novo Nome")
        assert schema.nome == "Novo Nome"
        assert schema.geometry is None  # default
    
    def test_municipio_out(self):
        """Test MunicipioOut with orm_mode"""
        data = {
            "id": 1,
            "ibge_code": "3500105",
            "nome": "Adamantina",
            "geometry": None
        }
        schema = MunicipioOut(**data)
        assert schema.id == 1
        assert schema.ibge_code == "3500105"


class TestIndicadorSchemas:
    """Test Indicador schema classes"""
    
    def test_indicador_base_valid(self):
        """Test IndicadorBase with valid data"""
        data = {
            "ibge_code": "3500105",
            "idh": 0.754,
            "idh_renda": 0.754,
            "idh_longevidade": 0.800,
            "idh_educacao": 0.620,
            "renda_per_capita": 45751.7,
            "saneamento": 97.36
        }
        schema = IndicadorBase(**data)
        assert schema.ibge_code == "3500105"
        assert schema.idh == 0.754
    
    def test_indicador_base_required_ibge_code(self):
        """Test IndicadorBase requires ibge_code"""
        with pytest.raises(ValidationError):
            IndicadorBase(idh=0.754)
    
    def test_indicador_base_nullable_fields(self):
        """Test IndicadorBase with nullable fields"""
        schema = IndicadorBase(
            ibge_code="3500105",
            idh=None,
            idh_renda=None,
            renda_per_capita=None
        )
        assert schema.idh is None
        assert schema.renda_per_capita is None
    
    def test_indicador_create(self):
        """Test IndicadorCreate schema"""
        data = {
            "ibge_code": "3500105",
            "idh": 0.754,
            "renda_per_capita": 45751.7
        }
        schema = IndicadorCreate(**data)
        assert schema.ibge_code == "3500105"
    
    def test_indicador_update(self):
        """Test IndicadorUpdate schema"""
        schema = IndicadorUpdate(
            idh=0.800,
            renda_per_capita=50000.0
        )
        assert schema.idh == 0.800
        assert schema.renda_per_capita == 50000.0
    
    def test_indicador_update_empty(self):
        """Test IndicadorUpdate with no data"""
        schema = IndicadorUpdate()
        assert schema.idh is None
        assert schema.renda_per_capita is None
    
    def test_indicador_out(self):
        """Test IndicadorOut schema"""
        data = {
            "id": 1,
            "ibge_code": "3500105",
            "idh": 0.754,
            "idh_renda": 0.754,
            "idh_longevidade": 0.800,
            "idh_educacao": 0.620,
            "renda_per_capita": 45751.7,
            "saneamento": 97.36
        }
        schema = IndicadorOut(**data)
        assert schema.id == 1
        assert schema.idh == 0.754


class TestPOISchemas:
    """Test POI schema classes"""
    
    def test_poi_base_valid(self):
        """Test POIBase with valid data"""
        data = {
            "municipio_id": 1,
            "tipo": "hospital",
            "nome": "Hospital Central",
            "latitude": -23.5101097,
            "longitude": -46.4983227
        }
        schema = POIBase(**data)
        assert schema.municipio_id == 1
        assert schema.tipo == "hospital"
        assert schema.latitude == -23.5101097
    
    def test_poi_base_required_coordinates(self):
        """Test POIBase requires latitude and longitude"""
        with pytest.raises(ValidationError):
            POIBase(municipio_id=1, tipo="hospital")
        
        with pytest.raises(ValidationError):
            POIBase(municipio_id=1, latitude=-23.5)
    
    def test_poi_base_nullable_fields(self):
        """Test POIBase with nullable optional fields"""
        schema = POIBase(
            municipio_id=None,
            tipo=None,
            nome=None,
            latitude=-23.5,
            longitude=-46.5
        )
        assert schema.municipio_id is None
        assert schema.tipo is None
        assert schema.nome is None
    
    def test_poi_create(self):
        """Test POICreate schema"""
        data = {
            "municipio_id": 1,
            "tipo": "hospital",
            "nome": "Hospital Central",
            "latitude": -23.5,
            "longitude": -46.5
        }
        schema = POICreate(**data)
        assert schema.latitude == -23.5
    
    def test_poi_update(self):
        """Test POIUpdate schema"""
        schema = POIUpdate(
            tipo="school",
            nome="New Name",
            latitude=-23.6,
            longitude=-46.6
        )
        assert schema.tipo == "school"
        assert schema.latitude == -23.6
    
    def test_poi_update_partial(self):
        """Test POIUpdate with partial data"""
        schema = POIUpdate(nome="New Name")
        assert schema.nome == "New Name"
        assert schema.tipo is None
    
    def test_poi_out_with_created_at(self):
        """Test POIOut schema with created_at"""
        now = datetime.now()
        data = {
            "id": 1,
            "municipio_id": 1,
            "tipo": "hospital",
            "nome": "Hospital",
            "latitude": -23.5,
            "longitude": -46.5,
            "created_at": now
        }
        schema = POIOut(**data)
        assert schema.id == 1
        assert schema.created_at == now
    
    def test_poi_out_without_created_at(self):
        """Test POIOut without created_at (nullable)"""
        data = {
            "id": 1,
            "municipio_id": 1,
            "tipo": "hospital",
            "latitude": -23.5,
            "longitude": -46.5
        }
        schema = POIOut(**data)
        assert schema.id == 1
        assert schema.created_at is None


class TestListSchemas:
    """Test list wrapper schemas"""
    
    def test_municipio_list(self):
        """Test MunicipioList schema"""
        municipios = [
            MunicipioOut(id=1, ibge_code="3500105", nome="Adamantina", geometry=None),
            MunicipioOut(id=2, ibge_code="3500106", nome="Herculândia", geometry=None)
        ]
        schema = MunicipioList(total=2, items=municipios)
        assert schema.total == 2
        assert len(schema.items) == 2
    
    def test_municipio_list_empty(self):
        """Test MunicipioList with empty items"""
        schema = MunicipioList(total=0, items=[])
        assert schema.total == 0
        assert len(schema.items) == 0
    
    def test_indicadores_list(self):
        """Test IndicadoresList schema"""
        indicadores = [
            MunicipioOut(id=1, ibge_code="3500105", nome="Adamantina", geometry=None),
            MunicipioOut(id=2, ibge_code="3500106", nome="Herculândia", geometry=None)
        ]
        schema = IndicadoresList(total=2, items=indicadores)
        assert schema.total == 2
    
    def test_poi_list(self):
        """Test POIList schema"""
        pois = [
            POIOut(id=1, municipio_id=1, tipo="hospital", nome="Hospital", 
                   latitude=-23.5, longitude=-46.5),
            POIOut(id=2, municipio_id=1, tipo="school", nome="School", 
                   latitude=-23.6, longitude=-46.6)
        ]
        schema = POIList(total=2, items=pois)
        assert schema.total == 2
        assert len(schema.items) == 2


class TestSchemaValidation:
    """Test schema validation rules"""
    
    def test_float_validation(self):
        """Test float fields validation"""
        schema = IndicadorBase(
            ibge_code="3500105",
            idh=0.754,
            renda_per_capita=45751.7
        )
        assert isinstance(schema.idh, float)
        assert isinstance(schema.renda_per_capita, float)
    
    def test_integer_validation(self):
        """Test integer fields validation"""
        poi = POIOut(
            id=1,
            municipio_id=1,
            tipo="hospital",
            latitude=-23.5,
            longitude=-46.5
        )
        assert isinstance(poi.id, int)
        assert isinstance(poi.municipio_id, int)
    
    def test_string_validation(self):
        """Test string fields validation"""
        municipio = MunicipioBase(
            ibge_code="3500105",
            nome="Adamantina"
        )
        assert isinstance(municipio.ibge_code, str)
        assert isinstance(municipio.nome, str)
    
    def test_invalid_float_conversion(self):
        """Test that invalid values raise ValidationError"""
        with pytest.raises(ValidationError):
            IndicadorBase(
                ibge_code="3500105",
                idh="invalid"
            )
    
    def test_orm_mode_enabled(self):
        """Test that orm_mode is enabled for Out schemas"""
        class MockModel:
            id = 1
            ibge_code = "3500105"
            nome = "Adamantina"
            geometry = None
        
        # orm_mode should allow loading from ORM objects via from_orm
        mock_obj = MockModel()
        schema = MunicipioOut.from_orm(mock_obj)
        assert schema.id == 1


class TestSchemaExamples:
    """Test schema with example values"""
    
    def test_municipio_example(self):
        """Test MunicipioBase example values"""
        schema = MunicipioBase(
            ibge_code="3500105",
            nome="Adamantina"
        )
        assert schema.ibge_code == "3500105"
    
    def test_indicador_example(self):
        """Test IndicadorBase example values"""
        schema = IndicadorBase(
            ibge_code="3500105",
            idh=0.754,
            renda_per_capita=457517.7,
            saneamento=97.36
        )
        assert schema.idh == 0.754
        assert schema.renda_per_capita == 457517.7
    
    def test_poi_example(self):
        """Test POIBase example values"""
        schema = POIBase(
            tipo="hospital",
            nome="Hospital Central",
            latitude=-23.5101097,
            longitude=-46.4983227
        )
        assert schema.latitude == -23.5101097
        assert schema.longitude == -46.4983227

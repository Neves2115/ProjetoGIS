"""
Tests for backend/models.py
Tests SQLAlchemy model definitions for Municipio, Indicador, and POI
"""
import pytest
from backend.models import Municipio, Indicador, POI, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


@pytest.fixture
def db_engine():
    """Create an in-memory SQLite database for testing"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture
def db_session(db_engine):
    """Create a new database session for each test"""
    Session = sessionmaker(bind=db_engine)
    session = Session()
    yield session
    session.close()


class TestMunicipioModel:
    """Test Municipio model"""
    
    def test_municipio_creation(self, db_session):
        """Test creating a Municipio instance"""
        municipio = Municipio(
            ibge_code="3500105",
            nome="Adamantina",
            geometry='{"type": "Point", "coordinates": [-46.5, -23.5]}'
        )
        db_session.add(municipio)
        db_session.commit()
        
        assert municipio.id is not None
        assert municipio.ibge_code == "3500105"
        assert municipio.nome == "Adamantina"
    
    def test_municipio_unique_ibge_code(self, db_session):
        """Test that ibge_code is unique"""
        municipio1 = Municipio(ibge_code="3500105", nome="Adamantina")
        municipio2 = Municipio(ibge_code="3500105", nome="Outro Nome")
        
        db_session.add(municipio1)
        db_session.commit()
        
        db_session.add(municipio2)
        with pytest.raises(Exception):  # IntegrityError
            db_session.commit()
    
    def test_municipio_nullable_geometry(self, db_session):
        """Test that geometry can be nullable"""
        municipio = Municipio(ibge_code="3500105", nome="Adamantina", geometry=None)
        db_session.add(municipio)
        db_session.commit()
        
        fetched = db_session.query(Municipio).filter_by(ibge_code="3500105").first()
        assert fetched.geometry is None
    
    def test_municipio_query_by_ibge_code(self, db_session):
        """Test querying Municipio by ibge_code"""
        municipio = Municipio(ibge_code="3500105", nome="Adamantina")
        db_session.add(municipio)
        db_session.commit()
        
        result = db_session.query(Municipio).filter_by(ibge_code="3500105").first()
        assert result is not None
        assert result.nome == "Adamantina"
    
    def test_municipio_columns_exist(self):
        """Test that Municipio has all required columns"""
        columns = {col.name for col in Municipio.__table__.columns}
        assert "id" in columns
        assert "ibge_code" in columns
        assert "nome" in columns
        assert "geometry" in columns


class TestIndicadorModel:
    """Test Indicador model"""
    
    def test_indicador_creation(self, db_session):
        """Test creating an Indicador instance"""
        indicador = Indicador(
            ibge_code="3500105",
            idh=0.754,
            idh_renda=0.754,
            idh_longevidade=0.800,
            idh_educacao=0.620,
            renda_per_capita=45751.7,
            saneamento=97.36
        )
        db_session.add(indicador)
        db_session.commit()
        
        assert indicador.id is not None
        assert indicador.ibge_code == "3500105"
        assert indicador.idh == 0.754
    
    def test_indicador_partial_data(self, db_session):
        """Test Indicador with partial data (nullable fields)"""
        indicador = Indicador(
            ibge_code="3500105",
            idh=0.754,
            idh_renda=None,
            renda_per_capita=None
        )
        db_session.add(indicador)
        db_session.commit()
        
        fetched = db_session.query(Indicador).filter_by(ibge_code="3500105").first()
        assert fetched.idh == 0.754
        assert fetched.idh_renda is None
        assert fetched.renda_per_capita is None
    
    def test_indicador_query_by_ibge_code(self, db_session):
        """Test querying Indicador by ibge_code"""
        indicador = Indicador(ibge_code="3500105", idh=0.754)
        db_session.add(indicador)
        db_session.commit()
        
        result = db_session.query(Indicador).filter_by(ibge_code="3500105").first()
        assert result is not None
        assert result.idh == 0.754
    
    def test_indicador_float_precision(self, db_session):
        """Test that float values are stored correctly"""
        indicador = Indicador(
            ibge_code="3500105",
            idh=0.754123,
            saneamento=97.36999
        )
        db_session.add(indicador)
        db_session.commit()
        
        fetched = db_session.query(Indicador).filter_by(ibge_code="3500105").first()
        assert fetched.idh > 0.754
        assert fetched.saneamento > 97.36
    
    def test_indicador_columns_exist(self):
        """Test that Indicador has all required columns"""
        columns = {col.name for col in Indicador.__table__.columns}
        assert "id" in columns
        assert "ibge_code" in columns
        assert "idh" in columns
        assert "idh_renda" in columns
        assert "idh_longevidade" in columns
        assert "idh_educacao" in columns
        assert "renda_per_capita" in columns
        assert "saneamento" in columns


class TestPOIModel:
    """Test POI model"""
    
    def test_poi_creation(self, db_session):
        """Test creating a POI instance"""
        poi = POI(
            municipio_id=1,
            tipo="hospital",
            nome="Hospital Central",
            latitude=-23.5101097,
            longitude=-46.4983227
        )
        db_session.add(poi)
        db_session.commit()
        
        assert poi.id is not None
        assert poi.tipo == "hospital"
        assert poi.latitude == -23.5101097
    
    def test_poi_without_municipio_id(self, db_session):
        """Test creating POI without municipio_id (nullable FK)"""
        poi = POI(
            municipio_id=None,
            tipo="park",
            nome="Central Park",
            latitude=-23.5,
            longitude=-46.5
        )
        db_session.add(poi)
        db_session.commit()
        
        fetched = db_session.query(POI).filter_by(nome="Central Park").first()
        assert fetched.municipio_id is None
    
    def test_poi_without_nome(self, db_session):
        """Test creating POI without nome (nullable)"""
        poi = POI(
            municipio_id=1,
            tipo="hospital",
            nome=None,
            latitude=-23.5,
            longitude=-46.5
        )
        db_session.add(poi)
        db_session.commit()
        
        fetched = db_session.query(POI).filter_by(municipio_id=1).first()
        assert fetched.nome is None
    
    def test_poi_created_at_timestamp(self, db_session):
        """Test that created_at is automatically set"""
        poi = POI(
            municipio_id=1,
            tipo="hospital",
            nome="Hospital",
            latitude=-23.5,
            longitude=-46.5
        )
        db_session.add(poi)
        db_session.commit()
        
        fetched = db_session.query(POI).filter_by(nome="Hospital").first()
        assert fetched.created_at is not None
    
    def test_poi_query_by_type(self, db_session):
        """Test querying POI by type"""
        poi1 = POI(municipio_id=1, tipo="hospital", latitude=-23.5, longitude=-46.5)
        poi2 = POI(municipio_id=1, tipo="school", latitude=-23.6, longitude=-46.6)
        
        db_session.add(poi1)
        db_session.add(poi2)
        db_session.commit()
        
        hospitals = db_session.query(POI).filter_by(tipo="hospital").all()
        assert len(hospitals) == 1
        assert hospitals[0].tipo == "hospital"
    
    def test_poi_query_by_municipio_id(self, db_session):
        """Test querying POI by municipio_id"""
        poi1 = POI(municipio_id=1, tipo="hospital", latitude=-23.5, longitude=-46.5)
        poi2 = POI(municipio_id=2, tipo="hospital", latitude=-23.6, longitude=-46.6)
        
        db_session.add(poi1)
        db_session.add(poi2)
        db_session.commit()
        
        mun1_pois = db_session.query(POI).filter_by(municipio_id=1).all()
        assert len(mun1_pois) == 1
    
    def test_poi_coordinates_precision(self, db_session):
        """Test that coordinates are stored with proper precision"""
        poi = POI(
            municipio_id=1,
            tipo="hospital",
            latitude=-23.5101097,
            longitude=-46.4983227
        )
        db_session.add(poi)
        db_session.commit()
        
        fetched = db_session.query(POI).filter_by(municipio_id=1).first()
        assert fetched.latitude < -23.5
        assert fetched.longitude < -46.4
    
    def test_poi_columns_exist(self):
        """Test that POI has all required columns"""
        columns = {col.name for col in POI.__table__.columns}
        assert "id" in columns
        assert "municipio_id" in columns
        assert "tipo" in columns
        assert "nome" in columns
        assert "latitude" in columns
        assert "longitude" in columns
        assert "created_at" in columns
    
    def test_poi_multiple_in_same_municipio(self, db_session):
        """Test storing multiple POIs for same municipality"""
        for i in range(5):
            poi = POI(
                municipio_id=1,
                tipo="hospital",
                nome=f"Hospital {i}",
                latitude=-23.5 + i*0.1,
                longitude=-46.5 + i*0.1
            )
            db_session.add(poi)
        db_session.commit()
        
        pois = db_session.query(POI).filter_by(municipio_id=1).all()
        assert len(pois) == 5


class TestModelIntegration:
    """Test models working together"""
    
    def test_municipio_with_indicador_and_pois(self, db_session):
        """Test storing related data across all models"""
        # Create municipio
        municipio = Municipio(ibge_code="3500105", nome="Adamantina")
        db_session.add(municipio)
        db_session.commit()
        
        # Create indicador
        indicador = Indicador(ibge_code="3500105", idh=0.754)
        db_session.add(indicador)
        db_session.commit()
        
        # Create POIs
        poi1 = POI(municipio_id=municipio.id, tipo="hospital", latitude=-23.5, longitude=-46.5)
        poi2 = POI(municipio_id=municipio.id, tipo="school", latitude=-23.6, longitude=-46.6)
        
        db_session.add(poi1)
        db_session.add(poi2)
        db_session.commit()
        
        # Verify all data was stored
        assert db_session.query(Municipio).count() == 1
        assert db_session.query(Indicador).count() == 1
        assert db_session.query(POI).count() == 2

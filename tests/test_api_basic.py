# tests/test_api_basic.py
import os
import json
import tempfile
import unittest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ajuste os imports conforme sua estrutura de pacotes
from backend.main import app
from backend import models
from backend.db import get_db
Base = models.Base

class APIBasicTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # criar arquivo sqlite temporário (arquivo evita problemas de :memory: + threads)
        fd, cls.tmp_db_path = tempfile.mkstemp(prefix="test_db_", suffix=".sqlite")
        os.close(fd)
        cls.database_url = f"sqlite:///{cls.tmp_db_path}"

        # engine / session de teste (allow multi-thread)
        cls.engine = create_engine(cls.database_url, connect_args={"check_same_thread": False})
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

        # cria todas as tabelas do modelo (Base deve reunir todos os models)
        Base.metadata.create_all(bind=cls.engine)

        # override do get_db para usar a SessionLocal de teste
        def override_get_db():
            db = cls.SessionLocal()
            try:
                yield db
            finally:
                db.close()

        # substituir dependência da app (importante: get_db é do módulo backend.db)
        app.dependency_overrides[get_db] = override_get_db

        # TestClient apontando para app com dependência sobrescrita
        cls.client = TestClient(app)

        # popular um município mínimo para os testes
        db = cls.SessionLocal()
        try:
            # garanta que o modelo Municipio tem campos: id, nome, ibge_code, geometry
            geom = {
                "type": "Polygon",
                # coords: [ [ [lon, lat], ... ] ]
                "coordinates": [
                    [
                        [-46.62, -23.62],
                        [-46.60, -23.62],
                        [-46.60, -23.60],
                        [-46.62, -23.60],
                        [-46.62, -23.62]
                    ]
                ]
            }
            muni = models.Municipio(nome="Municipio Teste", ibge_code="9999999", geometry=json.dumps(geom))
            db.add(muni)
            db.commit()
            db.refresh(muni)
            cls.muni_id = muni.id
            cls.muni_ibge = muni.ibge_code
        finally:
            db.close()

    @classmethod
    def tearDownClass(cls):
        # limpar override e fechar engine antes de remover arquivo
        app.dependency_overrides.pop(get_db, None)
        try:
            cls.engine.dispose()
        except Exception:
            pass
        try:
            os.unlink(cls.tmp_db_path)
        except Exception:
            pass

    def test_municipalities_geojson(self):
        # usa o prefixo que o main registra: /municipios/geojson
        resp = self.client.get("/municipios/geojson")
        self.assertEqual(resp.status_code, 200, resp.text)
        j = resp.json()
        self.assertIn("features", j)
        # verificar se há ao menos uma feature com o ibge_code que inserimos
        features = j.get("features", [])
        found = any((f.get("properties", {}).get("ibge_code") == self.muni_ibge) for f in features)
        self.assertTrue(found, f"Municipio {self.muni_ibge} não encontrado em GeoJSON (features={features})")

    def test_create_poi(self):
        # enviar municipio_id (o CRUD espera municipio_id)
        payload = {
            "tipo": "police",
            "nome": "Delegacia Teste",
            "latitude": -23.61,
            "longitude": -46.61,
            "municipio_id": self.muni_id
        }
        resp = self.client.post("/pois/", json=payload)
        # seu endpoint pode retornar 200 ou 201
        self.assertIn(resp.status_code, (200, 201), resp.text)
        data = resp.json()
        self.assertIn("id", data)
        self.assertEqual(data.get("tipo"), "police")
        # confirmar que o POI ficou associado ao municipio correto
        self.assertEqual(int(data.get("municipio_id")), int(self.muni_id))

    def test_get_pois_by_municipio(self):
        # garante que o POI criado no teste anterior aparece em /pois/municipio/{ibge}
        resp = self.client.get(f"/pois/municipio/{self.muni_ibge}")
        self.assertEqual(resp.status_code, 200, resp.text)
        data = resp.json()
        # deve ser lista
        self.assertIsInstance(data, list)
        # ao menos um item com tipo 'police' e nome que usamos
        self.assertTrue(any((p.get("tipo") == "police" and p.get("nome") == "Delegacia Teste") for p in data),
                        f"POI criado não encontrado na listagem do município: {data}")

if __name__ == "__main__":
    unittest.main()

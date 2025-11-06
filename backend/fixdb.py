from db import SessionLocal
from models import Municipio, Indicador

session = SessionLocal()

# --- 1️⃣ Correção de nomes incorretos ---
correcoes = {
    "Moji Mirim": "Mogi Mirim",
    "Florínia": "Florínea",
    "São Luís do Paraitinga": "São Luiz do Paraitinga",
    "Luís Antônio": "Luiz Antônio",
}

for errado, certo in correcoes.items():
    mun = session.query(Municipio).filter(Municipio.nome == errado).first()
    if mun:
        print(f"Corrigindo {errado} → {certo}")
        mun.nome = certo
    else:
        print(f"Aviso: {errado} não encontrado.")

# --- 2️⃣ Remover município extinto ---
embu = session.query(Municipio).filter(Municipio.nome == "Embu").first()
if embu:
    print("Removendo Embu e indicadores relacionados...")
    session.query(Indicador).filter(Indicador.ibge_code == embu.ibge_code).delete()
    session.delete(embu)

session.commit()

# --- 3️⃣ Repopular indicadores ausentes ---
# Exemplo de dados manuais (substitua pelos valores reais se souber)
dados_indicadores = {
    "Mogi Mirim": {"idh": 0.784, "renda_per_capita": 67095.62, "saneamento": 87.66},
    "Florínea": {"idh": 0.713, "renda_per_capita": 65354.84, "saneamento": 98.49},
    "São Luiz do Paraitinga": {"idh": 0.697, "renda_per_capita": 19098.4, "saneamento": 85.67},
    "Luiz Antônio": {"idh": 0.731, "renda_per_capita": 99603.69, "saneamento": 83.22}, 
}

for nome, valores in dados_indicadores.items():
    mun = session.query(Municipio).filter(Municipio.nome == nome).first()
    if not mun:
        print(f"Município {nome} não encontrado, pulando...")
        continue

    indicador = session.query(Indicador).filter(Indicador.ibge_code == mun.ibge_code).first()
    if indicador:
        print(f"Atualizando indicadores de {nome}")
        indicador.idh = valores["idh"]
        indicador.renda_per_capita = valores["renda_per_capita"]
        indicador.saneamento = valores["saneamento"]
    else:
        print(f"Inserindo novos indicadores para {nome}")
        novo = Indicador(
            ibge_code=mun.ibge_code,
            idh=valores["idh"],
            renda_per_capita=valores["renda_per_capita"],
            saneamento=valores["saneamento"]
        )
        session.add(novo)

session.commit()
session.close()
print("✅ Correções e repovoamento concluídos.")

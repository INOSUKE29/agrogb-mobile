
import sqlite3
import os

def get_db_path():
    app_data = os.getenv('LOCALAPPDATA', os.path.expanduser('~'))
    path = os.path.join(app_data, "AgroGB")
    os.makedirs(path, exist_ok=True)
    return os.path.join(path, "agrogb.db")

DB_PATH = get_db_path()
print(f"Banco de Dados: {DB_PATH}")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Tabelas do Módulo de Frota
print("Criando tabela maquinas...")
cursor.execute("""
    CREATE TABLE IF NOT EXISTS maquinas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        tipo TEXT,
        horimetro REAL DEFAULT 0,
        proxima_revisao REAL DEFAULT 0,
        status TEXT DEFAULT 'OK'
    )
""")

print("Criando tabela manutencoes...")
cursor.execute("""
    CREATE TABLE IF NOT EXISTS manutencoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        maquina_id INTEGER,
        data TEXT,
        descricao TEXT,
        custo REAL,
        FOREIGN KEY(maquina_id) REFERENCES maquinas(id)
    )
""")

conn.commit()
conn.close()
print("✅ Banco de Dados atualizado com tabelas de Frota!")

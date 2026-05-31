import db
print("Iniciando migracao...")
try:
    db.criar_tabelas()
    print("Sucesso na migracao.")
except Exception as e:
    print(f"Erro: {e}")

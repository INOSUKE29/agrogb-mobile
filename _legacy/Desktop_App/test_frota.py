import db
import os
import sqlite3
import sys

# Adicionar diretório atual ao path para importar módulos locais
sys.path.append(os.getcwd())

# Forçar uso do banco correto
db_path = r'C:\Users\Bruno\AppData\Local\AgroGB\agrogb.db'
if not os.path.exists(db_path):
    print(f"❌ DATABASE NOT FOUND AT: {db_path}")
    exit()

print("="*60)
print("TESTE DO MÓDULO FROTA (BACKEND)")
print("="*60)

try:
    # 1. Verificar se tabelas existem
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    print("\n🔍 Verificando tabelas...")
    tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('maquinas', 'manutencoes')").fetchall()
    found = [t[0] for t in tables]
    print(f"   Tabelas encontradas: {found}")
    
    if 'maquinas' not in found:
        print("   ⚠️ Tabela 'maquinas' não existe! Tentando criar...")
        db.criar_tabelas()
        print("   ✅ criar_tabelas() executado.")
    else:
        print("   ✅ Tabela 'maquinas' já existe.")
    conn.close()

    # 2. Tentar inserir máquina
    print("\n🚜 Testando Inserção de Máquina...")
    try:
        db.add_maquina("Trator Teste 01", "Trator", 1000.0, 1250.0)
        print("   ✅ Máquina inserida com sucesso!")
    except Exception as e:
        print(f"   ❌ Erro ao inserir máquina: {e}")

    # 3. Ler máquinas e verificar ID
    print("\n📋 Lendo Frota...")
    maquinas = db.get_maquinas()
    last_id = None
    if maquinas:
        for m in maquinas:
            status_val = m[5] if len(m) > 5 else "N/A"
            print(f"   - ID: {m[0]} | Nome: {m[1]} | Status: {status_val}")
            last_id = m[0]
        print(f"   ✅ Leitura OK. Total: {len(maquinas)}")
    else:
        print("   ⚠️ Nenhuma máquina retornada (mas deveria ter 1).")

    # 4. Inserir Manutenção
    if last_id:
        print(f"\n🛠️ Testando Manutenção para ID {last_id}...")
        try:
            db.add_manutencao(last_id, "2024-01-31", "Troca Teste", 500.00)
            print("   ✅ Manutenção inserida!")
            
            hist = db.get_historico_manutencoes(last_id)
            if hist:
                print(f"   ✅ Histórico lido: {len(hist)} registro(s)")
            else:
                print("   ❌ Histórico vazio!")
        except Exception as e:
            print(f"   ❌ Erro na manutenção: {e}")

    # 5. Testar Cálculo de Status
    print("\n📊 Testando Cálculo de Status...")
    try:
        stats = db.calcular_status_frota()
        print(f"   ✅ Stats: {stats}")
    except Exception as e:
        print(f"   ❌ Erro no cálculo: {e}")

except Exception as e:
    print(f"\n❌ ERRO FATAL: {e}")
    import traceback
    traceback.print_exc()

print("\n"+"="*60)
print("FIM DO TESTE")
print("="*60)

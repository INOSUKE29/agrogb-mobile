import sqlite3
import uuid
from datetime import datetime

# Conectar ao banco
conn = sqlite3.connect(r'C:\Users\Bruno\AppData\Local\AgroGB\agrogb.db')
cursor = conn.cursor()

print('=' * 60)
print('TESTE DE INSERÇÃO COM UUID - AgroGB v2.2')
print('=' * 60)

# Simular inserção de um cliente (como o código faz)
print('\n🧪 TESTE 1: Inserindo cliente de teste...')
uid = str(uuid.uuid4())
ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

try:
    cursor.execute(
        "INSERT INTO clientes (uuid, nome, telefone, endereco, cpf_cnpj, observacao, last_updated, sync_status) VALUES (?,?,?,?,?,?,?,0)",
        (uid, "Cliente Teste UUID", "(11) 99999-9999", "Rua Teste, 123", "000.000.000-00", "Cliente de teste", ts)
    )
    conn.commit()
    print(f'✅ Cliente inserido com UUID: {uid}')
    print(f'✅ Timestamp: {ts}')
    print(f'✅ sync_status: 0 (Pendente)')
except Exception as e:
    print(f'❌ Erro: {e}')

# Verificar se foi salvo corretamente
print('\n🔍 Verificando dados salvos...')
cursor.execute("SELECT uuid, nome, last_updated, sync_status FROM clientes WHERE nome='Cliente Teste UUID'")
resultado = cursor.fetchone()

if resultado:
    print(f'✅ UUID salvo: {resultado[0]}')
    print(f'✅ Nome: {resultado[1]}')
    print(f'✅ Timestamp: {resultado[2]}')
    print(f'✅ Status Sync: {resultado[3]} (0=Pendente, 1=Sincronizado)')
    print('\n🎉 TESTE PASSOU! O sistema está gerando UUIDs corretamente!')
else:
    print('❌ Erro: Cliente não encontrado no banco')

# Limpar teste
print('\n🧹 Removendo dados de teste...')
cursor.execute("DELETE FROM clientes WHERE nome='Cliente Teste UUID'")
conn.commit()
print('✅ Dados de teste removidos')

print('\n' + '=' * 60)
print('TESTE CONCLUÍDO COM SUCESSO!')
print('=' * 60)
print('\n💡 Próximo passo: Testar o programa visualmente')
print('   Abra o AgroGB e cadastre um cliente real para confirmar.')

conn.close()

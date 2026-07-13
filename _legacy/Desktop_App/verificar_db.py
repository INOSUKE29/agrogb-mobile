import sqlite3

# Conectar ao banco de dados
conn = sqlite3.connect(r'C:\Users\Bruno\AppData\Local\AgroGB\agrogb.db')
cursor = conn.cursor()

print('=' * 50)
print('VERIFICAÇÃO DO BANCO DE DADOS AGROGB v2.2')
print('=' * 50)

# Verificar versão
cursor.execute('SELECT valor FROM sistema_config WHERE chave="db_version"')
versao = cursor.fetchone()
print(f'\n✅ Versão do DB: {versao[0] if versao else "Não encontrada"}')

# Verificar tabela VENDAS
print('\n--- TABELA VENDAS ---')
cursor.execute('PRAGMA table_info(vendas)')
colunas_vendas = [col[1] for col in cursor.fetchall()]
print(f'Colunas: {", ".join(colunas_vendas)}')
print(f'✅ UUID presente: {"uuid" in colunas_vendas}')
print(f'✅ sync_status presente: {"sync_status" in colunas_vendas}')
print(f'✅ last_updated presente: {"last_updated" in colunas_vendas}')

# Verificar tabela COLHEITA
print('\n--- TABELA COLHEITA ---')
cursor.execute('PRAGMA table_info(colheita)')
colunas_colheita = [col[1] for col in cursor.fetchall()]
print(f'Colunas: {", ".join(colunas_colheita)}')
print(f'✅ UUID presente: {"uuid" in colunas_colheita}')
print(f'✅ sync_status presente: {"sync_status" in colunas_colheita}')
print(f'✅ last_updated presente: {"last_updated" in colunas_colheita}')

# Verificar tabela CLIENTES
print('\n--- TABELA CLIENTES ---')
cursor.execute('PRAGMA table_info(clientes)')
colunas_clientes = [col[1] for col in cursor.fetchall()]
print(f'✅ UUID presente: {"uuid" in colunas_clientes}')
print(f'✅ sync_status presente: {"sync_status" in colunas_clientes}')
print(f'✅ last_updated presente: {"last_updated" in colunas_clientes}')

# Contar registros
print('\n--- ESTATÍSTICAS ---')
cursor.execute('SELECT COUNT(*) FROM clientes')
print(f'Total de clientes: {cursor.fetchone()[0]}')

cursor.execute('SELECT COUNT(*) FROM vendas')
print(f'Total de vendas: {cursor.fetchone()[0]}')

cursor.execute('SELECT COUNT(*) FROM colheita')
print(f'Total de colheitas: {cursor.fetchone()[0]}')

print('\n' + '=' * 50)
print('VERIFICAÇÃO CONCLUÍDA!')
print('=' * 50)

conn.close()

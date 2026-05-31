import sqlite3

conn = sqlite3.connect(r'C:\Users\Bruno\AppData\Local\AgroGB\agrogb.db')
cursor = conn.cursor()

print('=' * 80)
print('ÚLTIMOS REGISTROS CADASTRADOS (com UUID)')
print('=' * 80)

# Clientes
print('\n📋 CLIENTES:')
print('-' * 80)
cursor.execute("""
    SELECT nome, uuid, last_updated, sync_status 
    FROM clientes 
    ORDER BY id DESC 
    LIMIT 3
""")
clientes = cursor.fetchall()
if clientes:
    for row in clientes:
        print(f'Nome: {row[0]}')
        print(f'UUID: {row[1] or "❌ SEM UUID"}')
        print(f'Última atualização: {row[2] or "N/A"}')
        print(f'Status: {"✅ Sincronizado" if row[3] == 1 else "⏳ Pendente"}')
        print('-' * 80)
else:
    print('Nenhum cliente cadastrado ainda.')

# Vendas
print('\n💰 VENDAS:')
print('-' * 80)
cursor.execute("""
    SELECT produto, cliente, uuid, last_updated, sync_status 
    FROM vendas 
    ORDER BY id DESC 
    LIMIT 3
""")
vendas = cursor.fetchall()
if vendas:
    for row in vendas:
        print(f'Produto: {row[0]}')
        print(f'Cliente: {row[1]}')
        print(f'UUID: {row[2] or "❌ SEM UUID"}')
        print(f'Última atualização: {row[3] or "N/A"}')
        print(f'Status: {"✅ Sincronizado" if row[4] == 1 else "⏳ Pendente"}')
        print('-' * 80)
else:
    print('Nenhuma venda cadastrada ainda.')

# Colheitas
print('\n🌾 COLHEITAS:')
print('-' * 80)
cursor.execute("""
    SELECT cultura, producao_total, uuid, last_updated, sync_status 
    FROM colheita 
    ORDER BY id DESC 
    LIMIT 3
""")
colheitas = cursor.fetchall()
if colheitas:
    for row in colheitas:
        print(f'Cultura: {row[0]}')
        print(f'Produção: {row[1]} kg')
        print(f'UUID: {row[2] or "❌ SEM UUID"}')
        print(f'Última atualização: {row[3] or "N/A"}')
        print(f'Status: {"✅ Sincronizado" if row[4] == 1 else "⏳ Pendente"}')
        print('-' * 80)
else:
    print('Nenhuma colheita cadastrada ainda.')

print('\n' + '=' * 80)
print('💡 Cadastre novos dados no AgroGB e execute este script novamente')
print('   para verificar se os UUIDs estão sendo gerados!')
print('=' * 80)

conn.close()

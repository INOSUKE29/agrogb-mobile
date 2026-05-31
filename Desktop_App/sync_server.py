# sync_server.py
# Servidor local para sincronizar dados do App Mobile com o Desktop
# Execute este arquivo no computador para permitir que o celular envie dados.

from flask import Flask, request, jsonify
import db
import sqlite3
from datetime import datetime
import socket

app = Flask(__name__)

def get_ip_address():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "online", "server_time": datetime.now().isoformat()}), 200

@app.route('/sync/upload', methods=['POST'])
def receive_data():
    data = request.json
    if not data:
        return jsonify({"error": "Sem dados"}), 400

    conn = db.conectar()
    cursor = conn.cursor()
    
    try:
        # Processar Colheitas
        if 'colheitas' in data and data['colheitas']:
            for item in data['colheitas']:
                # Verifica duplicidade pelo UUID (assumindo que adicionamos UUID nas tabelas desktop ou verificamos por dados)
                # Como o desktop pode não ter UUID, vamos checar por data/cultura/quantidade/produto
                # Ou melhor: vamos ACRESCENTAR.
                
                # Adaptação para esquema do desktop (verificar colheita.py)
                # Tabela desktop: id, data, cultura, produto, quantidade, observacao (supondo)
                # Vamos tentar inserir.
                try:
                    cursor.execute("INSERT INTO colheita (data, cultura, produto, quantidade, observacao, origem_mobile) VALUES (?, ?, ?, ?, ?, 1)",
                                (item['data'], item['cultura'], item['produto'], item['quantidade'], item['observacao']))
                except Exception as e:
                    print(f"Erro ao inserir colheita: {e}")

        # Processar Vendas
        if 'vendas' in data and data['vendas']:
            for item in data['vendas']:
                 # Tabela desktop: vendas (data, cliente, produto, quantidade, valor, observacao)
                 try:
                    cursor.execute("INSERT INTO vendas (data, cliente, produto, quantidade, valor, observacao, origem_mobile) VALUES (?, ?, ?, ?, ?, ?, 1)",
                                (item['data'], item['cliente'], item['produto'], item['quantidade'], item['valor'], item['observacao']))
                    
                    # Deduzir do estoque no desktop também? O desktop já deve ter triggers ou lógica.
                    # Vamos inserir no estoque como saída
                    cursor.execute("INSERT INTO estoque (item, quantidade, valor, origem, data, observacao) VALUES (?, ? * -1, ?, 'VENDA_MOBILE', ?, ?)",
                                 (item['produto'], item['quantidade'], item['valor'], item['data'], item['observacao']))
                 except Exception as e:
                    print(f"Erro ao inserir venda: {e}")

        # Processar Plantio
        if 'plantio' in data and data['plantio']:
            for item in data['plantio']:
                try:
                    cursor.execute("INSERT INTO plantio (data, cultura, quantidade_pes, tipo_plantio, observacao, origem_mobile) VALUES (?, ?, ?, ?, ?, 1)",
                                (item['data'], item['cultura'], item['quantidade_pes'], item['tipo_plantio'], item['observacao']))
                except Exception as e:
                     print(f"Erro ao inserir plantio: {e}")
        
        # Processar Custos/Compras
        if 'compras' in data and data['compras']:
            # No mobile chamamos de 'compras', no desktop é 'compras' e 'estoque' (entradas)
            for item in data['compras']:
                try:
                    cursor.execute("INSERT INTO compras (data, item, quantidade, valor, cultura, observacao, origem_mobile) VALUES (?, ?, ?, ?, ?, ?, 1)",
                                (item['data'], item['item'], item['quantidade'], item['valor'], item['cultura'], item['observacao']))
                    
                    # Entrada no estoque
                    cursor.execute("INSERT INTO estoque (item, quantidade, valor, origem, data, observacao) VALUES (?, ?, ?, 'COMPRA_MOBILE', ?, ?)",
                                (item['item'], item['quantidade'], item['valor'], item['data'], item['observacao']))
                except Exception as e:
                     print(f"Erro ao inserir compra: {e}")

        # Processar Custos (Despesas Gerais)
        if 'custos' in data and data['custos']:
            for item in data['custos']:
                try:
                    cursor.execute("INSERT INTO custos (data, produto, tipo, quantidade, valor_total, observacao, origem_mobile) VALUES (?, ?, ?, ?, ?, ?, 1)",
                                (item['data'], item['produto'], item['tipo'], item['quantidade'], item['valor_total'], item['observacao']))
                except Exception as e:
                     print(f"Erro ao inserir custo: {e}")
        
        # Processar Descarte
        if 'descarte' in data and data['descarte']:
            for item in data['descarte']:
                try:
                    cursor.execute("INSERT INTO descarte (data, produto, quantidade_kg, motivo, origem_mobile) VALUES (?, ?, ?, ?, 1)",
                                (item['data'], item['produto'], item['quantidade_kg'], item['motivo']))
                    
                    # Saída estoque (perda)
                    cursor.execute("INSERT INTO estoque (item, quantidade, origem, data, observacao) VALUES (?, ? * -1, 'DESCARTE_MOBILE', ?, ?)",
                                (item['produto'], item['quantidade_kg'], item['data'], f"Motivo: {item['motivo']}"))
                except Exception as e:
                     print(f"Erro ao inserir descarte: {e}")

        # Processar Clientes
        if 'clientes' in data and data['clientes']:
            for item in data['clientes']:
                try:
                    cursor.execute("INSERT OR IGNORE INTO clientes (uuid, nome, telefone, endereco, cpf_cnpj, observacao, origem_mobile) VALUES (?, ?, ?, ?, ?, ?, 1)",
                                (item['uuid'], item['nome'], item['telefone'], item['endereco'], item['cpf_cnpj'], item['observacao']))
                except Exception as e:
                    print(f"Erro ao inserir cliente: {e}")

        # Processar Culturas (Áreas)
        if 'culturas' in data and data['culturas']:
            for item in data['culturas']:
                try:
                    cursor.execute("INSERT OR IGNORE INTO culturas (uuid, nome, observacao, origem_mobile) VALUES (?, ?, ?, 1)",
                                (item['uuid'], item['nome'], item['observacao']))
                except Exception as e:
                    print(f"Erro ao inserir cultura: {e}")

        # Processar Cadastro (Itens/Catálogo)
        if 'cadastro' in data and data['cadastro']:
            for item in data['cadastro']:
                try:
                    cursor.execute("INSERT OR IGNORE INTO cadastro (uuid, nome, unidade, tipo, observacao, origem_mobile) VALUES (?, ?, ?, ?, ?, 1)",
                                (item['uuid'], item['nome'], item['unidade'], item['tipo'], item['observacao']))
                except Exception as e:
                    print(f"Erro ao inserir cadastro: {e}")

        conn.commit()
        return jsonify({"message": "Sincronização concluída com sucesso!"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    ip = get_ip_address()
    print("="*40)
    print(f"🚀 SERVIDOR DE SINCRONIZAÇÃO RODANDO!")
    print(f"📡 IP para colocar no celular: {ip}")
    print(f"🚪 Porta: 5000")
    print("="*40)
    print("Mantenha esta janela aberta enquanto sincroniza.")
    app.run(host='0.0.0.0', port=5000)

import sqlite3
import time
import os
import threading
try:
    import requests
except ImportError:
    requests = None

import supabase_client

DB_PATH = os.path.join(os.getenv('LOCALAPPDATA', os.path.expanduser('~')), "AgroGB", "agrogb.db")

TABLE_MAPPING = {
    "usuarios": "profiles",
    "cadastro": "cadastro", 
    "clientes": "clientes", 
    "culturas": "culturas", 
    "maquinas": "maquinas", 
    "fornecedores": "fornecedores", 
    "talhoes": "talhoes", 
    "equipes": "equipes",
    "colheitas": "colheitas", 
    "vendas": "vendas", 
    "compras": "compras", 
    "plantio": "plantios", 
    "custos": "custos", 
    "descarte": "descarte", 
    "manutencao_frota": "manutencao_frota",
    "planos_adubacao": "planos_adubacao", 
    "irrigacao": "irrigacao", 
    "fertirrigacao": "fertirrigacao", 
    "aplicacoes": "aplicacoes", 
    "financeiro_transacoes": "financeiro_transacoes",
    "caderno_notas": "caderno_notas", 
    "monitoramento": "monitoramento"
}

TABLE_ORDER = list(TABLE_MAPPING.keys())

SYNC_COLUMNS = {
    "usuarios": ["uuid", "usuario", "senha", "nivel", "email", "nome_completo", "telefone", "endereco", "avatar", "avatar_url", "provider", "last_updated", "is_deleted"],
    "colheitas": ["uuid", "cultura", "produto", "quantidade", "congelado", "data", "observacao", "anexo", "last_updated", "is_deleted"],
    "vendas": ["uuid", "cliente", "produto", "quantidade", "valor", "data", "observacao", "status", "anexo", "last_updated", "is_deleted"],
    "compras": ["uuid", "item", "quantidade", "valor", "cultura", "data", "observacao", "unidade", "fornecedor_uuid", "detalhes", "anexo", "last_updated", "is_deleted"],
    "plantio": ["uuid", "cultura", "quantidade_pes", "tipo_plantio", "data", "observacao", "last_updated", "is_deleted"],
    "custos": ["uuid", "produto", "tipo", "quantidade", "valor_total", "data", "observacao", "anexo", "last_updated", "is_deleted"],
    "descarte": ["uuid", "produto", "quantidade_kg", "motivo", "data", "last_updated", "is_deleted"],
    "cadastro": ["uuid", "nome", "unidade", "tipo", "estocavel", "vendavel", "observacao", "fator_conversao", "principio_ativo", "composicao", "classe_toxicologica", "preco_venda", "descricao_ia", "validado_por", "data_validacao", "last_updated", "is_deleted"],
    "clientes": ["uuid", "nome", "telefone", "endereco", "cpf_cnpj", "observacao", "last_updated", "is_deleted"],
    "culturas": ["uuid", "nome", "observacao", "last_updated", "is_deleted"],
    "maquinas": ["uuid", "nome", "tipo", "placa", "horimetro_atual", "intervalo_revisao", "status", "last_updated", "is_deleted"],
    "manutencao_frota": ["uuid", "maquina_uuid", "data", "descricao", "valor", "last_updated", "is_deleted"],
    "fornecedores": ["uuid", "nome", "contato", "telefone", "email", "observacao", "last_updated", "is_deleted"],
    "talhoes": ["uuid", "nome", "area_ha", "cultura_id", "status", "observacao", "last_updated", "is_deleted"],
    "equipes": ["uuid", "nome", "cargo", "documento", "status", "last_updated", "is_deleted"],
    "planos_adubacao": ["uuid", "nome_plano", "cultura", "tipo_aplicacao", "area_local", "descricao_tecnica", "status", "data_criacao", "data_aplicacao", "anexos_uri", "last_updated", "is_deleted"],
    "irrigacao": ["uuid", "talhao_uuid", "turno", "duracao_min", "volumetria_m3", "status", "data", "observacao", "last_updated", "is_deleted"],
    "fertirrigacao": ["uuid", "talhao_uuid", "formula", "volume_agua_l", "dosagem_insumo_kg", "data", "status", "observacao", "last_updated", "is_deleted"],
    "aplicacoes": ["uuid", "talhao_uuid", "produto_nome", "praga_alvo", "dose_ha", "volume_calda_l", "data", "carencia_dias", "data_liberacao", "last_updated", "is_deleted"],
    "financeiro_transacoes": ["uuid", "tipo", "descricao", "valor", "vencimento", "data_pagamento", "status", "categoria", "origem_uuid", "entidade_nome", "last_updated", "is_deleted"],
    "caderno_notas": ["uuid", "titulo", "conteudo", "data", "categoria", "last_updated", "is_deleted"],
    "monitoramento": ["uuid", "cultura", "data", "imagem_base64", "observacao", "last_updated", "is_deleted"],
}

def get_db():
    return sqlite3.connect(DB_PATH)

def push_changes():
    if requests is None:
        print("Sync Cloud indisponível.")
        return 0
        
    session = supabase_client.get_session()
    if not session or "user_id" not in session:
        print("Sync Cloud: Usuário não logado. Sincronização em pausa.")
        return 0
        
    user_id = session["user_id"]
    headers_push = supabase_client.get_auth_headers()
    headers_push["Prefer"] = "resolution=merge-duplicates"
    
    count = 0
    conn = get_db()
    cursor = conn.cursor()
    
    for table in TABLE_ORDER:
        try:
            cursor.execute(f"SELECT * FROM {table} WHERE sync_status = 0")
            col_names = [d[0] for d in cursor.description]
            rows = cursor.fetchall()
            
            if not rows: continue
            
            payloads = []
            for row in rows:
                data = dict(zip(col_names, row))
                allowed = SYNC_COLUMNS.get(table)
                if allowed:
                    data = {key: data.get(key) for key in allowed if key in data}
                else:
                    data.pop('id', None)
                    data.pop('sync_status', None)
                
                # RLS bypass context
                data["user_id"] = user_id
                
                if data.get("uuid"):
                    payloads.append(data)
            
            cloud_table = TABLE_MAPPING.get(table, table)
            url = f"{supabase_client.SUPABASE_URL}/rest/v1/{cloud_table}"
            
            res = requests.post(url, headers=headers_push, json=payloads)
            
            if res.status_code in [200, 201, 204]:
                uuids = [p['uuid'] for p in payloads]
                if uuids:
                    placeholders = ','.join(['?'] * len(uuids))
                    cursor.execute(f"UPDATE {table} SET sync_status = 1 WHERE uuid IN ({placeholders})", uuids)
                    conn.commit()
                    count += len(rows)
                    print(f"[{table}] {len(rows)} registros enviados.")
            else:
                print(f"[{table}] Erro Push: {res.status_code} - {res.text}")

        except Exception as e:
            print(f"[{table}] Exceção Push: {e}")
            
    conn.close()
    return count

def pull_changes():
    if requests is None:
        print("Sync Cloud indisponível.")
        return 0
        
    session = supabase_client.get_session()
    if not session or "user_id" not in session:
        return 0
        
    headers_get = supabase_client.get_auth_headers()
    count = 0
    conn = get_db()
    cursor = conn.cursor()
    
    for table in TABLE_ORDER:
        try:
            try:
                cursor.execute(f"SELECT MAX(last_updated) FROM {table}")
                res = cursor.fetchone()
                last_local = res[0] if res and res[0] else "1970-01-01T00:00:00"
            except:
                last_local = "1970-01-01T00:00:00"
                
            cloud_table = TABLE_MAPPING.get(table, table)
            url = f"{supabase_client.SUPABASE_URL}/rest/v1/{cloud_table}?last_updated=gt.{last_local}&select=*"
            res = requests.get(url, headers=headers_get)
            
            if res.status_code == 200:
                data = res.json()
                if not data: continue
                
                print(f"[{table}] Baixando {len(data)} registros...")
                
                for item in data:
                    item.pop('id', None)
                    item.pop('user_id', None)
                    
                    allowed = SYNC_COLUMNS.get(table)
                    if allowed:
                        item = {k: v for k, v in item.items() if k in allowed}
                    
                    cols = list(item.keys())
                    vals = list(item.values())
                    
                    cols.append("sync_status")
                    vals.append(1)
                    
                    placeholders = ",".join(["?"] * len(cols))
                    col_str = ",".join(cols)
                    
                    sql = f"INSERT OR REPLACE INTO {table} ({col_str}) VALUES ({placeholders})"
                    cursor.execute(sql, vals)
                    
                conn.commit()
                count += len(data)
                
        except Exception as e:
            print(f"[{table}] Exceção Pull: {e}")
            
    conn.close()
    return count

def start_sync_thread(interval=30):
    def run():
        time.sleep(3)
        while True:
            try:
                push_changes()
                pull_changes()
            except Exception as e:
                print("Global Sync Error:", e)
            time.sleep(interval)
            
    t = threading.Thread(target=run, daemon=True)
    t.start()

if __name__ == "__main__":
    print("Rodando sync manual...")
    push_changes()
    pull_changes()
    print("Fim.")

import sqlite3
import os
import uuid
from datetime import datetime

# Define caminho fixo para o Banco de Dados no AppData do usuário
# Isso evita o erro de "Read-Only" em pastas do sistema como Arquivos de Programas.
def get_db_path():
    app_data = os.getenv('LOCALAPPDATA', os.path.expanduser('~'))
    path = os.path.join(app_data, "AgroGB")
    os.makedirs(path, exist_ok=True)
    return os.path.join(path, "agrogb.db")

DB_PATH = get_db_path()

def conectar():
    return sqlite3.connect(DB_PATH)


def now_iso():
    return datetime.now().isoformat()


def new_uuid():
    return str(uuid.uuid4())


def ensure_column(cursor, table, column, definition):
    cols = [row[1] for row in cursor.execute(f"PRAGMA table_info({table})").fetchall()]
    if column not in cols:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def soft_delete(table, row_id):
    conn = conectar()
    cursor = conn.cursor()
    try:
        ensure_column(cursor, table, "is_deleted", "INTEGER DEFAULT 0")
        ensure_column(cursor, table, "sync_status", "INTEGER DEFAULT 0")
        ensure_column(cursor, table, "last_updated", "TEXT")
        cursor.execute(
            f"UPDATE {table} SET is_deleted = 1, sync_status = 0, last_updated = ? WHERE id = ?",
            (now_iso(), row_id),
        )
        conn.commit()
    finally:
        conn.close()


def criar_tabelas():
    conn = conectar()
    cursor = conn.cursor()

    # ==========================
    # 1. USUARIOS (Igual Mobile)
    # ==========================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        usuario TEXT UNIQUE,
        senha TEXT,
        nivel TEXT DEFAULT 'USUARIO',
        email TEXT, -- Adicionado para paridade
        nome_completo TEXT,
        telefone TEXT,
        endereco TEXT,
        avatar TEXT,
        avatar_url TEXT,
        provider TEXT DEFAULT 'local',
        sync_status INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        last_updated TEXT
    )
    """)

    # ==========================
    # 2. COLHEITAS (Plural, Flat)
    # ==========================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS colheitas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        cultura TEXT NOT NULL,
        produto TEXT NOT NULL,
        quantidade REAL NOT NULL,
        congelado REAL DEFAULT 0,
        data TEXT NOT NULL,
        observacao TEXT,
        anexo TEXT,
        is_deleted INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
    )
    """)

    # ==========================
    # 3. VENDAS (Igual Mobile)
    # ==========================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        cliente TEXT NOT NULL,
        produto TEXT NOT NULL,
        quantidade REAL NOT NULL,
        valor REAL NOT NULL,
        data TEXT NOT NULL,
        observacao TEXT,
        status TEXT DEFAULT 'ATIVA', -- Desktop extra feature, mantido
        anexo TEXT,
        is_deleted INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
    )
    """)

    # ==========================
    # 4. COMPRAS (Igual Mobile)
    # ==========================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS compras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        item TEXT NOT NULL,
        quantidade REAL NOT NULL,
        valor REAL NOT NULL,
        cultura TEXT,
        data TEXT NOT NULL,
        observacao TEXT,
        unidade TEXT, -- Desktop legacy
        fornecedor_uuid TEXT,
        detalhes TEXT,
        anexo TEXT,
        is_deleted INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
    )
    """)

    # ==========================
    # 5. PLANTIO (Igual Mobile)
    # ==========================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS plantio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        cultura TEXT NOT NULL,
        quantidade_pes INTEGER NOT NULL,
        tipo_plantio TEXT,
        data TEXT NOT NULL,
        observacao TEXT,
        is_deleted INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
    )
    """)

    # ==========================
    # 6. CUSTOS (Novo no Desktop, vindo do Mobile)
    # ==========================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS custos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        produto TEXT NOT NULL,
        tipo TEXT,
        quantidade REAL NOT NULL,
        valor_total REAL NOT NULL,
        data TEXT NOT NULL,
        observacao TEXT,
        anexo TEXT,
        is_deleted INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
    )
    """)

    # ==========================
    # 7. DESCARTE (Igual Mobile)
    # ==========================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS descarte (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        produto TEXT NOT NULL,
        quantidade_kg REAL NOT NULL,
        motivo TEXT,
        data TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
    )
    """)

    # ==========================
    # 8. CADASTRO (Igual Mobile)
    # ==========================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cadastro (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        unidade TEXT,
        tipo TEXT,
        estocavel INTEGER DEFAULT 1,
        vendavel INTEGER DEFAULT 1,
        observacao TEXT,
        fator_conversao REAL DEFAULT 1,
        principio_ativo TEXT,
        composicao TEXT,
        classe_toxicologica TEXT,
        preco_venda REAL DEFAULT 0,
        descricao_ia TEXT,
        validado_por TEXT,
        data_validacao TEXT,
        is_deleted INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
    )
    """)

    # ==========================
    # 9. CLIENTES (Igual Mobile)
    # ==========================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        telefone TEXT,
        endereco TEXT,
        cpf_cnpj TEXT,
        observacao TEXT,
        is_deleted INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
    )
    """)

    # ==========================
    # 10. CULTURAS (Igual Mobile)
    # ==========================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS culturas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        observacao TEXT,
        is_deleted INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
    )
    """)

    # ==========================
    # 11. MAQUINAS (Frota Mobile)
    # ==========================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS maquinas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        placa TEXT,
        horimetro_atual REAL DEFAULT 0,
        intervalo_revisao REAL DEFAULT 10000,
        status TEXT DEFAULT 'OK',
        is_deleted INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
    )
    """)

    # ==========================
    # 12. MANUTENCAO_FROTA (Frota Mobile)
    # ==========================
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS manutencao_frota (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        maquina_uuid TEXT NOT NULL,
        data TEXT NOT NULL,
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        is_deleted INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS estoque (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        item TEXT,
        produto TEXT,
        quantidade REAL NOT NULL DEFAULT 0,
        unidade TEXT,
        valor REAL DEFAULT 0,
        origem TEXT,
        data TEXT,
        observacao TEXT,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS receitas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_pai_uuid TEXT NOT NULL,
        item_filho_uuid TEXT NOT NULL,
        quantidade REAL NOT NULL,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS talhoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        area_ha REAL,
        cultura_id TEXT,
        status TEXT DEFAULT 'ATIVO',
        observacao TEXT,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fornecedores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        contato TEXT,
        telefone TEXT,
        email TEXT,
        observacao TEXT,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS irrigacao (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        talhao_uuid TEXT,
        turno TEXT,
        duracao_min INTEGER,
        volumetria_m3 REAL,
        status TEXT DEFAULT 'CONCLUIDO',
        data TEXT NOT NULL,
        observacao TEXT,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS financeiro_transacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        tipo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        vencimento TEXT NOT NULL,
        data_pagamento TEXT,
        status TEXT DEFAULT 'PENDENTE',
        categoria TEXT,
        origem_uuid TEXT,
        entidade_nome TEXT,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fertirrigacao (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        talhao_uuid TEXT NOT NULL,
        formula TEXT,
        volume_agua_l REAL,
        dosagem_insumo_kg REAL,
        data TEXT NOT NULL,
        status TEXT DEFAULT 'CONCLUIDO',
        observacao TEXT,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS aplicacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        talhao_uuid TEXT NOT NULL,
        produto_nome TEXT NOT NULL,
        praga_alvo TEXT,
        dose_ha REAL,
        volume_calda_l REAL,
        data TEXT NOT NULL,
        carencia_dias INTEGER,
        data_liberacao TEXT,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS equipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        cargo TEXT NOT NULL,
        documento TEXT,
        status TEXT DEFAULT 'ATIVO',
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS planos_adubacao (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        nome_plano TEXT NOT NULL,
        cultura TEXT,
        tipo_aplicacao TEXT,
        area_local TEXT,
        descricao_tecnica TEXT,
        status TEXT DEFAULT 'PLANEJADO',
        data_criacao TEXT NOT NULL,
        data_aplicacao TEXT,
        anexos_uri TEXT,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS caderno_notas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        titulo TEXT NOT NULL,
        conteudo TEXT,
        data TEXT NOT NULL,
        categoria TEXT,
        last_updated TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS monitoramento (
        uuid TEXT PRIMARY KEY,
        cultura TEXT,
        data TEXT,
        imagem_base64 TEXT,
        observacao TEXT,
        sync_status INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        primary_color TEXT DEFAULT '#059669',
        theme_mode TEXT DEFAULT 'system',
        fazenda_nome TEXT,
        fazenda_produtor TEXT,
        fazenda_documento TEXT,
        fazenda_telefone TEXT,
        fazenda_email TEXT,
        fazenda_logo TEXT,
        fin_moeda TEXT DEFAULT 'R$',
        fin_mes_fiscal INTEGER DEFAULT 1,
        fin_calc_margem INTEGER DEFAULT 0,
        fin_vinc_custo INTEGER DEFAULT 0,
        fin_meta_lucro REAL,
        clima_api_key TEXT,
        clima_cidade TEXT,
        clima_gps INTEGER DEFAULT 1,
        clima_ativo INTEGER DEFAULT 1,
        rel_incluir_logo INTEGER DEFAULT 1,
        rel_modelo TEXT DEFAULT 'resumido',
        img_qualidade REAL DEFAULT 0.8,
        img_limite INTEGER DEFAULT 3,
        updated_at TEXT
    )
    """)
    cursor.execute("INSERT OR IGNORE INTO app_settings (id, updated_at) VALUES (1, ?)", (now_iso(),))
    
    # 13. CONFIG (Sistema)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sistema_config (
        chave TEXT PRIMARY KEY,
        valor TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS logs_acesso (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT,
        data_hora TEXT,
        status TEXT,
        ip TEXT
    )
    """)

    # Admin Padrão
    import bcrypt
    try:
        senha_hash = bcrypt.hashpw("1234".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute("""
            INSERT OR IGNORE INTO usuarios (uuid, usuario, senha, nivel, provider, last_updated, sync_status, is_deleted)
            VALUES (?, 'ADMIN', ?, 'ADM', 'local', ?, 0, 0)
        """, (new_uuid(), senha_hash, now_iso()))
    except: pass

    # ==========================
    # LOGICA DE MIGRAÇÃO (PODEROSA)
    # ==========================
    
    # 1. Garantir UUID em todas as tabelas (incluindo Maquinas legado)
    tabelas_uuid = [
        "usuarios", "maquinas", "clientes", "culturas", "cadastro", "compras", "plantio",
        "colheitas", "estoque", "vendas", "descarte", "custos", "manutencao_frota",
        "receitas", "talhoes", "fornecedores", "irrigacao", "financeiro_transacoes",
        "fertirrigacao", "aplicacoes", "equipes", "planos_adubacao", "caderno_notas",
        "monitoramento"
    ]
    
    for tab in tabelas_uuid:
        try:
            # Tenta adicionar UUID se não existir
            ensure_column(cursor, tab, "uuid", "TEXT")
            ensure_column(cursor, tab, "sync_status", "INTEGER DEFAULT 0")
            ensure_column(cursor, tab, "last_updated", "TEXT")
            ensure_column(cursor, tab, "is_deleted", "INTEGER DEFAULT 0")
            print(f"Migrado esquema para {tab}")
        except: 
            pass # Coluna já existe

        # PREENCHER UUIDS NULOS (Para registros antigos)
        try:
            table_cols = [row[1] for row in cursor.execute(f"PRAGMA table_info({tab})").fetchall()]
            if "id" not in table_cols:
                continue
            rows_null = cursor.execute(f"SELECT id FROM {tab} WHERE uuid IS NULL").fetchall()
            if rows_null:
                import uuid
                from datetime import datetime
                ts = datetime.now().isoformat()
                for row in rows_null:
                    uid = str(uuid.uuid4())
                    cursor.execute(f"UPDATE {tab} SET uuid = ?, last_updated = ? WHERE id = ?", (uid, ts, row[0]))
                print(f"Preenchidos {len(rows_null)} UUIDs em {tab}")
        except Exception as e:
            print(f"Erro populando UUID em {tab}: {e}")

    # 1.1. Garantir colunas compartilhadas com o app mobile recente
    try:
        extras = {
            "usuarios": {
                "email": "TEXT",
                "nome_completo": "TEXT",
                "telefone": "TEXT",
                "endereco": "TEXT",
                "avatar": "TEXT",
                "avatar_url": "TEXT",
                "provider": "TEXT DEFAULT 'local'",
            },
            "colheitas": {"congelado": "REAL DEFAULT 0", "anexo": "TEXT"},
            "vendas": {"anexo": "TEXT"},
            "compras": {"fornecedor_uuid": "TEXT", "detalhes": "TEXT", "anexo": "TEXT"},
            "custos": {"anexo": "TEXT"},
            "cadastro": {
                "fator_conversao": "REAL DEFAULT 1",
                "principio_ativo": "TEXT",
                "composicao": "TEXT",
                "classe_toxicologica": "TEXT",
                "preco_venda": "REAL DEFAULT 0",
                "descricao_ia": "TEXT",
                "validado_por": "TEXT",
                "data_validacao": "TEXT",
            },
            "estoque": {"item": "TEXT", "produto": "TEXT", "unidade": "TEXT", "valor": "REAL DEFAULT 0", "origem": "TEXT", "data": "TEXT", "observacao": "TEXT"},
            "equipes": {"sync_status": "INTEGER DEFAULT 0"},
        }
        for table, columns in extras.items():
            for column, definition in columns.items():
                ensure_column(cursor, table, column, definition)
    except Exception as e:
        print(f"Erro garantindo colunas mobile: {e}")

    # ==========================
    # 2. MIGRAÇÃO V7.0 (PARIDADE MOBILE)
    # ==========================
    try:
        cur = conn.cursor()
        cols_cad = [row[1] for row in cur.execute("PRAGMA table_info(cadastro)").fetchall()]
        
        novas_cols = {
            "principio_ativo": "TEXT",
            "composicao": "TEXT",
            "classe_toxicologica": "TEXT",
            "preco_venda": "REAL DEFAULT 0",
            "descricao_ia": "TEXT",
            "validado_por": "TEXT",
            "data_validacao": "TEXT"
        }

        for col, tipo in novas_cols.items():
            if col not in cols_cad:
                print(f"Migrando V7: Adicionando {col} em cadastro...")
                cur.execute(f"ALTER TABLE cadastro ADD COLUMN {col} {tipo}")
        
    except Exception as e:
        print(f"Erro Migração V7 (Desktop): {e}")

    # ==========================
    # 3. MIGRAÇÃO DE COLUNAS (Rename / Copy)
    # ==========================
    try:
        # Verifica se na tabela 'maquinas' existe a coluna antiga 'horimetro' e NAO existe a nova 'horimetro_atual'
        cols_maquinas = [row[1] for row in cursor.execute("PRAGMA table_info(maquinas)").fetchall()]
        
        if "horimetro" in cols_maquinas and "horimetro_atual" not in cols_maquinas:
            print("Migrando colunas da tabela Maquinas...")
            # Como SQLite é limitado no RENAME COLUMN em versoes antigas, vamos ADD COLUMN e COPY
            cursor.execute("ALTER TABLE maquinas ADD COLUMN horimetro_atual REAL DEFAULT 0")
            cursor.execute("UPDATE maquinas SET horimetro_atual = horimetro")
            
        if "proxima_revisao" in cols_maquinas and "intervalo_revisao" not in cols_maquinas:
             cursor.execute("ALTER TABLE maquinas ADD COLUMN intervalo_revisao REAL DEFAULT 10000")
             # Logica: intervalo = proxima - atual. Se proxima < atual, usa 10000 padrao.
             cursor.execute("UPDATE maquinas SET intervalo_revisao = CASE WHEN proxima_revisao > horimetro THEN proxima_revisao - horimetro ELSE 10000 END")
             
        # Obs: Dados antigos (colunas velhas) ficam sobrando, mas não atrapalham.
        
    except Exception as e:
        print(f"Erro migrando colunas maquinas: {e}")

    # 2. Migrar Manutenções Legadas (manutencoes -> manutencao_frota)
    try:
        # Verifica se existe tabela antiga
        check = cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='manutencoes'").fetchone()
        if check:
            # Pega dados antigos
            old_rows = cursor.execute("SELECT maquina_id, data, descricao, custo FROM manutencoes").fetchall()
            if old_rows:
                import uuid
                from datetime import datetime
                ts = datetime.now().isoformat()
                count = 0
                for r in old_rows:
                    # Busca UUID da maquina correspondente
                    maq_row = cursor.execute("SELECT uuid FROM maquinas WHERE id = ?", (r[0],)).fetchone()
                    if maq_row and maq_row[0]:
                        muuid = maq_row[0]
                        # Insere na nova tabela se não for duplicado (simplificado: insere sempre que rodar? nao, ideal verificar)
                        # Como é one-shot migration, vamos assumir que se a tabela nova estiver vazia, migra.
                        check_empty = cursor.execute("SELECT count(*) FROM manutencao_frota").fetchone()[0]
                        if check_empty == 0:
                            nuuid = str(uuid.uuid4())
                            cursor.execute("""
                                INSERT INTO manutencao_frota (uuid, maquina_uuid, data, descricao, valor, last_updated, sync_status)
                                VALUES (?, ?, ?, ?, ?, ?, 0)
                            """, (nuuid, muuid, r[1], r[2], r[3], ts))
                            count += 1
                if count > 0: print(f"Migradas {count} manutenções para novo formato.")
            
            # Opcional: Renomear tabela antiga para backup
            # cursor.execute("ALTER TABLE manutencoes RENAME TO manutencoes_backup")
    except Exception as e:
        print(f"Erro migracao manutencao: {e}")

    conn.commit()
    conn.close()


# ==================================================
# MÓDULO FROTA (Padronizado com Mobile)
# ==================================================
import uuid

def add_maquina(nome, tipo, horimetro, proxima_revisao, placa=""):
    conn = conectar()
    cursor = conn.cursor()
    new_uuid = str(uuid.uuid4())
    import datetime
    now_iso = datetime.datetime.now().isoformat()
    
    # Mapeando inputs antigos para novo schema
    # proxima_revisao no Desktop era um valor, no Mobile é 'intervalo'. 
    # Vamos assumir intervalo = proxima - atual por enquanto ou fixo.
    intervalo = proxima_revisao - horimetro if proxima_revisao > horimetro else 10000
    
    cursor.execute("""
        INSERT INTO maquinas (uuid, nome, tipo, placa, horimetro_atual, intervalo_revisao, status, last_updated, sync_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    """, (new_uuid, nome, tipo, placa, horimetro, intervalo, 'OK', now_iso))
    conn.commit()
    conn.close()

def get_maquinas():
    conn = conectar()
    cursor = conn.cursor()
    # Mapear colunas novas para retorno esperado pelo UI antigo se necessário
    # O UI espera: id, nome, tipo, horimetro, proxima_revisao, status, placa
    cursor.execute("SELECT id, nome, tipo, horimetro_atual, (horimetro_atual + intervalo_revisao) as prox, status, placa, uuid FROM maquinas ORDER BY nome")
    dados = cursor.fetchall()
    conn.close()
    return dados # Retorna lista compativel com UI Desktop (com uuid no final extra)

def update_maquina(id_maquina, nome, tipo, horimetro, proxima_revisao, placa=""):
    conn = conectar()
    cursor = conn.cursor()
    import datetime
    now_iso = datetime.datetime.now().isoformat()
    intervalo = proxima_revisao - horimetro
    
    cursor.execute("""
        UPDATE maquinas 
        SET nome = ?, tipo = ?, horimetro_atual = ?, intervalo_revisao = ?, placa = ?, last_updated = ?, sync_status = 0
        WHERE id = ?
    """, (nome, tipo, horimetro, intervalo, placa, now_iso, id_maquina))
    conn.commit()
    conn.close()

def delete_maquina(id_maquina):
    conn = conectar()
    cursor = conn.cursor()
    # Primeiro pega o UUID para deletar manutenções
    row = cursor.execute("SELECT uuid FROM maquinas WHERE id = ?", (id_maquina,)).fetchone()
    if row:
        u = row[0]
        cursor.execute("DELETE FROM manutencao_frota WHERE maquina_uuid = ?", (u,))
        cursor.execute("DELETE FROM maquinas WHERE id = ?", (id_maquina,))
    conn.commit()
    conn.close()

def calcular_status_frota():
    conn = conectar()
    cursor = conn.cursor()
    maquinas = cursor.execute("SELECT id, horimetro_atual, intervalo_revisao FROM maquinas").fetchall()
    stats = {"OK": 0, "ALERTA": 0, "CRITICO": 0}
    
    for m in maquinas:
        mid, atual, intervalo = m
        restante = intervalo # Simplificado
        
        # Lógica simplificada pois Mobile usa apenas intervalo fixo
        # Idealmente compararíamos com a ultima manutenção
        
        status = "OK" # Placeholder
        stats["OK"] += 1
        
    conn.close()
    return stats

def add_manutencao(maquina_id, data, descricao, custo):
    conn = conectar()
    cursor = conn.cursor()
    import datetime
    
    # Precisamos do UUID da maquina
    row = cursor.execute("SELECT uuid FROM maquinas WHERE id = ?", (maquina_id,)).fetchone()
    if not row: return
    maq_uuid = row[0]
    
    new_uuid = str(uuid.uuid4())
    now_iso = datetime.datetime.now().isoformat()
    
    cursor.execute("""
        INSERT INTO manutencao_frota (uuid, maquina_uuid, data, descricao, valor, last_updated, sync_status) 
        VALUES (?, ?, ?, ?, ?, ?, 0)
    """, (new_uuid, maq_uuid, data, descricao, custo, now_iso))
    conn.commit()
    conn.close()

def get_historico_manutencoes(maquina_id):
    conn = conectar()
    cursor = conn.cursor()
    row = cursor.execute("SELECT uuid FROM maquinas WHERE id = ?", (maquina_id,)).fetchone()
    if not row: return []
    maq_uuid = row[0]
    
    # Retorna formato compatível com UI Desktop: (id, maquina_id, data, descricao, custo)
    # Ajustamos o select para fingir que maquina_uuid é maquina_id para não quebrar UI agora
    cursor.execute("""
        SELECT id, ? as maquina_id, data, descricao, valor 
        FROM manutencao_frota 
        WHERE maquina_uuid = ? 
        ORDER BY data DESC
    """, (maquina_id, maq_uuid))
    dados = cursor.fetchall()
    conn.close()
    return dados


# ==========================================
# FUNÇÕES DE INTELIGÊNCIA (BI)
# ==========================
def get_kpi_financeiro(mes, ano):
    """Retorna (total_vendas, total_compras, lucro) para o período"""
    conn = conectar()
    cursor = conn.cursor()
    
    # Filtro de data: YYYY-MM
    data_filtro = f"{ano}-{mes}"
    
    # Soma de Vendas
    vendas = cursor.execute("SELECT SUM(valor * quantidade) FROM vendas WHERE data LIKE ?", (f"{data_filtro}%",)).fetchone()[0] or 0
    
    # Soma de Compras
    compras = cursor.execute("SELECT SUM(valor) FROM compras WHERE data LIKE ?", (f"{data_filtro}%",)).fetchone()[0] or 0
    
    conn.close()
    return float(vendas), float(compras), float(vendas - compras)

def get_fluxo_caixa_anual(ano):
    """Retorna lista de (mes, receita, despesa) para o ano todo"""
    conn = conectar()
    cursor = conn.cursor()
    dados = []
    
    for mes in range(1, 13):
        m_str = str(mes).zfill(2)
        data_filtro = f"{ano}-{m_str}"
        v = cursor.execute("SELECT SUM(valor * quantidade) FROM vendas WHERE data LIKE ?", (f"{data_filtro}%",)).fetchone()[0] or 0
        c = cursor.execute("SELECT SUM(valor) FROM compras WHERE data LIKE ?", (f"{data_filtro}%",)).fetchone()[0] or 0
        dados.append((m_str, float(v), float(c)))
        
    conn.close()
    return dados

def get_vendas_por_produto(mes, ano):
    """Retorna lista de (produto, total_vendas) top 5"""
    conn = conectar()
    cursor = conn.cursor()
    
    data_filtro = f"{ano}-{mes}"
    
    # Agrega por nome do produto
    cursor.execute("""
        SELECT produto, SUM(valor * quantidade) as total 
        FROM vendas 
        WHERE data LIKE ? 
        GROUP BY produto 
        ORDER BY total DESC 
        LIMIT 5
    """, (f"{data_filtro}%",))
    
    dados = cursor.fetchall() # [(ProdA, 1000), (ProdB, 500)...]
    conn.close()
    return dados

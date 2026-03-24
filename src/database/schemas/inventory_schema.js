export const INVENTORY_SCHEMA = [
    `CREATE TABLE IF NOT EXISTS estoque (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        produto TEXT UNIQUE NOT NULL, 
        quantidade REAL NOT NULL, 
        last_updated TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS compras (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        uuid TEXT UNIQUE NOT NULL, 
        item TEXT NOT NULL, 
        quantidade REAL NOT NULL, 
        valor REAL NOT NULL, 
        cultura TEXT, 
        data TEXT NOT NULL, 
        observacao TEXT, 
        detalhes TEXT, 
        anexo TEXT, 
        last_updated TEXT NOT NULL, 
        sync_status INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS cadastro (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        uuid TEXT UNIQUE NOT NULL, 
        nome TEXT NOT NULL, 
        unidade TEXT, 
        tipo TEXT, 
        observacao TEXT, 
        fator_conversao REAL DEFAULT 1, 
        estocavel INTEGER DEFAULT 1,
        vendavel INTEGER DEFAULT 1,
        principio_ativo TEXT,
        classe_toxicologica TEXT,
        composicao TEXT,
        preco_venda REAL DEFAULT 0,
        descricao_ia TEXT,
        validado_por TEXT,
        data_validacao TEXT,
        codigo TEXT,
        unidade_id INTEGER,
        last_updated TEXT NOT NULL, 
        sync_status INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS v2_produtos (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        categoria TEXT,
        unidade_medida TEXT,
        preco_base REAL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending'
    );`,
    `CREATE TABLE IF NOT EXISTS v2_estoque_atual (
        id TEXT PRIMARY KEY,
        produto_id TEXT UNIQUE,
        quantidade REAL DEFAULT 0,
        localizacao TEXT,
        last_updated TEXT,
        sync_status TEXT DEFAULT 'pending'
    );`,
    `CREATE TABLE IF NOT EXISTS v2_movimentacoes_estoque (
        id TEXT PRIMARY KEY,
        produto_id TEXT,
        tipo TEXT,
        quantidade REAL,
        origem TEXT,
        data TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        sync_status TEXT DEFAULT 'pending'
    );`
];

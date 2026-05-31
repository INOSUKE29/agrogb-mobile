export const FARM_SCHEMA = [
    `CREATE TABLE IF NOT EXISTS areas (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        uuid TEXT UNIQUE NOT NULL, 
        nome TEXT NOT NULL, 
        descricao TEXT, 
        observacao TEXT, 
        metragem REAL, 
        peso_medio_caixa REAL DEFAULT 1, 
        last_updated TEXT NOT NULL, 
        sync_status INTEGER DEFAULT 0, 
        is_deleted INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        uuid TEXT UNIQUE NOT NULL, 
        nome TEXT NOT NULL, 
        telefone TEXT, 
        cidade TEXT, 
        estado TEXT, 
        endereco TEXT, 
        cpf_cnpj TEXT, 
        observacoes TEXT, 
        observacao_legada TEXT, 
        last_updated TEXT NOT NULL, 
        sync_status INTEGER DEFAULT 0, 
        is_deleted INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS culturas (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        uuid TEXT UNIQUE NOT NULL, 
        nome TEXT NOT NULL, 
        observacao TEXT, 
        last_updated TEXT NOT NULL, 
        sync_status INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS v2_fazendas (
        id TEXT PRIMARY KEY,
        produtor_id TEXT,
        nome TEXT NOT NULL,
        area_total REAL,
        cidade TEXT,
        estado TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending'
    );`,
    `CREATE TABLE IF NOT EXISTS v2_talhoes (
        id TEXT PRIMARY KEY,
        fazenda_id TEXT,
        nome TEXT NOT NULL,
        area REAL,
        tipo_solo TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending'
    );`
];

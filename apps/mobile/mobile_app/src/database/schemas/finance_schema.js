export const FINANCE_SCHEMA = [
    `CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        uuid TEXT UNIQUE NOT NULL, 
        usuario_id TEXT, 
        cliente_id TEXT, 
        cliente TEXT NOT NULL, 
        produto_id TEXT, 
        produto TEXT NOT NULL, 
        quantidade REAL NOT NULL, 
        valor REAL NOT NULL, 
        valor_recebido REAL, 
        status_pagamento TEXT DEFAULT 'A_RECEBER', 
        data_venda TEXT, 
        data_recebimento TEXT, 
        forma_pagamento TEXT, 
        data TEXT NOT NULL, 
        observacao TEXT, 
        anexo TEXT, 
        last_updated TEXT NOT NULL, 
        sync_status INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS custos (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        uuid TEXT UNIQUE NOT NULL, 
        produto TEXT NOT NULL, 
        tipo TEXT, 
        quantidade REAL NOT NULL, 
        valor_total REAL NOT NULL, 
        data TEXT NOT NULL, 
        observacao TEXT, 
        anexo TEXT, 
        categoria_id TEXT, 
        created_at TEXT, 
        last_updated TEXT NOT NULL, 
        is_deleted INTEGER DEFAULT 0, 
        sync_status INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS movimentacoes_financeiras (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        uuid TEXT UNIQUE, 
        tipo TEXT, 
        valor REAL, 
        data TEXT, 
        descricao TEXT, 
        created_at TEXT, 
        last_updated TEXT, 
        is_deleted INTEGER DEFAULT 0, 
        sync_status INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS v2_vendas (
        id TEXT PRIMARY KEY,
        cliente_id TEXT,
        data_venda TEXT,
        valor_total REAL,
        status TEXT DEFAULT 'Pendente',
        observacao TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending'
    );`,
    `CREATE TABLE IF NOT EXISTS v2_contas_financeiras (
        id TEXT PRIMARY KEY,
        nome TEXT,
        saldo_inicial REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        sync_status TEXT DEFAULT 'pending'
    );`,
    `CREATE TABLE IF NOT EXISTS v2_transacoes_financeiras (
        id TEXT PRIMARY KEY,
        conta_id TEXT,
        tipo TEXT, 
        valor REAL,
        categoria_id TEXT,
        descricao TEXT,
        data TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        sync_status TEXT DEFAULT 'pending'
    );`,
    `CREATE TABLE IF NOT EXISTS financial_accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        type TEXT NOT NULL, -- 'PAY' or 'RECEIVE'
        category TEXT, -- 'COMPRA', 'VENDA', 'CUSTO', 'OUTROS'
        description TEXT NOT NULL,
        total_value REAL NOT NULL,
        origin_uuid TEXT, -- Link para uuid da compra/venda
        status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PARTIAL', 'PAID', 'CANCELLED'
        due_date TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        last_updated TEXT,
        sync_status INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS financial_installments (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        installment_number INTEGER NOT NULL,
        value REAL NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PAID'
        payment_date TEXT,
        last_updated TEXT,
        sync_status INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        FOREIGN KEY(account_id) REFERENCES financial_accounts(id)
    );`
];

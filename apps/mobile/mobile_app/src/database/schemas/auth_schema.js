export const AUTH_SCHEMA = [
    `CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        usuario TEXT UNIQUE NOT NULL, 
        senha TEXT NOT NULL, 
        nivel TEXT DEFAULT 'USUARIO', 
        email TEXT, 
        nome_completo TEXT, 
        telefone TEXT, 
        endereco TEXT, 
        avatar TEXT, 
        provider TEXT DEFAULT 'local', 
        avatar_url TEXT, 
        created_at TEXT, 
        last_updated TEXT, 
        is_deleted INTEGER DEFAULT 0, 
        sync_status INTEGER DEFAULT 0, 
        uuid TEXT UNIQUE
    );`,
    `CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        uuid TEXT UNIQUE, 
        usuario_id INTEGER, 
        full_name TEXT, 
        bio TEXT, 
        last_updated TEXT, 
        sync_status INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY, 
        email TEXT, 
        name TEXT, 
        role TEXT, 
        created_at TEXT, 
        last_updated TEXT, 
        sync_status INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS v2_produtores (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE,
        senha TEXT,
        telefone TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending',
        device_id TEXT
    );`
];

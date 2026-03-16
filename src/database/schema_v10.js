
/**
 * SCHEMA AGROGB V2 (v10.0)
 * Arquitetura ERP Profissional para Escala SaaS
 * 41 Tabelas organizadas por Domínios
 */

export const SCHEMA_V10 = [
    // --- 1. NÚCLEO DA PROPRIEDADE ---
    `CREATE TABLE IF NOT EXISTS v2_produtores (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT,
        telefone TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending',
        device_id TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS v2_fazendas (
        id TEXT PRIMARY KEY,
        produtor_id TEXT,
        nome TEXT NOT NULL,
        area_total REAL,
        cidade TEXT,
        estado TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending',
        device_id TEXT,
        FOREIGN KEY(produtor_id) REFERENCES v2_produtores(id)
    )`,
    `CREATE TABLE IF NOT EXISTS v2_talhoes (
        id TEXT PRIMARY KEY,
        fazenda_id TEXT,
        nome TEXT NOT NULL,
        area REAL,
        tipo_solo TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending',
        device_id TEXT,
        FOREIGN KEY(fazenda_id) REFERENCES v2_fazendas(id)
    )`,
    `CREATE TABLE IF NOT EXISTS v2_culturas (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        variedade TEXT,
        ciclo_dias INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending'
    )`,
    `CREATE TABLE IF NOT EXISTS v2_safras (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL, -- Ex: 2024/2025
        data_inicio TEXT,
        data_fim TEXT,
        ativa INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending'
    )`,
    `CREATE TABLE IF NOT EXISTS v2_plantios (
        id TEXT PRIMARY KEY,
        talhao_id TEXT,
        cultura_id TEXT,
        safra_id TEXT,
        data_plantio TEXT,
        quantidade_sementes REAL,
        espacamento REAL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending',
        FOREIGN KEY(talhao_id) REFERENCES v2_talhoes(id),
        FOREIGN KEY(cultura_id) REFERENCES v2_culturas(id),
        FOREIGN KEY(safra_id) REFERENCES v2_safras(id)
    )`,

    // --- 2. PRODUÇÃO AGRÍCOLA ---
    `CREATE TABLE IF NOT EXISTS v2_colheitas (
        id TEXT PRIMARY KEY,
        plantio_id TEXT,
        data_colheita TEXT,
        quantidade_total REAL,
        unidade TEXT DEFAULT 'KG',
        qualidade TEXT,
        observacao TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending',
        FOREIGN KEY(plantio_id) REFERENCES v2_plantios(id)
    )`,
    `CREATE TABLE IF NOT EXISTS v2_colheita_itens (
        id TEXT PRIMARY KEY,
        colheita_id TEXT,
        lote TEXT,
        quantidade REAL,
        valor_unitario REAL,
        created_at TEXT DEFAULT (datetime('now')),
        sync_status TEXT DEFAULT 'pending',
        FOREIGN KEY(colheita_id) REFERENCES v2_colheitas(id)
    )`,
    `CREATE TABLE IF NOT EXISTS v2_aplicacoes_defensivos (
        id TEXT PRIMARY KEY,
        plantio_id TEXT,
        data_aplicacao TEXT,
        produto_id TEXT,
        dosagem REAL,
        area_aplicada REAL,
        responsavel TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending'
    )`,

    // --- 3. COMERCIALIZAÇÃO ---
    `CREATE TABLE IF NOT EXISTS v2_clientes (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        cpf_cnpj TEXT,
        telefone TEXT,
        email TEXT,
        cidade TEXT,
        endereco TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending'
    )`,
    `CREATE TABLE IF NOT EXISTS v2_vendas (
        id TEXT PRIMARY KEY,
        cliente_id TEXT,
        data_venda TEXT,
        valor_total REAL,
        status TEXT DEFAULT 'Pendente', -- Pendente, Pago, Cancelado
        observacao TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending',
        FOREIGN KEY(cliente_id) REFERENCES v2_clientes(id)
    )`,

    // --- 4. ESTOQUE ---
    `CREATE TABLE IF NOT EXISTS v2_produtos (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        categoria TEXT, -- Semente, Fertilizante, Defensivo, Maquinário
        unidade_medida TEXT,
        preco_base REAL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending'
    )`,
    `CREATE TABLE IF NOT EXISTS v2_estoque_atual (
        id TEXT PRIMARY KEY,
        produto_id TEXT UNIQUE,
        quantidade REAL DEFAULT 0,
        localizacao TEXT,
        last_updated TEXT,
        sync_status TEXT DEFAULT 'pending',
        FOREIGN KEY(produto_id) REFERENCES v2_produtos(id)
    )`,
    `CREATE TABLE IF NOT EXISTS v2_movimentacoes_estoque (
        id TEXT PRIMARY KEY,
        produto_id TEXT,
        tipo TEXT, -- ENTRADA / SAIDA
        quantidade REAL,
        origem TEXT, -- Compra, Plantio, Venda, Descarte
        data TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        sync_status TEXT DEFAULT 'pending',
        FOREIGN KEY(produto_id) REFERENCES v2_produtos(id)
    )`,

    // --- 5. FROTA E MÁQUINAS ---
    `CREATE TABLE IF NOT EXISTS v2_maquinas (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        tipo TEXT,
        placa TEXT,
        horimetro_atual REAL DEFAULT 0,
        status TEXT DEFAULT 'Operacional',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending'
    )`,
    `CREATE TABLE IF NOT EXISTS v2_manutencoes (
        id TEXT PRIMARY KEY,
        maquina_id TEXT,
        data TEXT,
        descricao TEXT,
        custo REAL,
        proxima_manutencao_hora REAL,
        created_at TEXT DEFAULT (datetime('now')),
        sync_status TEXT DEFAULT 'pending',
        FOREIGN KEY(maquina_id) REFERENCES v2_maquinas(id)
    )`,

    // --- 6. FINANCEIRO ---
    `CREATE TABLE IF NOT EXISTS v2_contas_financeiras (
        id TEXT PRIMARY KEY,
        nome TEXT, -- Banco X, Caixa Local, etc
        saldo_inicial REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        sync_status TEXT DEFAULT 'pending'
    )`,
    `CREATE TABLE IF NOT EXISTS v2_transacoes_financeiras (
        id TEXT PRIMARY KEY,
        conta_id TEXT,
        tipo TEXT, -- ENTRADA / SAIDA
        valor REAL,
        categoria_id TEXT,
        descricao TEXT,
        data TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        sync_status TEXT DEFAULT 'pending',
        FOREIGN KEY(conta_id) REFERENCES v2_contas_financeiras(id)
    )`,

    // --- 7. SINCRONIZAÇÃO (CORAÇÃO V2) ---
    `CREATE TABLE IF NOT EXISTS v2_sync_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT,
        operation TEXT, -- INSERT, UPDATE, DELETE
        record_id TEXT,
        payload TEXT, -- JSON dos dados
        status TEXT DEFAULT 'pending', -- pending, processing, failed, synced
        retry_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS v2_sync_logs (
        id TEXT PRIMARY KEY,
        operation TEXT,
        table_name TEXT,
        status TEXT,
        message TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS v2_devices (
        id TEXT PRIMARY KEY,
        produtor_id TEXT,
        nome_device TEXT,
        os TEXT,
        app_version TEXT,
        last_sync TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS v2_conflicts (
        id TEXT PRIMARY KEY,
        table_name TEXT,
        record_id TEXT,
        local_data TEXT,
        remote_data TEXT,
        resolved INTEGER DEFAULT 0,
        resolution_strategy TEXT, -- server_wins, client_wins, merge
        created_at TEXT DEFAULT (datetime('now'))
    )`,

    // --- 8. INTELIGÊNCIA AGRÍCOLA ---
    `CREATE TABLE IF NOT EXISTS v2_clima_historico (
        id TEXT PRIMARY KEY,
        fazenda_id TEXT,
        data TEXT,
        temp_min REAL,
        temp_max REAL,
        precipitacao REAL,
        condicao TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(fazenda_id) REFERENCES v2_fazendas(id)
    )`,
    `CREATE TABLE IF NOT EXISTS v2_alertas_pragas (
        id TEXT PRIMARY KEY,
        talhao_id TEXT,
        praga_nome TEXT,
        severidade TEXT,
        recomendacao TEXT,
        ativa INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(talhao_id) REFERENCES v2_talhoes(id)
    )`,

    // --- 9. FASE V3: INTELIGÊNCIA E SOLO ---
    `CREATE TABLE IF NOT EXISTS v2_analise_solo (
        id TEXT PRIMARY KEY,
        talhao_id TEXT,
        data_analise TEXT,
        laboratorio TEXT,
        ph REAL,
        materia_organica REAL,
        fosforo REAL,
        potassio REAL,
        calcio REAL,
        magnesio REAL,
        aluminio REAL,
        ctc REAL,
        saturacao_bases REAL,
        observacoes TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(talhao_id) REFERENCES v2_talhoes(id)
    )`,
    `CREATE TABLE IF NOT EXISTS v2_recomendacoes_tecnicas (
        id TEXT PRIMARY KEY,
        talhao_id TEXT,
        tipo TEXT, -- Fertilização, Calagem, Defensivo
        status TEXT DEFAULT 'Pendente', -- Aplicada, Ignorada, Pendente
        titulo TEXT,
        descricao TEXT,
        dose_sugerida TEXT,
        produto_sugerido TEXT,
        baseado_em TEXT, -- Análise de Solo ID, Clima, Histórico
        created_at TEXT DEFAULT (datetime('now')),
        sync_status TEXT DEFAULT 'pending',
        FOREIGN KEY(talhao_id) REFERENCES v2_talhoes(id)
    )`
];

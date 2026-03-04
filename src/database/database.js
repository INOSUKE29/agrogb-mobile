// database.js - Gestão Rápida com Enforcamento de MAIÚSCULAS e Suporte a Usuários
import * as SQLite from 'expo-sqlite';

let db;

// Função auxiliar para promissificar o executeSql
export const executeQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('❌ Banco de dados não inicializado');
            reject(new Error('Banco não inicializado'));
            return;
        }
        db.transaction(tx => {
            tx.executeSql(
                sql,
                params,
                (_, result) => resolve(result),
                (_, error) => {
                    // Silenciando o RedBox do React Native p/ erros triviais de Schema (Duplicate Column)
                    if (__DEV__) {
                        console.log('⚠️ Aviso SQL Interno:', sql, error.message);
                    }
                    reject(error);
                }
            );
        });
    });
};

export const initDB = async () => {
    try {
        db = SQLite.openDatabase('agrogb_mobile.db');
        console.log('✅ Banco de dados aberto (SDK 50)');
        await createTables();
        return db;
    } catch (error) {
        console.error('❌ Erro ao abrir banco:', error);
        throw error;
    }
};

const createTables = async () => {
    try {
        const queries = [
            `CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                nivel TEXT DEFAULT 'USUARIO',
                last_updated TEXT
            );`,
            `CREATE TABLE IF NOT EXISTS colheitas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                cultura TEXT NOT NULL,
                produto TEXT NOT NULL,
                quantidade REAL NOT NULL,
                data TEXT NOT NULL,
                observacao TEXT,
                last_updated TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0
            );`,
            `CREATE TABLE IF NOT EXISTS monitoramento (
                uuid TEXT PRIMARY KEY,
                cultura TEXT,
                data TEXT,
                imagem_base64 TEXT,
                observacao TEXT,
                sync_status INTEGER DEFAULT 0,
                last_updated TEXT NOT NULL
            );`,
            `CREATE TABLE IF NOT EXISTS vendas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                cliente TEXT NOT NULL,
                produto TEXT NOT NULL,
                quantidade REAL NOT NULL,
                valor REAL NOT NULL,
                data TEXT NOT NULL,
                observacao TEXT,
                last_updated TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0
            );`,
            `CREATE TABLE IF NOT EXISTS config (
                chave TEXT PRIMARY KEY,
                valor TEXT
            );`,
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
                last_updated TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0
            );`,
            `CREATE TABLE IF NOT EXISTS plantio (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                cultura TEXT NOT NULL,
                quantidade_pes INTEGER NOT NULL,
                tipo_plantio TEXT,
                data TEXT NOT NULL,
                observacao TEXT,
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
                last_updated TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0
            );`,
            `CREATE TABLE IF NOT EXISTS descarte (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                produto TEXT NOT NULL,
                quantidade_kg REAL NOT NULL,
                motivo TEXT,
                data TEXT NOT NULL,
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
                last_updated TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0
            );`,
            `CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                nome TEXT NOT NULL,
                telefone TEXT,
                endereco TEXT,
                cpf_cnpj TEXT,
                observacao TEXT,
                last_updated TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0
            );`,
            `CREATE TABLE IF NOT EXISTS culturas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                nome TEXT NOT NULL,
                observacao TEXT,
                last_updated TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0
            );`,
            `CREATE TABLE IF NOT EXISTS maquinas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                nome TEXT NOT NULL,
                tipo TEXT NOT NULL,
                placa TEXT,
                horimetro_atual REAL DEFAULT 0,
                intervalo_revisao REAL DEFAULT 10000,
                status TEXT DEFAULT 'OK',
                last_updated TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0
            );`,
            `CREATE TABLE IF NOT EXISTS manutencao_frota (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                maquina_uuid TEXT NOT NULL,
                data TEXT NOT NULL,
                descricao TEXT NOT NULL,
                valor REAL NOT NULL,
                last_updated TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0
            );`,
            `CREATE TABLE IF NOT EXISTS receitas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                produto_pai_uuid TEXT NOT NULL,
                item_filho_uuid TEXT NOT NULL,
                quantidade REAL NOT NULL,
                last_updated TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0,
                FOREIGN KEY(produto_pai_uuid) REFERENCES cadastro(uuid) ON DELETE CASCADE,
                FOREIGN KEY(item_filho_uuid) REFERENCES cadastro(uuid) ON DELETE CASCADE
            );`
        ];

        for (const query of queries) {
            await executeQuery(query);
        }

        // Inserir Admin padrão se não existir (Paridade com Desktop)
        await executeQuery(`INSERT OR IGNORE INTO usuarios (usuario, senha, nivel) VALUES ('ADMIN', '1234', 'ADM')`);

        // MIGRATION: Adicionar email se não existir (v3.5)
        try {
            await executeQuery('ALTER TABLE usuarios ADD COLUMN email TEXT');
            console.log('✅ Coluna email adicionada com sucesso');
        } catch (e) { }


        // MIGRATION: Cadastro (v4.0)
        try {
            await executeQuery('ALTER TABLE cadastro ADD COLUMN estocavel INTEGER DEFAULT 1');
            await executeQuery('ALTER TABLE cadastro ADD COLUMN vendavel INTEGER DEFAULT 1');
            console.log('✅ Colunas estocavel/vendavel adicionadas');
        } catch (e) { }

        // MIGRATION: Perfil de Usuário (v4.1)
        try {
            await executeQuery('ALTER TABLE usuarios ADD COLUMN nome_completo TEXT');
            await executeQuery('ALTER TABLE usuarios ADD COLUMN telefone TEXT');
            await executeQuery('ALTER TABLE usuarios ADD COLUMN endereco TEXT');
            console.log('✅ Colunas de perfil adicionadas');
        } catch (e) { }

        // MIGRATION: Colheita Congelado (v4.1)
        try {
            await executeQuery('ALTER TABLE colheitas ADD COLUMN congelado REAL DEFAULT 0');
            console.log('✅ Coluna congelado adicionada');
        } catch (e) { }

        // MIGRATION: Avatar Profile (v6.1)
        try {
            await executeQuery('ALTER TABLE usuarios ADD COLUMN avatar TEXT');
            console.log('✅ Coluna avatar adicionada');
        } catch (e) { }

        // MIGRATION: Cadastro Fator Conversão (v4.2)
        try {
            await executeQuery('ALTER TABLE cadastro ADD COLUMN fator_conversao REAL DEFAULT 1');
            console.log('✅ Coluna fator_conversao adicionada');
        } catch (e) { }

        // MIGRATION: Compras Detalhes (v4.0)
        try {
            await executeQuery('ALTER TABLE compras ADD COLUMN detalhes TEXT');
            console.log('✅ Coluna detalhes adicionada em compras');
        } catch (e) { }

        // MIGRATION: Auth Providers (v5.2)
        try {
            await executeQuery('ALTER TABLE usuarios ADD COLUMN provider TEXT DEFAULT "local"');
            await executeQuery('ALTER TABLE usuarios ADD COLUMN avatar_url TEXT');
            console.log('✅ Colunas de Auth Provider adicionadas');
        } catch (e) { }

        // MIGRATION: App Settings (FASE 10)
        try {
            await executeQuery(`
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
            `);
            await executeQuery(`INSERT OR IGNORE INTO app_settings (id, updated_at) VALUES (1, ?)`, [new Date().toISOString()]);
            console.log('✅ Tabela app_settings verificada/criada com sucesso');
        } catch (e) { console.error('❌ Erro app_settings', e); }

        // MIGRATION: Adubação (v5.4)
        try {
            await executeQuery(`CREATE TABLE IF NOT EXISTS planos_adubacao (
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
                sync_status INTEGER DEFAULT 0
            )`);
            console.log('✅ Tabela planos_adubacao criada/verificada');
        } catch (e) { console.error('Erro table planos_adubacao:', e); }

        // MIGRATION: Adubação (v5.4)
        try {
            await executeQuery(`CREATE TABLE IF NOT EXISTS planos_adubacao (
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
                sync_status INTEGER DEFAULT 0
            )`);
            console.log('✅ Tabela planos_adubacao criada/verificada');
        } catch (e) { console.error('Erro table planos_adubacao:', e); }

        // --- ARQUITETURA PROFISSIONAL MONITORAMENTO v6.0 ---

        // 1. MONITORAMENTO (Núcleo)
        try {
            // Se já existir a tabela antiga, podemos renomear ou apenas criar a nova se não existir.
            // Para garantir a estrutura nova, vamos criar 'monitoramento_v6' ou alterar a estrutura.
            // Dada a mudança radical, vou criar tabelas novas limpas para esta arquitetura e
            // o app usará elas.

            await executeQuery(`CREATE TABLE IF NOT EXISTS monitoramento_entidade (
                uuid TEXT PRIMARY KEY,
                usuario_id TEXT,
                area_id TEXT,
                cultura_id TEXT,
                data TEXT NOT NULL,
                observacao_usuario TEXT,
                status TEXT DEFAULT 'RASCUNHO', -- RASCUNHO / CONFIRMADO
                nivel_confianca TEXT DEFAULT 'TÉCNICO', -- INFORMATIVO / TÉCNICO / VALIDADO
                criado_em TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0,
                last_updated TEXT NOT NULL
            )`);
        } catch (e) { console.error('Erro table monitoramento_entidade', e); }

        // 2. MONITORAMENTO MÍDIA
        try {
            await executeQuery(`CREATE TABLE IF NOT EXISTS monitoramento_media (
                uuid TEXT PRIMARY KEY,
                monitoramento_uuid TEXT NOT NULL,
                tipo TEXT NOT NULL, -- IMAGEM / PDF / TEXTO
                caminho_arquivo TEXT NOT NULL,
                criado_em TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0,
                last_updated TEXT NOT NULL,
                FOREIGN KEY(monitoramento_uuid) REFERENCES monitoramento_entidade(uuid)
            )`);
        } catch (e) { console.error('Erro table monitoramento_media', e); }

        // 3. ANÁLISE IA (Resultados)
        try {
            await executeQuery(`CREATE TABLE IF NOT EXISTS analise_ia (
                uuid TEXT PRIMARY KEY,
                monitoramento_uuid TEXT NOT NULL,
                classificacao_principal TEXT,
                classificacoes_secundarias TEXT,
                sintomas TEXT,
                causa_provavel TEXT,
                tipo_problema TEXT, -- DOENCA / PRAGA / DEFICIENCIA / MANEJO
                nutriente TEXT,
                sugestao_controle TEXT,
                produtos_citados TEXT,
                dosagem TEXT,
                forma_aplicacao TEXT,
                observacoes_tecnicas TEXT,
                fonte_informacao TEXT,
                criado_em TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0,
                last_updated TEXT NOT NULL,
                FOREIGN KEY(monitoramento_uuid) REFERENCES monitoramento_entidade(uuid)
            )`);
        } catch (e) { console.error('Erro table analise_ia', e); }

        // 4. BASE DE CONHECIMENTO (Refinada)
        try {
            await executeQuery(`CREATE TABLE IF NOT EXISTS base_conhecimento_pro (
                uuid TEXT PRIMARY KEY,
                tipo TEXT NOT NULL,
                cultura_id TEXT,
                titulo TEXT NOT NULL,
                descricao TEXT,
                sintomas TEXT,
                causas TEXT,
                controle TEXT,
                fonte TEXT,
                nivel_confianca TEXT,
                ativo INTEGER DEFAULT 1,
                last_updated TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0
            )`);

            // Seed Inicial Pro
            const count = await executeQuery('SELECT COUNT(*) as c FROM base_conhecimento_pro');
            if (count.rows.item(0).c === 0) {
                await seedKnowledgeBasePro();
            }

        } catch (e) { console.error('Erro table base_conhecimento_pro', e); }

        // MIGRATION: Cadastro V7.0 (Campos Agrícolas Avançados)
        try {
            const newCols = [
                'principio_ativo TEXT',
                'classe_toxicologica TEXT',
                'composicao TEXT',
                'preco_venda REAL DEFAULT 0',
                'descricao_ia TEXT',         // V7.0: IA Cache
                'validado_por TEXT',         // V7.0: Validação
                'data_validacao TEXT'        // V7.0: Data Val
            ];
            for (const col of newCols) {
                try { await executeQuery(`ALTER TABLE cadastro ADD COLUMN ${col}`); } catch (e) { }
            }
            console.log('✅ Colunas V7.0 (Cadastro Agrícola & IA) verificadas.');
        } catch (e) { }

        // MIGRATION: V7.0 - Tabelas de Mídia e Auditoria
        try {
            await executeQuery(`CREATE TABLE IF NOT EXISTS cadastro_midia (
                uuid TEXT PRIMARY KEY,
                produto_uuid TEXT NOT NULL,
                tipo TEXT NOT NULL,        -- 'FOTO_PRODUTO' ou 'ROTULO_BULA'
                caminho_local TEXT,        -- Path no dispositivo
                url_remota TEXT,           -- URL no Cloud/Storage
                ocr_texto_bruto TEXT,      -- Texto extraído via OCR desta imagem
                criado_em TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0,
                FOREIGN KEY(produto_uuid) REFERENCES cadastro(uuid)
            )`);

            await executeQuery(`CREATE TABLE IF NOT EXISTS auditoria_cadastro (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                produto_uuid TEXT NOT NULL,
                campo_alterado TEXT NOT NULL,
                valor_antigo TEXT,
                valor_novo TEXT,
                alterado_por TEXT NOT NULL,
                data_alteracao TEXT NOT NULL
            )`);
            console.log('✅ Tabelas V7.0 (Mídia e Auditoria) criadas/verificadas');
        } catch (e) { console.error('Erro migração V7.0', e); }


        // MIGRATION: Soft Delete Flag
        const tablesToCheck = ['usuarios', 'colheitas', 'monitoramento', 'vendas', 'estoque', 'compras', 'plantio', 'custos', 'descarte', 'cadastro', 'clientes', 'culturas', 'maquinas', 'manutencao_frota', 'receitas', 'planos_adubacao'];
        for (const table of tablesToCheck) {
            try { await executeQuery(`ALTER TABLE ${table} ADD COLUMN is_deleted INTEGER DEFAULT 0`); } catch (e) { }
        }

        // MIGRATION: Coluna Anexo para Notas Fiscais e Recibos
        const tablesWithAttachments = ['compras', 'vendas', 'colheitas', 'custos'];
        for (const table of tablesWithAttachments) {
            try { await executeQuery(`ALTER TABLE ${table} ADD COLUMN anexo TEXT`); } catch (e) { }
        }
        console.log('✅ Colunas de Anexo migradas');

        console.log('✅ Soft delete migrado');

        console.log('✅ Arquitetura Monitoramento v6.0 Implementada');

        // MIGRATION: V8.0 - Módulo de Centro de Custos Profissional
        try {
            await executeQuery(`CREATE TABLE IF NOT EXISTS cost_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT,
                is_default INTEGER DEFAULT 0,
                is_deleted INTEGER DEFAULT 0,
                created_at TEXT
            )`);

            await executeQuery(`CREATE TABLE IF NOT EXISTS costs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                culture_id INTEGER,
                fleet_id INTEGER,
                quantity REAL,
                unit_value REAL,
                total_value REAL,
                notes TEXT,
                created_at TEXT,
                is_deleted INTEGER DEFAULT 0,
                FOREIGN KEY(category_id) REFERENCES cost_categories(id)
            )`);

            // Seed das categorias padrão
            const countCat = await executeQuery('SELECT COUNT(*) as c FROM cost_categories');
            if (countCat.rows.item(0).c === 0) {
                const defaultCategories = [
                    { name: 'Mão de Obra', type: 'variavel' },
                    { name: 'Combustível', type: 'variavel' },
                    { name: 'Manutenção', type: 'variavel' },
                    { name: 'Insumos', type: 'variavel' },
                    { name: 'Energia', type: 'fixa' },
                    { name: 'Frete', type: 'variavel' },
                    { name: 'Outros', type: 'variavel' }
                ];
                for (const cat of defaultCategories) {
                    await executeQuery(
                        `INSERT INTO cost_categories (name, type, is_default, created_at) VALUES (?, ?, ?, ?)`,
                        [cat.name, cat.type, 1, new Date().toISOString()]
                    );
                }
                console.log('✅ Categorias de Custos base criadas via Seed');
            }
            console.log('✅ Módulo de Custos Profissional (V8.0) criado/verificado');
        } catch (e) {
            console.log('❌ Erro migração V8.0 (Custos):', e.message || e);
        }

        // MIGRATION: V8.1 - Notas Manuais Caderno Agrícola
        try {
            await executeQuery(`CREATE TABLE IF NOT EXISTS caderno_notas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                observacao TEXT NOT NULL,
                data TEXT NOT NULL,
                last_updated TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0,
                is_deleted INTEGER DEFAULT 0
            )`);
            console.log('✅ Tabela caderno_notas verificada/criada');
        } catch (e) { }

        // MIGRATION: V9.0 - Financeiro (Contas a Receber)
        try {
            await executeQuery('ALTER TABLE vendas ADD COLUMN status_pagamento TEXT DEFAULT "A_RECEBER"');
            await executeQuery('ALTER TABLE vendas ADD COLUMN data_recebimento TEXT');
            await executeQuery('ALTER TABLE vendas ADD COLUMN forma_pagamento TEXT');
            console.log('✅ Colunas de status_pagamento adicionadas na tabela vendas');
        } catch (e) { }

        // MIGRATION: V9.0 - Financeiro (Categorias de Despesa e Custos)
        try {
            await executeQuery(`CREATE TABLE IF NOT EXISTS categorias_despesa (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                tipo TEXT,
                created_at TEXT
            )`);
            console.log('✅ Tabela categorias_despesa verificada/criada');
        } catch (e) { }

        try {
            await executeQuery('ALTER TABLE custos ADD COLUMN categoria_id TEXT');
            console.log('✅ Coluna categoria_id adicionada na tabela custos');
        } catch (e) { }

        // FASE 1: DEDUPLICAR CLIENTES EXISTENTES NO INÍCIO DO APP
        await deduplicateClientes();

    } catch (error) {
        console.error('❌ Erro ao criar tabelas:', error);
    }
};

export const deduplicateClientes = async () => {
    try {
        console.log('🧹 Iniciando deduplicação de clientes...');
        const res = await executeQuery('SELECT * FROM clientes WHERE is_deleted = 0 ORDER BY id ASC');
        const clientes = [];
        for (let i = 0; i < res.rows.length; i++) clientes.push(res.rows.item(i));

        const map = new Map();
        for (const c of clientes) {
            const key = c.cpf_cnpj ? c.cpf_cnpj.trim() : c.nome.trim().toUpperCase();
            if (map.has(key)) {
                console.log(`🗑️ Removendo cliente duplicado: ${c.nome} (ID: ${c.id})`);
                await executeQuery('UPDATE clientes SET is_deleted = 1, sync_status = 0 WHERE id = ?', [c.id]);
            } else {
                map.set(key, c);
            }
        }
        console.log('✅ Deduplicação de clientes concluída.');
    } catch (e) {
        console.error('❌ Erro na deduplicação de clientes:', e);
    }
};

// --- SEED PRO ---
const seedKnowledgeBasePro = async () => {
    try {
        const seeds = [
            // SOJA
            { tipo: 'DOENCA', titulo: 'Ferrugem Asiática da Soja', sintomas: 'Pontos esverdeados na face inferior da folha que evoluem para castanho-claro (urédias). Desfolha prematura.', causas: 'Fungo Phakopsora pachyrhizi', controle: 'Monitoramento constante e aplicação de fungicidas sistêmicos (triaróis/estrobilurinas).', fonte: 'Embrapa Soja', conf: 'VALIDADO' },
            { tipo: 'PRAGA', titulo: 'Percevejo-marrom', sintomas: 'Danos nas vagens e grãos, causando "chochamento" e retenção foliar.', causas: 'Euschistus heros', controle: 'Inseticidas químicos (neonicotinoides) e controle biológico (Telenomus podisi).', fonte: 'Embrapa', conf: 'VALIDADO' },
            { tipo: 'DOENCA', titulo: 'Antracnose (Soja)', sintomas: 'Manchas negras nas nervuras das folhas, hastes e vagens. Vagens contorcidas.', causas: 'Colletotrichum truncatum', controle: 'Uso de sementes sadias, tratamento de sementes e rotação de culturas.', fonte: 'Manual Fitossanitário', conf: 'VALIDADO' },
            { tipo: 'PRAGA', titulo: 'Lagarta-da-soja', sintomas: 'Desfolha intensa, deixando apenas as nervuras. Ocorre no estágio vegetativo e reprodutivo.', causas: 'Anticarsia gemmatalis', controle: 'Baculovírus e inseticidas seletivos.', fonte: 'Embrapa', conf: 'VALIDADO' },

            // MILHO
            { tipo: 'PRAGA', titulo: 'Lagarta-do-cartucho', sintomas: 'Folhas raspadas e perfuradas, cartucho destruído com presença de excrementos.', causas: 'Spodoptera frugiperda', controle: 'Milho Bt, Tratamento de sementes e inseticidas específicos.', fonte: 'Embrapa Milho', conf: 'VALIDADO' },
            { tipo: 'PRAGA', titulo: 'Cigarrinha-do-milho', sintomas: 'Vetor de molicutes (enfezamentos). Plantas com internódios curtos e espigas improdutivas.', causas: 'Dalbulus maidis', controle: 'Tratamento de sementes (Neonicotinoides), monitoramento e eliminação do milho tiguera.', fonte: 'Embrapa', conf: 'VALIDADO' },
            { tipo: 'DOENCA', titulo: 'Helmintosporiose', sintomas: 'Manchas necróticas elípticas (formato de charuto) nas folhas.', causas: 'Exserohilum turcicum', controle: 'Híbridos resistentes e fungicidas.', fonte: 'Rehagro', conf: 'VALIDADO' },

            // CAFÉ
            { tipo: 'PRAGA', titulo: 'Broca-do-café', sintomas: 'Frutos perfurados na região da coroa. Queda de frutos e perda de peso/qualidade.', causas: 'Hypothenemus hampei', controle: 'Colheita bem feita (repasse), iscas alcoólicas e Beauveria bassiana.', fonte: 'EPAMIG', conf: 'VALIDADO' },
            { tipo: 'DOENCA', titulo: 'Ferrugem do Cafeeiro', sintomas: 'Manchas alaranjadas pulverulentas na face inferior das folhas.', causas: 'Hemileia vastatrix', controle: 'Fungicidas cúpricos ou sistêmicos via solo/foliar.', fonte: 'Embrapa Café', conf: 'VALIDADO' },
            { tipo: 'PRAGA', titulo: 'Bicho-mineiro', sintomas: 'Larvas minam as folhas causando áreas necrosadas e desfolha.', causas: 'Leucoptera coffeella', controle: 'Inseticidas sistêmicos e preservação de inimigos naturais (vespas).', fonte: 'Manual Café', conf: 'VALIDADO' },

            // GERAL
            { tipo: 'DOENCA', titulo: 'Mofo Branco', sintomas: 'Micélio branco cotonoso em hastes e vagens. Formação de escleródios pretos.', causas: 'Sclerotinia sclerotiorum', controle: 'Rotação de culturas, cobertura do solo (palhada) e fungicidas específicos.', fonte: 'Embrapa', conf: 'VALIDADO' },
            { tipo: 'PRAGA', titulo: 'Mosca-branca', sintomas: 'Sucção de seiva, fumagina e transmissão de viroses (Mosaico Dourado).', causas: 'Bemisia tabaci', controle: 'Manejo integrado, rotação de inseticidas e eliminação de hospedeiros.', fonte: 'Embrapa', conf: 'VALIDADO' },
            { tipo: 'PRAGA', titulo: 'Ácaro-rajado', sintomas: 'Pontos cloróticos nas folhas, presença de teias na face inferior.', causas: 'Tetranychus urticae', controle: 'Acaricidas específicos.', fonte: 'Manual', conf: 'VALIDADO' },
            { tipo: 'DEFICIENCIA', titulo: 'Deficiência de Nitrogênio', sintomas: 'Amarelecimento generalizado das folhas velhas (clorose) em forma de V invertido (no milho).', causas: 'Baixa disponibilidade no solo', controle: 'Adubação nitrogenada de cobertura (Ureia).', fonte: 'Manual de Adubação', conf: 'VALIDADO' },
            { tipo: 'DEFICIENCIA', titulo: 'Deficiência de Potássio', sintomas: 'Clorose e necrose nas bordas das folhas velhas ("queima das pontas").', causas: 'Solo pobre em K', controle: 'Adubação potássica (Cloreto de Potássio).', fonte: 'Manual de Adubação', conf: 'VALIDADO' }
        ];

        // Limpar tabela antes de seedar (para garantir dados novos no dev)
        // await executeQuery('DELETE FROM base_conhecimento_pro'); 
        // Comentado para não zerar produção sem querer, mas para MVP dev é útil.
        // Vamos usar INSERT OR IGNORE baseado no titulo se possível, mas uuid é unico.
        // Melhor estratégia para seed dev: verificar count.

        const count = await executeQuery('SELECT COUNT(*) as c FROM base_conhecimento_pro');
        if (count.rows.item(0).c < 5) { // Se tiver pouco, reinicia/completa
            for (const s of seeds) {
                await executeQuery(
                    `INSERT INTO base_conhecimento_pro (uuid, tipo, titulo, sintomas, causas, controle, fonte, nivel_confianca, last_updated) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [require('uuid').v4(), s.tipo, s.titulo, s.sintomas, s.causas, s.controle, s.fonte, s.conf, new Date().toISOString()]
                );
            }
            console.log('✅ Base de Conhecimento Seedada com sucesso!');
        }
    } catch (e) { console.error('Seed Error:', e); }
};

// ... (helpers)

// --- PLANOS DE ADUBAÇÃO (v5.4) ---

export const insertPlanoAdubacao = async (d) => {
    await executeQuery(
        `INSERT INTO planos_adubacao (uuid, nome_plano, cultura, tipo_aplicacao, area_local, descricao_tecnica, status, data_criacao, data_aplicacao, anexos_uri, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [d.uuid, up(d.nome_plano), up(d.cultura), up(d.tipo_aplicacao), up(d.area_local), d.descricao_tecnica, up(d.status), d.data_criacao, d.data_aplicacao, d.anexos_uri, new Date().toISOString(), 0]
    );
};

export const updatePlanoAdubacao = async (uuid, d) => {
    await executeQuery(
        `UPDATE planos_adubacao SET nome_plano = ?, cultura = ?, tipo_aplicacao = ?, area_local = ?, descricao_tecnica = ?, status = ?, data_aplicacao = ?, anexos_uri = ?, last_updated = ?, sync_status = 0 WHERE uuid = ?`,
        [up(d.nome_plano), up(d.cultura), up(d.tipo_aplicacao), up(d.area_local), d.descricao_tecnica, up(d.status), d.data_aplicacao, d.anexos_uri, new Date().toISOString(), uuid]
    );
};

export const getPlanosAdubacao = async () => {
    const res = await executeQuery('SELECT * FROM planos_adubacao ORDER BY data_criacao DESC');
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const deletePlanoAdubacao = async (uuid) => {
    await executeQuery('DELETE FROM planos_adubacao WHERE uuid = ?', [uuid]);
};

// --- HELPER PARA MAIÚSCULAS ---
const up = (text) => text ? text.toString().toUpperCase().trim() : '';

// --- CONFIG ---
export const setConfig = async (chave, valor) => {
    try { await executeQuery('INSERT OR REPLACE INTO config (chave, valor) VALUES (?, ?)', [chave, valor]); } catch (e) { }
};

export const getConfig = async (chave) => {
    try {
        const result = await executeQuery('SELECT valor FROM config WHERE chave = ?', [chave]);
        return result.rows.length > 0 ? result.rows.item(0).valor : null;
    } catch (e) { return null; }
};

// --- USUÁRIOS ---
export const insertUsuario = async (u) => {
    await executeQuery(`INSERT INTO usuarios (usuario, senha, nivel, email, nome_completo, telefone, endereco, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [up(u.usuario), u.senha, up(u.nivel), u.email ? u.email.trim() : null, up(u.nome_completo), u.telefone, up(u.endereco), new Date().toISOString()]);
};

export const updateUsuario = async (u) => {
    await executeQuery(`UPDATE usuarios SET senha = ?, nivel = ?, email = ?, nome_completo = ?, telefone = ?, endereco = ?, last_updated = ? WHERE id = ?`,
        [u.senha, up(u.nivel), u.email ? u.email.trim() : null, up(u.nome_completo), u.telefone, up(u.endereco), new Date().toISOString(), u.id]);
};

export const getUsuarios = async () => {
    const res = await executeQuery('SELECT * FROM usuarios WHERE is_deleted = 0 ORDER BY usuario ASC');
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const deleteUsuario = async (id) => {
    await executeQuery('UPDATE usuarios SET is_deleted = 1 WHERE id = ?', [id]);
};

// --- OPERAÇÕES (TODAS COM up()) ---

export const insertColheita = async (c) => {
    await executeQuery(
        `INSERT INTO colheitas (uuid, cultura, produto, quantidade, congelado, data, observacao, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.uuid, up(c.cultura), up(c.produto), c.quantidade, c.congelado || 0, c.data, up(c.observacao), new Date().toISOString(), 0]
    );
    await atualizarEstoque(c.produto, c.quantidade, c.data);
};

export const updateColheita = async (uuid, dados) => {
    // Primeiro desfazer o estoque da quantidade antiga é complexo sem ler antes, 
    // mas para simplificar vamos assumir que a UI lida ou o usuário ajusta estoque se errar muito.
    // O ideal seria ler, subtrair, adicionar novo.
    const ant = await executeQuery('SELECT * FROM colheitas WHERE uuid = ?', [uuid]);
    if (ant.rows.length > 0) {
        const old = ant.rows.item(0);
        await atualizarEstoque(old.produto, -old.quantidade, old.data); // Reverte com data original
    }

    await executeQuery(
        `UPDATE colheitas SET cultura = ?, produto = ?, quantidade = ?, congelado = ?, data = ?, observacao = ?, last_updated = ?, sync_status = 0 WHERE uuid = ?`,
        [up(dados.cultura), up(dados.produto), dados.quantidade, dados.congelado || 0, dados.data, up(dados.observacao), new Date().toISOString(), uuid]
    );
    await atualizarEstoque(dados.produto, dados.quantidade, dados.data); // Aplica novo com data nova
};

export const deleteColheita = async (uuid) => {
    const ant = await executeQuery('SELECT * FROM colheitas WHERE uuid = ?', [uuid]);
    if (ant.rows.length > 0) {
        const old = ant.rows.item(0);
        await atualizarEstoque(old.produto, -old.quantidade); // Reverte estoque
    }
    await executeQuery('UPDATE colheitas SET is_deleted = 1, sync_status = 0 WHERE uuid = ?', [uuid]);
};

export const getColheitasRecentes = async () => {
    const res = await executeQuery('SELECT * FROM colheitas WHERE is_deleted = 0 ORDER BY data DESC, id DESC LIMIT 50');
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const insertVenda = async (v) => {
    await executeQuery(
        `INSERT INTO vendas (uuid, cliente, produto, quantidade, valor, data, observacao, status_pagamento, data_recebimento, forma_pagamento, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [v.uuid, up(v.cliente), up(v.produto), v.quantidade, v.valor, v.data, up(v.observacao), v.status_pagamento || 'A_RECEBER', v.data_recebimento || null, v.forma_pagamento || null, new Date().toISOString(), 0]
    );

    // LÓGICA V4.1: BAIXA DE ESTOQUE POR RECEITA
    try {
        // 1. Descobrir UUID do produto vendido pelo Nome
        const prodRes = await executeQuery('SELECT uuid FROM cadastro WHERE nome = ?', [up(v.produto)]);
        if (prodRes.rows.length > 0) {
            const paiUuid = prodRes.rows.item(0).uuid;

            // 2. Verificar se tem Receita
            const receitaRes = await executeQuery('SELECT * FROM receitas WHERE produto_pai_uuid = ?', [paiUuid]);

            if (receitaRes.rows.length > 0) {
                // TEM RECEITA: Baixar componentes
                console.log(`📦 Produto ${v.produto} tem receita. Baixando ingredientes...`);
                for (let i = 0; i < receitaRes.rows.length; i++) {
                    const ingrediente = receitaRes.rows.item(i);
                    const qtdIngrediente = ingrediente.quantidade * v.quantidade; // Qtd Receita * Qtd Venda

                    // Descobrir nome do filho para baixar estoque
                    const filhoRes = await executeQuery('SELECT nome FROM cadastro WHERE uuid = ?', [ingrediente.item_filho_uuid]);
                    if (filhoRes.rows.length > 0) {
                        const nomeFilho = filhoRes.rows.item(0).nome;
                        await atualizarEstoque(nomeFilho, -qtdIngrediente, v.data);
                        console.log(`   - Baixado: ${qtdIngrediente} de ${nomeFilho}`);
                    }
                }
            } else {
                // SEM RECEITA: Baixa o produto direto (Comportamento Clássico)
                await atualizarEstoque(v.produto, -v.quantidade, v.data);
            }
        } else {
            // Produto não cadastrado (Avulso): Baixa direto pelo nome
            await atualizarEstoque(v.produto, -v.quantidade, v.data);
        }
    } catch (e) {
        console.error("Erro na baixa de estoque receita:", e);
        // Fallback: tenta baixar o principal se der erro
        await atualizarEstoque(v.produto, -v.quantidade, v.data);
    }
};

export const updateVenda = async (uuid, v) => {
    const ant = await executeQuery('SELECT * FROM vendas WHERE uuid = ?', [uuid]);
    if (ant.rows.length > 0) {
        const old = ant.rows.item(0);
        await atualizarEstoque(old.produto, old.quantidade); // Devolve ao estoque (reverte saída)
    }

    await executeQuery(
        `UPDATE vendas SET cliente = ?, produto = ?, quantidade = ?, valor = ?, data = ?, observacao = ?, status_pagamento = ?, data_recebimento = ?, forma_pagamento = ?, last_updated = ?, sync_status = 0 WHERE uuid = ?`,
        [up(v.cliente), up(v.produto), v.quantidade, v.valor, v.data, up(v.observacao), v.status_pagamento || 'A_RECEBER', v.data_recebimento || null, v.forma_pagamento || null, new Date().toISOString(), uuid]
    );
    await atualizarEstoque(v.produto, -v.quantidade); // Tira do estoque novamente com nova qtd
};

export const marcarVendaRecebida = async (uuid) => {
    await executeQuery(
        `UPDATE vendas SET status_pagamento = 'RECEBIDO', data_recebimento = ?, sync_status = 0, last_updated = ? WHERE uuid = ?`,
        [new Date().toISOString(), new Date().toISOString(), uuid]
    );
};

export const deleteVenda = async (uuid) => {
    const ant = await executeQuery('SELECT * FROM vendas WHERE uuid = ?', [uuid]);
    if (ant.rows.length > 0) {
        const old = ant.rows.item(0);
        await atualizarEstoque(old.produto, old.quantidade); // Devolve ao estoque
    }
    await executeQuery('UPDATE vendas SET is_deleted = 1, sync_status = 0 WHERE uuid = ?', [uuid]);
};

export const getVendasRecentes = async () => {
    const res = await executeQuery('SELECT * FROM vendas WHERE is_deleted = 0 ORDER BY data DESC, id DESC LIMIT 50');
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const insertCompra = async (d) => {
    await executeQuery(`INSERT INTO compras (uuid, item, quantidade, valor, cultura, data, observacao, detalhes, last_updated, sync_status, anexo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [d.uuid, up(d.item), d.quantidade, d.valor, up(d.cultura), d.data, up(d.observacao), up(d.detalhes), new Date().toISOString(), 0, d.anexo || null]);
    await atualizarEstoque(d.item, d.quantidade);
};

export const updateCompra = async (uuid, d) => {
    const ant = await executeQuery('SELECT * FROM compras WHERE uuid = ?', [uuid]);
    if (ant.rows.length > 0) {
        const old = ant.rows.item(0);
        await atualizarEstoque(old.item, -old.quantidade); // Reverte entrada (tira do estoque)
    }

    await executeQuery(`UPDATE compras SET item = ?, quantidade = ?, valor = ?, cultura = ?, data = ?, observacao = ?, detalhes = ?, last_updated = ?, sync_status = 0, anexo = ? WHERE uuid = ?`,
        [up(d.item), d.quantidade, d.valor, up(d.cultura), d.data, up(d.observacao), up(d.detalhes), new Date().toISOString(), d.anexo || null, uuid]);
    await atualizarEstoque(d.item, d.quantidade); // Adiciona nova qtd
};

export const deleteCompra = async (uuid) => {
    const ant = await executeQuery('SELECT * FROM compras WHERE uuid = ?', [uuid]);
    if (ant.rows.length > 0) {
        const old = ant.rows.item(0);
        await atualizarEstoque(old.item, -old.quantidade); // Reverte entrada
    }
    await executeQuery('UPDATE compras SET is_deleted = 1, sync_status = 0 WHERE uuid = ?', [uuid]);
};

export const getComprasRecentes = async () => {
    const res = await executeQuery('SELECT * FROM compras WHERE is_deleted = 0 ORDER BY data DESC, id DESC LIMIT 50');
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const insertPlantio = async (d) => {
    await executeQuery(`INSERT INTO plantio (uuid, cultura, quantidade_pes, tipo_plantio, data, observacao, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [d.uuid, up(d.cultura), d.quantidade_pes, up(d.tipo_plantio), d.data, up(d.observacao), new Date().toISOString(), 0]);
};

export const insertCusto = async (d) => {
    await executeQuery(`INSERT INTO custos (uuid, produto, tipo, quantidade, valor_total, data, observacao, categoria_id, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [d.uuid, up(d.produto), up(d.tipo), d.quantidade, d.valor_total, d.data, up(d.observacao), d.categoria_id || null, new Date().toISOString(), 0]);
};

export const insertDescarte = async (d) => {
    await executeQuery(`INSERT INTO descarte (uuid, produto, quantidade_kg, motivo, data, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [d.uuid, up(d.produto), d.quantidade_kg, up(d.motivo), d.data, new Date().toISOString(), 0]);
    await atualizarEstoque(d.produto, -d.quantidade_kg);
};

// --- CADASTROS ---

export const insertCultura = async (d) => {
    await executeQuery(`INSERT INTO culturas (uuid, nome, observacao, last_updated, sync_status) VALUES (?, ?, ?, ?, ?)`,
        [d.uuid, up(d.nome), up(d.observacao), new Date().toISOString(), 0]);
};

export const getCulturas = async () => {
    const res = await executeQuery('SELECT * FROM culturas WHERE is_deleted = 0 ORDER BY nome ASC');
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const deleteCultura = async (id) => { await executeQuery('UPDATE culturas SET is_deleted = 1, sync_status = 0 WHERE id = ?', [id]); };

export const insertCliente = async (d) => {
    const nomeUp = up(d.nome);
    const cpf = d.cpf_cnpj ? d.cpf_cnpj.trim() : null;

    // FASE 2: Prevenção
    let queryCheck = 'SELECT id FROM clientes WHERE is_deleted = 0 AND (nome = ?';
    let paramsCheck = [nomeUp];

    if (cpf) {
        queryCheck += ' OR cpf_cnpj = ?';
        paramsCheck.push(cpf);
    }
    queryCheck += ')';

    const checkDuplicate = await executeQuery(queryCheck, paramsCheck);

    if (checkDuplicate.rows.length > 0) {
        throw new Error('Cliente já cadastrado com este Nome ou CPF/CNPJ.');
    }

    await executeQuery(`INSERT INTO clientes (uuid, nome, telefone, endereco, cpf_cnpj, observacao, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [d.uuid, nomeUp, d.telefone, up(d.endereco), d.cpf_cnpj, up(d.observacao), new Date().toISOString(), 0]);
};

export const getClientes = async () => {
    const res = await executeQuery('SELECT * FROM clientes WHERE is_deleted = 0 ORDER BY nome ASC');
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const deleteCliente = async (id) => { await executeQuery('UPDATE clientes SET is_deleted = 1, sync_status = 0 WHERE id = ?', [id]); };

export const insertCadastro = async (d) => {
    await executeQuery(`INSERT INTO cadastro (
        uuid, nome, unidade, tipo, observacao, estocavel, vendavel, fator_conversao, 
        principio_ativo, classe_toxicologica, composicao, preco_venda,
        last_updated, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            d.uuid, up(d.nome), up(d.unidade), up(d.tipo), up(d.observacao),
            d.estocavel !== undefined ? d.estocavel : 1,
            d.vendavel !== undefined ? d.vendavel : 1,
            d.fator_conversao || 1,
            up(d.principio_ativo), up(d.classe_toxicologica), up(d.composicao), d.preco_venda || 0,
            new Date().toISOString(), 0
        ]);
};

export const updateCadastro = async (d) => {
    await executeQuery(`UPDATE cadastro SET 
        nome = ?, unidade = ?, tipo = ?, observacao = ?, estocavel = ?, vendavel = ?, fator_conversao = ?, 
        principio_ativo = ?, classe_toxicologica = ?, composicao = ?, preco_venda = ?,
        last_updated = ?, sync_status = 0 
        WHERE uuid = ?`,
        [
            up(d.nome), up(d.unidade), up(d.tipo), up(d.observacao), d.estocavel, d.vendavel, d.fator_conversao,
            up(d.principio_ativo), up(d.classe_toxicologica), up(d.composicao), d.preco_venda,
            new Date().toISOString(), d.uuid
        ]);
};

export const getCadastro = async () => {
    const res = await executeQuery('SELECT * FROM cadastro WHERE is_deleted = 0 ORDER BY nome ASC');
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const deleteCadastro = async (id) => { await executeQuery('UPDATE cadastro SET is_deleted = 1, sync_status = 0 WHERE id = ?', [id]); };

// --- RECEITAS (v4.1) ---

export const insertReceita = async (paiUuid, filhoUuid, qtd) => {
    await executeQuery(
        `INSERT INTO receitas (produto_pai_uuid, item_filho_uuid, quantidade, last_updated, sync_status) VALUES (?, ?, ?, ?, ?)`,
        [paiUuid, filhoUuid, qtd, new Date().toISOString(), 0]
    );
};

export const getReceita = async (paiUuid) => {
    const res = await executeQuery(
        `SELECT r.*, c.nome as nome_filho, c.unidade as unidade_filho 
         FROM receitas r 
         JOIN cadastro c ON r.item_filho_uuid = c.uuid 
         WHERE r.produto_pai_uuid = ?`,
        [paiUuid]
    );
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const deleteItemReceita = async (id) => {
    await executeQuery('DELETE FROM receitas WHERE id = ?', [id]);
};

// --- ESTOQUE & SYNC ---

// --- ESTOQUE & SYNC ---

// V5.0: Logica de Estoque Seguro e Histórico
// Regra 1: Estoque (snapshot atual) nunca negativo.
// Regra 2: Movimentações históricas (antes de 2026) não afetam estoque atual.
const APP_START_DATE = '2026-01-01'; // Data de Corte

export const atualizarEstoque = async (produto, quantidadeDelta, dataReferencia = null) => {
    try {
        // REGRA DE HISTÓRICO: Se a data for antiga, não mexe no estoque atual
        if (dataReferencia) {
            if (new Date(dataReferencia) < new Date(APP_START_DATE)) {
                console.log(`📜 Registro histórico (${dataReferencia}): Estoque inalterado.`);
                return;
            }
        }

        const prodUp = up(produto);
        const result = await executeQuery('SELECT * FROM estoque WHERE produto = ?', [prodUp]);
        const timestamp = new Date().toISOString();

        if (result.rows.length > 0) {
            const current = result.rows.item(0);
            let novaQuantidade = current.quantidade + quantidadeDelta;

            // REGRA DE NEGATIVO: Se for ficar negativo, zera.
            if (novaQuantidade < 0) {
                console.warn(`⚠️ Estoque insuficiente de ${produto}. Ajustando de ${current.quantidade} para 0.`);
                novaQuantidade = 0;
            }

            await executeQuery('UPDATE estoque SET quantidade = ?, last_updated = ? WHERE produto = ?', [novaQuantidade, timestamp, prodUp]);
        } else {
            // Se não existe e delta é negativo, começa com 0 (não cria negativo)
            const inicial = quantidadeDelta < 0 ? 0 : quantidadeDelta;
            await executeQuery('INSERT INTO estoque (produto, quantidade, last_updated) VALUES (?, ?, ?)', [prodUp, inicial, timestamp]);
        }
    } catch (e) { console.error('Erro Estoque:', e); }
};

export const getEstoque = async () => {
    // JOIN com cadastro para pegar unidade e tipo
    const res = await executeQuery(`
        SELECT e.*, c.unidade, c.tipo, c.fator_conversao 
        FROM estoque e
        LEFT JOIN cadastro c ON UPPER(e.produto) = UPPER(c.nome)
        WHERE e.is_deleted = 0
        ORDER BY e.quantidade ASC
    `);
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

// --- CUSTOS PROFISSIONAIS (MÓDULO V8.0) ---

export const getCostCategories = async () => {
    const res = await executeQuery('SELECT * FROM cost_categories WHERE is_deleted = 0 ORDER BY name ASC');
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const insertCostCategory = async (name, type) => {
    await executeQuery(
        `INSERT INTO cost_categories (name, type, created_at) VALUES (?, ?, ?)`,
        [up(name), type, new Date().toISOString()]
    );
};

export const getCosts = async () => {
    const res = await executeQuery(`
        SELECT c.*, cat.name as category_name 
        FROM costs c
        LEFT JOIN cost_categories cat ON c.category_id = cat.id
        WHERE c.is_deleted = 0
        ORDER BY c.created_at DESC
    `);
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const insertCost = async (c) => {
    const total = (parseFloat(c.quantity) || 0) * (parseFloat(c.unit_value) || 0);
    await executeQuery(
        `INSERT INTO costs (category_id, culture_id, fleet_id, quantity, unit_value, total_value, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.category_id, c.culture_id || null, c.fleet_id || null, parseFloat(c.quantity) || 0, parseFloat(c.unit_value) || 0, total, up(c.notes), c.created_at || new Date().toISOString()]
    );
};

export const deleteCost = async (id) => {
    await executeQuery('UPDATE costs SET is_deleted = 1 WHERE id = ?', [id]);
};

export const getDadosPendentes = async () => {
    try {
        const t = ['colheitas', 'vendas', 'compras', 'plantio', 'custos', 'descarte', 'clientes', 'culturas', 'cadastro', 'caderno_notas'];
        let total = 0;
        const res = {};
        for (const tab of t) {
            const data = await executeQuery(`SELECT * FROM ${tab} WHERE sync_status = 0 AND is_deleted = 0`);
            const rows = [];
            for (let i = 0; i < data.rows.length; i++) rows.push(data.rows.item(i));
            res[tab] = rows;
            total += rows.length;
        }
        res.total = total;
        return res;
    } catch (e) { return { total: 0 }; }
};

// --- CADERNO NOTAS ---
export const insertCadernoNota = async (n) => {
    await executeQuery(
        `INSERT INTO caderno_notas (uuid, observacao, data, last_updated, sync_status, is_deleted) VALUES (?, ?, ?, ?, ?, ?)`,
        [require('uuid').v4(), up(n.observacao), n.data, new Date().toISOString(), 0, 0]
    );
};

// --- FROTA (NOVO MÓDULO) ---

export const insertMaquina = async (m) => {
    await executeQuery(
        `INSERT INTO maquinas (uuid, nome, tipo, placa, horimetro_atual, intervalo_revisao, status, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.uuid, up(m.nome), up(m.tipo), up(m.placa), m.horimetro_atual, m.intervalo_revisao, 'OK', new Date().toISOString(), 0]
    );
};

export const getMaquinas = async () => {
    const res = await executeQuery('SELECT * FROM maquinas WHERE is_deleted = 0 ORDER BY nome ASC');
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const updateMaquina = async (uuid, horimetro, placa) => {
    // Recalcula status
    // Simples: se horimetro > revisao -> Alerta (logica simplificada aqui, melhor na UI ou recalculo total)
    // Por enquanto apenas atualiza dados
    await executeQuery('UPDATE maquinas SET horimetro_atual = ?, placa = ?, last_updated = ? WHERE uuid = ?',
        [horimetro, up(placa), new Date().toISOString(), uuid]);
};

export const updateMaquinaRevisao = async (uuid, horimetro, intervalo) => {
    await executeQuery('UPDATE maquinas SET horimetro_atual = ?, intervalo_revisao = ?, last_updated = ? WHERE uuid = ?',
        [horimetro, intervalo, new Date().toISOString(), uuid]);
};

export const deleteMaquina = async (uuid) => {
    await executeQuery('UPDATE maquinas SET is_deleted = 1, sync_status = 0 WHERE uuid = ?', [uuid]);
};

export const insertManutencaoFrota = async (d) => {
    await executeQuery(
        `INSERT INTO manutencao_frota (uuid, maquina_uuid, data, descricao, valor, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [d.uuid, d.maquina_uuid, d.data, up(d.descricao), d.valor, new Date().toISOString(), 0]
    );
};

export const getHistoricoManutencoes = async (maquinaUuid) => {
    const res = await executeQuery('SELECT * FROM manutencao_frota WHERE maquina_uuid = ? ORDER BY data DESC', [maquinaUuid]);
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

// --- BASE DE CONHECIMENTO (v5.5) ---
export const getConhecimento = async (termo = '') => {
    let sql = 'SELECT * FROM base_conhecimento';
    const params = [];
    if (termo) {
        sql += ' WHERE nome LIKE ? OR sintomas LIKE ?';
        params.push(`%${termo.toUpperCase()}%`, `%${termo.toUpperCase()}%`);
    }
    sql += ' ORDER BY nome ASC';
    const res = await executeQuery(sql, params);
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

// --- MONITORAMENTO AVANÇADO (v5.5) ---
export const insertMonitoramentoCompleto = async (d) => {
    await executeQuery(
        `INSERT INTO monitoramento (
            uuid, cultura, area_uuid, plantio_uuid, data, imagem_base64, 
            observacao, diagnostico_tipo, diagnostico_nome, 
            severidade, acao_recomendada, sync_status, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            d.uuid, up(d.cultura), d.area_uuid, d.plantio_uuid, d.data, d.imagem_base64,
            up(d.observacao), up(d.diagnostico_tipo), up(d.diagnostico_nome),
            up(d.severidade), up(d.acao_recomendada), 0, new Date().toISOString()
        ]
    );
};

// --- DASHBOARD HELPERS (v3.9.2) ---
export const getDashboardStats = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Colheita Hoje (KG)
        const resColheita = await executeQuery(`SELECT SUM(quantidade) as total FROM colheitas WHERE data = ? AND is_deleted = 0`, [today]);
        const colheitaHoje = resColheita.rows.item(0).total || 0;

        // 2. Vendas Hoje (R$)
        const resVendas = await executeQuery(`SELECT SUM(valor) as total FROM vendas WHERE data = ? AND is_deleted = 0`, [today]);
        const vendasHoje = resVendas.rows.item(0).total || 0;

        // 3. Plantio Ativo (Total de registros não colhidos? Simplificado: Total Plantio Recente)
        const resPlantio = await executeQuery(`SELECT COUNT(*) as total FROM plantio WHERE is_deleted = 0`);
        const plantioAtivo = resPlantio.rows.item(0).total || 0;

        // 4. Máquinas Revisão (Alerta)
        const resMaquinas = await executeQuery(`SELECT COUNT(*) as total FROM maquinas WHERE horimetro_atual >= intervalo_revisao AND is_deleted = 0`);
        const maquinasAlert = resMaquinas.rows.item(0).total || 0;

        // 5. Saldo Geral (AGORA: Resultado do Ano/Período Atual)
        // Ignora histórico incompleto antes de APP_START_DATE
        const resRec = await executeQuery('SELECT SUM(valor * quantidade) as total FROM vendas WHERE data >= ? AND is_deleted = 0', [APP_START_DATE]);
        const resDesp = await executeQuery('SELECT SUM(valor) as total FROM compras WHERE data >= ? AND is_deleted = 0', [APP_START_DATE]);
        const resCust = await executeQuery('SELECT SUM(valor_total) as total FROM custos WHERE data >= ? AND is_deleted = 0', [APP_START_DATE]);
        const saldo = (resRec.rows.item(0).total || 0) - ((resDesp.rows.item(0).total || 0) + (resCust.rows.item(0).total || 0));

        // 6. Pendentes Sync
        const pendentes = (await getDadosPendentes()).total;

        return { colheitaHoje, vendasHoje, plantioAtivo, maquinasAlert, saldo, pendentes };
    } catch (e) {
        console.error('Dashboard Stats Error:', e);
        return { colheitaHoje: 0, vendasHoje: 0, plantioAtivo: 0, maquinasAlert: 0, saldo: 0, pendentes: 0 };
    }
};

// ==========================================
// FUNÇÕES AUXILIARES - APP SETTINGS (FASE 10)
// ==========================================
export const getAppSettings = async () => {
    try {
        const res = await executeQuery('SELECT * FROM app_settings WHERE id = 1');
        if (res.rows.length > 0) {
            return res.rows.item(0);
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar app_settings:', error);
        throw error;
    }
};

export const updateAppSetting = async (column, value) => {
    try {
        const validColumns = [
            'primary_color', 'theme_mode', 'fazenda_nome', 'fazenda_produtor', 'fazenda_documento',
            'fazenda_telefone', 'fazenda_email', 'fazenda_logo', 'fin_moeda', 'fin_mes_fiscal',
            'fin_calc_margem', 'fin_vinc_custo', 'fin_meta_lucro', 'clima_api_key', 'clima_cidade',
            'clima_gps', 'clima_ativo', 'rel_incluir_logo', 'rel_modelo', 'img_qualidade', 'img_limite'
        ];

        if (!validColumns.includes(column)) throw new Error('Coluna de configuração inválida');

        await executeQuery(`UPDATE app_settings SET ${column} = ?, updated_at = ? WHERE id = 1`, [value, new Date().toISOString()]);
        return true;
    } catch (error) {
        console.error(`Erro ao atualizar app_setting [${column}]:`, error);
        throw error;
    }
};

// --- CATEGORIAS DE DESPESA (v9.0) ---

export const getCategoriasDespesa = async () => {
    const res = await executeQuery('SELECT * FROM categorias_despesa ORDER BY nome ASC');
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const insertCategoriaDespesa = async (d) => {
    await executeQuery(`INSERT INTO categorias_despesa (id, nome, tipo, created_at) VALUES (?, ?, ?, ?)`,
        [d.id, up(d.nome), up(d.tipo), new Date().toISOString()]);
};

export const deleteCategoriaDespesa = async (id) => {
    await executeQuery('DELETE FROM categorias_despesa WHERE id = ?', [id]);
};

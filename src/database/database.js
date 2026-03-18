import * as SQLite from 'expo-sqlite';
import { atualizarEstoque } from '../services/EstoqueService';



const __DEV__ = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
let db;

// Função auxiliar para promissificar o executeSql
export const executeQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        if (!db) {
            if (__DEV__) console.error('❌ Banco de dados não inicializado');
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
        if (__DEV__) console.log('✅ Banco de dados aberto (SDK 50)');
        await createTables();
        return db;
    } catch (error) {
        console.error('[DATABASE ERROR] Erro ao abrir banco:', error);
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
            `CREATE TABLE IF NOT EXISTS colheitas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                area_id TEXT,
                usuario_id TEXT,
                cultura TEXT NOT NULL,
                produto TEXT NOT NULL,
                quantidade REAL NOT NULL,
                data_colheita TEXT,
                data TEXT NOT NULL,
                observacao TEXT,
                anexo TEXT,
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
                usuario_id TEXT,
                cliente_id TEXT, -- ID do cliente (uuid ou string)
                cliente TEXT NOT NULL,
                produto_id TEXT, -- ID do produto (uuid ou string)
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
                detalhes TEXT,
                anexo TEXT,
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
                anexo TEXT,
                categoria_id TEXT,
                created_at TEXT,
                last_updated TEXT NOT NULL,
                is_deleted INTEGER DEFAULT 0,
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
            `CREATE TABLE IF NOT EXISTS movimentacoes_financeiras (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE,
                tipo TEXT, -- RECEITA / DESPESA
                valor REAL,
                data TEXT,
                descricao TEXT,
                created_at TEXT,
                last_updated TEXT,
                is_deleted INTEGER DEFAULT 0,
                sync_status INTEGER DEFAULT 0
            );`
        ];

        // Executar todas as queries de criação iniciais em sequência para evitar "database is locked"
        for (const query of queries) {
            try {
                await executeQuery(query);
            } catch (error) {
                if (__DEV__) console.log("Aviso ao criar tabela: ", error.message);
            }
        }

        // Inserir Admin padrão se não existir (Paridade com Desktop)
        await executeQuery(`INSERT OR IGNORE INTO usuarios (usuario, senha, nivel) VALUES ('ADMIN', '1234', 'ADM')`);

        // MIGRATION: Adicionar email se não existir (v3.5)
        try {
            await executeQuery('ALTER TABLE usuarios ADD COLUMN email TEXT');
            if (__DEV__) console.log('✅ Coluna email adicionada com sucesso');
        } catch { }


        // MIGRATION: Cadastro (v4.0)
        try {
            await executeQuery('ALTER TABLE cadastro ADD COLUMN estocavel INTEGER DEFAULT 1');
            await executeQuery('ALTER TABLE cadastro ADD COLUMN vendavel INTEGER DEFAULT 1');
            if (__DEV__) console.log('✅ Colunas estocavel/vendavel adicionadas');
        } catch { }

        // MIGRATION: Perfil de Usuário (v4.1)
        try {
            await executeQuery('ALTER TABLE usuarios ADD COLUMN nome_completo TEXT');
            await executeQuery('ALTER TABLE usuarios ADD COLUMN telefone TEXT');
            await executeQuery('ALTER TABLE usuarios ADD COLUMN endereco TEXT');
            if (__DEV__) console.log('✅ Colunas de perfil adicionadas');
        } catch { }

        // MIGRATION: Colheita Congelado (v4.1)
        try {
            await executeQuery('ALTER TABLE colheitas ADD COLUMN congelado REAL DEFAULT 0');
            if (__DEV__) console.log('✅ Coluna congelado adicionada');
        } catch { }

        // MIGRATION: Avatar Profile (v6.1)
        try {
            await executeQuery('ALTER TABLE usuarios ADD COLUMN avatar TEXT');
            if (__DEV__) console.log('✅ Coluna avatar adicionada');
        } catch { }

        // MIGRATION: Cadastro Fator Conversão (v4.2)
        try {
            await executeQuery('ALTER TABLE cadastro ADD COLUMN fator_conversao REAL DEFAULT 1');
            console.log('✅ Coluna fator_conversao adicionada');
        } catch { }

        // MIGRATION: Monitoramento Severidade & Categoria (v21.0)
        try {
            await executeQuery('ALTER TABLE monitoramento_entidade ADD COLUMN severidade TEXT DEFAULT "BAIXA"');
            await executeQuery('ALTER TABLE monitoramento_entidade ADD COLUMN categoria TEXT DEFAULT "OUTROS"');
            if (__DEV__) console.log('✅ Monitoramento v21 Schema atualizado');
        } catch { }
        try {
            await executeQuery('ALTER TABLE cadastro ADD COLUMN fator_conversao REAL DEFAULT 1');
            console.log('✅ Coluna fator_conversao adicionada');
        } catch { }

        // MIGRATION: Compras Detalhes (v4.0)
        try {
            await executeQuery('ALTER TABLE compras ADD COLUMN detalhes TEXT');
            if (__DEV__) console.log('✅ Coluna detalhes adicionada em compras');
        } catch { }

        // MIGRATION: Auth Providers (v5.2)
        try {
            await executeQuery('ALTER TABLE usuarios ADD COLUMN provider TEXT DEFAULT "local"');
            await executeQuery('ALTER TABLE usuarios ADD COLUMN avatar_url TEXT');
            if (__DEV__) console.log('✅ Colunas de Auth Provider adicionadas');
        } catch { }

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
            if (__DEV__) console.log('✅ Tabela app_settings verificada/criada com sucesso');
        } catch (e) { if (__DEV__) console.error('❌ Erro app_settings', e); }

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
                severidade TEXT DEFAULT 'BAIXA', -- BAIXA / MEDIA / ALTA
                categoria TEXT DEFAULT 'OUTROS', -- PRAGA / DOENCA / NUTRICAO / CLIMA / OUTROS
                criado_em TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0,
                last_updated TEXT NOT NULL
            )`);
        } catch (e) { if (__DEV__) console.error('Erro table monitoramento_entidade', e); }

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
        } catch (e) { if (__DEV__) console.error('Erro table monitoramento_media', e); }

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
        } catch (e) { if (__DEV__) console.error('Erro table analise_ia', e); }

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
                try { await executeQuery(`ALTER TABLE cadastro ADD COLUMN ${col}`); } catch { }
            }
            if (__DEV__) console.log('✅ Colunas V7.0 (Cadastro Agrícola & IA) verificadas.');
        } catch { }

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
            if (__DEV__) console.log('✅ Tabelas V7.0 (Mídia e Auditoria) criadas/verificadas');
        } catch (e) { if (__DEV__) console.error('Erro migração V7.0', e); }


        // MIGRATION: Soft Delete Flag
        const tablesToCheck = ['usuarios', 'colheitas', 'monitoramento', 'vendas', 'estoque', 'compras', 'plantio', 'custos', 'descarte', 'cadastro', 'clientes', 'culturas', 'maquinas', 'manutencao_frota', 'receitas', 'planos_adubacao'];
        for (const table of tablesToCheck) {
            try { await executeQuery(`ALTER TABLE ${table} ADD COLUMN is_deleted INTEGER DEFAULT 0`); } catch { }
        }

        // MIGRATION: Coluna Anexo para Notas Fiscais e Recibos
        const tablesWithAttachments = ['compras', 'vendas', 'colheitas', 'custos'];
        for (const table of tablesWithAttachments) {
            try { await executeQuery(`ALTER TABLE ${table} ADD COLUMN anexo TEXT`); } catch { }
        }
        if (__DEV__) console.log('✅ Colunas de Anexo migradas');

        if (__DEV__) console.log('✅ Soft delete migrado');

        if (__DEV__) console.log('✅ Arquitetura Monitoramento v6.0 Implementada');

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
                if (__DEV__) console.log('✅ Categorias de Custos base criadas via Seed');
            }
            if (__DEV__) console.log('✅ Módulo de Custos Profissional (V8.0) criado/verificado');
        } catch (e) {
            if (__DEV__) console.log('❌ Erro migração V8.0 (Custos):', e?.message || e);
        }

        // MIGRATION: V8.1 - Notas Manuais Caderno Agrícola
        try {
            await executeQuery(`CREATE TABLE IF NOT EXISTS areas (
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
            );`);
            if (__DEV__) console.log('✅ Tabela areas verificada/criada');
        } catch (e) { if (__DEV__) console.error('Erro table areas:', e); }

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
            if (__DEV__) console.log('✅ Tabela caderno_notas verificada/criada');
        } catch { }

        // MIGRATION: V9.0 - Financeiro (Contas a Receber)
        try {
            await executeQuery('ALTER TABLE vendas ADD COLUMN status_pagamento TEXT DEFAULT "A_RECEBER"');
            await executeQuery('ALTER TABLE vendas ADD COLUMN data_recebimento TEXT');
            await executeQuery('ALTER TABLE vendas ADD COLUMN forma_pagamento TEXT');
            if (__DEV__) console.log('✅ Colunas de status_pagamento adicionadas na tabela vendas');
        } catch { }

        // MIGRATION: V9.0 - Financeiro (Categorias de Despesa e Custos)
        try {
            await executeQuery(`CREATE TABLE IF NOT EXISTS categorias_despesa (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                tipo TEXT,
                created_at TEXT
            )`);
            if (__DEV__) console.log('✅ Tabela categorias_despesa verificada/criada');
        } catch { }

        try {
            await executeQuery('ALTER TABLE custos ADD COLUMN categoria_id TEXT');
            if (__DEV__) console.log('✅ Coluna categoria_id adicionada na tabela custos');
        } catch { }

        // MIGRATION: V9.1 - Logs de Auditoria e Erro (Fase 19)
        try {
            await executeQuery(`CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL,
                usuario TEXT,
                acao TEXT NOT NULL,
                entidade TEXT,
                descricao TEXT,
                sync_status INTEGER DEFAULT 0
            )`);
            await executeQuery(`CREATE TABLE IF NOT EXISTS error_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE,
                usuario_id TEXT,
                data TEXT NOT NULL,
                created_at TEXT,
                tela TEXT,
                erro TEXT,
                stack TEXT,
                sync_status INTEGER DEFAULT 0
            )`);
            if (__DEV__) console.log('✅ Tabelas activity_log e error_logs verificadas/criadas');
        } catch { }

        // FASE 1: DEDUPLICAR CLIENTES EXISTENTES NO INÍCIO DO APP
        await deduplicateClientes();

        // =============================================
        // MIGRATION: v8.1 — Unidades de Medida
        // =============================================
        try {
            await executeQuery(`CREATE TABLE IF NOT EXISTS unidades_medida (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                sigla TEXT NOT NULL UNIQUE
            )`);
            const countUn = await executeQuery('SELECT COUNT(*) as c FROM unidades_medida');
            if (countUn.rows.item(0).c === 0) {
                const defaultUnits = [
                    ['Quilograma', 'KG'], ['Caixa', 'CX'], ['Unidade', 'UNI'],
                    ['Metro', 'M'], ['Litro', 'LT'], ['Saco', 'SC'], ['Bandeja', 'BDJ'],
                    ['Hectare', 'HA'], ['Cambuca', 'CBC']
                ];
                for (const [nome, sigla] of defaultUnits) {
                    await executeQuery('INSERT OR IGNORE INTO unidades_medida (nome, sigla) VALUES (?, ?)', [nome, sigla]);
                }
                if (__DEV__) console.log('✅ Seed unidades_medida concluído');
            } else {
                // MIGRATION: Adicionar ha, cbc e M se os outros já existirem
                await executeQuery('INSERT OR IGNORE INTO unidades_medida (nome, sigla) VALUES (?, ?)', ['Hectare', 'HA']);
                await executeQuery('INSERT OR IGNORE INTO unidades_medida (nome, sigla) VALUES (?, ?)', ['Cambuca', 'CBC']);
                await executeQuery('INSERT OR IGNORE INTO unidades_medida (nome, sigla) VALUES (?, ?)', ['Metro', 'M']);
            }
            if (__DEV__) console.log('✅ Tabela unidades_medida verificada/criada');
        } catch (e) { if (__DEV__) console.error('Erro unidades_medida:', e); }

        // MIGRATION: v8.1 — unidade_id na tabela cadastro
        try {
            await executeQuery('ALTER TABLE cadastro ADD COLUMN unidade_id INTEGER REFERENCES unidades_medida(id)');
            if (__DEV__) console.log('✅ Coluna unidade_id adicionada em cadastro');
        } catch { }

        // MIGRATION: v8.1 — peso_medio_caixa na tabela culturas
        try {
            await executeQuery('ALTER TABLE culturas ADD COLUMN peso_medio_caixa REAL DEFAULT 1');
            if (__DEV__) console.log('✅ Coluna peso_medio_caixa adicionada em culturas');
        } catch { }

        // MIGRATION: v8.1 — valor_recebido na tabela vendas
        try {
            await executeQuery('ALTER TABLE vendas ADD COLUMN valor_recebido REAL');
            if (__DEV__) console.log('✅ Coluna valor_recebido adicionada em vendas');
        } catch { }

        // MIGRATION: v8.1 — Movimentação de Estoque Profissional
        try {
            await executeQuery(`CREATE TABLE IF NOT EXISTS movimentacao_estoque (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                produto_id TEXT NOT NULL,
                tipo TEXT NOT NULL,
                quantidade REAL NOT NULL,
                origem TEXT,
                data TEXT NOT NULL,
                observacao TEXT,
                last_updated TEXT NOT NULL,
                sync_status INTEGER DEFAULT 0
            )`);
            if (__DEV__) console.log('✅ Tabela movimentacao_estoque verificada/criada');
        } catch (e) { if (__DEV__) console.error('Erro movimentacao_estoque:', e); }

        // MIGRATION: v8.5 — Configurações Unificadas (Fase 23)
        try {
            const configCols = [
                'fazenda_area REAL',
                'fazenda_safra TEXT',
                'unidade_padrao TEXT DEFAULT "KG"',
                'rel_graficos INTEGER DEFAULT 1',
                'rel_auto_pdf INTEGER DEFAULT 0',
                'rel_rodape TEXT'
            ];
            for (const col of configCols) {
                try { await executeQuery(`ALTER TABLE app_settings ADD COLUMN ${col}`); } catch { }
            }
        } catch { }

        // MIGRATION: v8.6 — codigo na tabela cadastro
        try { await executeQuery('ALTER TABLE cadastro ADD COLUMN codigo TEXT'); } catch { }

        // MIGRATION: v8.6 — cidade e estado na tabela clientes
        try { await executeQuery('ALTER TABLE clientes ADD COLUMN cidade TEXT'); } catch { }
        try { await executeQuery('ALTER TABLE clientes ADD COLUMN estado TEXT'); } catch { }
        
        // MIGRATION: v8.8 — Profissionalização de Logs de Erro
        try { await executeQuery('ALTER TABLE error_logs ADD COLUMN usuario_id TEXT'); } catch { }
        try { await executeQuery('ALTER TABLE error_logs ADD COLUMN created_at TEXT'); } catch { }

        // MIGRATION: v8.7 — Padronização Universal de IDENTIFICADORES (Fim do Erro 42703)
        const tablesToFix = ['usuarios', 'estoque', 'app_settings', 'activity_log', 'error_logs', 'unidades_medida'];
        for (const table of tablesToFix) {
            try {
                await executeQuery(`ALTER TABLE ${table} ADD COLUMN uuid TEXT`);
                if (__DEV__) console.log(`📏 Coluna uuid adicionada à tabela ${table}`);
            } catch { }
        }

        // Tenta povoar uuids vazios para compatibilidade
        try {
            const uuid = require('uuid');
            for (const table of tablesToFix) {
                const pendentes = await executeQuery(`SELECT id FROM ${table} WHERE uuid IS NULL OR uuid = ''`);
                for (let i = 0; i < pendentes.rows.length; i++) {
                    const id = pendentes.rows.item(i).id;
                    await executeQuery(`UPDATE ${table} SET uuid = ? WHERE id = ?`, [uuid.v4(), id]);
                }
            }
            // MIGRATION: v8.6.0 — Paridade v8.5.6 Supabase
            // =============================================
            if (__DEV__) console.log('🔄 Iniciando Migração v8.6.0 (Paridade Supabase v8.5.6)...');

            // Colheitas
            try { await executeQuery('ALTER TABLE colheitas ADD COLUMN area_id TEXT'); } catch { }
            try { await executeQuery('ALTER TABLE colheitas ADD COLUMN usuario_id TEXT'); } catch { }
            try { await executeQuery('ALTER TABLE colheitas ADD COLUMN data_colheita TEXT'); } catch { }
            try { await executeQuery('ALTER TABLE colheitas ADD COLUMN anexo TEXT'); } catch { }

            // Vendas
            try { await executeQuery('ALTER TABLE vendas ADD COLUMN usuario_id TEXT'); } catch { }

            // Áreas
            try { await executeQuery('ALTER TABLE areas ADD COLUMN metragem REAL'); } catch { }
            try { await executeQuery('ALTER TABLE areas ADD COLUMN peso_medio_caixa REAL DEFAULT 1'); } catch { }

            // Clientes
            try { await executeQuery('ALTER TABLE clientes ADD COLUMN cidade TEXT'); } catch { }
            try { await executeQuery('ALTER TABLE clientes ADD COLUMN estado TEXT'); } catch { }
            try { await executeQuery('ALTER TABLE clientes ADD COLUMN observacao_legada TEXT'); } catch { }

            // Cadastro (Mapeado como items no remoto)
            try { await executeQuery('ALTER TABLE cadastro ADD COLUMN unidade_id INTEGER'); } catch { }

            // Reseta contadores e erros para re-sincronizar se necessário
            const syncTablesFinal = [
                'usuarios', 'colheitas', 'vendas', 'estoque', 'compras', 'plantio', 'custos',
                'clientes', 'culturas', 'maquinas', 'receitas', 'profiles',
                'movimentacoes_financeiras', 'caderno_notas', 'areas', 'cadastro'
            ];
            for (const tr of syncTablesFinal) {
                try { await executeQuery(`UPDATE ${tr} SET sync_status = 0 WHERE sync_status = 2`); } catch { }
            }

            console.log('✅ Migração v8.6.0 Concluída.');

        } catch { }

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
    } catch (e) { console.error('[SYNC ERROR]', e); }
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

// --- v8.1 EXPORTS ---

export const getUnidades = async () => {
    const res = await executeQuery('SELECT * FROM unidades_medida ORDER BY nome ASC');
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

export const insertMovimentacao = async (m) => {
    await executeQuery(
        `INSERT INTO movimentacao_estoque (uuid, produto_id, tipo, quantidade, origem, data, observacao, last_updated, sync_status) VALUES (?,?,?,?,?,?,?,?,0)`,
        [m.uuid, m.produto_id, m.tipo, m.quantidade, m.origem || null, m.data, m.observacao || null, new Date().toISOString()]
    );
};

export const getSaldoEstoque = async (produto_id) => {
    const res = await executeQuery(
        `SELECT COALESCE(SUM(CASE WHEN tipo IN ('ENTRADA') THEN quantidade WHEN tipo IN ('SAIDA','VENDA','CONSUMO','DESCARTE') THEN -quantidade ELSE 0 END),0) AS saldo FROM movimentacao_estoque WHERE produto_id = ?`,
        [produto_id]
    );
    return res.rows.item(0).saldo || 0;
};

// marcarVendaRecebida migrou para VendaService.js

// --- HELPER PARA MAIÚSCULAS ---
const up = (text) => text ? text.toString().toUpperCase().trim() : '';

// --- LOGGING / AUDITORIA (Fase 19) ---
export const logActivity = async (acao, entidade, descricao, usuario = 'SISTEMA') => {
    try {
        await executeQuery(`INSERT INTO activity_log (data, usuario, acao, entidade, descricao, sync_status) VALUES (?, ?, ?, ?, ?, 0)`,
            [new Date().toISOString(), up(usuario), up(acao), up(entidade), up(descricao)]);
    } catch (e) { console.log('Erro ao registrar log:', e); }
};

export const logError = async (tela, erroMsg, stack = '') => {
    try {
        await executeQuery(`INSERT INTO error_logs (data, tela, erro, stack, sync_status) VALUES (?, ?, ?, ?, 0)`,
            [new Date().toISOString(), up(tela), erroMsg, stack]);
    } catch (e) { console.log('Erro ao registrar erro interno:', e); }
};


// --- CONFIG ---
export const setConfig = async (chave, valor) => {
    try { await executeQuery('INSERT OR REPLACE INTO config (chave, valor) VALUES (?, ?)', [chave, valor]); } catch { }
};

export const getConfig = async (chave) => {
    try {
        const result = await executeQuery('SELECT valor FROM config WHERE chave = ?', [chave]);
        return result.rows.length > 0 ? result.rows.item(0).valor : null;
    } catch { return null; }
};

// --- USUÁRIOS ---
export const insertUsuario = async (u) => {
    const uuid = require('uuid').v4();
    await executeQuery(`INSERT INTO usuarios (uuid, usuario, senha, nivel, email, nome_completo, telefone, endereco, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [uuid, up(u.usuario), u.senha, up(u.nivel), u.email ? u.email.trim() : null, up(u.nome_completo), u.telefone, up(u.endereco), new Date().toISOString()]);
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

// Lógicas de Vendas (insert, update, delete, get) migraram para VendaService.js
// Lógicas de Colheita migraram para ColheitaService.js

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

// Lógicas de Ajuste Inicial de Estoque migraram para EstoqueService.js

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
    } catch { return { total: 0 }; }
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
        const firstDayOfMonth = today.substring(0, 8) + '01'; // ex: '2023-10-01'

        // 1. Colheita Hoje (KG)
        const resColheita = await executeQuery(`SELECT SUM(quantidade) as total FROM colheitas WHERE data = ? AND is_deleted = 0`, [today]);
        const colheitaHoje = resColheita.rows.item(0).total || 0;

        // 2. Vendas Hoje (R$)
        const resVendas = await executeQuery(`SELECT SUM(valor) as total FROM vendas WHERE data = ? AND is_deleted = 0`, [today]);
        const vendasHoje = resVendas.rows.item(0).total || 0;

        // 3. Plantio Ativo
        const resPlantio = await executeQuery(`SELECT COUNT(*) as total FROM plantio WHERE is_deleted = 0`);
        const plantioAtivo = resPlantio.rows.item(0).total || 0;

        // 4. Máquinas Revisão
        const resMaquinas = await executeQuery(`SELECT COUNT(*) as total FROM maquinas WHERE horimetro_atual >= intervalo_revisao AND is_deleted = 0`);
        const maquinasAlert = resMaquinas.rows.item(0).total || 0;

        // 5. Custos do Mês (Soma de custos, compras e costs profissional)
        const resCustosMes = await executeQuery('SELECT SUM(valor_total) as total FROM custos WHERE data >= ? AND is_deleted = 0', [firstDayOfMonth]);
        const resComprasMes = await executeQuery('SELECT SUM(valor) as total FROM compras WHERE data >= ? AND is_deleted = 0', [firstDayOfMonth]);
        const resCostsProf = await executeQuery('SELECT SUM(total_value) as total FROM costs WHERE created_at >= ? AND is_deleted = 0', [firstDayOfMonth]);

        const custosMes = (resCustosMes.rows.item(0).total || 0) +
            (resComprasMes.rows.item(0).total || 0) +
            (resCostsProf.rows.item(0).total || 0);

        // 6. Resultado do Mês (Saldo do Mês)
        const resVendasMes = await executeQuery('SELECT SUM(valor) as total FROM vendas WHERE data >= ? AND is_deleted = 0', [firstDayOfMonth]);
        const vendasMesTotal = resVendasMes.rows.item(0).total || 0;
        const saldoMes = vendasMesTotal - custosMes;

        // 7. Pendentes Sync (Contagem Global v8.5.9)
        let pendentes = 0;
        try {
            const syncTables = [
                'usuarios', 'colheitas', 'vendas', 'estoque', 'compras', 'plantio', 'custos',
                'clientes', 'culturas', 'maquinas', 'receitas', 'profiles',
                'movimentacoes_financeiras', 'caderno_notas'
            ];
            for (const t of syncTables) {
                try {
                    const resP = await executeQuery(`SELECT COUNT(*) as c FROM ${t} WHERE sync_status IN (0, 2)`);
                    pendentes += resP.rows.item(0).c || 0;
                } catch { }
            }
        } catch { }

        return {
            colheitaHoje: colheitaHoje || 0,
            vendasHoje: vendasHoje || 0,
            plantioAtivo: plantioAtivo || 0,
            maquinasAlert: maquinasAlert || 0,
            custosMes: custosMes || 0,
            vendasMes: vendasMesTotal || 0,
            saldo: saldoMes || 0,
            pendentes: pendentes || 0
        };
    } catch (error) {
        console.error('[DATABASE ERROR] getDashboardStats Failed:', error);
        return {
            colheitaHoje: 0,
            vendasHoje: 0,
            plantioAtivo: 0,
            maquinasAlert: 0,
            custosMes: 0,
            vendasMes: 0,
            saldo: 0,
            pendentes: 0
        };
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
            'clima_gps', 'clima_ativo', 'rel_incluir_logo', 'rel_modelo', 'img_qualidade', 'img_limite',
            'fazenda_area', 'fazenda_safra', 'unidade_padrao', 'rel_graficos', 'rel_auto_pdf', 'rel_rodape'
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

// --- FIM DO ARQUIVO ---

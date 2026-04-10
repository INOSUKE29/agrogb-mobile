import * as SQLite from 'expo-sqlite';
import { v4 } from 'uuid';
import { Platform } from 'react-native';

import { SCHEMA_V10 } from './schema_v10';

import { V1_DIAMOND_PRO } from './migrations/v1_diamond_pro';

const __DEV__ = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
let db;

// Função auxiliar para promissificar o executeSql
export const executeQuery = (sql, params = [], retries = 3) => {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Banco não inicializado'));
            return;
        }
        
        const queryTimeout = setTimeout(() => {
            console.warn('🕒 [SQL TIMEOUT CRÍTICO]:', sql.substring(0, 100));
            reject(new Error('Timeout de execução SQL'));
        }, 30000);

        const attemptQuery = (remainingRetries) => {
            try {
                db.transaction(tx => {
                    const start = Date.now();
                    tx.executeSql(
                        sql,
                        params,
                        (_, result) => {
                            clearTimeout(queryTimeout);
                            const duration = Date.now() - start;
                            if (__DEV__ && duration > 1000) {
                                console.log(`⚠️ Query Lenta (${duration}ms):`, sql.substring(0, 100));
                            }
                            resolve(result);
                        },
                        (_, error) => {
                            // Se o erro for de banco ocupado/travado, tentamos novamente
                            if (remainingRetries > 0 && (error.message?.includes('locked') || error.message?.includes('busy'))) {
                                clearTimeout(queryTimeout);
                                const delay = (4 - remainingRetries) * 200; // Backoff simples
                                console.log(`🔄 [DB BUSY] Tentando novamente em ${delay}ms... (Restantes: ${remainingRetries})`);
                                setTimeout(() => attemptQuery(remainingRetries - 1), delay);
                                return;
                            }

                            clearTimeout(queryTimeout);
                            if (__DEV__) console.log('⚠️ Erro SQL:', sql, error.message);
                            reject(error);
                        }
                    );
                }, (txError) => {
                    if (remainingRetries > 0 && (txError.message?.includes('locked') || txError.message?.includes('busy'))) {
                        clearTimeout(queryTimeout);
                        setTimeout(() => attemptQuery(remainingRetries - 1), 200);
                        return;
                    }
                    clearTimeout(queryTimeout);
                    reject(txError);
                });
            } catch (e) {
                clearTimeout(queryTimeout);
                reject(e);
            }
        };

        attemptQuery(retries);
    });
};

/**
 * Executa múltiplas queries em uma ÚNICA transação atômica
 * Essencial para evitar bloqueios de banco na inicialização
 */
export const executeTransaction = (queries) => {
    return new Promise((resolve, reject) => {
        if (!db) return reject(new Error('Banco não inicializado'));
        
        db.transaction(tx => {
            queries.forEach(sql => {
                // Remove espaços vazios ou linhas nulas antes de executar
                if (!sql || sql.trim() === '') return;

                tx.executeSql(
                    sql, 
                    [], 
                    null, 
                    (_, err) => {
                        // Logamos o erro mas retornamos 'false' para NÃO abortar a transação
                        // Isso é vital para migrações que podem falhar (ex: colunas duplicadas)
                        console.warn('⚠️ [SQL MIGRATION WARNING]:', sql.substring(0, 50), '->', err.message);
                        return false; 
                    }
                );
            });
        }, 
        (err) => {
            // Se a transação INTEIRA falhar por erro fatal (ex: banco corrompido ou erro de sintaxe grave)
            console.error('❌ [TRANSACTION FATAL ERROR]:', err.message);
            // IMPORTANTE: Resolvemos mesmo assim para permitir que o app abra 
            // e possamos ver o erro na tela ou em logs, em vez de travar no loading.
            resolve(); 
        }, 
        () => {
            resolve();
        });
    });
};

export const initDB = async () => {
    try {
        if (Platform.OS === 'web') {
            console.log('🌐 Web mode detected. Using Mock DB to prevent crashes.');
            db = {
                transaction: (txFn, errFn, successFn) => {
                    try {
                        txFn({
                            executeSql: (sql, params, succ) => {
                                if (succ) succ(null, { rows: { length: 0, item: () => null, _array: [] } });
                            }
                        });
                        if (successFn) successFn();
                    } catch (e) {
                        if (errFn) errFn(e);
                    }
                }
            };
            return db;
        }

        db = SQLite.openDatabase('agrogb_mobile.db');
        
        if (__DEV__) console.log('✅ Banco de dados aberto modo padrão (SDK 50)');
        await createTables();
        return db;
    } catch (error) {
        console.error('[DATABASE ERROR] Erro ao abrir banco:', error);
        throw error;
    }
};

const createTables = async () => {
    try {
        if (__DEV__) console.log(`💎 v1.1 DIAMOND: Iniciando transação ATÔMICA TOTAL para ${V1_DIAMOND_PRO.length} comandos...`);
        const start = Date.now();
        
        // Inclui SCHEMA_V10 se disponível
        const allQueries = [...V1_DIAMOND_PRO, ...SCHEMA_V10];
        await executeTransaction(allQueries);
        if (__DEV__) console.log(`✨ DIAMOND SETUP em ${Date.now() - start}ms`);

        // --- TAREFAS PESADAS (RODAM APENAS UMA VEZ) ---
        const lastCleanup = await getConfig('LAST_HEAVY_CLEANUP');
        const today = new Date().toISOString().split('T')[0];

        if (lastCleanup !== today) {
            if (__DEV__) console.log('🚀 Executando manutenções pesadas diárias...');
            await deduplicateClientes();
            
            const countKnowledge = await executeQuery('SELECT COUNT(*) as c FROM base_conhecimento_pro');
            if (countKnowledge.rows.item(0).c === 0) {
                await seedKnowledgeBasePro();
            }
            await setConfig('LAST_HEAVY_CLEANUP', today);
        }

        if (__DEV__) console.log("✅ Ciclo de inicialização DIAMOND finalizado.");

    } catch (error) {
        console.error('❌ ERRO CRÍTICO DIAMOND SETUP:', error);
    }
};

export const deduplicateClientes = async () => {
    try {
        if (__DEV__) console.log('🧹 Iniciando deduplicação OTIMIZADA de clientes (SQL Express)...');
        
        // Estratégia SQL: Marca como deletado todos os registros que tenham Nome/CPF duplicado, 
        // mantendo apenas o ID mais antigo. Muito mais rápido que loop JS.
        await executeQuery(`
            UPDATE clientes 
            SET is_deleted = 1, sync_status = 0 
            WHERE id NOT IN (
                SELECT MIN(id) 
                FROM clientes 
                WHERE is_deleted = 0 
                GROUP BY UPPER(TRIM(nome)), COALESCE(TRIM(cpf_cnpj), '')
            ) AND is_deleted = 0
        `);

        if (__DEV__) console.log('✅ Deduplicação concluída via SQL Unitário.');
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
                    [v4(), s.tipo, s.titulo, s.sintomas, s.causas, s.controle, s.fonte, s.conf, new Date().toISOString()]
                );
            }
            console.log('✅ Base de Conhecimento Seedada com sucesso!');
        }
    } catch (e) { console.error('[SYNC ERROR]', e); }
};

// ... (helpers)

// --- OPERAÇÕES NATIVAS (FIM DA BAGUNÇA BUILD #107) ---
// Todo o CRUD de negócio foi migrado para src/services/

// --- LOGGING / AUDITORIA ---
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

// --- CONFIGURAÇÕES DE SISTEMA ---
export const setConfig = async (chave, valor) => {
    try { await executeQuery('INSERT OR REPLACE INTO config (chave, valor) VALUES (?, ?)', [chave, valor]); } catch { }
};

export const getConfig = async (chave) => {
    try {
        const result = await executeQuery('SELECT valor FROM config WHERE chave = ?', [chave]);
        return result.rows.length > 0 ? result.rows.item(0).valor : null;
    } catch { return null; }
};

// --- HELPER PARA MAIÚSCULAS ---
const up = (text) => text ? text.toString().toUpperCase().trim() : '';

// --- CONFIGURAÇÕES DO APP (FASE 10) ---
export const getAppSettings = async () => {
    try {
        const res = await executeQuery('SELECT * FROM app_settings WHERE id = 1');
        return res.rows.length > 0 ? res.rows.item(0) : null;
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

// --- FUNÇÃO LEGADA (MANTIDA PARA COMPATIBILIDADE TEMPORÁRIA) ---
// Será removida quando todos os módulos usarem EstoqueService
export const atualizarEstoque = async (produto, quantidadeDelta) => {
    const timestamp = new Date().toISOString();
    const prodUp = up(produto);
    const result = await executeQuery('SELECT * FROM estoque WHERE produto = ?', [prodUp]);
    if (result.rows.length > 0) {
        const current = result.rows.item(0);
        const novaQuantidade = Math.max(0, current.quantidade + quantidadeDelta);
        await executeQuery('UPDATE estoque SET quantidade = ?, last_updated = ? WHERE produto = ?', [novaQuantidade, timestamp, prodUp]);
    } else {
        await executeQuery('INSERT INTO estoque (produto, quantidade, last_updated) VALUES (?, ?, ?)', [prodUp, Math.max(0, quantidadeDelta), timestamp]);
    }
};

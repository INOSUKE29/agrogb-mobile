import * as SQLite from 'expo-sqlite';
import { v4 } from 'uuid';
import { Platform } from 'react-native';

import { SCHEMA_V10 } from './schema_v10';

import { V1_DIAMOND_PRO } from './migrations/v1_diamond_pro';

const __DEV__ = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
let db;

// Função auxiliar para promissificar o executeSql
export const executeQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Banco não inicializado'));
            return;
        }
        
        // Timeout de segurança de 30s por query (v10.7 Gold)
        const queryTimeout = setTimeout(() => {
            console.warn('🕒 [SQL TIMEOUT CRÍTICO]:', sql.substring(0, 100));
            reject(new Error('Timeout de execução SQL'));
        }, 30000);

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
                        clearTimeout(queryTimeout);
                        if (__DEV__) console.log('⚠️ Erro SQL:', sql, error.message);
                        reject(error);
                    }
                );
            }, (txError) => {
                clearTimeout(queryTimeout);
                reject(txError);
            });
        } catch (e) {
            clearTimeout(queryTimeout);
            reject(e);
        }
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
                tx.executeSql(sql, [], null, (_, err) => {
                    console.warn('⚠️ Erro em lote:', sql.substring(0, 50), err.message);
                    return false; // continua execução
                });
            });
        }, 
        (err) => reject(err), 
        () => resolve());
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
                            executeSql: (sql, params, succ, err) => {
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
    } catch (e) {
        console.error('Erro Estoque:', e);
    }
};

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
    const uuid = v4();
    await executeQuery(`INSERT INTO usuarios (uuid, usuario, senha, nivel, email, nome_completo, telefone, endereco, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [uuid, up(u.usuario), u.senha, up(u.nivel), u.email ? u.email.trim() : null, up(u.nome_completo), u.telefone, up(u.endereco), new Date().toISOString()]);
};

export const updateUsuario = async (u) => {
    await executeQuery(`UPDATE usuarios SET usuario = ?, senha = ?, nivel = ?, email = ?, nome_completo = ?, telefone = ?, endereco = ?, last_updated = ?, sync_status = 0 WHERE id = ?`,
        [up(u.usuario), u.senha, up(u.nivel), u.email ? u.email.trim() : null, up(u.nome_completo), u.telefone, up(u.endereco), new Date().toISOString(), u.id]);
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

export const updateCadernoNota = async (uuid, observacao) => {
    await executeQuery(
        `UPDATE caderno_notas SET observacao = ?, last_updated = ?, sync_status = 0 WHERE uuid = ?`,
        [up(observacao), new Date().toISOString(), uuid]
    );
};

export const deleteCadernoNota = async (uuid) => {
    await executeQuery(
        `UPDATE caderno_notas SET is_deleted = 1, sync_status = 0 WHERE uuid = ?`,
        [uuid]
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


// --- SERVIÇOS DESACOPLADOS ---
// getDashboardStats foi movido para src/services/DashboardService.js


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

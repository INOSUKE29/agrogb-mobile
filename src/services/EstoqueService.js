import { executeQuery } from '../database/database';

const up = (t) => (t ? t.toUpperCase() : null);
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

export const registrarAjusteEstoqueInicial = async (d) => {
    // Insere como uma compra com valor = 0 e um texto identificador
    // para que não gere custo, mas aumente a quantidade de estoque.
    await executeQuery(`INSERT INTO compras (uuid, item, quantidade, valor, cultura, data, observacao, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [d.uuid, up(d.produto), d.quantidade, 0, 'SISTEMA', new Date().toISOString(), 'AJUSTE_INICIAL|' + (d.observacao || ''), new Date().toISOString(), 0]);
    await atualizarEstoque(d.produto, d.quantidade);
};

export const insertProcessamento = async (d) => {
    // d.tipo = 'CONGELAMENTO' ou 'DESCARTE'
    await executeQuery(`INSERT INTO descarte (uuid, produto, quantidade_kg, motivo, data, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [d.uuid, up(d.produto), d.quantidade_kg, up(d.motivo) + ` [${d.tipo}]`, d.data, new Date().toISOString(), 0]
    );

    // Abate o estoque do produto principal
    await atualizarEstoque(d.produto, -d.quantidade_kg);

    if (d.tipo === 'CONGELAMENTO') {
        // Acrescenta no estoque com sufixo (CONGELADO)
        await atualizarEstoque(`${d.produto} (CONGELADO)`, d.quantidade_kg);
    }
};

export const insertDescarte = async (d) => {
    return insertProcessamento({ ...d, tipo: 'DESCARTE' });
};

export const insertCongelamento = async (d) => {
    return insertProcessamento({ ...d, tipo: 'CONGELAMENTO' });
};

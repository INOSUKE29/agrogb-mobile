import { executeQuery } from '../database/database';
import { atualizarEstoque } from './EstoqueService';

const up = (text) => text ? text.toString().toUpperCase().trim() : '';

export const insertVenda = async (v) => {
    await executeQuery(
        `INSERT INTO vendas (uuid, cliente, produto, quantidade, valor, data, observacao, status_pagamento, data_recebimento, forma_pagamento, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [v.uuid, up(v.cliente), up(v.produto), v.quantidade, v.valor, v.data, up(v.observacao), v.status_pagamento || 'A_RECEBER', v.data_recebimento || null, v.forma_pagamento || null, new Date().toISOString(), 0]
    );

    // BAIXA DE ESTOQUE (PRODUTO PRINCIPAL + RECEITA)
    try {
        await atualizarEstoque(v.produto, -v.quantidade, v.data);

        // ENGENHARIA DE PRODUTO: Buscar se o item vendido tem uma "receita" (composição)
        const resCad = await executeQuery('SELECT uuid FROM cadastro WHERE nome = ?', [up(v.produto)]);
        if (resCad.rows.length > 0) {
            const paiUuid = resCad.rows.item(0).uuid;
            const resRec = await executeQuery(`
                SELECT r.quantidade as qtd_uso, c.nome as nome_insumo 
                FROM receitas r
                JOIN cadastro c ON r.item_filho_uuid = c.uuid
                WHERE r.produto_pai_uuid = ?
            `, [paiUuid]);

            for (let i = 0; i < resRec.rows.length; i++) {
                const item = resRec.rows.item(i);
                const qtdTotalBaixa = item.qtd_uso * v.quantidade;
                await atualizarEstoque(item.nome_insumo, -qtdTotalBaixa, v.data);
                console.log(`[Engenharia] Baixa automática: ${item.nome_insumo} (-${qtdTotalBaixa})`);
            }
        }
    } catch (e) {
        console.error('Falha na baixa de estoque/receita:', e);
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

export const marcarVendaRecebida = async (uuid, valor_recebido) => {
    await executeQuery(
        `UPDATE vendas SET status_pagamento = 'RECEBIDO', valor_recebido = ?, data_recebimento = ?, last_updated = ? WHERE uuid = ?`,
        [valor_recebido, new Date().toISOString(), new Date().toISOString(), uuid]
    );
};

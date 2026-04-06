import { executeQuery, atualizarEstoque } from '../database/database';

const up = (t) => (t ? t.toUpperCase() : null);


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

import { executeQuery } from '../database/database';
import { atualizarEstoque } from './EstoqueService';
import { logActivity } from '../database/database';

const up = (t) => (t ? t.toUpperCase() : null);

export const insertColheita = async (c) => {
    await executeQuery(
        `INSERT INTO colheitas (uuid, cultura, produto, quantidade, congelado, data, observacao, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.uuid, up(c.cultura), up(c.produto), c.quantidade, c.congelado || 0, c.data, up(c.observacao), new Date().toISOString(), 0]
    );
    await atualizarEstoque(c.produto, c.quantidade, c.data);
    await logActivity('INSERIR', 'COLHEITAS', `Nova colheita: ${c.produto} - ${c.quantidade}kg`);
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
        await logActivity('EXCLUIR', 'COLHEITAS', `Colheita apagada: ${old.produto} - ${old.quantidade}kg`);
    }
    await executeQuery('UPDATE colheitas SET is_deleted = 1, sync_status = 0 WHERE uuid = ?', [uuid]);
};

export const getColheitasRecentes = async () => {
    const res = await executeQuery('SELECT * FROM colheitas WHERE is_deleted = 0 ORDER BY data DESC, id DESC LIMIT 50');
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

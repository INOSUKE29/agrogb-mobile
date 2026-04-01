import { executeQuery } from '../../../database/database';
import { supabase } from '../../../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * InventoryService (V1.1 DIAMOND PRO) 💎
 * Gerencia Produtos, Insumos e Estoque. 🚀
 */
export const InventoryService = {
    /**
     * Cadastro rápido de produto (ideal para modais)
     */
    quickCreate: async (data) => {
        const uuid = uuidv4();
        const timestamp = new Date().toISOString();
        
        const record = {
            uuid,
            nome: data.nome.toUpperCase(),
            unidade: data.unidade || 'UNI',
            tipo: data.tipo || 'INSUMO',
            last_updated: timestamp,
            sync_status: 0
        };

        // Salva Local
        await executeQuery(
            `INSERT INTO cadastro (uuid, nome, unidade, tipo, last_updated, sync_status) VALUES (?, ?, ?, ?, ?, ?)`,
            [record.uuid, record.nome, record.unidade, record.tipo, record.last_updated, record.sync_status]
        );

        // Tenta sincronizar se houver rede (fundo)
        supabase.from('cadastro').insert([{
            uuid: uuid,
            nome: record.nome,
            unidade: record.unidade,
            tipo: record.tipo
        }]).then(({ error }) => {
            if (!error) executeQuery(`UPDATE cadastro SET sync_status = 1 WHERE uuid = ?`, [uuid]);
        });

        return record;
    },

    getAll: async () => {
        const res = await executeQuery('SELECT * FROM cadastro ORDER BY nome ASC');
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
    },

    /**
     * Busca o estoque consolidado (v1.0.1 Fix)
     */
    getStocks: async () => { // Nome alternativo se for plural, mas useInventory chama getStock()
        const res = await executeQuery(`
            SELECT e.id, e.produto, e.quantidade, e.last_updated, c.unidade
            FROM estoque e
            LEFT JOIN cadastro c ON UPPER(e.produto) = UPPER(c.nome)
            ORDER BY e.produto ASC
        `);
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
    },

    getStock: async () => { // Alias para compatibilidade com useInventory.js
        const res = await executeQuery(`
            SELECT e.id, e.produto, e.quantidade, e.last_updated, c.unidade
            FROM estoque e
            LEFT JOIN cadastro c ON UPPER(e.produto) = UPPER(c.nome)
            ORDER BY e.produto ASC
        `);
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
    },

    /**
     * Atualiza o estoque de um produto (Soma/Subtrai)
     */
    updateStock: async (productName, quantity, date = null) => {
        const res = await executeQuery('SELECT quantidade FROM estoque WHERE produto = ?', [productName.toUpperCase()]);
        const currentQty = res.rows.length > 0 ? res.rows.item(0).quantidade : 0;
        const newQty = currentQty + quantity;

        if (res.rows.length > 0) {
            await executeQuery('UPDATE estoque SET quantidade = ?, last_updated = ? WHERE produto = ?', [newQty, new Date().toISOString(), productName.toUpperCase()]);
        } else {
            await executeQuery('INSERT INTO estoque (produto, quantidade, last_updated) VALUES (?, ?, ?)', [productName.toUpperCase(), newQty, new Date().toISOString()]);
        }

        // Registra movimentação (Legacy support)
        if (date) {
            const uuid = uuidv4();
            await executeQuery(
                `INSERT INTO v2_movimentacoes_estoque (id, produto_id, tipo, quantidade, data, sync_status) VALUES (?, ?, ?, ?, ?, ?)`,
                [uuid, productName.toUpperCase(), quantity > 0 ? 'ENTRADA' : 'SAÍDA', Math.abs(quantity), date, 'pending']
            );
        }
    },

    /**
     * BI: Busca produtos com estoque crítico (vinda da VIEW SQL) 📊
     */
    getCriticalStock: async () => {
        const { data, error } = await supabase
            .from('view_estoque_critico')
            .select('*');
        if (error) throw error;
        return data;
    },

    /**
     * BI: Busca resumo financeiro consolidado (vinda da VIEW SQL) 💰
     */
    getFinanceSummary: async () => {
        const { data, error } = await supabase
            .from('view_financeiro_resumo')
            .select('*');
        if (error) throw error;
        return data[0] || { total_vendas: 0, total_custos: 0, lucro_liquido: 0 };
    }
};

import { executeQuery } from '../../../database/database';
import { supabase } from '../../../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { InventoryService } from '../../inventory/services/InventoryService';

/**
 * FinanceService (V1.1 DIAMOND PRO) 💎
 * Gerencia Vendas, Custos e Fluxo Financeiro com Integração de Estoque. 🚀
 */
export const FinanceService = {
    /**
     * Registra uma nova venda com baixa automática de estoque e engenharia de produto.
     */
    recordSale: async (v) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const up = (text) => text ? text.toString().toUpperCase().trim() : '';

            // 1. CHAMA A LÓGICA NO BANCO (Nível ERP Diamond Pro) 🚀
            // Passamos o produto_uuid se disponível, ou buscamos na hora
            let produtoUuid = v.produto_uuid;
            if (!produtoUuid) {
                const res = await executeQuery('SELECT uuid FROM cadastro WHERE nome = ?', [up(v.produto)]);
                if (res.rows.length > 0) produtoUuid = res.rows.item(0).uuid;
            }

            const { data: saleUuid, error } = await supabase.rpc('process_sale_v2', {
                p_user_id: user.id,
                p_produto_uuid: produtoUuid,
                p_quantidade: v.quantidade,
                p_valor: v.valor,
                p_cliente_uuid: v.cliente_uuid || null
            });

            if (error) throw error;

            // 2. Sincroniza estado local (SQLite)
            const uuid = saleUuid || v.uuid || uuidv4();
            const timestamp = new Date().toISOString();
            await executeQuery(
                `INSERT INTO vendas (uuid, cliente, produto, quantidade, valor, data, last_updated, sync_status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuid, up(v.cliente), up(v.produto), v.quantidade, v.valor, v.data, timestamp, 1]
            );

            return { uuid, ...v };
        } catch (error) {
            console.error('[FinanceService] Erro ao registrar venda:', error);
            throw error;
        }
    },

    getRecentSales: async (limit = 50) => {
        const res = await executeQuery(`SELECT * FROM vendas WHERE is_deleted = 0 ORDER BY data DESC, id DESC LIMIT ${limit}`);
        return res.rows._array;
    },

    markAsPaid: async (uuid, amount) => {
        const timestamp = new Date().toISOString();
        await executeQuery(
            `UPDATE vendas SET status_pagamento = 'RECEBIDO', valor_recebido = ?, data_recebimento = ?, last_updated = ? WHERE uuid = ?`,
            [amount, timestamp, timestamp, uuid]
        );
    }
};

import { executeQuery } from '../../../database/database';
import { supabase } from '../../../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

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

            // 1. CHAMA A LÓGICA NO BANCO
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

            const uuid = saleUuid || v.uuid || uuidv4();
            const timestamp = new Date().toISOString();

            // 2. Sincroniza estado local (SQLite)
            await executeQuery(
                `INSERT INTO vendas (uuid, cliente, produto, quantidade, valor, data, last_updated, sync_status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuid, up(v.cliente), up(v.produto), v.quantidade, v.valor, v.data, timestamp, 1]
            );

            // 3. NOVO: Gera conta a receber no financeiro
            await FinanceService.createFinancialAccount({
                user_id: user.id,
                type: 'RECEIVE',
                category: 'VENDA',
                description: `VENDA: ${up(v.produto)} - ${up(v.cliente)}`,
                total_value: v.valor,
                origin_uuid: uuid,
                status: 'PAID', // Vendas simples assumimos pagas por enquanto no MVP
                due_date: v.data
            });

            return { uuid, ...v };
        } catch (error) {
            console.error('[FinanceService] Erro ao registrar venda:', error);
            throw error;
        }
    },

    recordPurchase: async (p) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const up = (text) => text ? text.toString().toUpperCase().trim() : '';
            const uuid = p.uuid || uuidv4();
            const now = new Date().toISOString();

            // 1. Salva na tabela legada de compras (para compatibilidade com outras telas)
            await executeQuery(
                `INSERT INTO compras (uuid, item, quantidade, valor, cultura, data, observacao, last_updated, sync_status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                [uuid, up(p.item), p.quantidade, p.valor, up(p.cultura), p.data, up(p.observacao), now]
            );

            // 2. Gera conta a pagar no novo financeiro
            await FinanceService.createFinancialAccount({
                user_id: user?.id || null,
                type: 'PAY',
                category: 'COMPRA',
                description: `COMPRA: ${up(p.item)}`,
                total_value: p.valor,
                origin_uuid: uuid,
                status: p.pago ? 'PAID' : 'PENDING',
                due_date: p.vencimento || p.data
            });

            return { uuid, ...p };
        } catch (error) {
            console.error('[FinanceService] Erro ao registrar compra:', error);
            throw error;
        }
    },

    recordCost: async (c) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const up = (text) => text ? text.toString().toUpperCase().trim() : '';
            const uuid = c.uuid || uuidv4();
            const now = new Date().toISOString();

            // 1. Salva na tabela legada de custos
            await executeQuery(
                `INSERT INTO custos (uuid, produto, tipo, quantidade, valor_total, data, observacao, categoria_id, last_updated, sync_status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                [uuid, up(c.produto), up(c.tipo), c.quantidade, c.valor_total, c.data, up(c.observacao), c.categoria_id || null, now]
            );

            // 2. Gera conta a pagar no financeiro
            await FinanceService.createFinancialAccount({
                user_id: user?.id || null,
                type: 'PAY',
                category: 'CUSTO',
                description: `CUSTO: ${up(c.produto)} (${up(c.tipo)})`,
                total_value: c.valor_total,
                origin_uuid: uuid,
                status: c.pago ? 'PAID' : 'PENDING',
                due_date: c.data
            });

            return { uuid, ...c };
        } catch (error) {
            console.error('[FinanceService] Erro ao registrar custo:', error);
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
    },

    /**
     * NOVO MÓDULO FINANCEIRO (V1.1)
     */
    createFinancialAccount: async (acc) => {
        const id = acc.id || uuidv4();
        const now = new Date().toISOString();
        await executeQuery(
            `INSERT INTO financial_accounts (
                id, user_id, type, category, description, total_value, 
                origin_uuid, status, due_date, created_at, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, acc.user_id || null, acc.type, acc.category || 'OUTROS',
                acc.description, acc.total_value, acc.origin_uuid || null,
                acc.status || 'PENDING', acc.due_date || null, now, now
            ]
        );
        return id;
    },

    createInstallments: async (accountId, installments) => {
        const now = new Date().toISOString();
        for (const inst of installments) {
            await executeQuery(
                `INSERT INTO financial_installments (
                    id, account_id, installment_number, value, due_date, status, last_updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    uuidv4(), accountId, inst.number, inst.value, 
                    inst.due_date, 'PENDING', now
                ]
            );
        }
    },

    getAccounts: async (type = null) => {
        let sql = 'SELECT * FROM financial_accounts WHERE is_deleted = 0';
        const params = [];
        if (type) {
            sql += ' AND type = ?';
            params.push(type);
        }
        sql += ' ORDER BY due_date ASC';
        const res = await executeQuery(sql, params);
        return res.rows._array || [];
    }
};

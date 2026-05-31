import { executeQuery } from '../../../database/database';
import { supabase } from '../../../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import EstoqueService from '../../../services/EstoqueService';

/**
 * InventoryService (V2.0 ENTERPRISE) 💎
 * Gerencia Produtos, Insumos e Interface com o Estoque consolidado.
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
        // Sincronização em background otimizada (Non-blocking)
        supabase.from('cadastro').insert([{
            uuid: uuid,
            nome: record.nome,
            unidade: record.unidade,
            tipo: record.tipo
        }]).then(({ error }) => {
            if (error && __DEV__) console.warn('[InventorySync] Falha silenciosa:', error.message);
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
     * Busca o estoque consolidado delegando para o EstoqueService
     */
    getStocks: async () => {
        return await EstoqueService.getListaConsolidada();
    },

    getStock: async () => { 
        return await EstoqueService.getListaConsolidada();
    },

    /**
     * Atualiza o estoque de um produto (Redirecionado para o motor Enterprise)
     */
    updateStock: async (productName, quantity, reason = 'AJUSTE MANUAL') => {
        return await EstoqueService.movimentar(productName, quantity, reason);
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

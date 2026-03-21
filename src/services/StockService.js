import { executeQuery } from '../database/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * StockService - Gestão Centralizada de Movimentações de Estoque 📦⚡
 */
export const StockService = {
    /**
     * Deduz uma lista de itens do estoque e registra a movimentação
     */
    applyStockDeduction: async (items, origin = 'Adubação') => {
        const now = new Date().toISOString();

        for (const item of items) {
            // 1. Buscar produto pelo nome (simplificado p/ match direto)
            const resProd = await executeQuery(`SELECT id FROM v2_produtos WHERE nome = ?`, [item.product_name]);
            
            if (resProd.rows.length > 0) {
                const produtoId = resProd.rows.item(0).id;

                // 2. Atualizar v2_estoque_atual
                await executeQuery(
                    `UPDATE v2_estoque_atual 
                     SET quantidade = quantidade - ?, last_updated = ?, sync_status = 'pending' 
                     WHERE produto_id = ?`,
                    [item.quantity, now, produtoId]
                );

                // 3. Registrar Movimentação Histórica
                await executeQuery(
                    `INSERT INTO v2_movimentacoes_estoque (id, produto_id, tipo, quantidade, origem, data, sync_status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), produtoId, 'SAIDA', item.quantity, origin, now, 'pending']
                );
            } else {
                console.warn(`[StockService] Produto não encontrado no estoque: ${item.product_name}`);
            }
        }
    }
};

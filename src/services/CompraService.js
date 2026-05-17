import { executeQuery } from '../database/database';
import EstoqueService from './EstoqueService';
import { v4 as uuidv4 } from 'uuid';

/**
 * SERVIÇO DE COMPRAS ENTERPRISE - BUILD #107
 * Gerencia o ciclo de vida das compras e integração automática com estoque.
 */
class CompraService {
    /**
     * Registra uma nova compra e movimenta o estoque
     */
    static async registrarCompra(dados) {
        const { uuid, produto, quantidade, valor, observacao, data, cultura } = dados;
        const purchaseUuid = uuid || uuidv4();
        const timestamp = new Date().toISOString();

        try {
            // 1. Salva o registro da compra na tabela financeira/operacional
            // Nota: Usamos a tabela 'compras' que já existe no esquema original
            await executeQuery(
                `INSERT INTO compras (
                    uuid, produto, quantidade, valor, observacao, data, cultura, criado_em, sync_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                [purchaseUuid, produto, quantidade, valor, observacao, data, cultura, timestamp]
            );

            // 2. Integração Automática com Estoque
            // Toda compra de insumo deve entrar no estoque físico
            await EstoqueService.movimentar(produto, quantidade, `COMPRA: ${purchaseUuid}`, purchaseUuid);

            return { success: true, uuid: purchaseUuid };
        } catch (error) {
            console.error('❌ [CompraService Error]:', error);
            throw error;
        }
    }

    /**
     * Busca as compras recentes para o histórico da tela
     */
    static async getRecentPurchases(limit = 40) {
        try {
            const res = await executeQuery(
                'SELECT * FROM compras WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY data DESC LIMIT ?',
                [limit]
            );
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            return rows;
        } catch (error) {
            console.error('❌ [CompraService Error]:', error);
            return [];
        }
    }

    /**
     * Exclui uma compra e estorna o estoque
     */
    static async excluirCompra(uuid) {
        try {
            // 1. Busca os dados da compra para saber o que estornar
            const res = await executeQuery('SELECT * FROM compras WHERE uuid = ?', [uuid]);
            if (res.rows.length > 0) {
                const compra = res.rows.item(0);
                
                // 2. Estorna o estoque (subtrai o que foi comprado)
                await EstoqueService.movimentar(compra.produto, -compra.quantidade, `ESTORNO COMPRA: ${uuid}`, uuid);

                // 3. Soft Delete na compra
                await executeQuery('UPDATE compras SET is_deleted = 1, sync_status = 0 WHERE uuid = ?', [uuid]);
            }
            return { success: true };
        } catch (error) {
            console.error('❌ [CompraService Error]:', error);
            throw error;
        }
    }
}

export default CompraService;

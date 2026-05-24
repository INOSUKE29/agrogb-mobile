import { executeQuery } from '../database/database';

/**
 * SERVIÇO DE ESTOQUE ENTERPRISE - BUILD #107
 * Responsável pela integridade física dos produtos e histórico de movimentações.
 */
class EstoqueService {

    /**
     * Atualiza a quantidade de um produto de forma segura
     */
    static async movimentar(id_produto, delta, motivo = 'AJUSTE', uuid_referencia = null) {
        const timestamp = new Date().toISOString();
        
        try {
            // 1. Busca o saldo atual
            const res = await executeQuery('SELECT * FROM estoque WHERE id = ? OR produto = ?', [id_produto, id_produto]);
            
            if (res.rows.length === 0) {
                // Se não existe, cria o registro inicial (se delta for positivo)
                if (delta < 0) return { success: false, error: 'Estoque insuficiente (não existente)' };
                
                await executeQuery(
                    'INSERT INTO estoque (produto, quantidade, last_updated) VALUES (?, ?, ?)',
                    [id_produto, delta, timestamp]
                );
            } else {
                const item = res.rows.item(0);
                let novaQtd = (item.quantidade || 0) + delta;

                // Regra de Ouro: Nunca negativo
                if (novaQtd < 0) {
                    console.warn(`[Estoque] Saldo insuficiente para ${id_produto}. Ajustado para 0.`);
                    novaQtd = 0;
                }

                await executeQuery(
                    'UPDATE estoque SET quantidade = ?, last_updated = ? WHERE id = ?',
                    [novaQtd, timestamp, item.id]
                );
            }

            // 2. Registra na tabela de movimentação histórica
            const { v4: uuidv4 } = require('uuid');
            await executeQuery(
                `INSERT INTO movimentacao_estoque (
                    uuid, produto_uuid, tipo, quantidade, motivo, data, last_updated, sync_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
                [
                    uuidv4(),
                    id_produto,
                    delta > 0 ? 'ENTRADA' : 'SAIDA',
                    Math.abs(delta),
                    motivo,
                    timestamp,
                    timestamp
                ]
            );

            return { success: true };
        } catch (error) {
            console.error('❌ [EstoqueService Error]:', error);
            throw error;
        }
    }

    /**
     * Busca o saldo consolidado de um produto
     */
    static async getSaldo(id_produto) {
        const res = await executeQuery('SELECT quantidade FROM estoque WHERE id = ? OR produto = ?', [id_produto, id_produto]);
        return res.rows.length > 0 ? res.rows.item(0).quantidade : 0;
    }

    /**
     * Retorna a lista completa de estoque para o Dashboard (Com Unidade do Cadastro)
     */
    static async getListaConsolidada() {
        const res = await executeQuery(`
            SELECT e.*, c.unidade, c.tipo as categoria 
            FROM estoque e
            LEFT JOIN cadastro c ON UPPER(e.produto) = UPPER(c.nome)
            ORDER BY e.produto ASC
        `);
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
    }
}

export default EstoqueService;

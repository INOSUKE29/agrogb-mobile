import { executeQuery, logActivity } from '../database/database';
import { v4 } from 'uuid';
import EstoqueService from './EstoqueService';

/**
 * SERVIÇO DE VENDAS ENTERPRISE - BUILD #107
 * Responsável por toda a lógica de negócio, garantindo integridade entre Venda e Estoque.
 */
class VendaService {
    
    /**
     * Registra uma nova venda com baixa automática de estoque
     */
    static async registrarVenda(vendaData) {
        const {
            produto,
            quantidade,
            valor_total,
            cliente_id,
            cliente_nome,
            data,
            observacao,
            pagamento_status = 'PENDENTE'
        } = vendaData;

        const uuid = v4();
        const timestamp = new Date().toISOString();

        try {
            // 1. Registra a Venda no SQLite
            await executeQuery(
                `INSERT INTO vendas (
                    uuid, produto, quantidade, valor_total, cliente_id, cliente_nome, 
                    data, observacao, pagamento_status, last_updated, sync_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                [
                    uuid, 
                    produto.toUpperCase().trim(), 
                    quantidade, 
                    valor_total, 
                    cliente_id, 
                    cliente_nome.toUpperCase().trim(),
                    data, 
                    observacao || '', 
                    pagamento_status,
                    timestamp
                ]
            );

            // 2. Realiza a baixa no estoque através do serviço mestre
            // Toda venda gera uma auditoria automática em v2_estoque_movimentacoes
            await EstoqueService.movimentar(produto, -quantidade, `VENDA: ${uuid}`, uuid);

            // 3. Registra Log de Atividade
            await logActivity('VENDA', 'VENDAS', `Venda de ${quantidade} de ${produto} para ${cliente_nome}`);

            return { success: true, uuid };
        } catch (error) {
            console.error('❌ [VendaService Error]:', error);
            throw error;
        }
    }

    /**
     * Retorna lista de vendas recentes (Abstração do driver)
     */
    static async getVendasRecentes() {
        const res = await executeQuery(
            'SELECT * FROM vendas WHERE is_deleted = 0 ORDER BY data DESC, id DESC LIMIT 100'
        );
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
    }

    /**
     * Estorno/Deleção de Venda (Repõe estoque automaticamente)
     */
    static async excluirVenda(uuid) {
        try {
            const venda = await executeQuery('SELECT * FROM vendas WHERE uuid = ?', [uuid]);
            if (venda.rows.length > 0) {
                const v = venda.rows.item(0);
                // Repõe o estoque que foi baixado (Estorno)
                await EstoqueService.movimentar(v.produto, v.quantidade, `ESTORNO VENDA: ${uuid}`, uuid);
                
                // Exclusão Lógica (Soft Delete) - Regra de Ouro Build #107
                await executeQuery('UPDATE vendas SET is_deleted = 1, sync_status = 0 WHERE uuid = ?', [uuid]);
                
                await logActivity('DELETE', 'VENDAS', `Estorno de venda ${uuid} - Estoque reposto.`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ [VendaService Excluir Error]:', error);
            throw error;
        }
    }
}

export default VendaService;

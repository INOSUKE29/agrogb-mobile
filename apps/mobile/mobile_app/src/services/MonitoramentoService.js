import { executeQuery } from '../database/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * MonitoramentoService - AgroGB Enterprise
 * Centraliza a lógica do Diário de Campo e Monitoramento de Pragas/Clima.
 */
const MonitoramentoService = {
    /**
     * Busca os últimos registros do diário de campo (limitado a 60 para performance)
     */
    getHistorico: async (limit = 60) => {
        try {
            const res = await executeQuery(
                `SELECT * FROM monitoramento_entidade 
                 WHERE status != 'EXCLUIDO' 
                 AND is_deleted = 0 
                 ORDER BY data DESC LIMIT ?`,
                [limit]
            );
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) {
                rows.push(res.rows.item(i));
            }
            return rows;
        } catch (error) {
            console.error('[MonitoramentoService] Erro ao buscar histórico:', error);
            return [];
        }
    },

    /**
     * Registra um novo apontamento no diário de campo
     */
    registrarObservacao: async (dados) => {
        const { local, observacao, severidade, categoria } = dados;
        const uuid = uuidv4();
        const agora = new Date().toISOString();

        try {
            await executeQuery(
                `INSERT INTO monitoramento_entidade (
                    uuid, cultura_id, data, observacao_usuario, status, 
                    nivel_confianca, severidade, categoria, criado_em, 
                    last_updated, sync_status, is_deleted
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    uuid,
                    local.toUpperCase() || 'CAMPO GERAL',
                    agora,
                    observacao.toUpperCase(),
                    'CONFIRMADO',
                    'TÉCNICO',
                    severidade,
                    categoria,
                    agora,
                    agora,
                    0, // Pendente de sincronismo
                    0  // Não deletado
                ]
            );
            return { success: true, uuid };
        } catch (error) {
            console.error('[MonitoramentoService] Erro ao registrar observação:', error);
            throw error;
        }
    },

    /**
     * Remove um registro (Soft Delete)
     */
    excluirRegistro: async (uuid) => {
        try {
            await executeQuery(
                `UPDATE monitoramento_entidade SET status='EXCLUIDO', is_deleted = 1, last_updated = ? WHERE uuid = ?`,
                [new Date().toISOString(), uuid]
            );
            return true;
        } catch (error) {
            console.error('[MonitoramentoService] Erro ao excluir registro:', error);
            throw error;
        }
    }
};

export default MonitoramentoService;

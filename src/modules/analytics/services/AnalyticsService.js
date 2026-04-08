import { executeQuery } from '../../../database/database';
import { LoggingService } from '../../system/services/LoggingService';

/**
 * AnalyticsService (Módulo Analytics - Diamond Pro)
 * Central de inteligência para cálculos de BI, ROI e Produtividade.
 */
export const AnalyticsService = {

    /**
     * Calcula o ROI da Safra.
     * ROI = ((Receita - Custo) / Custo) * 100
     */
    calculateROI: async () => {
        try {
            const vendas = await executeQuery(`SELECT SUM(valor_total) as total FROM v2_vendas WHERE is_deleted = 0`);
            const custos = await executeQuery(`SELECT SUM(valor) as total FROM compras WHERE is_deleted = 0`);

            const receita = vendas.rows.item(0).total || 0;
            const despesa = custos.rows.item(0).total || 0;

            if (despesa === 0) return 0;
            return (((receita - despesa) / despesa) * 100).toFixed(1);
        } catch (error) {
            await LoggingService.logError('AnalyticsService', 'calculateROI', error);
            return 0;
        }
    },

    /**
     * Busca o progresso da colheita atual.
     */
    getHarvestProgress: async () => {
        try {
            // Exemplo de lógica para progresso baseado em estimativa vs real
            const query = `
                SELECT 
                    SUM(quantidade_total) as colhido,
                    (SELECT SUM(area * 3000) FROM v2_talhoes) as estimado -- 3000kg/ha como base
                FROM v2_colheitas
            `;
            const res = await executeQuery(query);
            const data = res.rows.item(0);
            
            const colhido = data.colhido || 0;
            const estimado = data.estimado || 1; // evita div por zero
            
            const percentual = Math.min((colhido / estimado) * 100, 100);

            return {
                percentual: percentual.toFixed(0),
                colhido: colhido,
                estimado: estimado
            };
        } catch (error) {
            await LoggingService.logError('AnalyticsService', 'getHarvestProgress', error);
            return { percentual: 0, colhido: 0, estimado: 0 };
        }
    },

    /**
     * Busca a saúde financeira atual (Receita e Despesa).
     */
    getFinancialStatus: async () => {
        try {
            const vendas = await executeQuery(`SELECT SUM(valor_total) as soma FROM v2_vendas WHERE is_deleted = 0`);
            const custos = await executeQuery(`SELECT SUM(valor) as soma FROM compras WHERE is_deleted = 0`);
            
            return {
                receita: vendas.rows.item(0).soma || 0,
                despesa: custos.rows.item(0).soma || 0
            };
        } catch (error) {
            await LoggingService.logError('AnalyticsService', 'getFinancialStatus', error);
            return { receita: 0, despesa: 0 };
        }
    },

    /**
     * Detecção de anomalias por talhão.
     */
    getAnomalies: async () => {
        try {
            const query = `
                SELECT 
                    t.nome as talhao,
                    SUM(c.quantidade_total) as total
                FROM v2_talhoes t
                JOIN v2_colheitas c ON c.plantio_id IN (SELECT id FROM v2_plantios WHERE talhao_id = t.id)
                GROUP BY t.id
                HAVING total < (SELECT AVG(quantidade_total) FROM v2_colheitas) * 0.7
            `;
            const res = await executeQuery(query);
            return res.rows._array || [];
        } catch (error) {
            await LoggingService.logError('AnalyticsService', 'getAnomalies', error);
            return [];
        }
    }
};

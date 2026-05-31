import { executeQuery } from '../../../database/database';
import { LoggingService } from '../../system/services/LoggingService';

/**
 * AnalyticsService (Módulo Analytics - Diamond Pro)
 * Central de inteligência para cálculos de BI, ROI e Produtividade.
 */
export const AnalyticsService = {

    /**
     * BUILD #107 ENTERPRISE - Método Consolidado
     * Reduz o número de queries na inicialização puxando todos os KPIS essenciais de uma vez.
     */
    getDashboardStats: async () => {
        try {
            // Executa as somas fundamentais em um único bloco
            const resFinance = await executeQuery(`
                SELECT 
                    (SELECT SUM(valor_total) FROM v2_vendas WHERE is_deleted = 0) as receita,
                    (SELECT SUM(valor) FROM compras WHERE is_deleted = 0) as despesa,
                    (SELECT SUM(quantidade_total) FROM v2_colheitas) as colhido,
                    (SELECT SUM(area * 3000) FROM v2_talhoes) as estimado
            `);
            
            const data = resFinance.rows.item(0);
            const receita = data.receita || 0;
            const despesa = data.despesa || 0;
            const colhido = data.colhido || 0;
            const estimado = data.estimado || 1;

            // Cálculos em memória (mais rápido que no SQL)
            const roi = despesa === 0 ? 0 : (((receita - despesa) / despesa) * 100).toFixed(1);
            const harvestPercent = Math.min((colhido / estimado) * 100, 100).toFixed(0);

            return {
                roi,
                receita,
                despesa,
                harvest: {
                    percentual: harvestPercent,
                    colhido,
                    estimado
                }
            };
        } catch (error) {
            await LoggingService.logError('AnalyticsService', 'getDashboardStats', error);
            return null;
        }
    },

    /**
     * Mantemos as anomalias isoladas por serem opcionais/pesadas
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


import { executeQuery } from '../database/database';

/**
 * AnalyticsService (Phase V3)
 * Motor de BI para cálculos de produtividade e ROI.
 */
export const AnalyticsService = {

    /**
     * Calcula a produtividade por talhão (Kg/Ha)
     */
    getTalhaoProductivity: async () => {
        try {
            const query = `
                SELECT 
                    t.nome as talhao,
                    SUM(c.quantidade_total) as total_kg,
                    t.area as area_ha,
                    (SUM(c.quantidade_total) / t.area) as produtividade
                FROM v2_talhoes t
                LEFT JOIN v2_colheitas c ON c.plantio_id IN (SELECT id FROM v2_plantios WHERE talhao_id = t.id)
                GROUP BY t.id
            `;
            const res = await executeQuery(query);
            return res.rows._array || [];
        } catch (error) {
            console.error("Erro ao calcular produtividade:", error);
            return [];
        }
    },

    /**
     * Resumo Financeiro Simples (Receita vs Custo)
     */
    getFinancialHealth: async () => {
        try {
            const vendas = await executeQuery(`SELECT SUM(valor_total) as soma FROM v2_vendas WHERE is_deleted = 0`);
            const custos = await executeQuery(`SELECT SUM(valor) as soma FROM compras WHERE is_deleted = 0`); // V1 compat
            
            const receita = vendas.rows.item(0).soma || 0;
            const despesa = custos.rows.item(0).soma || 0;

            return {
                receita,
                despesa,
                lucro: receita - despesa,
                margem: receita > 0 ? ((receita - despesa) / receita) * 100 : 0
            };
        } catch (error) {
            return { receita: 0, despesa: 0, lucro: 0, margem: 0 };
        }
    },

    /**
     * Detecta tendências de queda na produção (Análise de 2 períodos)
     */
    detectProductionTrends: async () => {
        try {
            const query = `
                SELECT 
                    t.nome as talhao,
                    strftime('%m', c.data) as mes,
                    SUM(c.quantidade_total) as kilos
                FROM v2_talhoes t
                JOIN v2_colheitas c ON c.plantio_id IN (SELECT id FROM v2_plantios WHERE talhao_id = t.id)
                WHERE c.data >= date('now', '-2 months')
                GROUP BY t.id, mes
                ORDER BY t.id, mes DESC
            `;
            const res = await executeQuery(query);
            const trends = [];
            const data = res.rows._array || [];

            // Agrupa por talhão e compara os dois últimos meses
            const grouped = data.reduce((acc, curr) => {
                if (!acc[curr.talhao]) acc[curr.talhao] = [];
                acc[curr.talhao].push(curr);
                return acc;
            }, {});

            for (const talhao in grouped) {
                const periods = grouped[talhao];
                if (periods.length >= 2) {
                    const atual = periods[0].kilos;
                    const anterior = periods[1].kilos;
                    const diff = ((atual - anterior) / anterior) * 100;

                    if (diff < -15) {
                        trends.push({
                            talhao,
                            queda: Math.abs(diff).toFixed(1),
                            nivel: diff < -30 ? 'CRÍTICO' : 'ALERTA',
                            sugestao: "Anomalia detectada. Verificar incidência de pragas ou deficiência hídrica."
                        });
                    }
                }
            }
            return trends;
        } catch (error) {
            return [];
        }
    }
};

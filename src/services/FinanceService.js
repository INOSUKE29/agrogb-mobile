import { executeQuery } from '../database/database';

export const FinanceService = {
    /**
     * Calcula o DRE (Demonstrativo de Resultado do Exercício)
     * Resumo: Receitas - Custos Diretos = Margem Bruta - Despesas Fixas = Lucro Líquido
     */
    getDRE: async (month, year) => {
        try {
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

            // 1. Receitas (Vendas + Transações de Receber Liquidadas)
            const resVendas = await executeQuery(
                `SELECT SUM(valor * quantidade) as total FROM vendas WHERE data BETWEEN ? AND ? AND is_deleted = 0`,
                [startDate, endDate]
            );
            const resTransReceber = await executeQuery(
                `SELECT SUM(valor) as total FROM financeiro_transacoes WHERE tipo = 'RECEBER' AND status = 'PAGO' AND data_pagamento BETWEEN ? AND ? AND is_deleted = 0`,
                [startDate, endDate]
            );
            const receitas = (resVendas.rows.item(0).total || 0) + (resTransReceber.rows.item(0).total || 0);

            // 2. Custos Variáveis (Compras + Transações de Pagar Liquidadas)
            const resCompras = await executeQuery(
                `SELECT SUM(valor) as total FROM compras WHERE data BETWEEN ? AND ? AND is_deleted = 0`,
                [startDate, endDate]
            );
            const resTransPagar = await executeQuery(
                `SELECT SUM(valor) as total FROM financeiro_transacoes WHERE tipo = 'PAGAR' AND status = 'PAGO' AND data_pagamento BETWEEN ? AND ? AND is_deleted = 0`,
                [startDate, endDate]
            );
            const custosVariaveis = (resCompras.rows.item(0).total || 0) + (resTransPagar.rows.item(0).total || 0);

            // 3. Despesas Operacionais (Custos fixos/gerais)
            const resCustos = await executeQuery(
                `SELECT SUM(valor_total) as total FROM custos WHERE data BETWEEN ? AND ? AND is_deleted = 0`,
                [startDate, endDate]
            );
            const despesasOp = resCustos.rows.item(0).total || 0;

            const margemBruta = receitas - custosVariaveis;
            const lucroLiquido = margemBruta - despesasOp;

            return {
                receitas,
                custosVariaveis,
                margemBruta,
                despesasOp,
                lucroLiquido,
                percentualMargem: receitas > 0 ? (margemBruta / receitas) * 100 : 0
            };
        } catch (error) {
            console.error('Erro ao calcular DRE:', error);
            throw error;
        }
    },

    /**
     * Busca dados para o gráfico de Fluxo de Caixa (Entradas vs Saídas) reais
     */
    getCashFlow: async (period = '6months') => {
        try {
            // Simplificado para os últimos 6 meses
            const labels = [];
            const entradas = [];
            const saidas = [];
            
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const y = d.getFullYear();
                const label = d.toLocaleString('pt-BR', { month: 'short' });
                labels.push(label);

                const start = `${y}-${m}-01`;
                const end = `${y}-${m}-31`;

                const resE = await executeQuery(
                    `SELECT SUM(valor) as total FROM financeiro_transacoes WHERE tipo = 'RECEBER' AND status = 'PAGO' AND data_pagamento BETWEEN ? AND ?`,
                    [start, end]
                );
                const resS = await executeQuery(
                    `SELECT SUM(valor) as total FROM financeiro_transacoes WHERE tipo = 'PAGAR' AND status = 'PAGO' AND data_pagamento BETWEEN ? AND ?`,
                    [start, end]
                );

                entradas.push((resE.rows.item(0).total || 0) / 1000); // Em milhares para o gráfico
                saidas.push((resS.rows.item(0).total || 0) / 1000);
            }

            return {
                labels,
                datasets: [
                    {
                        data: entradas,
                        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                        strokeWidth: 2
                    },
                    {
                        data: saidas,
                        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                        strokeWidth: 2
                    }
                ],
                legend: ["Entradas (k)", "Saídas (k)"]
            };
        } catch (e) {
            console.error(e);
            return { labels: [], datasets: [], legend: [] };
        }
    },

    getUSDRate: async () => {
        try {
            const res = await executeQuery("SELECT value FROM app_settings WHERE key = 'usd_rate' LIMIT 1");
            return res.rows.length > 0 ? parseFloat(res.rows.item(0).value) : 5.0;
        } catch (e) {
            return 5.0;
        }
    }
};

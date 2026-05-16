/**
 * DashboardService
 * Centraliza a lógica de busca de dados para o Dashboard Executivo do banco de dados local.
 */
import { executeQuery } from '../database/database';

export const DashboardService = {
    /**
     * Busca dados consolidados do dashboard do banco de dados local
     */
    getDashboardData: async (propertyId = 'all', period = 'month') => {
        try {
            // Data de início (simplificada: últimos 30 dias para "mês")
            const date = new Date();
            date.setDate(date.getDate() - 30);
            const startDate = date.toISOString().split('T')[0];
            
            // 1. FINANCEIRO (Receitas de Vendas)
            const resVendas = await executeQuery(
                `SELECT SUM(valor * quantidade) as total FROM vendas WHERE data >= ? AND is_deleted = 0`, 
                [startDate]
            );
            const revenue = resVendas.rows.item(0).total || 0;

            // 2. FINANCEIRO (Despesas de Compras e Custos)
            const resCompras = await executeQuery(
                `SELECT SUM(valor) as total FROM compras WHERE data >= ? AND is_deleted = 0`, 
                [startDate]
            );
            const resCustos = await executeQuery(
                `SELECT SUM(valor_total) as total FROM custos WHERE data >= ? AND is_deleted = 0`, 
                [startDate]
            );
            const expenses = (resCompras.rows.item(0).total || 0) + (resCustos.rows.item(0).total || 0);
            
            const netResult = revenue - expenses;

            // 3. COLHEITA (Produção)
            const resColheita = await executeQuery(
                `SELECT SUM(quantidade) as total FROM colheitas WHERE data >= ? AND is_deleted = 0`, 
                [startDate]
            );
            const producaoTotal = resColheita.rows.item(0).total || 0;

            // 4. ATIVIDADES RECENTES (Unificado)
            const activities = [];
            
            // Vendas Recentes
            const resRecVendas = await executeQuery(
                `SELECT * FROM vendas WHERE is_deleted = 0 ORDER BY data DESC, id DESC LIMIT 2`
            );
            for(let i=0; i<resRecVendas.rows.length; i++) {
                const item = resRecVendas.rows.item(i);
                activities.push({
                    id: `v-${item.uuid}`,
                    type: 'finance',
                    title: 'Venda: ' + item.produto,
                    description: item.cliente,
                    value: `+ R$ ${(item.valor * item.quantidade).toFixed(2)}`,
                    time: item.data,
                    icon: 'cash-outline'
                });
            }

            // Colheitas Recentes
            const resRecColheitas = await executeQuery(
                `SELECT * FROM colheitas WHERE is_deleted = 0 ORDER BY data DESC, id DESC LIMIT 1`
            );
            for(let i=0; i<resRecColheitas.rows.length; i++) {
                const item = resRecColheitas.rows.item(i);
                activities.push({
                    id: `c-${item.uuid}`,
                    type: 'field',
                    title: 'Colheita: ' + item.cultura,
                    description: item.produto,
                    value: `${item.quantidade} kg`,
                    time: item.data,
                    icon: 'leaf-outline'
                });
            }

            // 5. ALERTAS INTELIGENTES
            const alerts = [];
            
            // Alerta: Estoque Baixo
            const resEstoque = await executeQuery('SELECT * FROM estoque WHERE quantidade < 10');
            if (resEstoque.rows.length > 0) {
                alerts.push({
                    id: 'a-stock',
                    type: 'warning',
                    title: 'Estoque Baixo',
                    message: `Existem ${resEstoque.rows.length} itens com nível crítico.`,
                    screen: 'Estoque'
                });
            }

            // Alerta: Irrigação Pendente (Exemplo: se não houve irrigação hoje)
            const today = new Date().toISOString().split('T')[0];
            // Nota: Se a tabela irrigacao não existir, isso vai dar erro, mas o try/catch segura.
            try {
                const resIrrig = await executeQuery('SELECT COUNT(*) as c FROM irrigacao WHERE data = ?', [today]);
                if (resIrrig.rows.item(0).c === 0) {
                    alerts.push({
                        id: 'a-irrig',
                        type: 'info',
                        title: 'Irrigação Diária',
                        message: 'Nenhum turno de irrigação registrado hoje.',
                        screen: 'Irrigacao'
                    });
                }
            } catch (e) {
                // Tabela irrigação pode não existir ainda no esquema
            }

            if (alerts.length === 0) {
                alerts.push({ id: 'a1', type: 'success', title: 'Operação Normal', message: 'Tudo em ordem com a sua fazenda.', screen: 'Home' });
            }

            return {
                financial: {
                    revenue,
                    expenses,
                    netResult,
                    trend: 0,
                    trendType: netResult >= 0 ? 'up' : 'down'
                },
                kpis: [
                    { id: '1', title: 'Produção Total', value: `${producaoTotal.toLocaleString()} kg`, icon: 'leaf', trend: '---', trendType: 'up', color: '#10B981' },
                    { id: '2', title: 'Receita Operacional', value: `R$ ${revenue.toLocaleString()}`, icon: 'cash', trend: '---', trendType: 'up', color: '#3B82F6' },
                    { id: '3', title: 'Despesas Gerais', value: `R$ ${expenses.toLocaleString()}`, icon: 'cart', trend: '---', trendType: 'down', color: '#EF4444' },
                    { id: '4', title: 'Margem Líquida', value: revenue > 0 ? `${((netResult / revenue) * 100).toFixed(1)}%` : '0%', icon: 'pie-chart', trend: '---', trendType: 'up', color: '#8B5CF6' }
                ],
                alerts: alerts,
                activities: activities.sort((a,b) => b.time.localeCompare(a.time)),
                chartData: await DashboardService.getProductionChartData()
            };
        } catch (error) {
            console.error('Erro ao buscar dados reais do dashboard:', error);
            throw error;
        }
    },

    getProductionChartData: async () => {
        try {
            const labels = [];
            const data = [];
            
            for(let i=6; i>=0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dayStr = d.toISOString().split('T')[0];
                labels.push(dayStr.split('-')[2] + '/' + dayStr.split('-')[1]);
                
                const res = await executeQuery(`SELECT SUM(quantidade) as total FROM colheitas WHERE data = ? AND is_deleted = 0`, [dayStr]);
                data.push(res.rows.item(0).total || 0);
            }

            return {
                labels,
                datasets: [{ data }]
            };
        } catch (e) {
            return { labels: ['Erro'], datasets: [{ data: [0] }] };
        }
    }
};

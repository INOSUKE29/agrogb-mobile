/**
 * DashboardService
 * Centraliza a lógica de busca de dados para o Dashboard Executivo.
 * Inicialmente utiliza dados mockados realistas para definição de UI/UX.
 */

export const DashboardService = {
    /**
     * Busca dados consolidados do dashboard
     */
    getDashboardData: async (propertyId = 'all', period = 'month') => {
        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            financial: {
                revenue: 154200.50,
                expenses: 89450.20,
                netResult: 64750.30,
                trend: 12.5, // +12.5% em relação ao período anterior
                trendType: 'up'
            },
            kpis: [
                { id: '1', title: 'Custo por Hectare', value: 'R$ 4.250', icon: 'crop', trend: '5.2%', trendType: 'down', color: '#10B981' },
                { id: '2', title: 'Custo por KG', value: 'R$ 1,12', icon: 'pricetag', trend: '2.1%', trendType: 'up', color: '#3B82F6' },
                { id: '3', title: 'Produtividade', value: '3.420 kg/ha', icon: 'trending-up', trend: '8.4%', trendType: 'up', color: '#F59E0B' },
                { id: '4', title: 'Margem Líquida', value: '42%', icon: 'pie-chart', trend: '1.5%', trendType: 'up', color: '#8B5CF6' }
            ],
            alerts: [
                { id: 'a1', type: 'warning', title: 'Estoque Baixo', message: 'Fertilizante NPK 10-10-10 abaixo do limite de segurança.', screen: 'Estoque' },
                { id: 'a2', type: 'danger', title: 'Contas Vencendo', message: '3 boletos vencem hoje (Total R$ 12.400).', screen: 'Vendas' }, // Redireciona para financeiro (Vendas/Custos)
                { id: 'a3', type: 'info', title: 'Aplicação Programada', message: 'Pulverização Talhão 04 agendada para amanhã.', screen: 'Monitoramento' }
            ],
            activities: [
                { id: 'rec1', type: 'finance', title: 'Venda de Soja', description: 'Carga #402 - 600 sacas', value: '+ R$ 84.000', time: '14:30', icon: 'cash-outline' },
                { id: 'rec2', type: 'field', title: 'Colheita Concluída', description: 'Talhão 12 - Variedade M80', value: '3.200 kg', time: '11:15', icon: 'leaf-outline' },
                { id: 'rec3', type: 'finance', title: 'Compra de Diesel', description: 'Posto Central - 2000L', value: '- R$ 11.200', time: '09:00', icon: 'cart-outline' }
            ],
            chartData: [
                { month: 'Jan', revenue: 45000, expenses: 32000 },
                { month: 'Fev', revenue: 52000, expenses: 38000 },
                { month: 'Mar', revenue: 48000, expenses: 41000 },
                { month: 'Abr', revenue: 61000, expenses: 39000 },
                { month: 'Mai', revenue: 75000, expenses: 42000 },
                { month: 'Jun', revenue: 84000, expenses: 45000 },
            ]
        };
    }
};

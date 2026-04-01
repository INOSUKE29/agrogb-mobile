import { executeQuery } from '../database/database';
import { supabase } from './supabaseClient';

/**
 * DashboardService - Camada de Lógica para a Home 🏛️📊
 * Isola as queries SQL da Interface e centraliza indicadores.
 */
export const DashboardService = {
    /**
     * Obtém todas as estatísticas para a HomeScreen
     */
    getStats: async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const firstDayOfMonth = today.substring(0, 8) + '01';

            // 1. TENTA BUSCAR BI DO SUPABASE (NÍVEL ERP) 🚀
            let biData = { total_vendas: 0, total_custos: 0, lucro_liquido: 0 };
            try {
                const { data } = await supabase.from('view_financeiro_resumo').select('*').limit(1);
                if (data && data[0]) biData = data[0];
            } catch (e) { console.log('[DashboardService] Fallback para SQLite para BI'); }

            const [
                resColheita,
                resVendas,
                resPlantio,
                resMaquinas,
                resCustosMes,
                resComprasMes,
                resVendasMes,
                resDescarte
            ] = await Promise.all([
                // 1. Colheita Hoje (KG)
                executeQuery(`SELECT SUM(quantidade) as total FROM colheitas WHERE data = ? AND is_deleted = 0`, [today]),
                // 2. Vendas Hoje (R$)
                executeQuery(`SELECT SUM(valor) as total FROM vendas WHERE data = ? AND is_deleted = 0`, [today]),
                // 3. Plantio Ativo-
                executeQuery(`SELECT COUNT(*) as total FROM plantio WHERE is_deleted = 0`),
                // 4. Máquinas em Alerta de Revisão
                executeQuery(`SELECT COUNT(*) as total FROM maquinas WHERE horimetro_atual >= intervalo_revisao AND is_deleted = 0`),
                // 5. Custos (Tabela custos)
                executeQuery('SELECT SUM(valor_total) as total FROM custos WHERE data >= ? AND is_deleted = 0', [firstDayOfMonth]),
                // 6. Compras (Tabela compras)
                executeQuery('SELECT SUM(valor) as total FROM compras WHERE data >= ? AND is_deleted = 0', [firstDayOfMonth]),
                // 7. Vendas do Mês
                executeQuery('SELECT SUM(valor) as total FROM vendas WHERE data >= ? AND is_deleted = 0', [firstDayOfMonth]),
                // 8. Perdas/Descartes
                executeQuery('SELECT SUM(quantidade) as total FROM descarte WHERE data >= ? AND is_deleted = 0', [firstDayOfMonth])
            ]);

            const colheitaHoje = resColheita.rows.item(0).total || 0;
            const vendasHoje = resVendas.rows.item(0).total || 0;
            const plantioAtivo = resPlantio.rows.item(0).total || 0;
            const maquinasAlert = resMaquinas.rows.item(0).total || 0;
            
            // Lógica de saldo: BI se disponível, senão SQLite
            const vendasMes = biData.total_vendas || resVendasMes.rows.item(0).total || 0;
            const custosMes = biData.total_custos || (resCustosMes.rows.item(0).total || 0) + (resComprasMes.rows.item(0).total || 0);
            const perdasMes = resDescarte.rows.item(0).total || 0;

            const syncPendentes = await DashboardService.getSyncCount();

            return {
                colheitaHoje,
                vendasHoje,
                plantioAtivo,
                maquinasAlert,
                custosMes,
                vendasMes,
                saldo: biData.lucro_liquido || (vendasMes - custosMes),
                perdasMes,
                syncPendentes
            };
        } catch (error) {
            console.error('[DashboardService] Erro ao carregar estatísticas:', error);
            return {
                colheitaHoje: 0,
                vendasHoje: 0,
                plantioAtivo: 0,
                maquinasAlert: 0,
                custosMes: 0,
                vendasMes: 0,
                saldo: 0,
                perdasMes: 0,
                syncPendentes: 0
            };
        }
    },

    /**
     * Conta quantos registros estão pendentes de sincronização
     */
    getSyncCount: async () => {
        let total = 0;
        const syncTables = [
            'usuarios', 'colheitas', 'vendas', 'compras', 'plantio', 'custos',
            'clientes', 'culturas', 'maquinas', 'caderno_notas', 'areas', 'monitoramento_entidade'
        ];

        try {
            const counts = await Promise.all(
                syncTables.map(table => 
                    executeQuery(`SELECT COUNT(*) as c FROM ${table} WHERE sync_status = 0 OR sync_status = 'pending'`).catch(() => ({ rows: { item: () => ({ c: 0 }) } }))
                )
            );
            total = counts.reduce((acc, curr) => acc + (curr.rows.item(0).c || 0), 0);
        } catch (error) {
            console.warn('[DashboardService] Erro ao contar pendências sync:', error.message);
        }

        return total;
    },

    getUserProfile: async () => {
        try {
            // 1. Tenta buscar da tabela principal de usuários (v1.0.1 fix)
            const resUser = await executeQuery('SELECT nome_completo as name FROM usuarios WHERE nome_completo IS NOT NULL LIMIT 1');
            if (resUser.rows.length > 0) {
                return resUser.rows.item(0);
            }

            // 2. Fallback para user_profiles
            const res = await executeQuery('SELECT name FROM user_profiles LIMIT 1');
            if (res.rows.length > 0) {
                return res.rows.item(0);
            }

            return { name: 'Produtor AgroGB' };
        } catch (error) {
            if (__DEV__) console.warn('[DashboardService] Erro ao buscar perfil:', error.message);
            return { name: 'Produtor AgroGB' };
        }
    }
};

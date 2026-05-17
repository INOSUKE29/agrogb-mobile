import { useState, useEffect, useCallback } from 'react';
import { DashboardService } from '../services/DashboardService';

/**
 * Hook para gerenciar dados do Dashboard Executivo
 */
export function useDashboardData(period = 'month') {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        
        setError(null);
        
        try {
            const dashboardData = await DashboardService.getDashboardData('all', period);
            setData(dashboardData);
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError('Falha ao carregar indicadores. Tente novamente.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [period]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(() => {
        loadData(true);
    }, [loadData]);

    return {
        data,
        loading,
        refreshing,
        error,
        onRefresh,
        reloadData: loadData
    };
}

import { useState, useCallback, useEffect } from 'react';
import { AnalyticsService } from '../services/AnalyticsService';
import { LoggingService } from '../../system/services/LoggingService';

/**
 * useAnalytics Hook (Diamond Pro)
 * Gerencia o estado dos dados analíticos para a Dashboard e Relatórios.
 */
export function useAnalytics() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        roi: 0,
        receita: 0,
        despesa: 0,
        harvest: { percentual: 0, colhido: 0, estimado: 0 },
        anomalies: []
    });

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await AnalyticsService.getDashboardStats();
            
            if (data) {
                const anomalies = await AnalyticsService.getAnomalies();
                setStats({
                    ...data,
                    anomalies
                });
            }
        } catch (error) {
            await LoggingService.logError('useAnalytics', 'loadData', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const refresh = () => {
        setRefreshing(true);
        loadData();
    };

    return {
        ...stats,
        loading,
        refreshing,
        refresh
    };
}

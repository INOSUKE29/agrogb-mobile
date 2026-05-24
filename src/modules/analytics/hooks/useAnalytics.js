import React, { useState, useEffect, useCallback } from 'react';
import { AnalyticsService } from '../../../services/AnalyticsService';

/**
 * useAnalytics - Hook de Inteligência Analítica e BI 📊🌱
 * Gerencia o estado de carregamento, recarregamento e busca 
 * dados financeiros e produtividade direto do AnalyticsService.
 */
export function useAnalytics() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [health, setHealth] = useState({ receita: 0, despesa: 0, lucro: 0, margem: 0 });
    const [productivity, setProductivity] = useState([]);
    const [anomalies, setAnomalies] = useState([]);

    const fetchData = useCallback(async () => {
        try {
            const [healthData, prodData, trendsData] = await Promise.all([
                AnalyticsService.getFinancialHealth(),
                AnalyticsService.getTalhaoProductivity(),
                AnalyticsService.detectProductionTrends()
            ]);
            setHealth(healthData || { receita: 0, despesa: 0, lucro: 0, margem: 0 });
            setProductivity(prodData || []);
            setAnomalies(trendsData || []);
        } catch (error) {
            console.error("[useAnalytics] Erro ao carregar BI:", error);
        }
    }, []);

    const init = useCallback(async () => {
        setLoading(true);
        await fetchData();
        setLoading(false);
    }, [fetchData]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    useEffect(() => {
        init();
    }, [init]);

    return {
        loading,
        refreshing,
        refresh,
        health,
        productivity,
        anomalies
    };
}

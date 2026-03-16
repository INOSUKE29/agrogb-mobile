import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import AnalyticsDashboard from '../ui/components/AnalyticsDashboard';
import RecommendationCard from '../ui/components/RecommendationCard';
import { AnalyticsService } from '../services/AnalyticsService';
import { executeQuery } from '../database/database';

export default function IntelligenceScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [productivity, setProductivity] = useState([]);
    const [finance, setFinance] = useState({ receita: 0, despesa: 0 });
    const [recommendations, setRecommendations] = useState([]);
    const [trends, setTrends] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const prod = await AnalyticsService.getTalhaoProductivity();
            const fin = await AnalyticsService.getFinancialHealth();
            const trendData = await AnalyticsService.detectProductionTrends();
            const recs = await executeQuery(`SELECT * FROM v2_recomendacoes_tecnicas WHERE status = 'Pendente' ORDER BY created_at DESC`);
            
            setProductivity(prod);
            setFinance(fin);
            setTrends(trendData);
            setRecommendations(recs.rows._array || []);
        } catch (error) {
            console.error("Erro ao carregar inteligência:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (loading) {
        return (
            <AppContainer>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#15803D" />
                    <Text style={styles.loadingText}>Processando Inteligência Rural...</Text>
                </View>
            </AppContainer>
        );
    }

    return (
        <AppContainer>
            <ScreenHeader title="INTELIGÊNCIA AGTECH" onBack={() => navigation.goBack()} />
            <ScrollView 
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* 0. ALERTAS DE TENDÊNCIA DE PRODUÇÃO */}
                {trends.length > 0 && (
                    <View style={styles.trendsContainer}>
                        <Text style={styles.sectionTitle}>Alertas de Produtividade 📉</Text>
                        {trends.map((trend, idx) => (
                            <View key={idx} style={[styles.trendCard, { borderLeftColor: trend.nivel === 'CRÍTICO' ? '#EF4444' : '#F59E0B' }]}>
                                <View style={styles.trendHeader}>
                                    <Text style={styles.trendTalhao}>{trend.talhao}</Text>
                                    <View style={[styles.levelBadge, { backgroundColor: trend.nivel === 'CRÍTICO' ? '#FEE2E2' : '#FEF3C7' }]}>
                                        <Text style={[styles.levelText, { color: trend.nivel === 'CRÍTICO' ? '#EF4444' : '#B45309' }]}>{trend.nivel}</Text>
                                    </View>
                                </View>
                                <Text style={styles.trendDesc}>Queda de <Text style={{fontWeight: 'bold'}}>{trend.queda}%</Text> comparado ao mês anterior.</Text>
                                <Text style={styles.trendAction}>💡 {trend.sugestao}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* 1. INSIGHTS E RECOMENDAÇÕES */}
                <Text style={styles.sectionTitle}>Insights Agronômicos ✨</Text>
                {recommendations.length > 0 ? (
                    recommendations.map((rec) => (
                        <RecommendationCard 
                            key={rec.id} 
                            recommendation={rec} 
                            onAction={() => Alert.alert("Sucesso", "Recomendação marcada como aplicada!")}
                        />
                    ))
                ) : (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>Lavoura 100% equilibrada. Nenhuma recomendação necessária.</Text>
                    </View>
                )}

                {/* 2. DASHBOARD DE BI */}
                <AnalyticsDashboard 
                    productivityData={productivity}
                    financialData={finance}
                />

                <View style={styles.footerInfo}>
                    <Text style={styles.footerText}>Dados atualizados em: {new Date().toLocaleTimeString()}</Text>
                </View>
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    content: { paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#15803D', fontWeight: 'bold' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginHorizontal: 20, marginTop: 20, marginBottom: 10 },
    emptyCard: { backgroundColor: '#F0FDF4', padding: 20, borderRadius: 16, marginHorizontal: 20, alignItems: 'center' },
    emptyText: { color: '#15803D', fontSize: 13, textAlign: 'center' },
    footerInfo: { alignItems: 'center', marginTop: 24 },
    footerText: { fontSize: 11, color: '#9CA3AF' },
    trendsContainer: { marginBottom: 10 },
    trendCard: { backgroundColor: '#FFF', marginHorizontal: 20, padding: 16, borderRadius: 16, marginBottom: 12, borderLeftWidth: 5, elevation: 2 },
    trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    trendTalhao: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
    levelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    levelText: { fontSize: 10, fontWeight: 'bold' },
    trendDesc: { fontSize: 13, color: '#4B5563', marginBottom: 6 },
    trendAction: { fontSize: 12, color: '#15803D', fontStyle: 'italic' }
});

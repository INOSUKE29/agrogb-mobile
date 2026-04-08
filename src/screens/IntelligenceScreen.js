import React from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import DashboardContent from '../ui/components/DashboardContent';
import RecommendationCard from '../ui/components/RecommendationCard';
import { useAnalytics } from '../modules/analytics/hooks/useAnalytics';
import { executeQuery } from '../database/database';

/**
 * IntelligenceScreen (Módulo Analytics - Diamond Pro)
 * Camada de visualização da inteligência AgTech.
 */
export default function IntelligenceScreen({ navigation }) {
    const analytics = useAnalytics();
    const [recommendations, setRecommendations] = React.useState([]);

    const loadRecommendations = React.useCallback(async () => {
        try {
            const recs = await executeQuery(`SELECT * FROM v2_recomendacoes_tecnicas WHERE status = 'Pendente' ORDER BY created_at DESC`);
            setRecommendations(recs.rows._array || []);
        } catch (error) {
            console.error("Erro ao carregar recomendações:", error);
        }
    }, []);

    React.useEffect(() => {
        loadRecommendations();
    }, [loadRecommendations]);

    if (analytics.loading) {
        return (
            <AppContainer>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#A3E635" />
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
                refreshControl={<RefreshControl refreshing={analytics.refreshing} onRefresh={analytics.refresh} tintColor="#A3E635" />}
            >
                {/* 1. DASHBOARD DE BI UNIFICADO DIAMOND PRO */}
                <DashboardContent data={analytics} />

                {/* 2. ALERTAS DE TENDÊNCIA DE PRODUÇÃO */}
                {analytics.anomalies.length > 0 && (
                    <View style={styles.trendsContainer}>
                        <Text style={styles.sectionTitle}>Alertas de Produtividade 📉</Text>
                        {analytics.anomalies.map((trend, idx) => (
                            <View key={idx} style={styles.trendCard}>
                                <View style={styles.trendHeader}>
                                    <Text style={styles.trendTalhao}>{trend.talhao}</Text>
                                    <View style={styles.levelBadge}>
                                        <Text style={styles.levelText}>ANOMALIA</Text>
                                    </View>
                                </View>
                                <Text style={styles.trendDesc}>Produção abaixo de 70% da média histórica detectada para este talhão.</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* 3. INSIGHTS E RECOMENDAÇÕES */}
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

                <View style={styles.footerInfo}>
                    <Text style={styles.footerText}>Dados atualizados em: {new Date().toLocaleTimeString()}</Text>
                </View>
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    content: { paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09100c' },
    loadingText: { marginTop: 12, color: '#A3E635', fontWeight: 'bold' },
    sectionTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', marginHorizontal: 20, marginTop: 10, marginBottom: 15, letterSpacing: 1 },
    emptyCard: { backgroundColor: 'rgba(163, 230, 53, 0.05)', padding: 20, borderRadius: 24, marginHorizontal: 20, alignItems: 'center' },
    emptyText: { color: '#A3E635', fontSize: 13, textAlign: 'center', fontWeight: 'bold' },
    footerInfo: { alignItems: 'center', marginTop: 24 },
    footerText: { fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 'bold' },
    trendsContainer: { marginBottom: 10 },
    trendCard: { backgroundColor: 'rgba(239, 68, 68, 0.1)', marginHorizontal: 20, padding: 20, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
    trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    trendTalhao: { fontSize: 16, fontWeight: '900', color: '#FFF' },
    levelBadge: { backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    levelText: { fontSize: 10, fontWeight: '900', color: '#FFF' },
    trendDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 }
});

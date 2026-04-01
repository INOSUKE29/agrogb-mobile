import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Platform } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useWeather } from '../../context/WeatherContext';

const screenWidth = Dimensions.get('window').width;

const GlassCard = ({ children, style }) => {
    const { isDark } = useTheme();
    return (
        <View style={[styles.glassCardContainer, style]}>
            <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.glassBlur}>
                {children}
            </BlurView>
        </View>
    );
};

export default function AnalyticsDashboard({ productivityData, financialData }) {
    const { colors, isDark } = useTheme();
    const { weather, loading: weatherLoading } = useWeather();
    
    // Premium Chart Config (Apple/Fintech Style)
    const chartConfig = {
        backgroundGradientFrom: colors.surface,
        backgroundGradientTo: colors.surface,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // primary emerald
        labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity * 0.5})` : `rgba(15, 23, 42, ${opacity * 0.5})`,
        style: { borderRadius: 24 },
        propsForDots: { r: "4", strokeWidth: "2", stroke: colors.primary },
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
    };

    // Cálculos de Performance
    const hasProductivity = productivityData && productivityData.length > 0;
    const totalProduzido = productivityData?.reduce((acc, curr) => acc + (curr.total_kg || 0), 0) || 0;
    const custoPorKg = totalProduzido > 0 ? (financialData.despesa / totalProduzido).toFixed(2) : '0,00';
    const roi = financialData.despesa > 0 ? (((financialData.receita - financialData.despesa) / financialData.despesa) * 100).toFixed(1) : 0;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            {/* Header com Gradiente Premium */}
            <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerLabel}>VISÃO GERAL</Text>
                        <Text style={styles.headerValue}>R$ {financialData.receita.toLocaleString()}</Text>
                    </View>
                    <View style={styles.headerBadge}>
                        <Ionicons name="trending-up" size={14} color="#FFF" />
                        <Text style={styles.headerBadgeText}>+12.5%</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Secção de Clima e Alertas */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>ALERTA RURAL</Text>
                    <Ionicons name="notifications-outline" size={18} color={colors.primary} />
                </View>
                
                <GlassCard style={styles.weatherCard}>
                    {weatherLoading ? (
                        <Text style={{ color: colors.textSecondary }}>Sincronizando satélite...</Text>
                    ) : weather ? (
                        <View style={styles.weatherRow}>
                            <Ionicons name="sunny" size={32} color="#F59E0B" />
                            <View style={{ marginLeft: 16, flex: 1 }}>
                                <Text style={[styles.weatherTemp, { color: colors.textPrimary }]}>{weather.main?.temp || '--'}°C</Text>
                                <Text style={[styles.weatherDesc, { color: colors.textSecondary }]}>CONDIÇÕES IDEAIS PARA COLHEITA</Text>
                            </View>
                            <View style={styles.humidityBadge}>
                                <Text style={styles.humidityText}>UR {weather.main?.humidity}%</Text>
                            </View>
                        </View>
                    ) : (
                        <Text style={{ color: colors.textSecondary }}>Sem dados climáticos no momento.</Text>
                    )}
                </GlassCard>
            </View>

            {/* Progresso da Colheita (Solicitado pelo User) */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>PROGRESSO DA COLHEITA</Text>
                <GlassCard style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>SAFRA ATUAL</Text>
                        <Text style={[styles.progressPercent, { color: colors.primary }]}>68%</Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}>
                        <LinearGradient 
                            colors={['#10B981', '#34D399']} 
                            style={[styles.progressBarFill, { width: '68%' }]} 
                            start={{ x: 0, y: 0 }} 
                            end={{ x: 1, y: 0 }} 
                        />
                    </View>
                    <Text style={[styles.progressStats, { color: colors.textMuted }]}>14.200 kg colhidos de 21.000 kg estimados</Text>
                </GlassCard>
            </View>

            {/* Métricas Secundárias (Fundo Limpo) */}
            <View style={styles.statsGrid}>
                <View style={[styles.miniCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.miniLabel, { color: colors.textMuted }]}>ROI SAFRA</Text>
                    <Text style={[styles.miniValue, { color: colors.success }]}>{roi}%</Text>
                </View>
                <View style={[styles.miniCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.miniLabel, { color: colors.textMuted }]}>CUSTO/KG</Text>
                    <Text style={[styles.miniValue, { color: colors.textPrimary }]}>R$ {custoPorKg}</Text>
                </View>
            </View>

            {/* Gráficos em Containers Limpos */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>PERFORMANCE POR TALHÃO</Text>
                {hasProductivity ? (
                    <BarChart
                        data={{
                            labels: productivityData.map(d => d.talhao.substring(0, 5)),
                            datasets: [{ data: productivityData.map(d => d.produtividade || 0) }]
                        }}
                        width={screenWidth - 32}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=""
                        fromZero
                        chartConfig={chartConfig}
                        withInnerLines={false}
                        style={styles.chart}
                    />
                ) : (
                    <View style={[styles.emptyChart, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Ionicons name="stats-chart-outline" size={40} color={colors.textMuted} />
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aguardando dados de colheita...</Text>
                    </View>
                )}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    headerValue: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 4 },
    headerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    headerBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
    
    section: { paddingHorizontal: 16, marginTop: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 16 },
    
    glassCardContainer: { borderRadius: 24, overflow: 'hidden' },
    glassBlur: { padding: 20 },
    
    weatherCard: { marginTop: 0 },
    weatherRow: { flexDirection: 'row', alignItems: 'center' },
    weatherTemp: { fontSize: 24, fontWeight: '900' },
    weatherDesc: { fontSize: 10, fontWeight: 'bold' },
    humidityBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 8, borderRadius: 12 },
    humidityText: { color: '#10B981', fontSize: 10, fontWeight: 'bold' },
    
    progressCard: { backgroundColor: 'transparent' },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    progressLabel: { fontSize: 10, fontWeight: '900' },
    progressPercent: { fontSize: 14, fontWeight: '900' },
    progressBarBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 5 },
    progressStats: { fontSize: 11, marginTop: 12, fontWeight: '600' },
    
    statsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 24 },
    miniCard: { flex: 1, padding: 16, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    miniLabel: { fontSize: 10, fontWeight: '900', marginBottom: 6 },
    miniValue: { fontSize: 18, fontWeight: '900' },
    
    chart: { borderRadius: 24, marginTop: 8 },
    emptyChart: { height: 160, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed' },
    emptyText: { marginTop: 12, fontSize: 12, fontWeight: '600' }
});

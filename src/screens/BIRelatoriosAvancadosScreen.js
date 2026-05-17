import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { executeQuery } from '../database/database';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/common/Card';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryGroup, VictoryAxis } from 'victory-native';

const { width } = Dimensions.get('window');

export default function BIRelatoriosAvancadosScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const [data, setData] = useState([]);

    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    const loadData = async () => {
        // Mock data for comparative BI (Safra 2025 vs 2026)
        setData([
            { quarter: 1, yield2025: 12, yield2026: 15 },
            { quarter: 2, yield2025: 18, yield2026: 22 },
            { quarter: 3, yield2025: 25, yield2026: 30 },
            { quarter: 4, yield2025: 20, yield2026: 28 },
        ]);
    };

    const isDark = theme?.theme_mode === 'dark';
    
    // Insight Card Estilos Dinâmicos
    const insightBg = isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFF7ED';
    const insightBorder = isDark ? 'rgba(245, 158, 11, 0.25)' : '#FED7AA';
    const insightText = isDark ? '#FBBF24' : '#92400E';

    // Cores de Eixos e Grade
    const axisColor = activeColors.text || '#1F2937';
    const gridColor = activeColors.border || '#E2E8F0';
    const tickLabelColor = activeColors.textMuted || '#6B7280';

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <LinearGradient 
                colors={[activeColors.primary || '#059669', activeColors.primaryDeep || '#064E3B']} 
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>BI AVANÇADO</Text>
                    <View style={{ width: 38 }} />
                </View>
                <Text style={styles.headerSub}>Comparativo de Safras e Produtividade</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}>
                <Card style={styles.chartCard}>
                    <Text style={[styles.chartTitle, { color: activeColors.textMuted || '#9CA3AF' }]}>
                        PRODUTIVIDADE (TON/HA) - 2025 vs 2026
                    </Text>
                    
                    <VictoryChart 
                        theme={VictoryTheme.material} 
                        width={width - 60} 
                        domainPadding={20}
                    >
                        <VictoryAxis 
                            tickValues={[1, 2, 3, 4]} 
                            tickFormat={["T1", "T2", "T3", "T4"]} 
                            style={{
                                axis: { stroke: axisColor },
                                grid: { stroke: gridColor },
                                tickLabels: { fill: tickLabelColor, fontSize: 10, fontWeight: '700' }
                            }}
                        />
                        <VictoryAxis 
                            dependentAxis 
                            tickFormat={(x) => `${x}t`} 
                            style={{
                                axis: { stroke: axisColor },
                                grid: { stroke: gridColor },
                                tickLabels: { fill: tickLabelColor, fontSize: 10, fontWeight: '700' }
                            }}
                        />
                        <VictoryGroup offset={15} colorScale={[isDark ? '#475569' : '#9CA3AF', activeColors.primary || '#10B981']}>
                            <VictoryBar data={data} x="quarter" y="yield2025" />
                            <VictoryBar data={data} x="quarter" y="yield2026" />
                        </VictoryGroup>
                    </VictoryChart>

                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: isDark ? '#475569' : '#9CA3AF' }]} />
                            <Text style={[styles.legendText, { color: activeColors.text || '#1F2937' }]}>SAFRA 2025</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: activeColors.primary || '#10B981' }]} />
                            <Text style={[styles.legendText, { color: activeColors.text || '#1F2937' }]}>SAFRA 2026</Text>
                        </View>
                    </View>
                </Card>

                <Card style={[styles.insightCard, { backgroundColor: insightBg, borderColor: insightBorder }]}>
                    <View style={styles.insightHeader}>
                        <Ionicons name="bulb-outline" size={20} color="#F59E0B" style={{ marginTop: -2 }} />
                        <Text style={[styles.insightTitle, { color: insightText }]}>INSIGHTS DE IA</Text>
                    </View>
                    <Text style={[styles.insightText, { color: insightText }]}>
                        A produtividade da safra 2026 está <Text style={{ fontWeight: '900', color: activeColors.primary || '#10B981' }}>22% superior</Text> à anterior no mesmo período. 
                        A otimização da fertirrigação no T3 foi o fator determinante para este aumento.
                    </Text>
                </Card>

                <TouchableOpacity style={[styles.exportBtn, { backgroundColor: activeColors.primary || '#1E2937' }]}>
                    <Ionicons name="cloud-download-outline" size={20} color="#FFF" />
                    <Text style={styles.exportText}>EXPORTAR RELATÓRIO EXECUTIVO (PDF)</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textAlign: 'center' },
    chartCard: { padding: 15, alignItems: 'center' },
    chartTitle: { fontSize: 10, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
    legend: { flexDirection: 'row', gap: 20, marginTop: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 10, fontWeight: 'bold' },
    insightCard: { marginTop: 20, padding: 20, borderWidth: 1 },
    insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    insightTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    insightText: { fontSize: 13, lineHeight: 20, fontWeight: '500' },
    exportBtn: { marginVertical: 30, padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    exportText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});

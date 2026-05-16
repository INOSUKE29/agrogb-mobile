import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
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

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#1F2937', '#111827']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>BI AVANÇADO</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.headerSub}>Comparativo de Safras e Produtividade</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                <Card style={styles.chartCard}>
                    <Text style={styles.chartTitle}>PRODUTIVIDADE (TON/HA) - 2025 vs 2026</Text>
                    <VictoryChart theme={VictoryTheme.material} width={width * 0.9} domainPadding={20}>
                        <VictoryAxis tickValues={[1, 2, 3, 4]} tickFormat={["T1", "T2", "T3", "T4"]} />
                        <VictoryAxis dependentAxis tickFormat={(x) => `${x}t`} />
                        <VictoryGroup offset={15} colorScale={["#9CA3AF", "#10B981"]}>
                            <VictoryBar data={data} x="quarter" y="yield2025" />
                            <VictoryBar data={data} x="quarter" y="yield2026" />
                        </VictoryGroup>
                    </VictoryChart>
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: '#9CA3AF' }]} />
                            <Text style={styles.legendText}>SAFRA 2025</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                            <Text style={styles.legendText}>SAFRA 2026</Text>
                        </View>
                    </View>
                </Card>

                <Card style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                        <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
                        <Text style={styles.insightTitle}>INSIGHTS DE IA</Text>
                    </View>
                    <Text style={styles.insightText}>
                        A produtividade da safra 2026 está <Text style={{ fontWeight: 'bold', color: '#10B981' }}>22% superior</Text> à anterior no mesmo período. 
                        A otimização da fertirrigação no T3 foi o fator determinante para este aumento.
                    </Text>
                </Card>

                <TouchableOpacity style={styles.exportBtn}>
                    <Ionicons name="cloud-download-outline" size={20} color="#FFF" />
                    <Text style={styles.exportText}>EXPORTAR RELATÓRIO EXECUTIVO (PDF)</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textAlign: 'center' },
    chartCard: { padding: 15, alignItems: 'center' },
    chartTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 10, letterSpacing: 1 },
    legend: { flexDirection: 'row', gap: 20, marginTop: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 10, fontWeight: 'bold', color: '#6B7280' },
    insightCard: { marginTop: 20, padding: 20, backgroundColor: '#FFF7ED', borderColor: '#FED7AA', borderWidth: 1 },
    insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    insightTitle: { fontSize: 11, fontWeight: '900', color: '#92400E', letterSpacing: 1 },
    insightText: { fontSize: 13, color: '#92400E', lineHeight: 20, fontWeight: '500' },
    exportBtn: { backgroundColor: '#1E2937', marginVertical: 30, padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    exportText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});

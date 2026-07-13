import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function RelatoriosScreen({ navigation }) {
    const [periodo, setPeriodo] = useState('30 Dias');

    const PERIODOS = ['Hoje', '7 Dias', '30 Dias', 'Safra Atual'];

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Ionicons name="bar-chart" size={26} color="#10B981" />
                    <Text style={styles.headerTitle}>Visão Geral</Text>
                </View>
                <TouchableOpacity style={styles.exportBtn}>
                    <Ionicons name="download-outline" size={20} color="#10B981" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* FILTROS DE PERÍODO */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodoScroll} contentContainerStyle={{ paddingRight: 20 }}>
                    {PERIODOS.map(p => {
                        const isActive = periodo === p;
                        return (
                            <TouchableOpacity 
                                key={p} 
                                style={[styles.periodoBtn, isActive && styles.periodoBtnActive]}
                                onPress={() => setPeriodo(p)}
                            >
                                <Text style={[styles.periodoText, isActive && styles.periodoTextActive]}>{p}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* LUCRO LÍQUIDO */}
                <View style={styles.highlightCard}>
                    <Text style={styles.highlightLabel}>LUCRO LÍQUIDO</Text>
                    <Text style={styles.highlightValue}>R$ 0,00</Text>
                    <View style={styles.badgeRow}>
                        <View style={[styles.badgePositive, { backgroundColor: 'transparent' }]}>
                            <Text style={[styles.badgeTextPositive, { color: '#64748B' }]}>Sem dados no período</Text>
                        </View>
                    </View>
                </View>

                {/* KPIs */}
                <View style={styles.kpiGrid}>
                    <View style={styles.kpiCard}>
                        <View style={styles.kpiHeader}>
                            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Ionicons name="arrow-down" size={16} color="#10B981" />
                            </View>
                        </View>
                        <Text style={styles.kpiValue}>R$ 0,00</Text>
                        <Text style={styles.kpiLabel}>Receitas</Text>
                    </View>

                    <View style={styles.kpiCard}>
                        <View style={styles.kpiHeader}>
                            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <Ionicons name="arrow-up" size={16} color="#EF4444" />
                            </View>
                        </View>
                        <Text style={styles.kpiValue}>R$ 0,00</Text>
                        <Text style={styles.kpiLabel}>Custos</Text>
                    </View>
                    
                    <View style={styles.kpiCard}>
                        <View style={styles.kpiHeader}>
                            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                <Ionicons name="basket" size={16} color="#3B82F6" />
                            </View>
                        </View>
                        <Text style={styles.kpiValue}>0 kg</Text>
                        <Text style={styles.kpiLabel}>Produção Total</Text>
                    </View>
                    
                    <View style={styles.kpiCard}>
                        <View style={styles.kpiHeader}>
                            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                <Ionicons name="pricetag" size={16} color="#F59E0B" />
                            </View>
                        </View>
                        <Text style={styles.kpiValue}>R$ 0,00</Text>
                        <Text style={styles.kpiLabel}>Ticket Médio/kg</Text>
                    </View>
                </View>

                <View style={styles.chartSection}>
                    <Text style={styles.sectionTitle}>Fluxo de Caixa (Receitas vs Custos)</Text>
                    <Text style={{ textAlign: 'center', color: '#64748B', marginTop: 20 }}>Gráfico indisponível por falta de dados.</Text>
                </View>

                {/* RANKING (Despesas por Categoria) */}
                <Text style={styles.sectionTitle}>Maiores Despesas</Text>
                <View style={styles.rankingCard}>
                    <Text style={{ textAlign: 'center', color: '#64748B', paddingVertical: 10 }}>Nenhuma despesa registrada no período.</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B121E' },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#111827' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#F8FAFC', marginLeft: 8 },
    exportBtn: { width: 40, height: 40, backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: 12, borderWidth: 1, borderColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
    
    content: { paddingBottom: 40 },
    
    periodoScroll: { paddingHorizontal: 20, marginTop: 20, marginBottom: 20, flexGrow: 0 },
    periodoBtn: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#1F2937', marginRight: 10 },
    periodoBtnActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    periodoText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
    periodoTextActive: { color: '#FFF', fontWeight: '900' },

    highlightCard: { backgroundColor: '#111827', marginHorizontal: 20, padding: 25, borderRadius: 24, borderWidth: 1, borderColor: '#1F2937', alignItems: 'center', marginBottom: 20 },
    highlightLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
    highlightValue: { color: '#F8FAFC', fontSize: 36, fontWeight: '900', letterSpacing: -1, marginBottom: 12 },
    badgeRow: { flexDirection: 'row' },
    badgePositive: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
    badgeTextPositive: { color: '#10B981', fontSize: 12, fontWeight: '800', marginLeft: 4 },

    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between', marginBottom: 25 },
    kpiCard: { width: '48%', backgroundColor: '#111827', borderRadius: 20, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#1F2937' },
    kpiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    kpiIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    kpiTrend: { fontSize: 13, fontWeight: '800' },
    kpiValue: { color: '#F8FAFC', fontSize: 20, fontWeight: '900', marginBottom: 4 },
    kpiLabel: { color: '#64748B', fontSize: 12, fontWeight: '600' },

    sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '900', marginHorizontal: 20, marginBottom: 15 },
    
    chartSection: { backgroundColor: '#111827', marginHorizontal: 20, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#1F2937', marginBottom: 25 },
    chartMock: { height: 180, marginTop: 20, position: 'relative' },
    gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#1F2937' },
    barsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 10 },
    barGroup: { alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
    barWrapper: { flexDirection: 'row', height: '80%', alignItems: 'flex-end', gap: 4 },
    bar: { width: 14, borderRadius: 7 },
    barNegative: { width: 14, borderRadius: 7 },
    barLabel: { color: '#64748B', fontSize: 10, fontWeight: '700', marginTop: 12 },

    rankingCard: { backgroundColor: '#111827', marginHorizontal: 20, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#1F2937' },
    rankingRow: { marginBottom: 15 },
    rankingInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    rankingName: { color: '#E2E8F0', fontSize: 13, fontWeight: '700' },
    rankingProgressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    progressBarBg: { flex: 1, height: 6, backgroundColor: '#1F2937', borderRadius: 3, marginRight: 15, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    rankingVal: { color: '#94A3B8', fontSize: 12, fontWeight: '800', width: 70, textAlign: 'right' }
});

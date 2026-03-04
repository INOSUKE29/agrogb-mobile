import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { executeQuery } from '../database/database';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import AppContainer from '../ui/AppContainer';
import GlowCard from '../ui/GlowCard';
import { DARK } from '../styles/darkTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

const CHART_CFG = {
    backgroundGradientFrom: '#0F2E28',
    backgroundGradientTo: '#0F2E28',
    color: (opacity = 1) => `rgba(0, 255, 156, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(168, 197, 190, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.65,
    propsForDots: { r: '4', strokeWidth: '1', stroke: '#00FF9C' },
    propsForBackgroundLines: { stroke: 'rgba(0,255,156,0.08)' },
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function RelatoriosScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [kpi, setKpi] = useState({ prod: 0, faturamento: 0, custos: 0, lucro: 0 });
    const [monthlyProd, setMonthlyProd] = useState(Array(6).fill(0));
    const [monthlyRevCost, setMonthlyRevCost] = useState({ rev: Array(6).fill(0), cost: Array(6).fill(0) });
    const [period, setPeriod] = useState('mes'); // 'mes' | 'trimestre' | 'ano'

    const loadData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            let startDate;
            if (period === 'mes') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            else if (period === 'trimestre') { startDate = new Date(now); startDate.setMonth(now.getMonth() - 3); }
            else { startDate = new Date(now.getFullYear(), 0, 1); }
            const start = startDate.toISOString().split('T')[0];

            const rProd = await executeQuery('SELECT SUM(quantidade) as t FROM colheitas WHERE data >= ?', [start]);
            const rFat = await executeQuery("SELECT SUM(valor * quantidade) as t FROM vendas WHERE status_pagamento = 'RECEBIDO' AND data >= ?", [start]);
            const rCust = await executeQuery('SELECT SUM(valor_total) as t FROM custos WHERE data >= ?', [start]);
            const prod = rProd.rows.item(0).t || 0;
            const fat = rFat.rows.item(0).t || 0;
            const cust = rCust.rows.item(0).t || 0;
            setKpi({ prod, faturamento: fat, custos: cust, lucro: fat - cust });

            // Monthly production last 6 months
            const prodArr = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const r = await executeQuery(`SELECT SUM(quantidade) as t FROM colheitas WHERE strftime('%Y-%m', data) = ?`, [`${y}-${m}`]);
                prodArr.push(r.rows.item(0).t || 0);
            }
            setMonthlyProd(prodArr);

            // Monthly revenue vs cost last 6 months
            const revArr = [], costArr = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const rr = await executeQuery(`SELECT SUM(valor * quantidade) as t FROM vendas WHERE status_pagamento = 'RECEBIDO' AND strftime('%Y-%m', data) = ?`, [`${y}-${m}`]);
                const rc = await executeQuery(`SELECT SUM(valor_total) as t FROM custos WHERE strftime('%Y-%m', data) = ?`, [`${y}-${m}`]);
                revArr.push(rr.rows.item(0).t || 0);
                costArr.push(rc.rows.item(0).t || 0);
            }
            setMonthlyRevCost({ rev: revArr, cost: costArr });
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { loadData(); }, [period]));

    const fmtBRL = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const fmtKg = (v) => `${(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`;

    const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return MONTHS[d.getMonth()];
    });

    const kpis = [
        { label: 'PRODUÇÃO', value: fmtKg(kpi.prod), icon: 'leaf', color: '#00FF9C' },
        { label: 'FATURAMENTO', value: fmtBRL(kpi.faturamento), icon: 'cash', color: '#1BFFB2' },
        { label: 'CUSTOS', value: fmtBRL(kpi.custos), icon: 'wallet', color: '#FF6B6B' },
        { label: 'LUCRO LÍQUIDO', value: fmtBRL(kpi.lucro), icon: 'trending-up', color: kpi.lucro >= 0 ? '#00FF9C' : '#FF3B3B' },
    ];

    return (
        <AppContainer>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.title}>RELATÓRIOS</Text>
                <View style={{ width: 28 }} />
            </View>
            <View style={styles.glowLine} />

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={DARK.glow} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                    {/* PERIOD PILLS */}
                    <View style={styles.periodRow}>
                        {[['mes', 'ESTE MÊS'], ['trimestre', 'TRIMESTRE'], ['ano', 'ANO']].map(([k, l]) => (
                            <TouchableOpacity key={k} style={[styles.pill, period === k && styles.pillActive]} onPress={() => setPeriod(k)}>
                                <Text style={[styles.pillText, period === k && styles.pillTextActive]}>{l}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* KPI CARDS 2x2 */}
                    <View style={styles.kpiGrid}>
                        {kpis.map(({ label, value, icon, color }) => (
                            <GlowCard key={label} style={[styles.kpiCard, { borderColor: color + '40' }]}>
                                <View style={[styles.kpiIcon, { backgroundColor: color + '18' }]}>
                                    <Ionicons name={icon} size={20} color={color} />
                                </View>
                                <Text style={[styles.kpiValue, { color }]}>{value}</Text>
                                <Text style={styles.kpiLabel}>{label}</Text>
                            </GlowCard>
                        ))}
                    </View>

                    {/* CHART: PRODUÇÃO MENSAL */}
                    <GlowCard style={{ marginBottom: 20 }}>
                        <Text style={styles.chartTitle}>📦 PRODUÇÃO MENSAL (kg)</Text>
                        <LineChart
                            data={{ labels: last6Months, datasets: [{ data: monthlyProd.map(v => Math.max(v, 0)) }] }}
                            width={CHART_WIDTH}
                            height={180}
                            chartConfig={CHART_CFG}
                            bezier
                            style={{ borderRadius: 12, marginTop: 10 }}
                            withInnerLines={true}
                            withOuterLines={false}
                        />
                    </GlowCard>

                    {/* CHART: RECEITA VS CUSTO */}
                    <GlowCard style={{ marginBottom: 20 }}>
                        <Text style={styles.chartTitle}>💰 RECEITA vs CUSTO (R$)</Text>
                        <View style={styles.legendRow}>
                            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#00FF9C' }]} /><Text style={styles.legendText}>Receita</Text></View>
                            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} /><Text style={styles.legendText}>Custo</Text></View>
                        </View>
                        <BarChart
                            data={{
                                labels: last6Months,
                                datasets: [
                                    { data: monthlyRevCost.rev.map(v => Math.max(v, 0)), color: () => '#00FF9C' },
                                    { data: monthlyRevCost.cost.map(v => Math.max(v, 0)), color: () => '#FF6B6B' }
                                ]
                            }}
                            width={CHART_WIDTH}
                            height={180}
                            chartConfig={{ ...CHART_CFG, color: (opacity) => `rgba(0,255,156,${opacity})` }}
                            style={{ borderRadius: 12, marginTop: 10 }}
                            withInnerLines={true}
                            withCustomBarColorFromData
                            flatColor
                            showValuesOnTopOfBars={false}
                        />
                    </GlowCard>

                    {/* INSIGHT BOX */}
                    <GlowCard style={{ borderColor: kpi.lucro >= 0 ? 'rgba(0,255,156,0.35)' : 'rgba(255,59,59,0.35)' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <Ionicons name={kpi.lucro >= 0 ? 'trending-up' : 'trending-down'} size={22} color={kpi.lucro >= 0 ? DARK.glow : DARK.danger} />
                            <Text style={[styles.chartTitle, { marginBottom: 0 }]}>RESUMO DO PERÍODO</Text>
                        </View>
                        <Text style={styles.insightText}>Lucro Líquido: <Text style={{ color: kpi.lucro >= 0 ? DARK.glow : DARK.danger, fontWeight: 'bold' }}>{fmtBRL(kpi.lucro)}</Text></Text>
                        {kpi.faturamento > 0 && (
                            <Text style={styles.insightText}>Margem: <Text style={{ color: DARK.glow, fontWeight: 'bold' }}>{((kpi.lucro / kpi.faturamento) * 100).toFixed(1)}%</Text></Text>
                        )}
                        <Text style={styles.insightText}>Produção total: <Text style={{ color: DARK.glow, fontWeight: 'bold' }}>{fmtKg(kpi.prod)}</Text></Text>
                    </GlowCard>
                </ScrollView>
            )}
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 15, fontWeight: '900', color: DARK.textPrimary, letterSpacing: 1 },
    glowLine: { height: 1, backgroundColor: DARK.glowLine, marginBottom: 4 },

    periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(0,255,156,0.05)', borderWidth: 1, borderColor: DARK.glowBorder },
    pillActive: { backgroundColor: DARK.glow, borderColor: DARK.glow },
    pillText: { fontSize: 11, fontWeight: 'bold', color: DARK.textMuted },
    pillTextActive: { color: '#061E1A' },

    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    kpiCard: { width: (SCREEN_WIDTH - 52) / 2, alignItems: 'center', padding: 16 },
    kpiIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    kpiValue: { fontSize: 15, fontWeight: '900', marginBottom: 4 },
    kpiLabel: { fontSize: 9, fontWeight: '900', color: DARK.textMuted, letterSpacing: 1, textAlign: 'center' },

    chartTitle: { fontSize: 11, fontWeight: '900', color: DARK.glow, letterSpacing: 1, marginBottom: 4 },
    legendRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 10, color: DARK.textMuted, fontWeight: 'bold' },

    insightText: { fontSize: 13, color: DARK.textSecondary, marginBottom: 6, lineHeight: 20 },
});

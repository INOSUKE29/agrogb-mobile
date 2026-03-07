import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Share } from 'react-native';
import { executeQuery } from '../database/database';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import { showToast } from '../ui/Toast';
import { generatePDFAgro } from '../services/ReportService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48; // Padding ajustado para GlowCard

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function RelatoriosScreen({ navigation }) {
    const { colors, theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [kpi, setKpi] = useState({ prod: 0, faturamento: 0, custos: 0, lucro: 0 });
    const [monthlyProd, setMonthlyProd] = useState(Array(6).fill(0));
    const [monthlyRevCost, setMonthlyRevCost] = useState({ rev: Array(6).fill(0), cost: Array(6).fill(0) });
    const [period, setPeriod] = useState('mes'); // 'mes' | 'trimestre' | 'ano'

    const isDark = theme === 'dark' || theme === 'ultra_premium';

    const chartConfig = {
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        color: (opacity = 1) => colors.primary,
        labelColor: (opacity = 1) => colors.textMuted,
        strokeWidth: 2,
        barPercentage: 0.6,
        useShadowColorFromDataset: false,
        propsForDots: { r: '4', strokeWidth: '1', stroke: colors.primary },
        propsForBackgroundLines: { stroke: colors.glassBorder, strokeDasharray: '' },
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            let startDate;
            if (period === 'mes') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            else if (period === 'trimestre') { startDate = new Date(now); startDate.setMonth(now.getMonth() - 3); }
            else { startDate = new Date(now.getFullYear(), 0, 1); }
            const start = startDate.toISOString().split('T')[0];

            const rProd = await executeQuery('SELECT SUM(quantidade) as t FROM colheitas WHERE data >= ? AND is_deleted = 0', [start]);
            const rFat = await executeQuery("SELECT SUM(valor * quantidade) as t FROM vendas WHERE data >= ? AND is_deleted = 0", [start]);
            const rCust = await executeQuery('SELECT SUM(valor_total) as t FROM custos WHERE data >= ? AND is_deleted = 0', [start]);

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
                const r = await executeQuery(`SELECT SUM(quantidade) as t FROM colheitas WHERE strftime('%Y-%m', data) = ? AND is_deleted = 0`, [`${y}-${m}`]);
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
                const rr = await executeQuery(`SELECT SUM(valor * quantidade) as t FROM vendas WHERE strftime('%Y-%m', data) = ? AND is_deleted = 0`, [`${y}-${m}`]);
                const rc = await executeQuery(`SELECT SUM(valor_total) as t FROM custos WHERE strftime('%Y-%m', data) = ? AND is_deleted = 0`, [`${y}-${m}`]);
                revArr.push(rr.rows.item(0).t || 0);
                costArr.push(rc.rows.item(0).t || 0);
            }
            setMonthlyRevCost({ rev: revArr, cost: costArr });
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { loadData(); }, [period]));

    const fmtBRL = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const fmtKg = (v) => `${(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`;

    const last6MonthsLabels = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return MONTHS[d.getMonth()];
    });

    const handleExport = async (type) => {
        const now = new Date().toISOString().split('T')[0];
        const past = new Date();
        past.setMonth(past.getMonth() - 1);
        const start = past.toISOString().split('T')[0];

        showToast(`Gerando PDF de ${type}...`);
        await generatePDFAgro(type, start, now);
    };

    return (
        <AppContainer>
            <ScreenHeader
                title="INTELIGÊNCIA"
                onBack={() => navigation.goBack()}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* SELETOR DE PERÍODO */}
                <View style={styles.periodSelector}>
                    {[
                        { id: 'mes', label: 'ESTE MÊS' },
                        { id: 'trimestre', label: '3 MESES' },
                        { id: 'ano', label: 'ESTE ANO' }
                    ].map((p) => (
                        <TouchableOpacity
                            key={p.id}
                            onPress={() => setPeriod(p.id)}
                            style={[
                                styles.periodBtn,
                                { borderColor: colors.glassBorder },
                                period === p.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                            ]}
                        >
                            <Text style={[
                                styles.periodText,
                                { color: colors.textSecondary },
                                period === p.id && { color: '#FFF' }
                            ]}>{p.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* KPI GRID */}
                <View style={styles.kpiGrid}>
                    <GlowCard style={styles.kpiCard}>
                        <Ionicons name="leaf" size={20} color={colors.primary} />
                        <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>PRODUÇÃO</Text>
                        <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{fmtKg(kpi.prod)}</Text>
                    </GlowCard>

                    <GlowCard style={styles.kpiCard}>
                        <Ionicons name="cash" size={20} color={colors.glow} />
                        <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>FATURAMENTO</Text>
                        <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{fmtBRL(kpi.faturamento)}</Text>
                    </GlowCard>

                    <GlowCard style={styles.kpiCard}>
                        <Ionicons name="wallet" size={20} color={colors.danger} />
                        <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>CUSTOS</Text>
                        <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{fmtBRL(kpi.custos)}</Text>
                    </GlowCard>

                    <GlowCard style={styles.kpiCard}>
                        <Ionicons name="trending-up" size={20} color={colors.success || colors.primary} />
                        <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>LUCRO ESTIMADO</Text>
                        <Text style={[styles.kpiValue, { color: kpi.lucro >= 0 ? colors.success || colors.primary : colors.danger }]}>
                            {fmtBRL(kpi.lucro)}
                        </Text>
                    </GlowCard>
                </View>

                {/* GRÁFICO PRODUÇÃO */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>EVOLUÇÃO DE PRODUÇÃO (KG)</Text>
                <GlowCard style={styles.chartCard}>
                    <LineChart
                        data={{
                            labels: last6MonthsLabels,
                            datasets: [{ data: monthlyProd.map(v => Math.max(v, 0)) }]
                        }}
                        width={CHART_WIDTH - 32}
                        height={180}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                        withInnerLines={true}
                        withOuterLines={false}
                    />
                </GlowCard>

                {/* GRÁFICO FINANCEIRO */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>RECEITA vs CUSTO (R$)</Text>
                <GlowCard style={styles.chartCard}>
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.legendText, { color: colors.textMuted }]}>Receita</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: colors.danger }]} />
                            <Text style={[styles.legendText, { color: colors.textMuted }]}>Custo</Text>
                        </View>
                    </View>
                    <BarChart
                        data={{
                            labels: last6MonthsLabels,
                            datasets: [
                                { data: monthlyRevCost.rev.map(v => Math.max(v, 0)), color: () => colors.primary },
                                { data: monthlyRevCost.cost.map(v => Math.max(v, 0)), color: () => colors.danger }
                            ]
                        }}
                        width={CHART_WIDTH - 32}
                        height={180}
                        chartConfig={{ ...chartConfig, color: (opacity = 1) => colors.primary }}
                        style={styles.chart}
                        flatColor={true}
                        withCustomBarColorFromData={true}
                    />
                </GlowCard>

                {/* MENU DE EXPORTAÇÃO */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>REPOSITÓRIO E EXPORTAÇÃO (PDF)</Text>
                <GlowCard style={styles.exportSection}>
                    <TouchableOpacity style={styles.exportItem} onPress={() => handleExport('VENDAS')}>
                        <View style={[styles.exportIcon, { backgroundColor: colors.primary + '15' }]}>
                            <MaterialCommunityIcons name="file-pdf-box" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.exportInfo}>
                            <Text style={[styles.exportLabel, { color: colors.textPrimary }]}>Relatório de Vendas</Text>
                            <Text style={[styles.exportDesc, { color: colors.textMuted }]}>Detalhamento de comercialização</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />

                    <TouchableOpacity style={styles.exportItem} onPress={() => handleExport('ESTOQUE')}>
                        <View style={[styles.exportIcon, { backgroundColor: colors.primary + '15' }]}>
                            <MaterialCommunityIcons name="file-pdf-box" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.exportInfo}>
                            <Text style={[styles.exportLabel, { color: colors.textPrimary }]}>Inventário de Estoque</Text>
                            <Text style={[styles.exportDesc, { color: colors.textMuted }]}>Posição atual de insumos e produtos</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />

                    <TouchableOpacity style={styles.exportItem} onPress={() => handleExport('COLHEITA')}>
                        <View style={[styles.exportIcon, { backgroundColor: colors.primary + '15' }]}>
                            <MaterialCommunityIcons name="file-pdf-box" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.exportInfo}>
                            <Text style={[styles.exportLabel, { color: colors.textPrimary }]}>Histórico de Colheitas</Text>
                            <Text style={[styles.exportDesc, { color: colors.textMuted }]}>Rastreabilidade de campo</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                </GlowCard>

                <View style={{ height: 40 }} />
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: 20,
    },
    periodSelector: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    periodBtn: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    periodText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 25,
    },
    kpiCard: {
        width: (SCREEN_WIDTH - 52) / 2,
        padding: 16,
        alignItems: 'flex-start',
    },
    kpiLabel: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
        marginTop: 10,
        marginBottom: 4,
    },
    kpiValue: {
        fontSize: 16,
        fontWeight: '900',
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    chartCard: {
        padding: 16,
        marginBottom: 25,
        alignItems: 'center',
    },
    chart: {
        borderRadius: 12,
        marginTop: 10,
    },
    legend: {
        flexDirection: 'row',
        gap: 20,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 10,
        fontWeight: '700',
    },
    exportSection: {
        padding: 4,
        marginBottom: 20,
    },
    exportItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    exportIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    exportInfo: {
        flex: 1,
        marginLeft: 12,
    },
    exportLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    exportDesc: {
        fontSize: 11,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginHorizontal: 12,
    }
});

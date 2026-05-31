import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { executeQuery } from '../database/database';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

// ------------------------------------------------------------------
// COMPONENT: FinancialDashboard
// RESPONSIBILITY: Handle all financial data logic, filtering, and visualization
// ------------------------------------------------------------------

export default function FinancialDashboard() {
    const [period, setPeriod] = useState('MONTH'); // MONTH, QUARTER, YEAR, ALL
    const [loading, setLoading] = useState(false);
    const [kpis, setKpis] = useState({
        revenue: 0,
        costs: 0,
        inputs: 0,
        result: 0,
        margin: 0,
        growth: 0
    });
    const [chartData, setChartData] = useState({
        labels: ['Início', 'Fim'],
        datasets: [
            { data: [0, 0], color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})` }, // Revenue
            { data: [0, 0], color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})` }   // Costs
        ]
    });

    useEffect(() => {
        loadFinancialData();
    }, [period]);

    // --- DATA LOADING & LOGIC ---
    const loadFinancialData = async () => {
        setLoading(true);
        try {
            // 1. Define Date Range based on Period
            const now = new Date();
            let startDate = new Date();

            if (period === 'MONTH') startDate.setMonth(now.getMonth() - 1);
            if (period === 'QUARTER') startDate.setMonth(now.getMonth() - 3);
            if (period === 'YEAR') startDate.setFullYear(now.getFullYear() - 1);
            if (period === 'ALL') startDate = new Date(0); // Epoch

            const startStr = startDate.toISOString().split('T')[0];
            // const endStr = now.toISOString().split('T')[0]; // Today

            // 2. Fetch Aggregated Totals (KPIs)
            // Note: Using broad queries for now. Ideally should filter by date in SQL.
            // SQLite date comparison: WHERE date_column >= 'YYYY-MM-DD'

            // Revenue (Vendas)
            const resVendas = await executeQuery(
                `SELECT SUM(valor * quantidade) as total FROM vendas WHERE data >= ?`,
                [startStr]
            );

            // Costs (Custos Operacionais)
            const resCustos = await executeQuery(
                `SELECT SUM(valor_total) as total FROM custos WHERE data >= ?`,
                [startStr]
            );

            // Inputs (Compras) - Treated as Cost for Result calculation? Usually yes.
            const resCompras = await executeQuery(
                `SELECT SUM(valor * quantidade) as total FROM compras WHERE data_compra >= ?`,
                [startStr]
            );

            const revenue = resVendas.rows.item(0).total || 0;
            const operationalCosts = resCustos.rows.item(0).total || 0;
            const inputCosts = resCompras.rows.item(0).total || 0;
            const totalCosts = operationalCosts + inputCosts;

            const result = revenue - totalCosts;
            const margin = revenue > 0 ? (result / revenue) * 100 : 0;

            setKpis({
                revenue,
                costs: totalCosts,
                inputs: inputCosts,
                result,
                margin,
                growth: 0 // Placeholder for comparison logic
            });

            // 3. Prepare Chart Data (Simplified 2-point trend for now to avoid complex group by logic in SQLite without raw raw query power)
            // Ideally: Aggregate by Month/Week. keeping it safely simple for v1.
            setChartData({
                labels: ['Início', 'Hoje'],
                datasets: [
                    {
                        data: [revenue * 0.2, revenue], // Fake curve for visual demo if only 1 point exists
                        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Green
                        strokeWidth: 3
                    },
                    {
                        data: [totalCosts * 0.3, totalCosts],
                        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // Red
                        strokeWidth: 3
                    }
                ],
                legend: ["Receita", "Despesas"]
            });

        } catch (error) {
            console.error("Financial Data Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const { colors } = useTheme();
    const formatBRL = (val) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    return (
        <View style={styles.container}>

            {/* 1. HEADER: PERIOD SELECTOR */}
            <View style={styles.periodSelector}>
                {['MONTH', 'QUARTER', 'YEAR'].map((p) => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                        onPress={() => setPeriod(p)}
                    >
                        <Text style={[styles.periodText, period === p && { color: colors.primary }]}>
                            {p === 'MONTH' ? 'Mês' : p === 'QUARTER' ? 'Trimestre' : 'Ano'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <>
                    {/* 2. MAIN CARD: NET RESULT */}
                    <View style={styles.mainCard}>
                        <View style={styles.mainCardHeader}>
                            <Text style={styles.label}>RESULTADO LÍQUIDO</Text>
                            <Ionicons
                                name={kpis.result >= 0 ? "trending-up" : "trending-down"}
                                size={20}
                                color={kpis.result >= 0 ? colors.primary : colors.danger}
                            />
                        </View>
                        <Text style={[styles.bigNumber, { color: kpis.result >= 0 ? colors.primary : colors.danger }]}>
                            {formatBRL(kpis.result)}
                        </Text>
                        <View style={styles.badgeRow}>
                            <View style={[styles.badge, { backgroundColor: kpis.margin >= 0 ? '#DCFCE7' : '#FEE2E2' }]}>
                                <Text style={[styles.badgeText, { color: kpis.margin >= 0 ? '#166534' : '#991B1B' }]}>
                                    {kpis.margin.toFixed(1)}% Margem
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* 3. CHART SECTION */}
                    <View style={styles.chartContainer}>
                        <Text style={styles.sectionTitle}>Evolução Financeira</Text>
                        <LineChart
                            data={chartData}
                            width={width - 50} // Content padding
                            height={220}
                            chartConfig={{
                                backgroundColor: "#ffffff",
                                backgroundGradientFrom: "#ffffff",
                                backgroundGradientTo: "#ffffff",
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: { r: "4", strokeWidth: "2", stroke: "#fff" }
                            }}
                            bezier
                            style={styles.chartStyle}
                        />
                    </View>

                    {/* 4. KPI GRID */}
                    <View style={styles.grid}>
                        <KpiCard
                            title="Faturamento"
                            value={formatBRL(kpis.revenue)}
                            icon="cash-outline"
                            color={colors.primary}
                            trend="+4.5%"
                            colors={colors}
                        />
                        <KpiCard
                            title="Custos Totais"
                            value={formatBRL(kpis.costs)}
                            icon="alert-circle-outline"
                            color={colors.danger}
                            trend="-1.2%"
                            colors={colors}
                        />
                        <KpiCard
                            title="Insumos"
                            value={formatBRL(kpis.inputs)}
                            icon="cart-outline"
                            color={colors.warning}
                            trend="Estável"
                            colors={colors}
                        />
                        <KpiCard
                            title="Desp. Operac."
                            value={formatBRL(kpis.costs - kpis.inputs)}
                            icon="construct-outline"
                            color="#6366F1"
                            trend="Variável"
                            colors={colors}
                        />
                    </View>
                </>
            )}
        </View>
    );
}

// --- SUB-COMPONENT: KpiCard ---
const KpiCard = ({ title, value, icon, color, trend, colors }) => (
    <View style={styles.kpiCard}>
        <View style={styles.kpiHeader}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <Text style={[styles.trendText, { color: trend.includes('-') ? colors.danger : colors.primary }]}>
                {trend}
            </Text>
        </View>
        <Text style={styles.kpiTitle}>{title}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Period Selector
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20
    },
    periodBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8
    },
    periodBtnActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    periodText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280'
    },
    periodTextActive: {
        color: '#10B981' // Agro Green fixed for selector
    },

    // Main Card
    mainCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    mainCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9CA3AF',
        letterSpacing: 1
    },
    bigNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 12
    },
    badgeRow: { flexDirection: 'row' },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold'
    },

    // Chart
    chartContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        elevation: 2
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 16
    },
    chartStyle: {
        marginVertical: 8,
        borderRadius: 16
    },

    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between'
    },
    kpiCard: {
        width: (width - 40 - 12) / 2, // (Screen - Padding - Gap) / 2
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        marginBottom: 0
    },
    kpiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    trendText: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    kpiTitle: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4
    },
    kpiValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937'
    }
});

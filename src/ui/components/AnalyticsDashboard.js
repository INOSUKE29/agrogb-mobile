
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsDashboard({ productivityData, financialData }) {
    
    // Configuração de cores Premium
    const chartConfig = {
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(21, 128, 61, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: { r: "6", strokeWidth: "2", stroke: "#15803D" },
        barPercentage: 0.6,
    };

    const hasProductivity = productivityData && productivityData.length > 0;
    
    // Cálculos de ROI e Eficiência
    const totalProduzido = productivityData?.reduce((acc, curr) => acc + (curr.total_kg || 0), 0) || 0;
    const custoPorKg = totalProduzido > 0 ? (financialData.despesa / totalProduzido).toFixed(2) : 0;
    const roi = financialData.despesa > 0 ? (((financialData.receita - financialData.despesa) / financialData.despesa) * 100).toFixed(1) : 0;

    return (
        <View style={styles.container}>
            <Text style={styles.mainTitle}>Performance Rural 📈</Text>

            {/* Cards de Métricas Premium */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
                    <Text style={styles.statLabel}>Eficiência (ROI)</Text>
                    <Text style={[styles.statValue, { color: '#059669' }]}>{roi}%</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: '#6366F1' }]}>
                    <Text style={styles.statLabel}>Custo / Kg</Text>
                    <Text style={[styles.statValue, { color: '#4F46E5' }]}>R$ {custoPorKg}</Text>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={[styles.statCard, { borderLeftColor: '#10B981', flex: 1.5 }]}>
                    <Text style={styles.statLabel}>Receita Total</Text>
                    <Text style={[styles.statValue, { color: '#059669', fontSize: 20 }]}>R$ {financialData.receita.toLocaleString()}</Text>
                </View>
            </View>

            {/* Gráfico de Produtividade */}
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Produtividade por Talhão (Kg/Ha)</Text>
                {hasProductivity ? (
                    <BarChart
                        data={{
                            labels: productivityData.map(d => d.talhao),
                            datasets: [{ data: productivityData.map(d => d.produtividade || 0) }]
                        }}
                        width={screenWidth - 48}
                        height={240}
                        yAxisLabel=""
                        yAxisSuffix=""
                        fromZero
                        chartConfig={chartConfig}
                        verticalLabelRotation={15}
                        style={styles.chart}
                    />
                ) : (
                    <View style={styles.emptyChart}>
                        <Text style={styles.emptyText}>Dados de colheita/área insuficientes para gerar gráficos.</Text>
                    </View>
                )}
            </View>

            {/* Gráfico de Evolução */}
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Tendência de Mercado vs Produção</Text>
                <LineChart
                    data={{
                        labels: ["Safra A", "Safra B", "Safra C", "Atual"],
                        datasets: [{ data: [65, 78, 72, 85] }]
                    }}
                    width={screenWidth - 48}
                    height={200}
                    chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                    }}
                    bezier
                    style={styles.chart}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 24, letterSpacing: -0.5 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
    statCard: { 
        flex: 1, 
        backgroundColor: '#FFF', 
        padding: 16, 
        borderRadius: 20, 
        elevation: 8, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 12,
        borderLeftWidth: 6 
    },
    statLabel: { fontSize: 11, color: '#6B7280', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: '900' },
    chartContainer: { 
        backgroundColor: '#FFF', 
        padding: 12, 
        borderRadius: 24, 
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    chartTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 16, marginLeft: 8 },
    chart: { marginVertical: 8, borderRadius: 16 },
    emptyChart: { height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB' },
    emptyText: { color: '#9CA3AF', fontSize: 12, textAlign: 'center', paddingHorizontal: 40 }
});

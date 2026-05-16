import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Dimensions, 
    ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';
import { FinanceService } from '../services/financeService';
import { ExportService } from '../services/exportService';
import Card from '../components/common/Card';

const { width } = Dimensions.get('window');

export default function FinanceiroDashboardScreen({ navigation }) {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [dre, setDre] = useState(null);
    const [cashFlow, setCashFlow] = useState(null);
    const [usdRate, setUsdRate] = useState(5.0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const dreData = await FinanceService.getDRE(new Date().getMonth() + 1, new Date().getFullYear());
            const flowData = await FinanceService.getCashFlow();
            const rate = await FinanceService.getUSDRate();
            setDre(dreData);
            setCashFlow(flowData);
            setUsdRate(rate);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!dre) return;
        const exportData = [
            { "Categoria": "Receita Bruta", "Valor": dre.receitas },
            { "Categoria": "Custos Variáveis", "Valor": dre.custosVariaveis },
            { "Categoria": "Margem Bruta", "Valor": dre.margemBruta },
            { "Categoria": "Despesas Fixas", "Valor": dre.despesasOp },
            { "Categoria": "Lucro Líquido", "Valor": dre.lucroLiquido },
            { "Categoria": "Margem (%)", "Valor": dre.percentualMargem.toFixed(2) + "%" }
        ];
        await ExportService.exportToExcel(exportData, 'DRE_AgroGB');
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    const formatUSD = (val) => {
        const usdVal = (val || 0) / usdRate;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usdVal);
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#064E3B', '#065F46']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>FINANCEIRO PRO</Text>
                    <TouchableOpacity onPress={loadData}>
                        <Ionicons name="refresh" size={24} color="#FFF" style={{ marginRight: 15 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleExport}>
                        <Ionicons name="download-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('CentroCustos')} style={{ marginLeft: 15 }}>
                        <Ionicons name="pie-chart-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSub}>Visão Estratégica e Rentabilidade</Text>
            </LinearGradient>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                
                <Text style={styles.sectionTitle}>RESUMO MENSAL (DRE)</Text>
                
                <Card style={styles.dreCard}>
                    <View style={styles.dreRow}>
                        <View>
                            <Text style={styles.dreLabel}>Receita Bruta</Text>
                            <Text style={styles.usdSub}>{formatUSD(dre?.receitas)}</Text>
                        </View>
                        <Text style={[styles.dreValue, { color: '#10B981' }]}>{formatCurrency(dre?.receitas)}</Text>
                    </View>
                    <View style={styles.dreRow}>
                        <View>
                            <Text style={styles.dreLabel}>(-) Custos Variáveis</Text>
                            <Text style={styles.usdSub}>{formatUSD(dre?.custosVariaveis)}</Text>
                        </View>
                        <Text style={[styles.dreValue, { color: '#EF4444' }]}>{formatCurrency(dre?.custosVariaveis)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.dreRow}>
                        <View>
                            <Text style={[styles.dreLabel, { fontWeight: '900' }]}>MARGEM BRUTA</Text>
                            <Text style={styles.usdSub}>{formatUSD(dre?.margemBruta)}</Text>
                        </View>
                        <Text style={[styles.dreValue, { fontWeight: '900' }]}>{formatCurrency(dre?.margemBruta)}</Text>
                    </View>
                    <View style={styles.dreRow}>
                        <Text style={styles.dreLabel}>(-) Despesas Fixas</Text>
                        <Text style={[styles.dreValue, { color: '#EF4444' }]}>{formatCurrency(dre?.despesasOp)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <LinearGradient 
                        colors={['#F9FAFB', '#F3F4F6']} 
                        style={styles.profitBox}
                    >
                        <Text style={styles.profitLabel}>LUCRO LÍQUIDO</Text>
                        <Text style={[styles.profitValue, { color: dre?.lucroLiquido >= 0 ? '#059669' : '#DC2626' }]}>
                            {formatCurrency(dre?.lucroLiquido)}
                        </Text>
                        <Text style={[styles.usdSub, { marginBottom: 10 }]}>Conversão: {formatUSD(dre?.lucroLiquido)}</Text>
                        <View style={[styles.marginBadge, { backgroundColor: dre?.lucroLiquido >= 0 ? '#D1FAE5' : '#FEE2E2' }]}>
                            <Text style={[styles.marginText, { color: dre?.lucroLiquido >= 0 ? '#065F46' : '#991B1B' }]}>
                                MARGEM: {dre?.percentualMargem.toFixed(1)}%
                            </Text>
                        </View>
                    </LinearGradient>
                </Card>

                <Text style={styles.sectionTitle}>FLUXO DE CAIXA</Text>
                <Card style={styles.chartCard}>
                    <LineChart
                        data={cashFlow}
                        width={width - 60}
                        height={220}
                        chartConfig={{
                            backgroundColor: "#FFF",
                            backgroundGradientFrom: "#FFF",
                            backgroundGradientTo: "#FFF",
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: { r: "4", strokeWidth: "2", stroke: "#ffa726" }
                        }}
                        bezier
                        style={{ marginVertical: 8, borderRadius: 16 }}
                    />
                </Card>

                <View style={styles.actionGrid}>
                    <TouchableOpacity style={styles.actionItem}>
                        <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                            <Ionicons name="receipt-outline" size={24} color="#2563EB" />
                        </View>
                        <Text style={styles.actionText}>Contas a Pagar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem}>
                        <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                            <Ionicons name="cash-outline" size={24} color="#059669" />
                        </View>
                        <Text style={styles.actionText}>Contas a Receber</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    body: { padding: 20 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#6B7280', letterSpacing: 1.5, marginBottom: 15, marginTop: 10 },
    dreCard: { padding: 20 },
    dreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    dreLabel: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
    dreValue: { fontSize: 15, fontWeight: '700' },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
    profitBox: { padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10 },
    profitLabel: { fontSize: 10, fontWeight: '900', color: '#6B7280', letterSpacing: 1 },
    profitValue: { fontSize: 28, fontWeight: '900', marginVertical: 5 },
    marginBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    marginText: { fontSize: 10, fontWeight: '800' },
    chartCard: { padding: 10, alignItems: 'center' },
    actionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingBottom: 40 },
    actionItem: { backgroundColor: '#FFF', width: '48%', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 2 },
    actionIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    actionText: { fontSize: 12, fontWeight: '800', color: '#1F2937' },
    usdSub: { fontSize: 10, color: '#9CA3AF', fontWeight: '700' }
});

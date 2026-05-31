import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Dimensions, 
    ActivityIndicator,
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';
import { FinanceService } from '../services/FinanceService';
import { ExportService } from '../services/ExportService';
import Card from '../components/common/Card';

const { width } = Dimensions.get('window');

export default function FinanceiroDashboardScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    
    const [loading, setLoading] = useState(true);
    const [dre, setDre] = useState(null);
    const [cashFlow, setCashFlow] = useState(null);
    const [usdRate, setUsdRate] = useState(5.2); // Fallback seguro

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
            setUsdRate(rate || 5.2);
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
            <View style={[styles.loaderContainer, { backgroundColor: activeColors.bg || '#020617' }]}>
                <ActivityIndicator size="large" color={activeColors.primary || '#10B981'} />
            </View>
        );
    }

    const isProfit = (dre?.lucroLiquido || 0) >= 0;
    
    // Caixa de Lucro: Degradê HSL dinâmico conforme o resultado e tema
    const profitBoxGrad = theme?.theme_mode === 'dark'
        ? (isProfit 
            ? ['rgba(16, 185, 129, 0.08)', 'rgba(6, 78, 59, 0.2)'] 
            : ['rgba(239, 68, 68, 0.08)', 'rgba(153, 27, 27, 0.2)'])
        : (isProfit 
            ? ['#F0FDF4', '#DCFCE7'] 
            : ['#FEF2F2', '#FEE2E2']);

    const profitBadgeBg = isProfit 
        ? 'rgba(16, 185, 129, 0.15)' 
        : 'rgba(239, 68, 68, 0.15)';
    
    const profitBadgeText = isProfit ? '#10B981' : '#F87171';

    // Configurações do gráfico
    const chartBg = activeColors.card || '#FFFFFF';
    const labelColor = theme?.theme_mode === 'dark'
        ? (opacity = 1) => `rgba(248, 250, 252, ${opacity * 0.6})`
        : (opacity = 1) => `rgba(15, 23, 42, ${opacity * 0.6})`;

    const gridLinesColor = theme?.theme_mode === 'dark'
        ? (opacity = 1) => `rgba(30, 41, 59, ${opacity * 0.5})`
        : (opacity = 1) => `rgba(226, 232, 240, ${opacity * 0.5})`;

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
                    <Text style={styles.headerTitle}>FINANCEIRO PRO</Text>
                    
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={loadData} style={styles.iconBtn}>
                            <Ionicons name="refresh" size={20} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleExport} style={styles.iconBtn}>
                            <Ionicons name="download-outline" size={20} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('CentroCustos')} style={styles.iconBtn}>
                            <Ionicons name="pie-chart-outline" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.headerSub}>Visão Estratégica e Rentabilidade</Text>
            </LinearGradient>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                
                <Text style={[styles.sectionTitle, { color: activeColors.textMuted || '#6B7280' }]}>RESUMO MENSAL (DRE)</Text>
                
                <Card style={styles.dreCard}>
                    <View style={styles.dreRow}>
                        <View>
                            <Text style={[styles.dreLabel, { color: activeColors.text || '#4B5563' }]}>Receita Bruta</Text>
                            <Text style={styles.usdSub}>{formatUSD(dre?.receitas)}</Text>
                        </View>
                        <Text style={[styles.dreValue, { color: activeColors.success || '#10B981' }]}>{formatCurrency(dre?.receitas)}</Text>
                    </View>

                    <View style={styles.dreRow}>
                        <View>
                            <Text style={[styles.dreLabel, { color: activeColors.text || '#4B5563' }]}>(-) Custos Variáveis</Text>
                            <Text style={styles.usdSub}>{formatUSD(dre?.custosVariaveis)}</Text>
                        </View>
                        <Text style={[styles.dreValue, { color: activeColors.error || '#EF4444' }]}>{formatCurrency(dre?.custosVariaveis)}</Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: activeColors.border || '#E5E7EB' }]} />

                    <View style={styles.dreRow}>
                        <View>
                            <Text style={[styles.dreLabel, { fontWeight: '800', color: activeColors.text || '#1F2937' }]}>MARGEM BRUTA</Text>
                            <Text style={styles.usdSub}>{formatUSD(dre?.margemBruta)}</Text>
                        </View>
                        <Text style={[styles.dreValue, { fontWeight: '800', color: activeColors.text || '#1F2937' }]}>{formatCurrency(dre?.margemBruta)}</Text>
                    </View>

                    <View style={styles.dreRow}>
                        <Text style={[styles.dreLabel, { color: activeColors.text || '#4B5563' }]}>(-) Despesas Fixas</Text>
                        <Text style={[styles.dreValue, { color: activeColors.error || '#EF4444' }]}>{formatCurrency(dre?.despesasOp)}</Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: activeColors.border || '#E5E7EB' }]} />

                    <LinearGradient 
                        colors={profitBoxGrad} 
                        style={styles.profitBox}
                    >
                        <Text style={[styles.profitLabel, { color: activeColors.textMuted || '#6B7280' }]}>LUCRO LÍQUIDO</Text>
                        <Text style={[styles.profitValue, { color: isProfit ? (activeColors.success || '#059669') : (activeColors.error || '#DC2626') }]}>
                            {formatCurrency(dre?.lucroLiquido)}
                        </Text>
                        <Text style={[styles.usdSub, { marginBottom: 10, color: activeColors.textMuted || '#9CA3AF' }]}>Conversão: {formatUSD(dre?.lucroLiquido)}</Text>
                        <View style={[styles.marginBadge, { backgroundColor: profitBadgeBg }]}>
                            <Text style={[styles.marginText, { color: profitBadgeText }]}>
                                MARGEM: {dre?.percentualMargem?.toFixed(1)}%
                            </Text>
                        </View>
                    </LinearGradient>
                </Card>

                <Text style={[styles.sectionTitle, { color: activeColors.textMuted || '#6B7280' }]}>FLUXO DE CAIXA</Text>
                
                {cashFlow && cashFlow.labels && cashFlow.labels.length > 0 ? (
                    <Card style={styles.chartCard}>
                        <LineChart
                            data={cashFlow}
                            width={width - 70}
                            height={200}
                            chartConfig={{
                                backgroundColor: chartBg,
                                backgroundGradientFrom: chartBg,
                                backgroundGradientTo: chartBg,
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                                labelColor: labelColor,
                                propsForBackgroundLines: {
                                    stroke: gridLinesColor(0.5),
                                    strokeDasharray: '',
                                },
                                style: { borderRadius: 16 },
                                propsForDots: { r: "4", strokeWidth: "2", stroke: activeColors.primary || '#10B981' }
                            }}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 16 }}
                        />
                    </Card>
                ) : (
                    <Card style={[styles.chartCard, { padding: 40 }]}>
                        <Ionicons name="stats-chart-outline" size={32} color={activeColors.textMuted} />
                        <Text style={{ color: activeColors.textMuted, marginTop: 10, fontSize: 13, fontWeight: '700' }}>Fluxo de Caixa Indisponível</Text>
                    </Card>
                )}

                <View style={styles.actionGrid}>
                    <TouchableOpacity 
                        style={[styles.actionItem, { backgroundColor: activeColors.card || '#FFF', borderColor: activeColors.border, borderWidth: theme?.theme_mode === 'dark' ? 1 : 0 }]}
                        onPress={() => navigation.navigate('Compras')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                            <Ionicons name="receipt-outline" size={24} color="#2563EB" />
                        </View>
                        <Text style={[styles.actionText, { color: activeColors.text || '#1F2937' }]}>Contas a Pagar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionItem, { backgroundColor: activeColors.card || '#FFF', borderColor: activeColors.border, borderWidth: theme?.theme_mode === 'dark' ? 1 : 0 }]}
                        onPress={() => navigation.navigate('Vendas')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                            <Ionicons name="cash-outline" size={24} color="#10B981" />
                        </View>
                        <Text style={[styles.actionText, { color: activeColors.text || '#1F2937' }]}>Contas a Receber</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    headerActions: { flexDirection: 'row', gap: 12 },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    body: { paddingHorizontal: 20, paddingTop: 20 },
    sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12, marginTop: 10 },
    dreCard: { padding: 20 },
    dreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    dreLabel: { fontSize: 14, fontWeight: '600' },
    dreValue: { fontSize: 15, fontWeight: '700' },
    divider: { height: 1, marginVertical: 10 },
    profitBox: { padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10 },
    profitLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    profitValue: { fontSize: 28, fontWeight: '900', marginVertical: 5 },
    marginBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    marginText: { fontSize: 10, fontWeight: '800' },
    chartCard: { padding: 10, alignItems: 'center' },
    actionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingBottom: 40 },
    actionItem: { width: '48%', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
    actionIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    actionText: { fontSize: 12, fontWeight: '800' },
    usdSub: { fontSize: 10, fontWeight: '700' }
});

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { Card } from '../ui/components/Card';
import { generateVendasPDF, generateEstoquePDF, generateColheitaPDF } from '../services/ReportService';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { executeQuery } from '../database/database';

const { width } = Dimensions.get('window');

export default function RelatoriosScreen() {
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState('DASHBOARD'); // DASHBOARD ou PDF

    // Gráficos Data
    const [prodSemanal, setProdSemanal] = useState([0, 0, 0, 0, 0, 0, 0]);
    const [finMensal, setFinMensal] = useState({ vendas: 0, custos: 0, lucro: 0 });
    const [custosCat, setCustosCat] = useState([]);
    const [hasData, setHasData] = useState(false);

    useFocusEffect(useCallback(() => { loadGraphs(); }, []));

    const loadGraphs = async () => {
        try {
            let dataFound = false;

            // Produção Semanal (Últimos 7 dias)
            const resProd = await executeQuery(`
                SELECT SUM(quantidade) as q, strftime('%w', data) as d 
                FROM colheitas 
                WHERE is_deleted = 0 AND date(data) >= date('now', '-7 days')
                GROUP BY d
            `);
            let s = [0, 0, 0, 0, 0, 0, 0];
            for (let i = 0; i < resProd.rows.length; i++) {
                const r = resProd.rows.item(i);
                s[parseInt(r.d)] = r.q || 0;
                if (r.q > 0) dataFound = true;
            }
            setProdSemanal(s);

            // Financeiro Mensal
            const vQ = await executeQuery(`
                SELECT 
                    (SELECT SUM(valor) FROM vendas WHERE is_deleted = 0 AND strftime('%Y-%m', data) = strftime('%Y-%m', 'now')) as v,
                    (SELECT SUM(valor) FROM compras WHERE is_deleted = 0 AND strftime('%Y-%m', data) = strftime('%Y-%m', 'now')) as c
            `);
            const v = vQ.rows.item(0).v || 0;
            const c = vQ.rows.item(0).c || 0;
            if (v > 0 || c > 0) dataFound = true;
            setFinMensal({ vendas: v, custos: c, lucro: v - c });

            // Custos por Categoria
            const catQ = await executeQuery(`
                SELECT item as cat, SUM(valor) as t 
                FROM compras 
                WHERE is_deleted = 0 
                GROUP BY item 
                ORDER BY t DESC 
                LIMIT 5
            `);
            const colorsList = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
            let dist = [];
            for (let i = 0; i < catQ.rows.length; i++) {
                const r = catQ.rows.item(i);
                dist.push({
                    name: (r.cat || 'Diversos').substring(0, 12),
                    total: r.t,
                    color: colorsList[i % 5],
                    legendFontColor: isDark ? '#FFF' : '#333',
                    legendFontSize: 11
                });
                dataFound = true;
            }
            setCustosCat(dist);
            setHasData(dataFound);

        } catch (e) {
            console.error('[REPORT ERROR]', e);
        }
    };

    const handleReport = async (type) => {
        setLoading(true);
        try {
            if (type === 'VENDAS') await generateVendasPDF();
            else if (type === 'ESTOQUE') await generateEstoquePDF();
            else if (type === 'COLHEITA') await generateColheitaPDF();
            Alert.alert('Sucesso', 'PDF gerado com sucesso!');
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível gerar o PDF.');
        } finally { setLoading(false); }
    };

    const chartConfig = {
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        color: () => colors.primary,
        labelColor: () => colors.textSecondary,
        strokeWidth: 3,
        barPercentage: 0.7,
        useShadowColorFromDataset: false,
        propsForDots: { r: "5", strokeWidth: "2", stroke: colors.primary },
        propsForLabels: { fontSize: 9, fontWeight: 'bold' }
    };

    const EmptyChart = ({ title }) => (
        <View style={styles.emptyChart}>
            <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={40} color={colors.border} />
            <Text style={[styles.emptyChartText, { color: colors.textMuted }]}>Sem dados suficientes para {title}</Text>
        </View>
    );

    return (
        <AppContainer>
            <ScreenHeader title="INTELIGÊNCIA DE DADOS" onBack={() => navigation.goBack()} />

            <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setTab('DASHBOARD')} style={[styles.tab, tab === 'DASHBOARD' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}>
                    <Text style={[styles.tabText, { color: tab === 'DASHBOARD' ? colors.primary : colors.textMuted }]}>DASHBOARD</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTab('PDF')} style={[styles.tab, tab === 'PDF' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}>
                    <Text style={[styles.tabText, { color: tab === 'PDF' ? colors.primary : colors.textMuted }]}>PDFS OFICIAIS</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {tab === 'DASHBOARD' ? (
                    <View>
                        {!hasData && (
                            <Card style={{ marginBottom: 20, padding: 20, backgroundColor: colors.primary + '10' }}>
                                <Text style={{ color: colors.primary, fontWeight: 'bold', textAlign: 'center' }}>
                                    🚀 Comece a registrar suas atividades para visualizar as estatísticas aqui!
                                </Text>
                            </Card>
                        )}

                        <Card style={styles.chartCard}>
                            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>PRODUÇÃO ÚLTIMOS 7 DIAS (KG)</Text>
                            {prodSemanal.some(v => v > 0) ? (
                                <LineChart
                                    data={{ labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'], datasets: [{ data: prodSemanal }] }}
                                    width={width - 40} height={200} chartConfig={chartConfig} bezier style={styles.chart}
                                />
                            ) : <EmptyChart title="Produção" />}
                        </Card>

                        <Card style={styles.chartCard}>
                            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>COMPARATIVO MENSAL (R$)</Text>
                            {finMensal.vendas > 0 || finMensal.custos > 0 ? (
                                <BarChart
                                    data={{ labels: ['Vendas', 'Custos', 'Lucro'], datasets: [{ data: [finMensal.vendas, finMensal.custos, finMensal.lucro] }] }}
                                    width={width - 40} height={200} chartConfig={chartConfig} style={styles.chart} yAxisLabel="R$"
                                />
                            ) : <EmptyChart title="Financeiro" />}
                        </Card>

                        {custosCat.length > 0 ? (
                            <Card style={styles.chartCard}>
                                <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>DISTRIBUIÇÃO DE CUSTOS</Text>
                                <PieChart
                                    data={custosCat} width={width - 40} height={200} chartConfig={chartConfig} accessor="total" backgroundColor="transparent" paddingLeft="15" absolute
                                />
                            </Card>
                        ) : null}
                    </View>
                ) : (
                    <View>
                        <TouchableOpacity style={[styles.reportBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleReport('VENDAS')}>
                            <Ionicons name="cart-outline" size={24} color="#3B82F6" />
                            <Text style={[styles.reportLabel, { color: colors.textPrimary }]}>RELATÓRIO DE VENDAS</Text>
                            <Ionicons name="download-outline" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={[styles.reportBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleReport('ESTOQUE')}>
                            <Ionicons name="cube-outline" size={24} color={colors.primary} />
                            <Text style={[styles.reportLabel, { color: colors.textPrimary }]}>INVENTÁRIO DE ESTOQUE</Text>
                            <Ionicons name="download-outline" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.reportBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleReport('COLHEITA')}>
                            <Ionicons name="leaf-outline" size={24} color="#F59E0B" />
                            <Text style={[styles.reportLabel, { color: colors.textPrimary }]}>RESUMO DE COLHEITA</Text>
                            <Ionicons name="download-outline" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>

                        <Card style={{ padding: 20, marginTop: 10, borderStyle: 'dashed', borderWidth: 1 }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
                                Os arquivos são gerados em formato PDF compatível com WhatsApp, E-mail e Impressão. 
                                Certifique-se de que os dados foram sincronizados recentemente.
                            </Text>
                        </Card>
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {loading && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: '#FFF', marginTop: 15, fontWeight: 'bold' }}>GERANDO DOCUMENTO...</Text>
                </View>
            )}
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    container: { padding: 15 },
    tabContainer: { flexDirection: 'row', height: 55, borderBottomWidth: 1 },
    tab: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tabText: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
    chartCard: { padding: 15, marginBottom: 15, alignItems: 'center' },
    chartTitle: { fontSize: 11, fontWeight: '900', marginBottom: 20, alignSelf: 'flex-start', letterSpacing: 1 },
    chart: { borderRadius: 16, marginTop: 10 },
    reportBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 1.5, marginBottom: 15, gap: 15 },
    reportLabel: { fontSize: 14, fontWeight: '900' },
    emptyChart: { height: 160, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
    emptyChartText: { fontSize: 12, marginTop: 10, fontWeight: 'bold' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
});


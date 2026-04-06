import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Platform, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import SafeBlurView from '../ui/SafeBlurView';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { generateVendasPDF, generateEstoquePDF, generateColheitaPDF } from '../services/ReportService';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { executeQuery } from '../database/database';

const { width } = Dimensions.get('window');

/**
 * AgroGB OS - Dashboard Intelligence (Diamond Pro Level) 💎
 * Tela mais avançada e premium de relatórios já criada para o sistema.
 */
export default function RelatoriosScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState('DASHBOARD');
    const [periodo, setPeriodo] = useState('MES'); // 7D, MES, ANO, TUDO

    // Gráficos e Inteligência
    const [prodSemanal, setProdSemanal] = useState([0, 0, 0, 0, 0, 0, 0]);
    const [finMensal, setFinMensal] = useState({ vendas: 0, custos: 0, lucro: 0 });
    const [metricasBi, setMetricasBi] = useState({ margem: 0, ticketMedio: 0 });
    const [cortexInsight, setCortexInsight] = useState({ tipo: 'info', msg: 'Analisando seus dados globais...' });
    const [custosCat, setCustosCat] = useState([]);
    const [previsaoColheita, setPrevisaoColheita] = useState({ labels: ['Sem dados'], data: [0] });
    const [recentFeeds, setRecentFeeds] = useState([]);
    const [cadastrosTot, setCadastrosTot] = useState({ clientes: 0, insumos: 0, plantios: 0 });
    const [hasData, setHasData] = useState(false);

    useFocusEffect(useCallback(() => { loadGraphs(); }, [periodo]));

    const loadGraphs = async () => {
        try {
            let dataFound = false;

            // Motor Lógico Temporal Nível Enterprise
            let filtroData = "";
            let filtroPrev = "";
            let dataStrColheita = "";
            
            if (periodo === '7D') {
                filtroData = "date(data) >= date('now', '-7 days')";
                filtroPrev = "date(data) >= date('now', '-14 days') AND date(data) < date('now', '-7 days')";
                dataStrColheita = "-7 days";
            } else if (periodo === 'MES') {
                filtroData = "strftime('%Y-%m', data) = strftime('%Y-%m', 'now')";
                filtroPrev = "strftime('%Y-%m', data) = strftime('%Y-%m', 'now', '-1 month')";
                dataStrColheita = "start of month";
            } else if (periodo === 'ANO') {
                filtroData = "strftime('%Y', data) = strftime('%Y', 'now')";
                filtroPrev = "strftime('%Y', data) = strftime('%Y', 'now', '-1 year')";
                dataStrColheita = "start of year";
            } else {
                filtroData = "1=1";
                filtroPrev = "1=0";
                dataStrColheita = "-3000 days"; // Tudo
            }

            const resProd = await executeQuery(`
                SELECT SUM(quantidade) as q, strftime('%w', data) as d 
                FROM colheitas 
                WHERE is_deleted = 0 AND date(data) >= date('now', '${dataStrColheita}')
                GROUP BY d
            `);
            let s = [0, 0, 0, 0, 0, 0, 0];
            for (let i = 0; i < resProd.rows.length; i++) {
                const r = resProd.rows.item(i);
                s[parseInt(r.d)] = r.q || 0;
                if (r.q > 0) dataFound = true;
            }
            setProdSemanal(s);

            const vQ = await executeQuery(`
                SELECT 
                    (SELECT SUM(valor) FROM vendas WHERE is_deleted = 0 AND ${filtroData}) as v,
                    (SELECT COUNT(id) FROM vendas WHERE is_deleted = 0 AND ${filtroData}) as qt_vendas,
                    (SELECT SUM(valor) FROM compras WHERE is_deleted = 0 AND ${filtroData}) as c,
                    (SELECT SUM(valor) FROM vendas WHERE is_deleted = 0 AND ${filtroPrev}) as prev_v,
                    (SELECT SUM(valor) FROM compras WHERE is_deleted = 0 AND ${filtroPrev}) as prev_c
            `);
            const v = vQ.rows.item(0).v || 0;
            const c = vQ.rows.item(0).c || 0;
            const qVendas = vQ.rows.item(0).qt_vendas || 0;
            const prev_v = vQ.rows.item(0).prev_v || 0;
            const prev_c = vQ.rows.item(0).prev_c || 0;
            
            const lucroNow = v - c;
            const lucroPrev = prev_v - prev_c;

            const calcPerc = (now, prev) => {
                if (!prev) return now > 0 ? 100 : 0;
                return ((now - prev) / prev) * 100;
            };

            const diffLucro = calcPerc(lucroNow, lucroPrev);
            setFinMensal({ 
                vendas: v, custos: c, lucro: lucroNow,
                diffVendas: calcPerc(v, prev_v),
                diffCustos: calcPerc(c, prev_c),
                diffLucro: diffLucro
            });
            
            // MÉTRICAS BI
            const margem = v > 0 ? ((lucroNow / v) * 100) : 0;
            const ticketMedio = qVendas > 0 ? (v / qVendas) : 0;
            setMetricasBi({ margem, ticketMedio });

            // AGROBOT CORTEX (INTELIGÊNCIA PREDITIVA)
            if (v === 0 && c === 0) setCortexInsight({ tipo: 'info', msg: 'Sem movimentações financeiras para analisar no momento.' });
            else if (lucroNow < 0) {
                setCortexInsight({ tipo: 'alert', msg: `Seus custos estão consumindo as vendas. Tente represar saídas e avaliar o preço da colheita atual.` });
            } else if (calcPerc(c, prev_c) > 10 && calcPerc(v, prev_v) < 0) {
                setCortexInsight({ tipo: 'alert', msg: `Atenção: Seus Custos subiram enquanto suas Vendas caíram comparado ao período anterior. Revise compras de insumos.` });
            } else if (margem > 40) {
                setCortexInsight({ tipo: 'success', msg: `Excelente performance! Operação rodando com margem incrível de ${margem.toFixed(0)}%. O negócio está altamente escalável.` });
            } else if (v > prev_v) {
                setCortexInsight({ tipo: 'success', msg: `Crescimento constante. Você aumentou o faturamento em relação à marca histórica. Continue a aceleração.` });
            } else {
                setCortexInsight({ tipo: 'info', msg: `Operação estável. Foque em fechar bons clientes e economizar insumos para aumentar a margem bruta de ${Math.max(margem, 0).toFixed(0)}%.` });
            }

            if (v > 0 || c > 0) dataFound = true;

            const catQ = await executeQuery(`
                SELECT item as cat, SUM(valor) as t 
                FROM compras 
                WHERE is_deleted = 0 AND ${filtroData}
                GROUP BY item 
                ORDER BY t DESC 
                LIMIT 5
            `);
            const colorsList = ['#34D399', '#3B82F6', '#FBBF24', '#F87171', '#A78BFA'];
            let dist = [];
            for (let i = 0; i < catQ.rows.length; i++) {
                const r = catQ.rows.item(i);
                dist.push({
                    name: (r.cat || 'Diversos').substring(0, 12),
                    total: r.t,
                    color: colorsList[i % 5],
                    legendFontColor: '#94A3B8',
                    legendFontSize: 11
                });
                dataFound = true;
            }
            setCustosCat(dist);

            const timelineQ = await executeQuery(`
                SELECT 'VENDA' as tipo, data, valor as montante, cliente as detalhe FROM vendas WHERE is_deleted = 0 AND ${filtroData}
                UNION ALL
                SELECT 'CUSTO' as tipo, data, valor as montante, item as detalhe FROM compras WHERE is_deleted = 0 AND ${filtroData}
                UNION ALL
                SELECT 'COLHEITA' as tipo, data, quantidade as montante, area as detalhe FROM colheitas WHERE is_deleted = 0 AND ${filtroData}
                ORDER BY data DESC LIMIT 4
            `);
            let feeds = [];
            for (let i = 0; i < timelineQ.rows.length; i++) {
                feeds.push(timelineQ.rows.item(i));
            }
            setRecentFeeds(feeds);

            // Fetch Previsão de Colheita
            try {
                const prevQ = await executeQuery(`SELECT quantidade_pes, observacao FROM plantio WHERE is_deleted = 0 AND observacao LIKE '%PREV: %'`);
                let mesesMap = {};
                for (let i = 0; i < prevQ.rows.length; i++) {
                    const r = prevQ.rows.item(i);
                    const match = r.observacao.match(/PREV:\s*(\d{2}\/\d{4})/);
                    if (match && match[1]) {
                        const mesAnAno = match[1];
                        mesesMap[mesAnAno] = (mesesMap[mesAnAno] || 0) + parseInt(r.quantidade_pes || 0);
                    }
                }
                const chaves = Object.keys(mesesMap).sort((a, b) => {
                    const [mA, yA] = a.split('/');
                    const [mB, yB] = b.split('/');
                    return new Date(yA, mA - 1) - new Date(yB, mB - 1);
                });
                
                // Get only upcoming months or top 5
                let pLabels = [];
                let pData = [];
                chaves.slice(0, 5).forEach(m => {
                    pLabels.push(m);
                    pData.push(mesesMap[m]);
                });
                if (pLabels.length > 0) {
                    setPrevisaoColheita({ labels: pLabels, data: pData });
                } else {
                    setPrevisaoColheita({ labels: ['Sem dados'], data: [0] });
                }
            } catch (e) {
                console.log('Erro ao consultar previsão', e);
            }

            // Fetch Cadastros (Visão Geral)
            try {
                const cCli = await executeQuery('SELECT COUNT(*) as c FROM clientes WHERE is_deleted = 0');
                const cIns = await executeQuery('SELECT COUNT(*) as c FROM cadastro WHERE is_deleted = 0');
                const cPla = await executeQuery('SELECT COUNT(*) as c FROM plantio WHERE is_deleted = 0');
                setCadastrosTot({
                    clientes: cCli.rows.item(0).c || 0,
                    insumos: cIns.rows.item(0).c || 0,
                    plantios: cPla.rows.item(0).c || 0
                });
            } catch(e) { console.log('Erro ao carregar totais de cadastro', e); }

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
            Alert.alert('Sucesso', 'PDF gravado e pronto para envio!');
        } catch {
            Alert.alert('Erro', 'Não foi possível gerar o PDF.');
        } finally { setLoading(false); }
    };

    const exportCSV = async (tableName, title) => {
        setLoading(true);
        try {
            const hasDeleted = ['vendas', 'compras', 'colheitas', 'adubacoes'].includes(tableName);
            const query = hasDeleted 
                ? `SELECT * FROM ${tableName} WHERE is_deleted = 0 ORDER BY uuid DESC LIMIT 2000` 
                : `SELECT * FROM ${tableName} ORDER BY uuid DESC LIMIT 2000`;
                
            const res = await executeQuery(query);
            
            if(res.rows.length === 0) {
               Alert.alert('Vazio', 'Não há registros nesta área ainda.');
               return;
            }
            
            const sample = res.rows.item(0);
            const headers = Object.keys(sample);
            let csv = headers.join(',') + '\n';
            
            for (let i = 0; i < res.rows.length; i++) {
                const r = res.rows.item(i);
                csv += headers.map(h => {
                    let val = r[h];
                    if (typeof val === 'string') val = val.replace(/,/g, ' '); 
                    return val !== null ? val : '';
                }).join(',') + '\n';
            }
            
            const uri = FileSystem.documentDirectory + `AgroGB_${tableName}.csv`;
            await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
            await Sharing.shareAsync(uri, { dialogTitle: 'Baixar ' + title });
        } catch(e) {
            console.log(e);
            Alert.alert('Erro', 'Não foi possível exportar a planilha.');
        } finally { setLoading(false); }
    };

    const totalProdSemanal = useMemo(() => prodSemanal.reduce((a, b) => a + b, 0), [prodSemanal]);

    const chartConfig = {
        backgroundGradientFromOpacity: 0,
        backgroundGradientToOpacity: 0,
        color: (opacity = 1) => `rgba(52, 211, 153, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
        strokeWidth: 3,
        barPercentage: 0.7,
        useShadowColorFromDataset: false,
        propsForDots: { r: "4", strokeWidth: "2", stroke: "#10B981" },
        propsForLabels: { fontSize: 10, fontWeight: '700' }
    };

    const chartConfigBar = {
        ...chartConfig,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        propsForLabels: { fontSize: 10, fontWeight: '700' }
    };

    const chartConfigOrange = {
        ...chartConfig,
        color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
        propsForLabels: { fontSize: 10, fontWeight: '700' }
    };

    const formatCurrency = (val) => 'R$ ' + (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    const PercBadge = ({ value, invert = false }) => {
        if (value === undefined || value === null) return null;
        if (value === 0) return (
            <View style={[styles.percBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={[styles.percText, { color: '#94A3B8' }]}>= 0%</Text>
            </View>
        );
        const isPositive = value > 0;
        const isGood = invert ? !isPositive : isPositive;
        const color = isGood ? '#34D399' : '#F87171';
        const icon = isPositive ? 'trending-up' : 'trending-down';
        return (
            <View style={[styles.percBadge, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={10} color={color} />
                <Text style={[styles.percText, { color }]}>{Math.abs(value).toFixed(1)}%</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#040914', '#0A1220']} style={StyleSheet.absoluteFill} />
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' }}>
                
                {/* HEADERS */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={26} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Inteligência de Dados</Text>
                        <Text style={styles.headerSubtitle}>Monitoramento Global</Text>
                    </View>
                    <View style={{ width: 44 }} />
                </View>

                {/* SEGMENTED CONTROL NEON */}
                <View style={styles.segmentWrapper}>
                    <SafeBlurView intensity={20} tint="dark" style={styles.segmentInner}>
                        {['DASHBOARD', 'TODOS RELATÓRIOS'].map(mode => {
                            const isActive = mode === (tab === 'DASHBOARD' ? 'DASHBOARD' : 'TODOS RELATÓRIOS');
                            return (
                                <TouchableOpacity
                                    key={mode}
                                    style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                                    onPress={() => setTab(mode === 'DASHBOARD' ? 'DASHBOARD' : 'PDF')}
                                >
                                    {isActive && <LinearGradient colors={['rgba(16, 185, 129, 0.2)', 'transparent']} style={StyleSheet.absoluteFill} />}
                                    <Text style={[styles.segmentText, isActive ? styles.segmentTextActive : {}]}>
                                        {mode}
                                    </Text>
                                    {isActive && <View style={styles.segmentGlowLine} />}
                                </TouchableOpacity>
                            );
                        })}
                    </SafeBlurView>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {tab === 'DASHBOARD' ? (
                        <>
                            {/* GLOBAL TIME FILTERS (TIME-TRAVEL) */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginBottom: 20 }}>
                                {[
                                    { k: '7D', l: '7 Dias' },
                                    { k: 'MES', l: 'Este Mês' },
                                    { k: 'ANO', l: 'Este Ano' },
                                    { k: 'TUDO', l: 'Início Global' }
                                ].map(f => {
                                    const active = periodo === f.k;
                                    return (
                                        <TouchableOpacity key={f.k} activeOpacity={0.8} onPress={() => setPeriodo(f.k)} style={[styles.timeChip, active && styles.timeChipActive]}>
                                            <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>{f.l}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* AGROBOT CORTEX INSIGHTS */}
                            <View style={[styles.cortexBox, cortexInsight.tipo === 'alert' ? { borderColor: 'rgba(248, 113, 113, 0.4)' } : cortexInsight.tipo === 'success' ? { borderColor: 'rgba(52, 211, 153, 0.4)' } : {}]}>
                                <View style={styles.cortexHeader}>
                                    <View style={styles.cortexBrain}>
                                        <Ionicons name="hardware-chip" size={16} color={cortexInsight.tipo === 'alert' ? '#F87171' : cortexInsight.tipo === 'success' ? '#34D399' : '#3B82F6'} />
                                    </View>
                                    <Text style={styles.cortexTitle}>AgroGB Insights™</Text>
                                </View>
                                <Text style={styles.cortexMessage}>{cortexInsight.msg}</Text>
                            </View>

                            <Text style={styles.sectionHeader}>💰 BALANÇO FINANCEIRO</Text>
                            {/* KPI GRID */}
                            <View style={styles.kpiGrid}>
                                <SafeBlurView intensity={30} tint="dark" style={styles.kpiCard}>
                                    <View style={styles.kpiIconBox}>
                                        <Ionicons name="cash" size={16} color="#34D399" />
                                    </View>
                                    <Text style={styles.kpiValue}>{formatCurrency(finMensal.vendas)}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={styles.kpiLabel}>FATURAMENTO MÊS</Text>
                                        <PercBadge value={finMensal.diffVendas} />
                                    </View>
                                </SafeBlurView>
                                
                                <SafeBlurView intensity={30} tint="dark" style={styles.kpiCard}>
                                    <View style={styles.kpiIconBox}>
                                        <Ionicons name="leaf" size={16} color="#34D399" />
                                    </View>
                                    <Text style={styles.kpiValue}>{totalProdSemanal} kg</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={styles.kpiLabel}>COLHEITA 7 DIAS</Text>
                                    </View>
                                </SafeBlurView>

                                <SafeBlurView intensity={30} tint="dark" style={styles.kpiCard}>
                                    <View style={styles.kpiIconBox}>
                                        <Ionicons name="trending-down" size={16} color="#64748B" />
                                    </View>
                                    <Text style={styles.kpiValue}>{formatCurrency(finMensal.custos)}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={styles.kpiLabel}>CUSTOS MÊS</Text>
                                        <PercBadge value={finMensal.diffCustos} invert={true} />
                                    </View>
                                </SafeBlurView>
                                
                                <SafeBlurView intensity={30} tint="dark" style={styles.kpiCard}>
                                    <View style={styles.kpiIconBox}>
                                        <Ionicons name="wallet" size={16} color="#FBBF24" />
                                    </View>
                                    <Text style={[styles.kpiValue, { color: finMensal.lucro >= 0 ? '#FBBF24' : '#F87171' }]}>
                                        {formatCurrency(finMensal.lucro)}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={styles.kpiLabel}>LUCRO LÍQUIDO</Text>
                                        <PercBadge value={finMensal.diffLucro} />
                                    </View>
                                </SafeBlurView>
                            </View>

                            {/* BI METRICS (TICKET & MARGIN) */}
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                                <SafeBlurView intensity={30} tint="dark" style={[styles.mainCard, { flex: 1, marginBottom: 0, paddingVertical: 15 }]}>
                                    <Text style={styles.kpiLabel}>MARGEM BRUTA</Text>
                                    <Text style={[styles.kpiValue, { fontSize: 20, color: metricasBi.margem > 0 ? '#34D399' : '#F87171' }]}>{metricasBi.margem.toFixed(1)}%</Text>
                                </SafeBlurView>
                                <SafeBlurView intensity={30} tint="dark" style={[styles.mainCard, { flex: 1, marginBottom: 0, paddingVertical: 15 }]}>
                                    <Text style={styles.kpiLabel}>TICKET MÉDIO</Text>
                                    <Text style={[styles.kpiValue, { fontSize: 20, color: '#3B82F6' }]}>{formatCurrency(metricasBi.ticketMedio)}</Text>
                                </SafeBlurView>
                            </View>

                            <Text style={[styles.sectionHeader, { marginTop: 10 }]}>🌾 OPERACIONAL & CAMPO</Text>
                            {/* GRÁFICO 1: PRODUÇÃO (Green Line) */}
                            <SafeBlurView intensity={30} tint="dark" style={styles.mainCard}>
                                <View style={styles.cardHeader}>
                                    <Ionicons name="leaf-outline" size={18} color="#34D399" />
                                    <Text style={styles.cardTitle}>PRODUÇÃO ÚLTIMOS 7 DIAS (KG)</Text>
                                </View>
                                {totalProdSemanal > 0 ? (
                                    <LineChart
                                        data={{ labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'], datasets: [{ data: prodSemanal }] }}
                                        width={width - 70} height={200} chartConfig={chartConfig} bezier
                                        style={styles.chartLine}
                                    />
                                ) : (
                                    <View style={styles.emptyState}>
                                        <MaterialCommunityIcons name="finance" size={40} color="rgba(255,255,255,0.1)" />
                                        <Text style={styles.emptyText}>Nenhuma colheita nos últimos 7 dias.</Text>
                                    </View>
                                )}
                            </SafeBlurView>

                            {/* GRÁFICO 2: FINANCEIRO (Blue Bars) */}
                            <SafeBlurView intensity={30} tint="dark" style={styles.mainCard}>
                                <View style={styles.cardHeader}>
                                    <Ionicons name="bar-chart-outline" size={18} color="#3B82F6" />
                                    <Text style={styles.cardTitle}>PERFORMANCE FINANCEIRA</Text>
                                </View>
                                {finMensal.vendas > 0 || finMensal.custos > 0 ? (
                                    <BarChart
                                        data={{ labels: ['Ven', 'Cus', 'Luc'], datasets: [{ data: [finMensal.vendas, finMensal.custos, finMensal.lucro] }] }}
                                        width={width - 70} height={200} chartConfig={chartConfigBar} yAxisLabel="R$" style={styles.chartLine}
                                    />
                                ) : (
                                    <View style={styles.emptyState}>
                                        <MaterialCommunityIcons name="finance" size={40} color="rgba(255,255,255,0.1)" />
                                        <Text style={styles.emptyText}>Sem movimentações financeiras este mês.</Text>
                                    </View>
                                )}
                            </SafeBlurView>

                            {/* GRÁFICO 2.5: PREVISÃO DE COLHEITA (Orange Bars) */}
                            <SafeBlurView intensity={30} tint="dark" style={styles.mainCard}>
                                <View style={styles.cardHeader}>
                                    <Ionicons name="calendar-outline" size={18} color="#F59E0B" />
                                    <Text style={styles.cardTitle}>PREVISÃO DE COLHEITA FUTURA (PÉS)</Text>
                                </View>
                                {previsaoColheita.data.reduce((a,b) => a + b, 0) > 0 ? (
                                    <BarChart
                                        data={{ labels: previsaoColheita.labels, datasets: [{ data: previsaoColheita.data }] }}
                                        width={width - 70} height={200} chartConfig={chartConfigOrange} style={styles.chartLine}
                                    />
                                ) : (
                                    <View style={styles.emptyState}>
                                        <MaterialCommunityIcons name="finance" size={40} color="rgba(255,255,255,0.1)" />
                                        <Text style={styles.emptyText}>Sem previsões de colheita ativas.</Text>
                                    </View>
                                )}
                            </SafeBlurView>

                            {/* GRÁFICO 3: DISTRIBUIÇÃO (Pie) */}
                            {custosCat.length > 0 && (
                                <SafeBlurView intensity={30} tint="dark" style={styles.mainCard}>
                                    <View style={styles.cardHeader}>
                                        <Ionicons name="pie-chart-outline" size={18} color="#A78BFA" />
                                        <Text style={styles.cardTitle}>TOP 5 CENTROS DE CUSTO</Text>
                                    </View>
                                    <PieChart
                                        data={custosCat} width={width - 60} height={180} chartConfig={chartConfig} accessor="total" backgroundColor="transparent" paddingLeft="10" absolute
                                    />
                                </SafeBlurView>
                            )}

                            <Text style={[styles.sectionHeader, { marginTop: 10 }]}>🗂️ BASE DE DADOS (VISÃO GERAL)</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                                <SafeBlurView intensity={30} tint="dark" style={styles.miniCard}>
                                    <Ionicons name="people" size={18} color="#A78BFA" style={{ marginBottom: 4 }} />
                                    <Text style={styles.miniCardValue}>{cadastrosTot.clientes}</Text>
                                    <Text style={styles.miniCardLabel}>CLIENTES</Text>
                                </SafeBlurView>
                                <SafeBlurView intensity={30} tint="dark" style={styles.miniCard}>
                                    <Ionicons name="list" size={18} color="#FBBF24" style={{ marginBottom: 4 }} />
                                    <Text style={styles.miniCardValue}>{cadastrosTot.insumos}</Text>
                                    <Text style={styles.miniCardLabel}>INSUMOS</Text>
                                </SafeBlurView>
                                <SafeBlurView intensity={30} tint="dark" style={styles.miniCard}>
                                    <Ionicons name="flask" size={18} color="#34D399" style={{ marginBottom: 4 }} />
                                    <Text style={styles.miniCardValue}>{cadastrosTot.plantios}</Text>
                                    <Text style={styles.miniCardLabel}>PLANTIOS</Text>
                                </SafeBlurView>
                            </View>

                            <Text style={[styles.sectionHeader, { marginTop: 10 }]}>⏱️ ÚLTIMOS ACONTECIMENTOS (LIVE FEED)</Text>
                            <SafeBlurView intensity={30} tint="dark" style={[styles.mainCard, { paddingVertical: 10 }]}>
                                {recentFeeds.length > 0 ? recentFeeds.map((feed, idx) => {
                                    const isVenda = feed.tipo === 'VENDA';
                                    const isCusto = feed.tipo === 'CUSTO';
                                    const icon = isVenda ? 'cash-outline' : isCusto ? 'trending-down-outline' : 'leaf-outline';
                                    const iconColor = isVenda ? '#34D399' : isCusto ? '#F87171' : '#3B82F6';
                                    const dateStr = feed.data ? feed.data.substring(0, 10).split('-').reverse().join('/') : 'Hoje';
                                    return (
                                        <View key={idx} style={styles.feedItem}>
                                            <View style={[styles.feedIcon, { backgroundColor: iconColor + '15' }]}>
                                                <Ionicons name={icon} size={14} color={iconColor} />
                                            </View>
                                            <View style={styles.feedContent}>
                                                <Text style={styles.feedTitle}>{feed.tipo === 'COLHEITA' ? 'Colheita Registrada' : feed.tipo === 'VENDA' ? 'Nova Venda' : 'Despesa Lançada'}</Text>
                                                <Text style={styles.feedSub}>{feed.detalhe}</Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={[styles.feedValue, { color: iconColor }]}>
                                                    {feed.tipo === 'COLHEITA' ? `${feed.montante || 0} kg` : formatCurrency(feed.montante)}
                                                </Text>
                                                <Text style={styles.feedDate}>{dateStr}</Text>
                                            </View>
                                        </View>
                                    );
                                }) : (
                                    <View style={[styles.emptyState, { height: 100 }]}>
                                        <Text style={styles.emptyText}>Sem atividades recentes na fazenda.</Text>
                                    </View>
                                )}
                            </SafeBlurView>

                        </>
                    ) : (
                        <View style={styles.pdfSection}>
                            <Text style={styles.sectionHeader}>👑 PDFs FORMAIS (Impressoes Globais)</Text>
                            <TouchableOpacity style={styles.pdfCard} activeOpacity={0.8} onPress={() => handleReport('VENDAS')}>
                                <View style={styles.pdfIconBg}>
                                    <Ionicons name="receipt-outline" size={20} color="#34D399" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.pdfTitle}>Relatório de Vendas (Recibos)</Text>
                                    <Text style={styles.pdfSub}>Listagem pronta para enviar.</Text>
                                </View>
                                <View style={styles.pdfDownloadBtn}>
                                    <Ionicons name="document-text-outline" size={16} color="#FFF" />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.pdfCard} activeOpacity={0.8} onPress={() => handleReport('ESTOQUE')}>
                                <View style={styles.pdfIconBg}>
                                    <Ionicons name="cube-outline" size={20} color="#34D399" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.pdfTitle}>Posição de Estoque</Text>
                                    <Text style={styles.pdfSub}>Resumo do seu inventário atual.</Text>
                                </View>
                                <View style={styles.pdfDownloadBtn}>
                                    <Ionicons name="document-text-outline" size={16} color="#FFF" />
                                </View>
                            </TouchableOpacity>

                            <Text style={[styles.sectionHeader, { marginTop: 15 }]}>📊 PLANILHAS EM EXCEL (.CSV)</Text>
                            {[
                                { t: 'vendas', n: 'Histórico de Vendas', i: 'cash-outline' },
                                { t: 'compras', n: 'Relatório de Custos/Compras', i: 'trending-down-outline' },
                                { t: 'colheitas', n: 'Registros de Colheita', i: 'leaf-outline' },
                                { t: 'plantio', n: 'Histórico de Plantios', i: 'flask-outline' },
                                { t: 'cadastro', n: 'Catálogo de Produtos / Insumos', i: 'list-outline' },
                                { t: 'clientes', n: 'Base de Parceiros', i: 'people-outline' }
                            ].map(item => (
                                <TouchableOpacity key={item.t} style={styles.xlsCard} activeOpacity={0.8} onPress={() => exportCSV(item.t, item.n)}>
                                    <View style={[styles.pdfIconBg, { width: 40, height: 40, borderRadius: 12 }]}>
                                        <Ionicons name={item.i} size={18} color="#94A3B8" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.pdfTitle}>{item.n}</Text>
                                    </View>
                                    <View style={[styles.pdfDownloadBtn, { width: 32, height: 32, borderRadius: 10 }]}>
                                        <MaterialCommunityIcons name="microsoft-excel" size={16} color="#FFF" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                            
                            <View style={[styles.pdfDisclaimer, { marginBottom: 30 }]}>
                                <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                                <Text style={styles.pdfDisclaimerText}>Os PDFs são adequados para impressão A4. As planilhas CSV exportam os bancos de dados puros para contabilidade.</Text>
                            </View>
                        </View>
                    )}

                </ScrollView>
            </SafeAreaView>

            {loading && (
                <View style={styles.overlayLoading}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>COMPILANDO ARQUIVO OFICIAL...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    topOrb: { position: 'absolute', top: -100, left: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: '#10B981', opacity: 0.05 },
    bottomOrb: { position: 'absolute', bottom: -100, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: '#3B82F6', opacity: 0.05 },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20, paddingBottom: 15, zIndex: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTextContainer: { alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
    headerSubtitle: { color: '#34D399', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    
    segmentWrapper: { paddingHorizontal: 20, marginBottom: 20 },
    segmentInner: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    segmentBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    segmentBtnActive: { backgroundColor: 'rgba(255,255,255,0.03)' },
    segmentText: { color: '#64748B', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
    segmentTextActive: { color: '#FFF' },
    segmentGlowLine: { position: 'absolute', bottom: 0, left: 20, right: 20, height: 2, backgroundColor: '#10B981', borderRadius: 2, shadowColor: '#10B981', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.8, shadowRadius: 5 },

    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

    timeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    timeChipActive: { backgroundColor: 'rgba(52, 211, 153, 0.1)', borderColor: '#10B981' },
    timeChipText: { color: '#64748B', fontSize: 11, fontWeight: '800' },
    timeChipTextActive: { color: '#34D399' },

    cortexBox: { padding: 18, borderRadius: 20, backgroundColor: 'rgba(15, 23, 42, 0.7)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', marginBottom: 20 },
    cortexHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
    cortexBrain: { width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    cortexTitle: { color: '#E2E8F0', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    cortexMessage: { color: '#94A3B8', fontSize: 12, lineHeight: 18, fontWeight: '500' },

    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
    kpiCard: { width: '48%', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(15, 23, 42, 0.4)' },
    kpiIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
    kpiValue: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 4 },
    kpiLabel: { color: '#64748B', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, flex: 1 },
    percBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 3 },
    percText: { fontSize: 9, fontWeight: '900' },

    miniCard: { flex: 1, padding: 12, marginHorizontal: 4, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(15, 23, 42, 0.4)', alignItems: 'center' },
    miniCardValue: { color: '#FFF', fontSize: 16, fontWeight: '900', marginTop: 4 },
    miniCardLabel: { color: '#64748B', fontSize: 9, fontWeight: '800', marginTop: 2 },

    mainCard: { borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(15, 23, 42, 0.4)', overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    cardTitle: { color: '#E2E8F0', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    chartLine: { left: -10 },
    emptyState: { height: 160, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#64748B', fontSize: 12, fontWeight: '600', marginTop: 10 },

    pdfSection: { paddingTop: 10 },
    pdfCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 15, overflow: 'hidden', gap: 15 },
    pdfIconBg: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
    pdfTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '800', marginBottom: 4 },
    pdfSub: { color: '#94A3B8', fontSize: 11 },
    pdfDownloadBtn: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
    
    xlsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 10, gap: 12 },
    sectionHeader: { color: '#94A3B8', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 14, marginTop: 5 },

    feedItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    feedIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    feedContent: { flex: 1 },
    feedTitle: { color: '#F8FAFC', fontSize: 12, fontWeight: '800', marginBottom: 2 },
    feedSub: { color: '#94A3B8', fontSize: 10 },
    feedValue: { fontSize: 13, fontWeight: '900', marginBottom: 2 },
    feedDate: { color: '#64748B', fontSize: 9, fontWeight: '700' },

    pdfDisclaimer: { flexDirection: 'row', padding: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, marginTop: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', gap: 12 },
    pdfDisclaimerText: { flex: 1, color: '#64748B', fontSize: 11, lineHeight: 18 },

    overlayLoading: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    loadingText: { color: '#FFF', marginTop: 15, fontSize: 12, fontWeight: '800', letterSpacing: 1 }
});

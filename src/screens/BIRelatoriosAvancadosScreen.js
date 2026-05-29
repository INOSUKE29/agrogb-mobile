import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { executeQuery } from '../database/database';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function BIRelatoriosAvancadosScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const isDark = theme?.theme_mode === 'dark';

    const [loading, setLoading] = useState(false);
    const [financials, setFinancials] = useState({
        receita: 18200,
        custos: 6400,
        lucro: 11800,
        margem: 65,
        producao: 1240,
        perdas: 80
    });

    const loadBIData = async () => {
        try {
            const rProd = await executeQuery('SELECT SUM(quantidade) as total FROM colheitas');
            const rVendas = await executeQuery('SELECT SUM(valor * quantidade) as total FROM vendas');
            const rCustos = await executeQuery('SELECT SUM(valor_total) as total FROM custos');
            const rPerdas = await executeQuery('SELECT SUM(quantidade_kg) as total FROM descarte');

            const receita = rVendas.rows.item(0).total || 18200;
            const custos = rCustos.rows.item(0).total || 6400;
            const lucro = receita - custos;
            const margem = receita > 0 ? Math.round((lucro / receita) * 100) : 65;
            const producao = rProd.rows.item(0).total || 1240;
            const perdas = rPerdas.rows.item(0).total || 80;

            setFinancials({ receita, custos, lucro, margem, producao, perdas });
        } catch (e) {
            console.error('Erro no BI local:', e);
        }
    };

    useFocusEffect(useCallback(() => {
        loadBIData();
    }, []));

    const handleExportPDF = async () => {
        setLoading(true);
        try {
            const htmlContent = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1F2937; padding: 30px; }
                        .header { text-align: center; border-bottom: 3px solid #10B981; padding-bottom: 20px; margin-bottom: 30px; }
                        .logo { font-size: 28px; font-weight: 900; color: #064E3B; letter-spacing: 2px; }
                        .subtitle { font-size: 14px; color: #4B5563; margin-top: 5px; }
                        .section-title { font-size: 16px; font-weight: 800; color: #111827; border-left: 5px solid #10B981; padding-left: 10px; margin: 30px 0 15px 0; }
                        .kpi-grid { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 30px; }
                        .kpi-card { flex: 1; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 15px; text-align: center; }
                        .kpi-label { font-size: 10px; font-weight: 800; color: #6B7280; text-transform: uppercase; margin-bottom: 5px; }
                        .kpi-value { font-size: 18px; font-weight: 900; color: #10B981; }
                        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        .table th { background: #064E3B; color: #FFF; text-align: left; padding: 12px; font-size: 12px; }
                        .table td { padding: 12px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
                        .table tr:nth-child(even) { background: #F9FAFB; }
                        .footer { text-align: center; font-size: 10px; color: #9CA3AF; margin-top: 50px; border-top: 1px solid #E5E7EB; padding-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">AGROGB BI RURAL</div>
                        <div class="subtitle">Relatório Executivo de Resultados e Performance</div>
                    </div>

                    <div class="section-title">INDICADORES CHAVE DE PERFORMANCE (KPI)</div>
                    <div class="kpi-grid">
                        <div class="kpi-card">
                            <div class="kpi-label">Faturamento Total</div>
                            <div class="kpi-value" style="color: #3B82F6;">R$ ${financials.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-label">Custo Operacional</div>
                            <div class="kpi-value" style="color: #EF4444;">R$ ${financials.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-label">Resultado Líquido</div>
                            <div class="kpi-value" style="color: #10B981;">R$ ${financials.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    <div class="section-title">DEMONSTRATIVO DE RESULTADOS EXERCÍCIO (DRE)</div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>INDICADOR FINANCEIRO / OPERACIONAL</th>
                                <th>VALOR NOMINAL</th>
                                <th>DESEMPENHO RELATIVO</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Receita de Comercialização de Safras</td>
                                <td>R$ ${financials.receita.toLocaleString('pt-BR')}</td>
                                <td>100.0%</td>
                            </tr>
                            <tr>
                                <td>Custos de Produção e Insumos</td>
                                <td style="color: #EF4444;">- R$ ${financials.custos.toLocaleString('pt-BR')}</td>
                                <td>${Math.round((financials.custos / financials.receita) * 100) || 0}%</td>
                            </tr>
                            <tr style="font-weight: bold; background: #ECFDF5;">
                                <td>Lucro Líquido Operacional</td>
                                <td style="color: #10B981;">R$ ${financials.lucro.toLocaleString('pt-BR')}</td>
                                <td>${financials.margem}%</td>
                            </tr>
                            <tr>
                                <td>Produção Total Acumulada</td>
                                <td>${financials.producao.toLocaleString('pt-BR')} KG</td>
                                <td>Eficiência de Colheita</td>
                            </tr>
                            <tr>
                                <td>Perdas e Descartes de Campo</td>
                                <td style="color: #7C3AED;">${financials.perdas.toLocaleString('pt-BR')} KG</td>
                                <td>${Math.round((financials.perdas / (financials.producao || 1)) * 100)}% de Perda</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="footer">
                        AgroGB Mobile Pro • Documento Oficial de Auditoria Rural • Gerado em ${new Date().toLocaleDateString('pt-BR')}
                    </div>
                </body>
                </html>
            `;
            
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível gerar o PDF Executivo.');
        } finally {
            setLoading(false);
        }
    };

    // Mapeamento de Cores e Estilo Escuro/Claro
    const chartConfig = {
        backgroundColor: '#1E293B',
        backgroundGradientFrom: '#1E293B',
        backgroundGradientTo: '#0F172A',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: { r: '6', strokeWidth: '2', stroke: '#10B981' }
    };

    const pieData = [
        { name: 'Adubação', population: 35, color: '#10B981', legendFontColor: '#FFF', legendFontSize: 11 },
        { name: 'Insumos', population: 25, color: '#3B82F6', legendFontColor: '#FFF', legendFontSize: 11 },
        { name: 'Mão de Obra', population: 25, color: '#F59E0B', legendFontColor: '#FFF', legendFontSize: 11 },
        { name: 'Transporte', population: 15, color: '#EF4444', legendFontColor: '#FFF', legendFontSize: 11 }
    ];

    const barData = {
        labels: ['Vendas', 'Custos', 'Lucro'],
        datasets: [{ data: [financials.receita, financials.custos, financials.lucro] }]
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0B121E' : '#F3F4F6' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <LinearGradient 
                colors={isDark ? ['#111827', '#0F172A'] : [theme?.colors?.primary || '#10B981', '#064E3B']} 
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>ANÁLISE E GRÁFICOS</Text>
                    <View style={{ width: 38 }} />
                </View>
                <Text style={styles.headerSub}>Análise visual de produção e financeiro rural</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                
                {/* 📉 CARD 1: PRODUÇÃO SEMANAL (LineChart) */}
                <Card style={styles.chartCard}>
                    <Text style={styles.chartTitle}>📈 PRODUÇÃO SEMANAL (KG)</Text>
                    <LineChart
                        data={{
                            labels: ["Seg", "Ter", "Qua", "Qui", "Sex"],
                            datasets: [{ data: [120, 90, 140, 110, 170] }]
                        }}
                        width={width - 48}
                        height={180}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chartStyle}
                    />
                </Card>

                {/* 📊 CARD 2: FINANCEIRO DO MÊS (BarChart) */}
                <Card style={styles.chartCard}>
                    <Text style={styles.chartTitle}>📊 FINANCEIRO DO MÊS (R$)</Text>
                    <BarChart
                        data={barData}
                        width={width - 48}
                        height={180}
                        chartConfig={{
                            ...chartConfig,
                            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`
                        }}
                        style={styles.chartStyle}
                        fromZero
                    />
                </Card>

                {/* 🥧 CARD 3: DISTRIBUIÇÃO DE CUSTOS (PieChart) */}
                <Card style={styles.chartCard}>
                    <Text style={styles.chartTitle}>🥧 DISTRIBUIÇÃO DE CUSTOS (%)</Text>
                    <PieChart
                        data={pieData}
                        width={width - 48}
                        height={160}
                        chartConfig={chartConfig}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        style={styles.chartStyle}
                    />
                </Card>

                {/* 📊 CARD 4: PRODUÇÃO POR CULTURA */}
                <Card style={styles.chartCard}>
                    <Text style={styles.chartTitle}>🌱 PRODUÇÃO POR CULTURA (KG)</Text>
                    <BarChart
                        data={{
                            labels: ['Morango', 'Tomate', 'Alface'],
                            datasets: [{ data: [620, 480, 310] }]
                        }}
                        width={width - 48}
                        height={180}
                        chartConfig={{
                            ...chartConfig,
                            color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`
                        }}
                        style={styles.chartStyle}
                        fromZero
                    />
                </Card>

                {/* 🖨️ PDF EXPORT BUTTON */}
                <TouchableOpacity 
                    style={styles.exportBtn} 
                    onPress={handleExportPDF}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="document-text" size={20} color="#FFF" />
                            <Text style={styles.exportText}>EXPORTAR RELATÓRIO BI (PDF)</Text>
                        </>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textAlign: 'center' },
    scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
    chartCard: { 
        padding: 16, 
        alignItems: 'center', 
        backgroundColor: '#1E293B', 
        borderRadius: 20, 
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8
    },
    chartTitle: { fontSize: 12, fontWeight: '900', color: '#FFF', letterSpacing: 1, marginBottom: 16, alignSelf: 'flex-start' },
    chartStyle: { marginVertical: 8, borderRadius: 16 },
    exportBtn: { marginTop: 10, padding: 18, borderRadius: 15, backgroundColor: '#27AE60', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    exportText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});

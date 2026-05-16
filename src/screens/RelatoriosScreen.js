import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, TextInput, Alert } from 'react-native';
import { executeQuery } from '../database/database';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { generatePDFAgro } from '../services/ReportService';
import { ExportService } from '../services/ExportService';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import MetricCard from '../components/common/MetricCard';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

const { width } = Dimensions.get('window');

export default function RelatoriosScreen({ navigation }) {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ prod: 0, vendas: 0, custos: 0, perdas: 0 });
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const loadData = async () => {
        setLoading(true);
        try {
            const rProd = await executeQuery('SELECT SUM(quantidade) as total FROM colheitas');
            const rVendas = await executeQuery('SELECT SUM(valor * quantidade) as total FROM vendas');
            const rCustos = await executeQuery('SELECT SUM(valor_total) as total FROM custos');
            const rPerdas = await executeQuery('SELECT SUM(quantidade_kg) as total FROM descarte');

            setData({
                prod: rProd.rows.item(0).total || 0,
                vendas: rVendas.rows.item(0).total || 0,
                custos: rCustos.rows.item(0).total || 0,
                perdas: rPerdas.rows.item(0).total || 0
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const handlePreset = (days) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        setEndDate(end.toISOString().split('T')[0]);
        setStartDate(start.toISOString().split('T')[0]);
    };

    const handleExportExcel = async () => {
        try {
            const res = await executeQuery('SELECT cultura, produto, quantidade, data, observacao FROM colheitas WHERE is_deleted = 0 ORDER BY data DESC');
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            await ExportService.exportToExcel(rows, 'Relatorio_Colheitas_AgroGB');
        } catch (e) { Alert.alert('Erro', 'Falha ao exportar dados.'); }
    };

    const profit = data.vendas - data.custos;

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>BI RURAL PERFORMANCE</Text>
                    <TouchableOpacity onPress={loadData}>
                        <Ionicons name="refresh" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSub}>Análise executiva de resultados e lucratividade</Text>
            </LinearGradient>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                {loading ? (
                    <ActivityIndicator size="large" color={theme?.colors?.primary} style={{ marginTop: 50 }} />
                ) : (
                    <View style={styles.content}>
                        <View style={styles.metricGrid}>
                            <MetricCard 
                                title="PRODUÇÃO" 
                                value={`${data.prod.toLocaleString('pt-BR')} KG`} 
                                icon="leaf" 
                                color={theme?.colors?.primary}
                                style={styles.metricItem}
                            />
                            <MetricCard 
                                title="VENDAS" 
                                value={`R$ ${data.vendas.toLocaleString('pt-BR')}`} 
                                icon="cash" 
                                color="#3B82F6"
                                style={styles.metricItem}
                            />
                            <MetricCard 
                                title="CUSTOS" 
                                value={`R$ ${data.custos.toLocaleString('pt-BR')}`} 
                                icon="trending-down" 
                                color="#EF4444"
                                style={styles.metricItem}
                            />
                            <MetricCard 
                                title="PERDAS" 
                                value={`${data.perdas.toLocaleString('pt-BR')} KG`} 
                                icon="alert-circle" 
                                color="#7C3AED"
                                style={styles.metricItem}
                            />
                        </View>

                        <Card style={styles.insightCard} noPadding>
                            <LinearGradient 
                                colors={profit >= 0 ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']} 
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.insightHeader}
                            >
                                <Ionicons name="bulb-outline" size={20} color="#FFF" />
                                <Text style={styles.insightTitle}>INSIGHT EXECUTIVO</Text>
                            </LinearGradient>
                            <View style={styles.insightBody}>
                                <Text style={styles.insightValue}>
                                    {profit >= 0 ? 'RESULTADO LÍQUIDO POSITIVO' : 'RESULTADO LÍQUIDO NEGATIVO'}
                                </Text>
                                <Text style={[styles.profitValue, { color: profit >= 0 ? '#10B981' : '#EF4444' }]}>
                                    R$ {Math.abs(profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </Text>
                                <Text style={styles.insightDesc}>
                                    {profit >= 0 
                                        ? 'Sua operação está gerando lucro líquido. Mantenha o controle de custos.' 
                                        : 'Atenção: Os custos operacionais excederam o faturamento no período.'}
                                </Text>
                            </View>
                        </Card>

                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>GERAR RELATÓRIOS OFICIAIS (PDF)</Text>
                            <Card style={styles.pdfCard}>
                                <View style={styles.presetRow}>
                                    {[{label: 'Hoje', d: 0}, {label: '7 Dias', d: 7}, {label: '30 Dias', d: 30}].map(p => (
                                        <TouchableOpacity key={p.label} style={styles.presetBtn} onPress={() => handlePreset(p.d)}>
                                            <Text style={styles.presetText}>{p.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={styles.dateGrid}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>INÍCIO</Text>
                                        <TextInput style={styles.dateInput} value={startDate} onChangeText={setStartDate} placeholder="AAAA-MM-DD" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>FIM</Text>
                                        <TextInput style={styles.dateInput} value={endDate} onChangeText={setEndDate} placeholder="AAAA-MM-DD" />
                                    </View>
                                </View>

                                <AgroButton 
                                    title="RELATÓRIO DE VENDAS" 
                                    onPress={() => generatePDFAgro('VENDAS', startDate, endDate)}
                                    icon="document-text-outline"
                                    style={{ marginBottom: 10 }}
                                />
                                <AgroButton 
                                    title="POSIÇÃO DE ESTOQUE" 
                                    variant="secondary"
                                    onPress={() => generatePDFAgro('ESTOQUE', startDate, endDate)}
                                    icon="cube-outline"
                                    style={{ marginBottom: 10 }}
                                />
                                <AgroButton 
                                    title="RELATÓRIO DRE (PDF)" 
                                    onPress={async () => {
                                        const exportData = [
                                            { "Indicador": "Receitas Brutas", "Valor": `R$ ${data.vendas.toLocaleString('pt-BR')}` },
                                            { "Indicador": "Custos Totais", "Valor": `R$ ${data.custos.toLocaleString('pt-BR')}` },
                                            { "Indicador": "Resultado Líquido", "Valor": `R$ ${profit.toLocaleString('pt-BR')}` },
                                            { "Indicador": "Produção Total", "Valor": `${data.prod.toLocaleString('pt-BR')} KG` },
                                            { "Indicador": "Perdas Registradas", "Valor": `${data.perdas.toLocaleString('pt-BR')} KG` }
                                        ];
                                        await ExportService.exportToPDF('DEMONSTRATIVO DE RESULTADOS (RESUMO)', exportData, 'DRE_RESUMO_AGROGB');
                                    }}
                                    icon="bar-chart-outline"
                                    style={{ marginBottom: 10, backgroundColor: '#064E3B' }}
                                />
                                <AgroButton 
                                    title="EXPORTAR EXCEL (FULL)" 
                                    variant="secondary"
                                    onPress={handleExportExcel}
                                    icon="grid-outline"
                                    style={{ borderColor: '#10B981' }}
                                />
                            </Card>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
    scroll: { flex: 1 },
    content: { padding: 20 },
    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    metricItem: { width: (width - 50) / 2, height: 110, marginHorizontal: 0 },
    insightCard: { marginBottom: 25 },
    insightHeader: { padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    insightTitle: { fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    insightBody: { padding: 20, alignItems: 'center' },
    insightValue: { fontSize: 12, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 },
    profitValue: { fontSize: 28, fontWeight: '900', marginVertical: 8 },
    insightDesc: { fontSize: 12, color: '#6B7280', textAlign: 'center', fontWeight: '500' },
    section: { marginTop: 10 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 15, letterSpacing: 1 },
    pdfCard: { padding: 20 },
    presetRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    presetBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#F3F4F6', borderRadius: 10, alignItems: 'center' },
    presetText: { fontSize: 11, fontWeight: '900', color: '#4B5563' },
    dateGrid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    inputLabel: { fontSize: 9, fontWeight: '900', color: '#9CA3AF', marginBottom: 8, letterSpacing: 1 },
    dateInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' }
});

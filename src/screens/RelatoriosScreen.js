import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, TextInput, Alert } from 'react-native';
import { executeQuery } from '../database/database';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { generatePDFAgro } from '../services/ReportService';

const { width } = Dimensions.get('window');

export default function RelatoriosScreen() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ prod: 0, vendas: 0, custos: 0, perdas: 0 });

    const loadData = async () => {
        setLoading(true);
        try {
            const rProd = await executeQuery('SELECT SUM(total_caixas) as total FROM colheitas WHERE is_deleted = 0');
            const rVendas = await executeQuery('SELECT SUM(valor * quantidade) as total FROM vendas');
            const rCustos = await executeQuery('SELECT SUM(valor_total) as total FROM custos');
            const rPerdas = await executeQuery('SELECT SUM(quantidade_kg) as total FROM descarte');

            const rEncomendasPendentes = await executeQuery("SELECT SUM(quantidade_restante) as total FROM orders WHERE status IN ('PENDENTE', 'PARCIAL') AND is_deleted = 0");
            const rReceitaPrevista = await executeQuery("SELECT SUM(quantidade_restante * valor_unitario) as total FROM orders WHERE status IN ('PENDENTE', 'PARCIAL') AND is_deleted = 0");

            setData({
                prod: rProd.rows.item(0).total || 0,
                vendas: rVendas.rows.item(0).total || 0,
                custos: rCustos.rows.item(0).total || 0,
                perdas: rPerdas.rows.item(0).total || 0,
                enc_pendentes: rEncomendasPendentes.rows.item(0).total || 0,
                enc_receita: rReceitaPrevista.rows.item(0).total || 0
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const StatCard = ({ title, value, unit, color, icon }) => (
        <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <Text style={styles.icon}>{icon}</Text>
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardLabel}>{title}</Text>
                <View style={styles.valueRow}>
                    <Text style={styles.cardValue}>{value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                    <Text style={styles.cardUnit}>{unit}</Text>
                </View>
            </View>
        </View>
    );

    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const handlePreset = (days) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        setEndDate(end.toISOString().split('T')[0]);
        setStartDate(start.toISOString().split('T')[0]);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.title}>BI RURAL PERFORMANCE</Text>
                <Text style={styles.sub}>Análise de Resultados e Produtividade</Text>
            </View>

            {loading ? <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 100 }} /> : (
                <View style={styles.content}>
                    <StatCard title="PRODUÇÃO TOTAL" value={data.prod} unit="CX" color="#10B981" icon="📦" />
                    <StatCard title="FATURAMENTO" value={data.vendas} unit="R$" color="#3B82F6" icon="💰" />
                    <StatCard title="ENCOMENDAS (PAG. FUTURO)" value={data.enc_receita} unit="R$" color="#F59E0B" icon="⏳" />
                    <StatCard title="ITENS ENCOMENDADOS" value={data.enc_pendentes} unit="QTD" color="#8B5CF6" icon="📦" />
                    <StatCard title="CUSTOS OPERACIONAIS" value={data.custos} unit="R$" color="#EF4444" icon="💸" />
                    <StatCard title="QUEBRAS / PERDAS" value={data.perdas} unit="KG" color="#7F1D1D" icon="📉" />

                    <View style={styles.insightBox}>
                        <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.insightHeader}>
                            <Text style={styles.insightTitle}>INSIGHT DO DIA</Text>
                        </LinearGradient>
                        <View style={styles.insightBody}>
                            <Text style={styles.insightTxt}>
                                {data.vendas > data.custos
                                    ? 'LUCRATIVIDADE OPERACIONAL POSITIVA EM R$ ' + (data.vendas - data.custos).toFixed(2)
                                    : 'ATENÇÃO: CUSTOS EXCEDENDO FATURAMENTO. REVISE SUAS ENTRADAS.'}
                            </Text>
                        </View>
                    </View>

                    {/* PDF REPORTS SECTION */}
                    <View style={styles.pdfSection}>
                        <Text style={styles.sectionTitle}>RELATÓRIOS OFICIAIS (PDF)</Text>

                        <View style={styles.presetRow}>
                            <TouchableOpacity style={styles.presetBtn} onPress={() => handlePreset(0)}><Text style={styles.presetText}>Hoje</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.presetBtn} onPress={() => handlePreset(7)}><Text style={styles.presetText}>7 Dias</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.presetBtn} onPress={() => handlePreset(30)}><Text style={styles.presetText}>30 Dias</Text></TouchableOpacity>
                        </View>

                        <View style={styles.dateRow}>
                            <TextInput style={styles.dateInput} value={startDate} onChangeText={setStartDate} placeholder="AAAA-MM-DD" keyboardType="numeric" />
                            <Text style={{ alignSelf: 'center', fontWeight: 'bold', color: '#9CA3AF' }}>ATÉ</Text>
                            <TextInput style={styles.dateInput} value={endDate} onChangeText={setEndDate} placeholder="AAAA-MM-DD" keyboardType="numeric" />
                        </View>

                        <TouchableOpacity style={[styles.pdfBtn, { backgroundColor: '#059669' }]} onPress={() => generatePDFAgro('COLHEITA_DETALHADA', startDate, endDate)}>
                            <Text style={{ fontSize: 20 }}>🌾</Text>
                            <Text style={styles.pdfBtnText}>RELATÓRIO DETALHADO DE COLHEITA</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.pdfBtn} onPress={() => generatePDFAgro('VENDAS', startDate, endDate)}>
                            <Text style={{ fontSize: 20 }}>📄</Text>
                            <Text style={styles.pdfBtnText}>GERAR RELATÓRIO DE VENDAS</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.pdfBtn, styles.stockBtn]} onPress={() => generatePDFAgro('ESTOQUE', startDate, endDate)}>
                            <Text style={{ fontSize: 20 }}>📦</Text>
                            <Text style={styles.pdfBtnText}>POSIÇÃO DE ESTOQUE ATUAL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F5' },
    header: { padding: 28, paddingTop: 48 },
    title: { fontSize: 22, fontWeight: '900', color: '#1E1E1E' },
    sub: { fontSize: 11, color: '#6E6E6E', letterSpacing: 0.5, marginTop: 5 },
    content: { padding: 20 },
    card: { backgroundColor: '#FFF', borderRadius: 18, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
    iconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 18 },
    icon: { fontSize: 26 },
    cardInfo: { flex: 1 },
    cardLabel: { fontSize: 11, fontWeight: '700', color: '#6E6E6E', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
    valueRow: { flexDirection: 'row', alignItems: 'baseline' },
    cardValue: { fontSize: 20, fontWeight: '800', color: '#1E1E1E' },
    cardUnit: { fontSize: 10, fontWeight: 'bold', color: '#6E6E6E', marginLeft: 8 },
    insightBox: { backgroundColor: '#FFF', borderRadius: 18, overflow: 'hidden', marginTop: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
    insightHeader: { padding: 15, alignItems: 'center', backgroundColor: '#176E46' },
    insightTitle: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 1.5 },
    insightBody: { padding: 22, alignItems: 'center' },
    insightTxt: { fontSize: 13, fontWeight: '700', color: '#1E1E1E', textAlign: 'center', lineHeight: 22 },

    // PDF Section Styles
    pdfSection: { marginTop: 28, marginBottom: 50 },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: '#1E1E1E', marginBottom: 14, letterSpacing: 0.5 },
    dateRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    dateInput: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#D9D9D9', textAlign: 'center', color: '#1E1E1E' },
    pdfBtn: { backgroundColor: '#1F8A5B', padding: 16, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, elevation: 3, marginBottom: 10 },
    pdfBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    stockBtn: { backgroundColor: '#176E46' },
    presetRow: { flexDirection: 'row', gap: 8, marginBottom: 14, justifyContent: 'center' },
    presetBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#E8F5EE', borderRadius: 20 },
    presetText: { fontSize: 11, fontWeight: '700', color: '#1F8A5B' }
});


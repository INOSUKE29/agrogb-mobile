import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, TextInput, Alert } from 'react-native';
import { executeQuery } from '../database/database';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { generatePDFAgro } from '../services/ReportService';
import { Ionicons } from '@expo/vector-icons';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { DARK, GLOW_CARD_SHADOW } from '../styles/darkTheme';

const { width } = Dimensions.get('window');

export default function RelatoriosScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ prod: 0, vendas: 0, custos: 0, perdas: 0 });

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
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const StatCard = ({ title, value, unit, glowColor, icon }) => (
        <View style={[styles.statCard, { borderColor: glowColor + '40', shadowColor: glowColor }]}>
            <View style={[styles.iconBox, { backgroundColor: glowColor + '18' }]}>
                <Text style={styles.icon}>{icon}</Text>
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardLabel}>{title}</Text>
                <View style={styles.valueRow}>
                    <Text style={[styles.cardValue, { color: glowColor }]}>{value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
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
        <AppContainer>
            <ScreenHeader
                title="BI Rural Performance"
                onBack={navigation?.goBack ? () => navigation.goBack() : null}
            />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {loading ? <ActivityIndicator size="large" color={DARK.glow} style={{ marginTop: 80 }} /> : (
                    <>
                        <StatCard title="PRODUÇÃO TOTAL" value={data.prod} unit="KG" glowColor={DARK.glow} icon="🌾" />
                        <StatCard title="FATURAMENTO" value={data.vendas} unit="R$" glowColor="#3B82F6" icon="💰" />
                        <StatCard title="CUSTOS OPERACIONAIS" value={data.custos} unit="R$" glowColor={DARK.danger} icon="💸" />
                        <StatCard title="QUEBRAS / PERDAS" value={data.perdas} unit="KG" glowColor="#F59E0B" icon="📉" />

                        {/* Insight */}
                        <LinearGradient
                            colors={['rgba(0,255,156,0.15)', 'rgba(0,255,156,0.05)']}
                            style={styles.insightBox}
                        >
                            <Text style={styles.insightTitle}>💡 INSIGHT DO DIA</Text>
                            <Text style={styles.insightTxt}>
                                {data.vendas > data.custos
                                    ? '✅ LUCRATIVIDADE OPERACIONAL POSITIVA EM R$ ' + (data.vendas - data.custos).toFixed(2)
                                    : '⚠️ ATENÇÃO: CUSTOS EXCEDENDO FATURAMENTO. REVISE SUAS ENTRADAS.'}
                            </Text>
                        </LinearGradient>

                        {/* PDF Section */}
                        <Text style={styles.sectionTitle}>RELATÓRIOS OFICIAIS (PDF)</Text>
                        <View style={styles.presetRow}>
                            {[{ label: 'Hoje', days: 0 }, { label: '7 Dias', days: 7 }, { label: '30 Dias', days: 30 }].map(p => (
                                <TouchableOpacity key={p.label} style={styles.presetBtn} onPress={() => handlePreset(p.days)}>
                                    <Text style={styles.presetText}>{p.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.dateRow}>
                            <TextInput style={styles.dateInput} value={startDate} onChangeText={setStartDate} placeholder="AAAA-MM-DD" placeholderTextColor={DARK.placeholder} keyboardType="numeric" />
                            <Text style={{ alignSelf: 'center', fontWeight: 'bold', color: DARK.textMuted }}>ATÉ</Text>
                            <TextInput style={styles.dateInput} value={endDate} onChangeText={setEndDate} placeholder="AAAA-MM-DD" placeholderTextColor={DARK.placeholder} keyboardType="numeric" />
                        </View>

                        <TouchableOpacity style={styles.pdfBtn} onPress={() => generatePDFAgro('VENDAS', startDate, endDate)}>
                            <Text style={{ fontSize: 18 }}>📄</Text>
                            <Text style={styles.pdfBtnText}>GERAR RELATÓRIO DE VENDAS</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.pdfBtn, { borderColor: '#3B82F640' }]} onPress={() => generatePDFAgro('ESTOQUE', startDate, endDate)}>
                            <Text style={{ fontSize: 18 }}>📦</Text>
                            <Text style={styles.pdfBtnText}>POSIÇÃO DE ESTOQUE ATUAL</Text>
                        </TouchableOpacity>
                    </>
                )}
                <View style={{ height: 60 }} />
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 20 },
    statCard: {
        backgroundColor: DARK.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    iconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 18 },
    icon: { fontSize: 26 },
    cardInfo: { flex: 1 },
    cardLabel: { fontSize: 9, fontWeight: '900', color: DARK.textMuted, letterSpacing: 1.5, marginBottom: 6 },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    cardValue: { fontSize: 22, fontWeight: '800' },
    cardUnit: { fontSize: 10, fontWeight: 'bold', color: DARK.textMuted },

    insightBox: { borderRadius: 18, padding: 20, borderWidth: 1, borderColor: DARK.glowBorder, marginBottom: 24, marginTop: 6 },
    insightTitle: { fontSize: 10, fontWeight: '900', color: DARK.glow, letterSpacing: 2, marginBottom: 10 },
    insightTxt: { fontSize: 13, fontWeight: '700', color: DARK.textSecondary, lineHeight: 22 },

    sectionTitle: { fontSize: 11, fontWeight: '900', color: DARK.textMuted, marginBottom: 14, letterSpacing: 1.5 },
    presetRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    presetBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(0,255,156,0.1)', borderRadius: 20, borderWidth: 1, borderColor: DARK.glowBorder },
    presetText: { fontSize: 11, fontWeight: 'bold', color: DARK.glow },

    dateRow: { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'center' },
    dateInput: { flex: 1, backgroundColor: DARK.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: DARK.glowBorder, textAlign: 'center', color: DARK.textPrimary, fontSize: 13 },

    pdfBtn: { backgroundColor: 'rgba(0,255,156,0.12)', borderWidth: 1, borderColor: DARK.glowBorder, padding: 15, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
    pdfBtnText: { color: DARK.glow, fontWeight: 'bold', fontSize: 13 },
});

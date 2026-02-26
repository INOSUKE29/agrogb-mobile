import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, TextInput } from 'react-native';
import { executeQuery } from '../database/database';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { generatePDFAgro } from '../services/ReportService';
import FinancialDashboard from '../components/FinancialDashboard';

const THEME = {
    bg: '#F3F4F6',
    headerBg: ['#4C1D95', '#5B21B6'], // Violet for Reports
    cardBg: '#FFF',
    textMain: '#1F2937',
    primary: '#7C3AED'
};

const { width } = Dimensions.get('window');

export default function RelatoriosScreen({ navigation }) {
    const [viewMode, setViewMode] = useState('MENU'); // MENU, PROD, FIN, EST, PDF
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({});

    // PDF Dates
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const loadGlobalDates = () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        setEndDate(end.toISOString().split('T')[0]);
        setStartDate(start.toISOString().split('T')[0]);
    };

    useFocusEffect(useCallback(() => {
        loadGlobalDates();
    }, []));

    // --- DATA LOADERS ---
    const loadProduction = async () => {
        setLoading(true);
        try {
            const res = await executeQuery(`SELECT cultura, SUM(quantidade) as total FROM colheitas GROUP BY cultura`);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setData({ production: rows });
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const loadFinancial = async () => {
        setLoading(true);
        try {
            const vendas = await executeQuery(`SELECT SUM(valor * quantidade) as total FROM vendas`);
            const custos = await executeQuery(`SELECT SUM(valor_total) as total FROM custos`);
            const compras = await executeQuery(`SELECT SUM(valor * quantidade) as total FROM compras`);
            setData({
                vendas: vendas.rows.item(0).total || 0,
                custos: custos.rows.item(0).total || 0,
                compras: compras.rows.item(0).total || 0
            });
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const loadStock = async () => {
        setLoading(true);
        try {
            const res = await executeQuery(`SELECT produto, quantidade, unidade FROM estoque ORDER BY quantidade ASC`);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setData({ stock: rows });
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    // --- NAVIGATION HANDLERS ---
    const openSection = (mode) => {
        setViewMode(mode);
        if (mode === 'PROD') loadProduction();
        if (mode === 'FIN') loadFinancial();
        if (mode === 'EST') loadStock();
    };

    // --- COMPONENTS ---
    const MenuCard = ({ title, icon, color, mode, lib: IconLib = Ionicons }) => (
        <TouchableOpacity style={styles.menuCard} onPress={() => openSection(mode)}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                <IconLib name={icon} size={32} color={color} />
            </View>
            <Text style={styles.menuTitle}>{title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={{ marginTop: 10 }} />
        </TouchableOpacity>
    );

    const StatRow = ({ label, value, color = '#374151', bold = false }) => (
        <View style={styles.statRow}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValue, { color, fontWeight: bold ? 'bold' : 'normal' }]}>{value}</Text>
        </View>
    );

    // --- RENDER CONTENT ---
    const renderContent = () => {
        if (loading) return <ActivityIndicator size="large" color={THEME.primary} style={{ marginTop: 50 }} />;

        switch (viewMode) {
            case 'MENU':
                return (
                    <View style={styles.grid}>
                        <MenuCard title="Produção" icon="leaf" color="#10B981" mode="PROD" />
                        <MenuCard title="Financeiro" icon="cash" color="#3B82F6" mode="FIN" />
                        <MenuCard title="Estoque" icon="cube" color="#F59E0B" mode="EST" />
                        <MenuCard title="Relatórios Oficiais (PDF)" icon="document-text" color="#EF4444" mode="PDF" />
                    </View>
                );

            case 'PROD':
                return (
                    <View>
                        <Text style={styles.sectionHeader}>Colheita por Cultura (Total)</Text>
                        {data.production?.map((item, i) => (
                            <View key={i} style={styles.listItem}>
                                <Text style={styles.listTitle}>{item.cultura}</Text>
                                <Text style={styles.listValue}>{item.total} <Text style={{ fontSize: 10 }}>kg/cx</Text></Text>
                            </View>
                        ))}
                        {(!data.production || data.production.length === 0) && <Text style={styles.emptyText}>Sem dados registrados.</Text>}
                    </View>
                );



            // ... existing code ...

            case 'FIN':
                return <FinancialDashboard />;


            case 'EST':
                return (
                    <View>
                        <Text style={styles.sectionHeader}>Posição de Estoque</Text>
                        {data.stock?.map((item, i) => (
                            <View key={i} style={styles.listItem}>
                                <Text style={styles.listTitle}>{item.produto}</Text>
                                <Text style={[styles.listValue, { color: item.quantidade < 10 ? '#EF4444' : '#1F2937' }]}>
                                    {item.quantidade} {item.unidade}
                                </Text>
                            </View>
                        ))}
                        {(!data.stock || data.stock.length === 0) && <Text style={styles.emptyText}>Estoque vazio.</Text>}
                    </View>
                );

            case 'PDF':
                return (
                    <View>
                        <View style={styles.card}>
                            <Text style={styles.label}>Período de Análise</Text>
                            <View style={styles.dateRow}>
                                <TextInput style={styles.dateInput} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" keyboardType="numeric" />
                                <Text>até</Text>
                                <TextInput style={styles.dateInput} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" keyboardType="numeric" />
                            </View>
                        </View>

                        <Text style={styles.sectionHeader}>Gerar Documentos</Text>
                        <TouchableOpacity style={[styles.pdfBtn, { backgroundColor: '#10B981' }]} onPress={() => generatePDFAgro('VENDAS', startDate, endDate)}>
                            <Ionicons name="document-text" size={20} color="#FFF" />
                            <Text style={styles.btnText}>Relatório de Vendas</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.pdfBtn, { backgroundColor: '#3B82F6' }]} onPress={() => generatePDFAgro('ESTOQUE', startDate, endDate)}>
                            <Ionicons name="cube" size={20} color="#FFF" />
                            <Text style={styles.btnText}>Posição de Estoque</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.pdfBtn, { backgroundColor: '#F59E0B' }]} onPress={() => generatePDFAgro('COLHEITA', startDate, endDate)}>
                            <Ionicons name="leaf" size={20} color="#FFF" />
                            <Text style={styles.btnText}>Resumo de Safra</Text>
                        </TouchableOpacity>
                    </View>
                );
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#E6F4EA', '#FFFFFF']} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={THEME.headerBg} style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {viewMode !== 'MENU' && (
                        <TouchableOpacity onPress={() => setViewMode('MENU')} style={{ marginRight: 15 }}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                    )}
                    <View>
                        <Text style={styles.headerTitle}>
                            {viewMode === 'MENU' ? 'Central de Relatórios' :
                                viewMode === 'PROD' ? 'Produção Agrícola' :
                                    viewMode === 'FIN' ? 'Gestão Financeira' :
                                        viewMode === 'EST' ? 'Controle de Estoque' : 'Documentos Oficiais'}
                        </Text>
                        <Text style={styles.headerSub}>
                            {viewMode === 'MENU' ? 'Selecione uma categoria' : 'Visão Detalhada'}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {renderContent()}
                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    header: { padding: 30, paddingTop: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 5 },

    content: { padding: 20 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'center' },
    menuCard: { width: width * 0.42, backgroundColor: '#FFF', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 3 },
    iconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    menuTitle: { fontSize: 13, fontWeight: 'bold', color: '#374151', textAlign: 'center' },

    card: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, elevation: 2, marginBottom: 20 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    statLabel: { color: '#6B7280', fontSize: 13 },
    statValue: { fontSize: 14, color: '#1F2937' },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },

    listItem: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    listTitle: { fontWeight: 'bold', color: '#374151' },
    listValue: { color: '#059669', fontWeight: 'bold' },
    sectionHeader: { fontSize: 13, fontWeight: 'bold', color: '#6B7280', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
    emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20 },

    label: { fontSize: 12, fontWeight: 'bold', color: '#6B7280', marginBottom: 10 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dateInput: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, textAlign: 'center', backgroundColor: '#F9FAFB' },

    pdfBtn: { flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 15, elevation: 2 },
    btnText: { color: '#FFF', fontWeight: 'bold' }
});

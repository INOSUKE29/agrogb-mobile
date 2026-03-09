import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, StatusBar as RNStatusBar,
    ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';
import WeatherWidget from '../ui/WeatherWidget';
import SidebarDrawer from '../ui/SidebarDrawer';
import { MetricCard } from '../ui/components/MetricCard';
import { QuickAction } from '../ui/components/QuickAction';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const scale = (size) => isSmallDevice ? size * 0.9 : size;

export default function HomeScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const [stats, setStats] = useState({
        saldo: 0,
        colheitaHoje: 0,
        custosMes: 0,
        vendasMes: 0,
        vendasHoje: 0,
    });
    const [drawerVisible, setDrawerVisible] = useState(false);

    const loadStats = async () => {
        const data = await getDashboardStats();
        setStats(prev => ({ ...prev, ...data }));
    };

    useFocusEffect(useCallback(() => {
        loadStats();
    }, []));

    const formatBRL = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const categories = [
        {
            title: 'Gestão Operacional',
            color: colors.primary,
            actions: [
                { id: 'caderno', label: 'Caderno', icon: 'book', route: 'CadernoCampo' },
                { id: 'colheita', label: 'Colheita', icon: 'leaf', route: 'Colheita' },
                { id: 'plantio', label: 'Plantio', icon: 'rose-outline', route: 'Plantio' },
                { id: 'monitorar', label: 'Monitorar', icon: 'eye-outline', route: 'Monitoramento' },
                { id: 'estoque', label: 'Estoque', icon: 'cube', route: 'Estoque' },
                { id: 'adubacao', label: 'Adubação', icon: 'flask', route: 'AdubacaoList' },
            ]
        },
        {
            title: 'Comercial & Vendas',
            color: '#3B82F6',
            actions: [
                { id: 'vendas', label: 'Vendas', icon: 'cart', route: 'Vendas' },
                { id: 'compras', label: 'Compras', icon: 'basket', route: 'Compras' },
                { id: 'custos', label: 'Custos', icon: 'wallet-outline', route: 'Custos' },
                { id: 'clientes', label: 'Clientes', icon: 'people', route: 'Clientes' },
                { id: 'encomendas', label: 'Encomendas', icon: 'gift-outline', route: 'Encomendas' },
                { id: 'relatorios', label: 'Relatórios', icon: 'bar-chart', route: 'Relatorios' },
            ]
        },
        {
            title: 'Sistema & Frota',
            color: '#6366F1',
            actions: [
                { id: 'frota', label: 'Frota', icon: 'bus-outline', route: 'Frota' },
                { id: 'ocr', label: 'Scanner', icon: 'camera', route: 'Scanner' },
                { id: 'culturas', label: 'Culturas', icon: 'map-outline', route: 'Culturas' },
                { id: 'usuarios', label: 'Equipe', icon: 'people-circle-outline', route: 'Usuarios' },
                { id: 'sync', label: 'Sincronizar', icon: 'sync', route: 'Sync' },
                { id: 'perfil', label: 'Ajustes', icon: 'settings-outline', route: 'Profile' },
            ]
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <RNStatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} navigation={navigation} />

            <SafeAreaView style={{ flex: 1 }}>
                {/* TOP BAR / GREETING */}
                <View style={styles.topHeader}>
                    <TouchableOpacity onPress={() => setDrawerVisible(true)} style={[styles.menuToggle, { backgroundColor: colors.card, marginRight: scale(15) }]}>
                        <Ionicons name="menu-outline" size={scale(26)} color={colors.primary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.greeting, { color: colors.textSecondary }]}>Bom trabalho,</Text>
                        <Text style={[styles.userName, { color: colors.textPrimary }]}>Produtor AgroGB 🌿</Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* WEATHER BADGE (FLOATING STYLE) */}
                    <View style={styles.weatherWrapper}>
                        <WeatherWidget />
                    </View>

                    {/* FINANCIAL COMMAND CENTER (THE "ELITE" CARD) */}
                    <View style={[styles.financialCard, { backgroundColor: isDark ? '#1E293B' : colors.primary }]}>
                        <View style={styles.finHeader}>
                            <Text style={styles.finTitle}>RESUMO MENSAL</Text>
                            <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.6)" />
                        </View>

                        <View style={styles.finRow}>
                            <View style={styles.finItem}>
                                <View style={styles.finLabelRow}>
                                    <View style={styles.finDot} />
                                    <Text style={styles.finLabel}>TOTAL VENDAS</Text>
                                </View>
                                <Text style={styles.finValue}>{formatBRL(stats.vendasMes)}</Text>
                            </View>

                            <View style={[styles.finDivider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />

                            <View style={styles.finItem}>
                                <View style={styles.finLabelRow}>
                                    <View style={[styles.finDot, { backgroundColor: '#EF4444' }]} />
                                    <Text style={styles.finLabel}>CUSTOS TOTAIS</Text>
                                </View>
                                <Text style={[styles.finValue, { color: '#FCA5A5' }]}>{formatBRL(stats.custosMes)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* QUICK METRICS GRID */}
                    <View style={styles.metricsGrid}>
                        <MetricCard
                            icon="leaf"
                            label="PRODUÇÃO"
                            value={`${stats.colheitaHoje}kg`}
                            color={colors.primary}
                        />
                        <MetricCard
                            icon="wallet"
                            label="SALDO"
                            value={formatBRL(stats.saldo)}
                            color="#10B981"
                        />
                        <MetricCard
                            icon="trending-up"
                            label="RESULTADO"
                            value="82%"
                            color="#F59E0B"
                        />
                    </View>

                    {/* CATEGORIZED ACTIONS */}
                    {categories.map((cat, idx) => (
                        <View key={idx} style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIndicator, { backgroundColor: cat.color }]} />
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{cat.title}</Text>
                            </View>
                            <View style={styles.actionGrid}>
                                {cat.actions.map((action) => (
                                    <QuickAction
                                        key={action.id}
                                        icon={action.icon}
                                        label={action.label}
                                        color={cat.color}
                                        onPress={() => navigation.navigate(action.route)}
                                    />
                                ))}
                            </View>
                        </View>
                    ))}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>

            {/* BOTTOM TOOLBAR */}
            <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity style={styles.tabBtn}>
                    <Ionicons name="home" size={24} color={colors.primary} />
                    <Text style={[styles.tabText, { color: colors.primary }]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBtn} onPress={() => navigation.navigate('Relatorios')}>
                    <Ionicons name="pie-chart-outline" size={24} color={colors.textSecondary} />
                    <Text style={[styles.tabText, { color: colors.textSecondary }]}>Gráficos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBtn} onPress={() => navigation.navigate('Sync')}>
                    <Ionicons name="refresh-circle-outline" size={24} color={colors.textSecondary} />
                    <Text style={[styles.tabText, { color: colors.textSecondary }]}>Sync</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBtn} onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="person-outline" size={24} color={colors.textSecondary} />
                    <Text style={[styles.tabText, { color: colors.textSecondary }]}>Perfil</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(20),
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + scale(10) : scale(15),
        paddingBottom: scale(10),
    },
    greeting: { fontSize: scale(12), fontWeight: '700', textTransform: 'uppercase', opacity: 0.6 },
    userName: { fontSize: scale(20), fontWeight: '900', marginTop: 2 },
    menuToggle: {
        width: scale(48),
        height: scale(48),
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3
    },
    scrollContent: { paddingHorizontal: scale(20) },
    weatherWrapper: {
        marginBottom: scale(20),
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    financialCard: {
        padding: scale(24),
        borderRadius: 28,
        marginBottom: scale(20),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    finHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: scale(20),
    },
    finTitle: { color: 'rgba(255,255,255,0.7)', fontSize: scale(10), fontWeight: '900', letterSpacing: 1.5 },
    finRow: { flexDirection: 'row', alignItems: 'center' },
    finItem: { flex: 1 },
    finLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    finDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80', marginRight: 6 },
    finLabel: { color: 'rgba(255,255,255,0.6)', fontSize: scale(9), fontWeight: '900' },
    finValue: { color: '#FFFFFF', fontSize: scale(22), fontWeight: '900' },
    finDivider: { width: 1, height: scale(40), marginHorizontal: scale(15) },

    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: scale(25),
    },

    section: { marginBottom: scale(30) },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: scale(15) },
    sectionIndicator: { width: 4, height: 18, borderRadius: 2, marginRight: 10 },
    sectionTitle: { fontSize: scale(15), fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: isSmallDevice ? 70 : 85,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 10,
        paddingBottom: isSmallDevice ? 15 : 25,
        borderTopWidth: 1,
    },
    tabBtn: { alignItems: 'center' },
    tabText: { fontSize: scale(10), fontWeight: '800', marginTop: 4 }
});

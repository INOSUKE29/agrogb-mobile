import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, StatusBar as RNStatusBar,
    ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import { DashboardService } from '../services/DashboardService';
import WeatherWidget from '../ui/WeatherWidget';
import SidebarDrawer from '../ui/SidebarDrawer';
import { MetricCard } from '../ui/components/MetricCard';
import QuickAction from '../ui/components/QuickAction';
import AnalyticsDashboard from '../ui/components/AnalyticsDashboard';

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
        perdasMes: 0,
        performanceData: [], // Dashboard v1.1
    });
    const [userProfile, setUserProfile] = useState({ name: 'Produtor AgroGB' });
    const [loadingStats, setLoadingStats] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);

    const loadStats = async () => {
        if (loadingStats) return;
        setLoadingStats(true);
        try {
            const data = await DashboardService.getStats();
            setStats(prev => ({ ...prev, ...data }));
            
            // Carrega perfil simplificado (SQLite Paridade PRO)
            const profileRes = await DashboardService.getUserProfile();
            if (profileRes) setUserProfile(profileRes);
        } catch (err) {
            if (__DEV__) console.warn('[HomeScreen] Erro ao atualizar dashboard:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    useFocusEffect(useCallback(() => {
        loadStats();
    }, []));

    const formatBRL = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const categories = [
        {
            title: 'GESTÃO OPERACIONAL',
            color: colors.primary,
            actions: [
                { id: 'plantio', label: 'Plantio', icon: 'analytics', route: 'Plantio', color: '#10B981' },
                { id: 'monitoramento', label: 'Monitoramento', icon: 'camera', route: 'Monitoramento', color: '#10B981' },
                { id: 'colheita', label: 'Colheita', icon: 'leaf', route: 'Colheita', color: '#10B981' },
                { id: 'adubacao', label: 'Adubação', icon: 'flask', route: 'AdubacaoList', color: '#10B981' },
                { id: 'estoque', label: 'Estoque', icon: 'cube', route: 'Estoque', color: '#10B981' },
                { id: 'caderno', label: 'Caderno', icon: 'book', route: 'CadernoCampo', color: '#10B981' },
            ]
        },
        {
            title: 'COMERCIAL & FINANCEIRO',
            color: '#3B82F6',
            actions: [
                { id: 'vendas', label: 'Vendas', icon: 'cart', route: 'Vendas', color: '#3B82F6' },
                { id: 'compras', label: 'Compras', icon: 'basket', route: 'Compras', color: '#3B82F6' },
                { id: 'custos', label: 'Custos', icon: 'wallet', route: 'Custos', color: '#EF4444' },
                { id: 'contas', label: 'Contas', icon: 'cash', route: 'FinancialAccounts', color: '#10B981', prefix: '$' },
                { id: 'clientes', label: 'Clientes', icon: 'people', route: 'Clientes', color: '#6366F1' },
                { id: 'encomendas', label: 'Encomendas', icon: 'gift', route: 'Encomendas', color: '#14B8A6' },
                { id: 'relatorios', label: 'Relatórios', icon: 'bar-chart', route: 'Relatorios', color: '#3B82F6' },
            ]
        },
        {
            title: 'SISTEMA',
            color: '#94A3B8',
            actions: [
                { id: 'cadastros', label: 'Cadastros', icon: 'list-circle', route: 'MenuCadastros', color: '#94A3B8' },
                { id: 'culturas', label: 'Culturas', icon: 'flower', route: 'Culturas', color: '#94A3B8' },
                { id: 'equipe', label: 'Equipe', icon: 'people-circle', route: 'Usuarios', color: '#94A3B8' },
                { id: 'frota', label: 'Frota', icon: 'bus', route: 'Frota', color: '#64748B' },
                { id: 'sync', label: 'Sincronização', icon: 'refresh-circle', route: 'Sync', color: '#3B82F6' },
                { id: 'config', label: 'Ajustes', icon: 'settings', route: 'Profile', color: '#94A3B8' },
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
                        <Text style={[styles.userName, { color: colors.textPrimary }]}>{userProfile.name} 🌿</Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* NEW DIAMOND PRO DASHBOARD HEADER */}
                    <AnalyticsDashboard 
                        productivityData={stats.performanceData}
                        financialData={{
                            receita: stats.vendasMes,
                            despesa: stats.custosMes
                        }}
                    />

                    {/* FINANCIAL & PERFORMANCE SUMMARY (TRANSITIONED TO DASHBOARD) */}
                    {/* Mantemos apenas os métricas rápidas que não estão no dashboard principal se necessário,
                        mas para estética limpa, vamos focar nos QuickActions logo abaixo agora. */}

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
                                        color={action.color}
                                        prefix={action.prefix}
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
                <TouchableOpacity style={styles.tabBtn} onPress={() => navigation.navigate('Dashboard')}>
                    <Ionicons name="home" size={24} color={colors.primary} />
                    <Text style={[styles.tabText, { color: colors.primary }]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBtn} onPress={() => navigation.navigate('Relatorios')}>
                    <Ionicons name="bar-chart-outline" size={24} color={colors.textSecondary} />
                    <Text style={[styles.tabText, { color: colors.textSecondary }]}>Relatórios</Text>
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
    scrollContent: { paddingBottom: 100 },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(20),
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + scale(10) : scale(50), // Ajustado para não sobrepor relógio
        paddingBottom: scale(15),
        zIndex: 10,
        backgroundColor: 'transparent'
    },
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
    finDividerHoriz: { height: 1, width: '100%', marginVertical: scale(15) },
    finRowFooter: { flexDirection: 'row', alignItems: 'center', opacity: 0.8 },
    finMiniLabel: { color: 'rgba(255,255,255,0.6)', fontSize: scale(9), fontWeight: '900' },
    finMiniValue: { color: '#FDA4AF', fontSize: scale(12), fontWeight: '900' },

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

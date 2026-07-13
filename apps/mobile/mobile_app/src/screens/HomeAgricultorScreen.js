import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, StatusBar as RNStatusBar, InteractionManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import WeatherWidget from '../components/WeatherWidget';
import { getDashboardStats } from '../database/database';
import { syncTable } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SidebarAgricultor from '../components/SidebarAgricultor';
import { useTheme } from '../theme/ThemeContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../context/AuthContext';
import ProductionChart from '../components/dashboard/ProductionChart';

const { width } = Dimensions.get('window');

const AGRICULTOR_ATALHOS = [
    { id: "add_colheita", label: "Colheita", icon: "basket", screen: "Colheita", color: "#F59E0B" },
    { id: "add_venda", label: "Venda", icon: "barcode", screen: "VendaForm", color: "#10B981" },
    { id: "clientes", label: "Clientes", icon: "people", screen: "Clientes", color: "#EC4899" },
    { id: "estoque", label: "Estoque", icon: "layers", screen: "Estoque", color: "#8B5CF6" },
    { id: "add_encomenda", label: "Encomenda", icon: "cube", screen: "NovaEncomenda", color: "#3B82F6" },
    { id: "catalogo", label: "Catálogo", icon: "library", screen: "Cadastro", color: "#06B6D4" },
];

export default function HomeAgricultorScreen({ navigation }) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { data: dashboardData } = useDashboardData();
    const isDark = theme?.theme_mode === 'dark';

    const THEME = {
        bg: theme?.colors?.bg ?? '#091829',
        headerBg: theme?.colors?.headerBg ?? ['#0D8C39', '#18B34A'],
        cardBg: theme?.colors?.card ?? '#FFFFFF',
        textMain: theme?.colors?.text ?? '#1F2937',
        textSub: theme?.colors?.textMuted ?? '#6B7280',
        primary: theme?.colors?.primary ?? '#059669',
        accent: theme?.colors?.accent ?? '#10B981',
        alert: theme?.colors?.warning ?? '#F59E0B'
    };

    const [stats, setStats] = useState({
        saldo: 0,
        colheitaHoje: 0,
        vendasHoje: 0,
        plantioAtivo: 0,
        maquinasAlert: 0,
        pendentes: 0,
        alertasPendentes: 0,
        atendimentosHoje: 0,
        recomendacoesPendentes: 0
    });
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isReady, setIsReady] = useState(false); 

    const loadStats = async () => {
        const data = await getDashboardStats();
        setStats(data);
    };

    const autoSync = async () => {
        const tables = ['colheitas', 'vendas', 'compras', 'plantio', 'custos', 'descarte', 'clientes', 'culturas', 'cadastro', 'maquinas', 'manutencao_frota', 'v2_monitoramentos', 'analise_ia', 'v2_monitoramentos_midia'];
        for (const tab of tables) {
            syncTable(tab).catch(err => console.log('Background sync error', tab, err));
        }
    };

    useFocusEffect(useCallback(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            setIsReady(true);
            setTimeout(() => {
                loadStats();
                autoSync();
            }, 50);
        });
        return () => task.cancel();
    }, []));

    const screenWidth = Dimensions.get('window').width;
    const numColumns = 3;
    const cardWidth = (screenWidth - 40 - ((numColumns - 1) * 12)) / numColumns; 

    const formatBRL = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <View style={[styles.container, { backgroundColor: THEME.bg }]}>
            <RNStatusBar barStyle="light-content" backgroundColor={THEME.headerBg[0]} />

            {/* 1. HEADER (Status Instantâneo) */}
            <LinearGradient colors={THEME.headerBg} style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                            <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.profileBtn}>
                                <Ionicons name="menu" size={30} color="#FFF" />
                            </TouchableOpacity>
                            <View>
                                <Text style={styles.salutation}>Olá, {user?.name || 'Bruno'} 👋</Text>
                                <Text style={styles.subSalutation}>Bem-vindo ao seu painel</Text>
                            </View>
                        </View>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Pendencias')} 
                            style={styles.bellBtn}
                        >
                            <Ionicons name={stats.alertasPendentes > 0 ? "notifications" : "notifications-outline"} size={26} color="#FFF" />
                            {stats.alertasPendentes > 0 && (
                                <View style={styles.bellBadge}>
                                    <Text style={styles.bellBadgeText}>{stats.alertasPendentes}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                    <View style={{ marginTop: 15, width: '100%', flexDirection: 'row', alignItems: 'center' }}>
                        {/* Mini-widget de clima compacto */}
                        <WeatherWidget compact={true} />
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {isReady ? (
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                        {/* 2. CARDS DE RESUMO (Métricas de Impacto) */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryCarousel}>
                            <View style={[styles.summaryCard, { backgroundColor: theme?.colors?.card || '#1F2937', borderColor: theme?.colors?.border || '#374151' }]}>
                                <View style={[styles.summaryIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                    <Ionicons name="wallet" size={22} color="#3B82F6" />
                                </View>
                                <Text style={[styles.summaryTitle, { color: THEME.textSub }]}>VENDAS (HOJE)</Text>
                                <Text style={[styles.summaryValue, { color: THEME.textMain }]}>{formatBRL(stats.vendasHoje || 0)}</Text>
                            </View>
                            <View style={[styles.summaryCard, { backgroundColor: theme?.colors?.card || '#1F2937', borderColor: theme?.colors?.border || '#374151' }]}>
                                <View style={[styles.summaryIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                    <Ionicons name="basket" size={22} color="#F59E0B" />
                                </View>
                                <Text style={[styles.summaryTitle, { color: THEME.textSub }]}>COLHEITA</Text>
                                <Text style={[styles.summaryValue, { color: THEME.textMain }]}>{stats.colheitaHoje || 0} kg</Text>
                            </View>
                            <View style={[styles.summaryCard, { backgroundColor: theme?.colors?.card || '#1F2937', borderColor: theme?.colors?.border || '#374151' }]}>
                                <View style={[styles.summaryIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                    <Ionicons name="leaf" size={22} color="#10B981" />
                                </View>
                                <Text style={[styles.summaryTitle, { color: THEME.textSub }]}>PLANTIO ATIVO</Text>
                                <Text style={[styles.summaryValue, { color: THEME.textMain }]}>{stats.plantioAtivo || 0} Áreas</Text>
                            </View>
                        </ScrollView>

                        {/* 3. BLOCO DE RESOLUÇÃO DE PROBLEMAS */}
                        <Text style={[styles.sectionTitle, { color: THEME.textSub, marginTop: 30 }]}>QUADRO OPERACIONAL</Text>
                        <View style={styles.problemBlock}>
                            <TouchableOpacity style={[styles.problemCard, { backgroundColor: theme?.colors?.card || '#1F2937', borderColor: theme?.colors?.border || '#374151' }]} onPress={() => navigation.navigate('Pendencias')}>
                                <View style={styles.problemHeader}>
                                    <Ionicons name="clipboard" size={24} color="#EF4444" />
                                    <Text style={[styles.problemValue, { color: THEME.textMain }]}>{stats.pendentes || 0}</Text>
                                </View>
                                <Text style={[styles.problemLabel, { color: THEME.textSub }]}>Pendências Críticas</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={[styles.problemCard, { backgroundColor: theme?.colors?.card || '#1F2937', borderColor: theme?.colors?.border || '#374151' }]} onPress={() => navigation.navigate('Intelligence')}>
                                <View style={styles.problemHeader}>
                                    <Ionicons name="flash" size={24} color="#F59E0B" />
                                    <Text style={[styles.problemValue, { color: THEME.textMain }]}>{stats.alertasPendentes || 0}</Text>
                                </View>
                                <Text style={[styles.problemLabel, { color: THEME.textSub }]}>Alertas IA (Clima)</Text>
                            </TouchableOpacity>
                        </View>

                        {/* 4. AÇÕES RÁPIDAS */}
                        <Text style={[styles.sectionTitle, { color: THEME.textSub, marginTop: 30 }]}>AÇÕES RÁPIDAS</Text>
                        <View style={styles.grid}>
                            {AGRICULTOR_ATALHOS.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.actionCard, { width: cardWidth, backgroundColor: theme?.colors?.cardMenu || '#152235' }]}
                                    onPress={() => navigation.navigate(item.screen)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.iconCirclePremium}>
                                        <Ionicons name={item.icon} size={28} color={item.color || '#10B981'} />
                                    </View>
                                    <Text style={styles.cardTitle} numberOfLines={2}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 5. GRÁFICOS E INTELIGÊNCIA */}
                        <View style={styles.chartSection}>
                            <Text style={[styles.sectionTitle, { color: THEME.textSub }]}>PRODUÇÃO (ÚLTIMOS 7 DIAS)</Text>
                            {dashboardData && <ProductionChart data={dashboardData.chartData} />}
                        </View>

                        {/* 6. ATIVIDADES RECENTES */}
                        <Text style={[styles.sectionTitle, { color: THEME.textSub }]}>HISTÓRICO RECENTE</Text>
                        <View style={[styles.timeline, { backgroundColor: theme?.colors?.card || '#1F2937', borderColor: theme?.colors?.border || '#374151' }]}>
                            <View style={styles.timelineItem}>
                                <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
                                <View style={styles.timelineContent}>
                                    <Text style={[styles.timelineText, { color: THEME.textMain }]}>Sincronização de dados concluída</Text>
                                    <Text style={[styles.timelineTime, { color: THEME.textSub }]}>Hoje</Text>
                                </View>
                            </View>
                            {/* Linha conectora */}
                            <View style={[styles.timelineLine, { backgroundColor: theme?.colors?.border || '#374151' }]} />
                            <View style={styles.timelineItem}>
                                <View style={[styles.timelineDot, { backgroundColor: '#3B82F6' }]} />
                                <View style={styles.timelineContent}>
                                    <Text style={[styles.timelineText, { color: THEME.textMain }]}>Acesso ao sistema via dispositivo móvel</Text>
                                    <Text style={[styles.timelineTime, { color: THEME.textSub }]}>Hoje</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.version}>AgroGB v8.0 • ERP Agrícola Inteligente</Text>
                        </View>
                    </ScrollView>
                ) : (
                    <View style={styles.loadingContainer}>
                        <View style={[styles.skeletonBlock, { width: '100%', height: 100, marginBottom: 20 }]} />
                        <View style={[styles.skeletonBlock, { width: '100%', height: 200, marginBottom: 20 }]} />
                        <View style={[styles.skeletonBlock, { width: '100%', height: 200 }]} />
                    </View>
                )}
            </View>

            <SidebarAgricultor visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTop: { flexDirection: 'column', alignItems: 'flex-start' },
    salutation: { fontSize: 18, color: '#FFFFFF', fontWeight: 'bold' },
    subSalutation: { fontSize: 12, color: '#D1FAE5' },
    profileBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
    bellBtn: { padding: 6, position: 'relative' },
    bellBadge: { position: 'absolute', top: 2, right: 4, backgroundColor: '#EF4444', minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    bellBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

    content: { flex: 1, marginTop: -20 },
    scroll: { padding: 20 },

    summaryCarousel: { paddingBottom: 20, flexDirection: 'row', gap: 24 },
    summaryCard: { width: 140, padding: 20, borderRadius: 16, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
    summaryIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    summaryTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 4, letterSpacing: 0.5 },
    summaryValue: { fontSize: 16, fontWeight: 'bold' },

    sectionTitle: { fontSize: 13, fontWeight: '900', marginBottom: 20, marginTop: 40, letterSpacing: 1 },
    
    problemBlock: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
    problemCard: { flex: 1, padding: 20, borderRadius: 16, borderWidth: 1, elevation: 1 },
    problemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    problemValue: { fontSize: 24, fontWeight: 'bold' },
    problemLabel: { fontSize: 13, fontWeight: '600' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingBottom: 10 },
    actionCard: { borderRadius: 20, padding: 12, height: 120, alignItems: 'center', justifyContent: 'center', elevation: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    iconCirclePremium: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: {width: 0, height: 2}, shadowOpacity: 1, shadowRadius: 4, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', color: '#FFFFFF' },

    chartSection: { marginVertical: 48 }, // Espaçamento exigido de ~50px acima e abaixo

    timeline: { padding: 20, borderRadius: 16, borderWidth: 1 },
    timelineItem: { flexDirection: 'row', alignItems: 'flex-start' },
    timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, zIndex: 2 },
    timelineLine: { width: 2, height: 24, marginLeft: 5, marginVertical: -4, zIndex: 1 },
    timelineContent: { marginLeft: 16, flex: 1 },
    timelineText: { fontSize: 13, fontWeight: '500' },
    timelineTime: { fontSize: 11, marginTop: 4 },

    loadingContainer: { padding: 20 },
    skeletonBlock: { backgroundColor: 'rgba(150,150,150,0.15)', borderRadius: 12 },

    footer: { marginTop: 40, alignItems: 'center', paddingBottom: 20 },
    version: { color: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }
});

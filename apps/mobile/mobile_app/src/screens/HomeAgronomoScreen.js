import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, StatusBar as RNStatusBar, InteractionManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import WeatherWidget from '../components/WeatherWidget';
import { getDashboardStats } from '../database/database';
import { syncTable } from '../services/supabase';
import { MenuConfigService } from '../services/MenuConfigService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SidebarDrawer from '../components/SidebarDrawer';
import { useTheme } from '../theme/ThemeContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../context/AuthContext';
import TasksWidget from '../components/dashboard/TasksWidget';
import SmartAlerts from '../components/dashboard/SmartAlerts';
import ProductionChart from '../components/dashboard/ProductionChart';

const { width } = Dimensions.get('window');

export default function HomeAgronomoScreen({ navigation }) {
    const { theme } = useTheme();
    const { user, role } = useAuth();
    const { data: dashboardData } = useDashboardData();
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
    const [isReady, setIsReady] = useState(false); // Gatilho de Skeleton View

    const loadStats = async () => {
        const data = await getDashboardStats();
        setStats(data);
    };

    const autoSync = async () => {
        const tables = ['colheitas', 'vendas', 'compras', 'plantio', 'custos', 'descarte', 'clientes', 'culturas', 'cadastro', 'maquinas', 'manutencao_frota', 'monitoramento_entidade', 'analise_ia', 'monitoramento_media'];
        for (const tab of tables) {
            syncTable(tab).catch(err => console.log('Background sync error', tab, err));
        }
    };

    const [menuConfig, setMenuConfig] = useState(null);

    useFocusEffect(useCallback(() => {
        // Aguardar o término das animações pesadas do React Navigation 
        // e adicionar um 'suspiro' de 250ms para garantir que o CPU 
        // renderizou todos os blocos verdes do layout antes de inundar a API
        const task = InteractionManager.runAfterInteractions(() => {
            // Libera a tela de desenhar os blocos e listas só quando a tampa for aberta
            setIsReady(true);
            setTimeout(() => {
                loadStats();
                autoSync();
                MenuConfigService.getMenuConfig(role).then(cfg => setMenuConfig(cfg));
            }, 50);
        });
        return () => task.cancel();
    }, []));

    // Lógica de Colunas Adaptativas
    // Se a config diz X colunas, mas a tela for pequena, reduzimos.
    const screenWidth = Dimensions.get('window').width;
    const getNumColumns = () => {
        if (!menuConfig) return 4; 
        const desired = menuConfig.menu_columns || 4;
        if (screenWidth < 380 && desired > 3) return 3; 
        return desired;
    };

    const numColumns = getNumColumns();
    const cardWidth = (screenWidth - 40 - ((numColumns - 1) * 12)) / numColumns; // 40 (padding) + gaps

    const formatBRL = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <View style={[styles.container, { backgroundColor: THEME.bg }]}>
            <RNStatusBar barStyle="light-content" backgroundColor={THEME.headerBg[0]} />

            <LinearGradient colors={THEME.headerBg} style={styles.header}>
                <View style={[styles.headerTop, { alignItems: 'flex-start', flexDirection: 'column', width: '100%' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                            <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.profileBtn}>
                                <Ionicons name="menu" size={30} color="#FFF" />
                            </TouchableOpacity>
                            <View>
                                <Text style={styles.salutation}>Olá, {user?.name || 'Bruno'} 👋</Text>
                                <Text style={styles.subSalutation}>{role === 'AGRONOMO' ? 'Painel do Consultor' : 'Bem-vindo ao seu painel'}</Text>
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
                    <View style={{ marginTop: 20, width: '100%' }}>
                        <WeatherWidget />
                    </View>
                </View>

                {/* KPIS TÉCNICOS DO AGRÔNOMO */}
                {isReady && (
                    <View style={styles.kpiRow}>
                        <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>ATENDIMENTOS (HOJE)</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Text style={styles.kpiEmoji}>🤝</Text>
                                <Text style={styles.kpiValue}>{stats.atendimentosHoje} <Text style={styles.unit}>visitas</Text></Text>
                            </View>
                        </View>

                        <View style={styles.vr} />

                        <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>RECOMENDAÇÕES PEND.</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Text style={styles.kpiEmoji}>📝</Text>
                                <Text style={styles.kpiValue}>{stats.recomendacoesPendentes} <Text style={styles.unit}>rec.</Text></Text>
                            </View>
                        </View>
                    </View>
                )}

            </LinearGradient>

            <View style={styles.content}>
                {isReady ? (
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                        {stats.maquinasAlert > 0 && (
                            <TouchableOpacity style={[styles.alertBar, { backgroundColor: theme?.theme_mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' }]} onPress={() => navigation.navigate('Frota')}>
                                <Ionicons name="warning" size={20} color={THEME.alert} />
                                <Text style={[styles.alertText, { color: theme?.theme_mode === 'dark' ? '#FCD34D' : '#92400E' }]}>{stats.maquinasAlert} MÁQUINAS PRECISAM DE REVISÃO</Text>
                                <Ionicons name="chevron-forward" size={20} color={THEME.alert} />
                            </TouchableOpacity>
                        )}

                        <TasksWidget />
                        {dashboardData && <SmartAlerts alerts={dashboardData.alerts} navigation={navigation} />}

                        <Text style={[styles.sectionTitle, { color: THEME.textSub }]}>ACESSO RÁPIDO</Text>
                        {menuConfig ? (
                            <View style={styles.grid}>
                                {menuConfig.menu_items.filter(i => i.enabled).slice(0, 6).map((item, index) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[styles.card, { width: cardWidth, height: 110, backgroundColor: theme?.colors?.cardMenu || '#152235' }]}
                                        onPress={() => navigation.navigate(item.screen)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.iconCirclePremium}>
                                            <Ionicons name={item.icon} size={28} color={item.color || '#10B981'} />
                                        </View>
                                        <Text style={[styles.cardTitle, { color: '#FFF' }]} numberOfLines={1}>{item.label}</Text>
                                        {/* Badges Especiais */}
                                        {item.id === 'sync' && stats.pendentes > 0 && (
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>{stats.pendentes}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: THEME.textSub }}>Carregando menu...</Text></View>
                        )}

                        {/* Sem gráfico de produção para o Agrônomo */}

                        <View style={styles.footer}>
                            <Text style={styles.version}>AgroGB Mobile v6.0 • Premium</Text>
                        </View>
                    </ScrollView>
                ) : (
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                            <View style={[styles.skeletonBlock, { width: '30%', height: 60 }]} />
                            <View style={[styles.skeletonBlock, { width: '30%', height: 60 }]} />
                            <View style={[styles.skeletonBlock, { width: '30%', height: 60 }]} />
                        </View>
                        <View style={[styles.skeletonBlock, { width: '100%', height: 180, marginBottom: 20 }]} />
                        <View style={[styles.skeletonBlock, { width: '45%', height: 110, marginBottom: 10 }]} />
                    </ScrollView>
                )}
            </View>

            <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    brand: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
    brandPro: { fontSize: 10, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', color: '#A7F3D0' },
    salutation: { fontSize: 18, color: '#FFFFFF', fontWeight: 'bold' },
    subSalutation: { fontSize: 12, color: '#D1FAE5' },
    profileBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
    bellBtn: { padding: 6, position: 'relative' },
    bellBadge: { position: 'absolute', top: 2, right: 4, backgroundColor: '#EF4444', minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    bellBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

    kpiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#142233', padding: 15, borderRadius: 16, shadowColor: '#10B981', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    kpiItem: { flex: 1, alignItems: 'center' },
    kpiLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '900', marginBottom: 4, letterSpacing: 0.5 },
    kpiValue: { fontSize: 14, color: '#FFF', fontWeight: 'bold' },
    kpiEmoji: { fontSize: 14 },
    unit: { fontSize: 10, color: '#6B7280' },
    vr: { width: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.1)' },

    content: { flex: 1, marginTop: -10 },
    scroll: { padding: 20 },

    alertBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12, marginBottom: 20, gap: 10, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
    alertText: { flex: 1, fontSize: 11, fontWeight: 'bold', color: '#92400E' },

    sectionTitle: { fontSize: 12, fontWeight: '900', color: '#9CA3AF', marginBottom: 15, letterSpacing: 1 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: { borderRadius: 18, padding: 10, alignItems: 'center', justifyContent: 'center', elevation: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    iconCirclePremium: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.95)', shadowColor: 'rgba(255,255,255,0.20)', shadowOffset: {width: 0, height: 2}, shadowOpacity: 1, shadowRadius: 5, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },

    badge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

    skeletonBlock: { backgroundColor: 'rgba(150,150,150,0.15)', borderRadius: 12 },

    footer: { marginTop: 40, alignItems: 'center' },
    version: { color: '#D1D5DB', fontSize: 10, fontWeight: 'bold' }
});

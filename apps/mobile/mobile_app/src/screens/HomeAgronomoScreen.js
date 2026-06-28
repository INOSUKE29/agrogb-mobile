import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, StatusBar as RNStatusBar, InteractionManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import WeatherWidget from '../components/WeatherWidget';
import { getDashboardAgronomoStats } from '../database/database';
import { syncTable } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SidebarAgronomo from '../components/SidebarAgronomo';
import { useTheme } from '../theme/ThemeContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../context/AuthContext';
import SmartAlerts from '../components/dashboard/SmartAlerts';
import SyncWorker from '../services/SyncWorker';

const { width } = Dimensions.get('window');

const AGRONOMO_ATALHOS = [
    { id: "clientes", label: "Clientes", icon: "people-outline", screen: "Clientes", color: "#3B82F6" },
    { id: "propriedades", label: "Propriedades", icon: "home-outline", screen: "Propriedades", color: "#10B981" },
    { id: "culturas", label: "Culturas", icon: "leaf-outline", screen: "Culturas", color: "#8B5CF6" },
    { id: "monitoramento", label: "Monitoramento", icon: "camera-outline", screen: "Monitoramento", color: "#EC4899" },
    { id: "diagnostico", label: "Diagnóstico", icon: "medkit-outline", screen: "Diagnosticos", color: "#F59E0B" },
    { id: "prescricoes", label: "Prescrições", icon: "receipt-outline", screen: "Receitas", color: "#059669" },
    { id: "biblioteca", label: "Biblioteca", icon: "library-outline", screen: "BibliotecaGlobal", color: "#6366F1" },
    { id: "relatorios", label: "Relatórios", icon: "document-text-outline", screen: "Relatorios", color: "#374151" }
];

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
        clientesCount: 0,
        recomendacoesPendentes: 0,
        atendimentosHoje: 0,
        pendentes: 0,
        alertasPendentes: 0
    });
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isReady, setIsReady] = useState(false); 

    const loadStats = async () => {
        const data = await getDashboardAgronomoStats();
        setStats(data);
    };

    const autoSync = async () => {
        // Fallback antigo de sincronização mantido para não quebrar tabelas legadas
        const tables = ['colheitas', 'vendas', 'compras', 'plantio', 'custos', 'descarte', 'clientes', 'culturas', 'cadastro', 'maquinas', 'manutencao_frota', 'monitoramento_entidade', 'analise_ia', 'monitoramento_media'];
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
                // Novo motor offline-first
                SyncWorker.processSyncQueue();
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

            <LinearGradient colors={THEME.headerBg} style={styles.header}>
                <View style={[styles.headerTop, { alignItems: 'flex-start', flexDirection: 'column', width: '100%' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                            <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.profileBtn}>
                                <Ionicons name="menu" size={30} color="#FFF" />
                            </TouchableOpacity>
                            <View>
                                <Text style={styles.salutation}>Olá, {user?.name || 'Consultor'} 👋</Text>
                                <Text style={styles.subSalutation}>Painel do Consultor</Text>
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
                    <View style={{ marginTop: 10, width: '100%', flexDirection: 'row', alignItems: 'center' }}>
                        <WeatherWidget compact={true} customLocation="Fazenda Vale Verde" />
                    </View>
                </View>

            </LinearGradient>

            <View style={styles.content}>
                {isReady ? (
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                        <View style={styles.dashPanel}>
                            <Text style={styles.panelTitle}>ACOMPANHAMENTO TÉCNICO</Text>
                            
                            <TouchableOpacity style={styles.listItem}>
                                <View style={styles.listIcon}><Ionicons name="people" size={20} color="#3B82F6" /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.listTitle}>Clientes para acompanhar</Text>
                                    <Text style={styles.listSub}>{stats.clientesCount} clientes ativos</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={styles.listItem}>
                                <View style={styles.listIcon}><Ionicons name="warning" size={20} color="#F59E0B" /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.listTitle}>Alertas de Lavoura</Text>
                                    <Text style={styles.listSub}>{stats.alertasPendentes} ocorrências</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.listItem}>
                                <View style={styles.listIcon}><Ionicons name="receipt" size={20} color="#10B981" /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.listTitle}>Recomendações Pendentes</Text>
                                    <Text style={styles.listSub}>{stats.recomendacoesPendentes} aguardando envio</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.sectionTitle, { color: THEME.textSub, marginTop: 20 }]}>FERRAMENTAS TÉCNICAS</Text>
                        <View style={styles.grid}>
                            {AGRONOMO_ATALHOS.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.card, { width: cardWidth, height: 110, backgroundColor: theme?.colors?.cardMenu || '#152235' }]}
                                    onPress={() => navigation.navigate(item.screen)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconCirclePremium, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                        <Ionicons name={item.icon} size={28} color={item.color || '#10B981'} />
                                    </View>
                                    <Text style={[styles.cardTitle, { color: '#FFF' }]} numberOfLines={1}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.version}>AgroGB Mobile v8.0 • Premium (Agrônomo)</Text>
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

            <SidebarAgronomo visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
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
    
    dashPanel: { backgroundColor: '#142233', borderRadius: 16, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    panelTitle: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 15, letterSpacing: 0.5 },
    listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginBottom: 8 },
    listIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    listTitle: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
    listSub: { color: '#9CA3AF', fontSize: 11 },

    badge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

    skeletonBlock: { backgroundColor: 'rgba(150,150,150,0.15)', borderRadius: 12 },

    footer: { marginTop: 40, alignItems: 'center' },
    version: { color: '#D1D5DB', fontSize: 10, fontWeight: 'bold' }
});

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, StatusBar as RNStatusBar, InteractionManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import WeatherWidget from '../components/WeatherWidget';
import { executeQuery, getConfig, getDashboardStats } from '../database/database';
import { syncTable } from '../services/supabase';
import { MenuConfigService } from '../services/MenuConfigService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SidebarDrawer from '../components/SidebarDrawer';
import { DARK, GLOW_CARD_SHADOW } from '../styles/darkTheme';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
    const [stats, setStats] = useState({
        saldo: 0,
        colheitaHoje: 0,
        vendasHoje: 0,
        plantioAtivo: 0,
        maquinasAlert: 0,
        pendentes: 0
    });
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isReady, setIsReady] = useState(false);

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
        const task = InteractionManager.runAfterInteractions(() => {
            setIsReady(true);
            setTimeout(() => {
                loadStats();
                autoSync();
                MenuConfigService.getMenuConfig().then(cfg => setMenuConfig(cfg));
            }, 50);
        });
        return () => task.cancel();
    }, []));

    const screenWidth = Dimensions.get('window').width;
    const getNumColumns = () => {
        if (!menuConfig) return 3;
        const desired = menuConfig.menu_columns || 3;
        if (screenWidth < 380 && desired > 2) return 2;
        return desired;
    };

    const numColumns = getNumColumns();
    const cardWidth = (screenWidth - 40 - ((numColumns - 1) * 12)) / numColumns;

    const formatBRL = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" backgroundColor={DARK.bg} />

            {/* HEADER */}
            <LinearGradient colors={['#061E1A', '#0B2E26']} style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%' }}>
                    <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuBtn}>
                        <Ionicons name="menu" size={28} color={DARK.glow} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.brand}>AgroGB</Text>
                        <Text style={styles.salutation}>PAINEL GERENCIAL</Text>
                    </View>
                </View>
                <View style={{ marginTop: 16, width: '100%' }}>
                    <WeatherWidget />
                </View>

                {/* KPI ROW */}
                {isReady && (
                    <View style={styles.kpiRow}>
                        <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>COLHEITA (HOJE)</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Ionicons name="leaf" size={13} color={DARK.glow} />
                                <Text style={styles.kpiValue}>{stats.colheitaHoje} <Text style={styles.unit}>kg</Text></Text>
                            </View>
                        </View>
                        <View style={styles.vr} />
                        <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>VENDAS (HOJE)</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Ionicons name="cash" size={13} color={DARK.glow} />
                                <Text style={styles.kpiValue}>{stats.vendasHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
                            </View>
                        </View>
                        <View style={styles.vr} />
                        <View style={styles.kpiItem}>
                            <Text style={styles.kpiLabel}>RESULTADO (MÊS)</Text>
                            <Text style={[styles.kpiValue, { color: stats.saldo >= 0 ? DARK.glow : DARK.danger }]}>
                                {formatBRL(stats.saldo)}
                            </Text>
                        </View>
                    </View>
                )}
                {/* Glow separator */}
                <View style={styles.glowLine} />
            </LinearGradient>

            <View style={styles.content}>
                {isReady ? (
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                        {stats.maquinasAlert > 0 && (
                            <TouchableOpacity style={styles.alertBar} onPress={() => navigation.navigate('Frota')}>
                                <Ionicons name="warning" size={18} color={DARK.warning} />
                                <Text style={styles.alertText}>{stats.maquinasAlert} MÁQUINAS PRECISAM DE REVISÃO</Text>
                                <Ionicons name="chevron-forward" size={18} color={DARK.warning} />
                            </TouchableOpacity>
                        )}

                        <Text style={styles.sectionTitle}>ACESSO RÁPIDO</Text>
                        {menuConfig ? (
                            <View style={styles.grid}>
                                {menuConfig.menu_items.filter(i => i.enabled).map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[styles.card, { width: cardWidth }]}
                                        onPress={() => navigation.navigate(item.screen)}
                                        activeOpacity={0.75}
                                    >
                                        <View style={styles.iconCircle}>
                                            <Ionicons name={item.icon} size={22} color={DARK.glow} />
                                        </View>
                                        <Text style={styles.cardTitle} numberOfLines={1}>{item.label}</Text>
                                        {item.id === 'sync' && stats.pendentes > 0 && (
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>{stats.pendentes}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: DARK.textMuted }}>Carregando menu...</Text>
                            </View>
                        )}

                        <View style={styles.footer}>
                            <Text style={styles.version}>AgroGB Mobile v7.0 • Dark Agro Tech</Text>
                        </View>
                    </ScrollView>
                ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="leaf-outline" size={36} color={DARK.glowBorder} />
                        <Text style={{ marginTop: 10, color: DARK.textMuted, fontSize: 12 }}>Preparando espaço...</Text>
                    </View>
                )}
            </View>

            <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DARK.bg },
    header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
    menuBtn: { padding: 8, backgroundColor: 'rgba(0,255,156,0.1)', borderRadius: 12, borderWidth: 1, borderColor: DARK.glowBorder },
    brand: { fontSize: 22, fontWeight: '900', color: DARK.glow, letterSpacing: 0.5 },
    salutation: { fontSize: 10, color: DARK.textSecondary, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
    glowLine: { height: 1, backgroundColor: DARK.glowLine, marginTop: 16, shadowColor: '#00FF9C', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },

    kpiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,255,156,0.05)', borderWidth: 1, borderColor: DARK.glowBorder, padding: 14, borderRadius: 14, marginTop: 16 },
    kpiItem: { flex: 1, alignItems: 'center' },
    kpiLabel: { fontSize: 8, color: DARK.textMuted, fontWeight: '900', marginBottom: 5, letterSpacing: 0.8 },
    kpiValue: { fontSize: 13, color: DARK.textPrimary, fontWeight: 'bold' },
    unit: { fontSize: 10, color: DARK.textMuted },
    vr: { width: 1, height: 28, backgroundColor: DARK.glowBorder },

    content: { flex: 1 },
    scroll: { padding: 20 },

    alertBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', padding: 12, borderRadius: 12, marginBottom: 20, gap: 10 },
    alertText: { flex: 1, fontSize: 11, fontWeight: 'bold', color: DARK.warning },

    sectionTitle: { fontSize: 10, fontWeight: '900', color: DARK.textMuted, marginBottom: 16, letterSpacing: 1.5, textTransform: 'uppercase' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: {
        backgroundColor: DARK.card,
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: DARK.glowBorder,
        ...GLOW_CARD_SHADOW,
    },
    iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,255,156,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 10, fontWeight: 'bold', color: DARK.textSecondary, textAlign: 'center' },

    badge: { position: 'absolute', top: 5, right: 5, backgroundColor: DARK.danger, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

    footer: { marginTop: 40, alignItems: 'center' },
    version: { color: DARK.textMuted, fontSize: 10, fontWeight: 'bold' },
});

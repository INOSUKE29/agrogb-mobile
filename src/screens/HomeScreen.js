import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, StatusBar as RNStatusBar, InteractionManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import WeatherWidget from '../components/WeatherWidget';
import { getDashboardStats } from '../database/database';
import { pushLocalChanges, pullServerChanges } from '../services/SyncService';
import { MenuConfigService } from '../services/MenuConfigService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SidebarDrawer from '../components/SidebarDrawer';

// --- TEMA SENIOR PREMIUM AGROGB ---
const THEME = {
    bg: '#F4F7F6',             // Gelo neve ultra suave (Fundo Geral)
    headerBg: ['#065F3E', '#10B981'], // Verde Navy escuro pro Esmeralda
    cardBg: '#FFFFFF',         // Branco Absoluto 
    textMain: '#1E293B',       // Slate Escuro (Titulos Fortes)
    textSub: '#64748B',        // Slate Neutro (Textos Secundarios)
    accent: '#10B981',         // Esmeralda brilhante
};

export default function HomeScreen({ navigation }) {
    const [stats, setStats] = useState({ saldo: 0, colheitaHoje: 0, vendasHoje: 0, plantioAtivo: 0, maquinasAlert: 0, pendentes: 0 });
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [menuConfig, setMenuConfig] = useState(null);

    const loadStats = async () => {
        const data = await getDashboardStats();
        setStats(data);
    };

    const autoSync = async () => {
        try { await pushLocalChanges(); await pullServerChanges(); } 
        catch (e) { console.log('Sync BG fail:', e); }
    };

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

    const formatBRL = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" backgroundColor="#065F3E" />

            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
                
                {/* O HEADER SUPREMO (Com Curvatura Extra) */}
                <LinearGradient colors={THEME.headerBg} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.headerCurveWrap}>
                    <View style={styles.headerContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                                <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuIconBox}>
                                    <Ionicons name="menu-outline" size={28} color="#FFF" />
                                </TouchableOpacity>
                                <View>
                                    <Text style={styles.brandText}>AgroGB<Text style={{fontWeight:'400', fontSize: 13}}> App</Text></Text>
                                    <Text style={styles.salutationText}>Fazenda em Tempo Real</Text>
                                </View>
                            </View>
                            <View style={styles.proTag}><Text style={styles.proTagText}>PRO</Text></View>
                        </View>

                        {/* Clima Moderno Embutido */}
                        <WeatherWidget />
                    </View>
                </LinearGradient>

                {/* AREA DE CONTEUDO (Puxada p/ cima pra sobrepor o verde) */}
                <View style={styles.mainContent}>
                    
                    {/* CARTAO DE ESTATISTICAS FLUTUANTE (Glass/Elevated) */}
                    {isReady && (
                        <View style={styles.statsCardFloating}>
                            <View style={styles.statBlock}>
                                <Text style={styles.statLabel}>COLHEITA (Hoje)</Text>
                                <View style={styles.statRowFlex}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}><Ionicons name="leaf" size={12} color="#10B981" /></View>
                                    <Text style={styles.statNumber}>{stats.colheitaHoje} <Text style={{fontSize: 11, color: THEME.textSub}}>kg</Text></Text>
                                </View>
                            </View>
                            
                            <View style={styles.statDivider} />
                            
                            <View style={styles.statBlock}>
                                <Text style={styles.statLabel}>VENDAS (Mês)</Text>
                                <View style={styles.statRowFlex}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#F0F9FF' }]}><Ionicons name="cash" size={12} color="#0EA5E9" /></View>
                                    <Text style={[styles.statNumber, {color: THEME.textMain}]}>{formatBRL(stats.vendasHoje)}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ALERTAS DE FROTA */}
                    {isReady && stats.maquinasAlert > 0 && (
                        <TouchableOpacity style={styles.alertBanner} onPress={() => navigation.navigate('Frota')}>
                            <View style={styles.alertIconCircle}><Ionicons name="warning" size={16} color="#D97706" /></View>
                            <View style={{flex: 1}}>
                                <Text style={styles.alertTitle}>ATENÇÃO NA FROTA</Text>
                                <Text style={styles.alertDesc}>{stats.maquinasAlert} máquinas precisam de revisão imediata.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#D97706" />
                        </TouchableOpacity>
                    )}

                    {/* GRID CENTRAL: O Famoso "Acesso Rápido" */}
                    <Text style={styles.sectionHeader}>Acesso Rápido</Text>
                    
                    {isReady ? (
                        <View style={styles.gridContainer}>
                            {menuConfig ? menuConfig.menu_items.filter(i => i.enabled).map((item, index) => {
                                const baseColor = item.color || '#64748B';
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.gridCard}
                                        onPress={() => navigation.navigate(item.screen)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.gridIconCircle, { backgroundColor: baseColor + '1A' }]}>
                                            <Ionicons name={item.icon} size={24} color={baseColor} />
                                        </View>
                                        <Text style={styles.gridCardText} numberOfLines={1}>{item.label}</Text>
                                        
                                        {/* Bolinha vermelha de notificacao PENDENTES em cima do SYNC */}
                                        {item.id === 'sync' && stats.pendentes > 0 && (
                                            <View style={styles.notificationBubble}>
                                                <Text style={styles.notificationNumber}>{stats.pendentes}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            }) : (
                                <Text style={{textAlign: 'center', color: THEME.textSub, marginTop: 20}}>Localizando Módulos...</Text>
                            )}
                        </View>
                    ) : (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <Ionicons name="apps-outline" size={30} color="#CBD5E1" />
                            <Text style={{ marginTop: 10, color: '#94A3B8', fontSize: 13 }}>Sincronizando painel, aguarde...</Text>
                        </View>
                    )}

                    <View style={styles.footerSpacing}>
                         <Text style={styles.footerBrand}>AgroGB 2026 • Design Edition</Text>
                    </View>
                    
                </View>
            </ScrollView>

            <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    
    headerCurveWrap: {
        paddingTop: 50,
        paddingBottom: 70, // Espaco extra pra engolir o card de baixo
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        zIndex: 1
    },
    headerContent: { paddingHorizontal: 24 },
    menuIconBox: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 6, borderRadius: 12 },
    brandText: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
    salutationText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },
    proTag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    proTagText: { color: '#A7F3D0', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

    mainContent: { flex: 1, paddingHorizontal: 20, marginTop: -45, zIndex: 10 },
    
    // THE SUPREME STATS CARD (Flutua na divisao do verde com cinza)
    statsCardFloating: {
        flexDirection: 'row',
        backgroundColor: THEME.cardBg,
        borderRadius: 24,
        paddingVertical: 20,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 6,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    statBlock: { flex: 1, alignItems: 'flex-start' },
    statDivider: { width: 1, height: '100%', backgroundColor: '#F1F5F9', marginHorizontal: 20 },
    statLabel: { fontSize: 10, fontWeight: '700', color: THEME.textSub, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
    statRowFlex: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statIconBox: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    statNumber: { fontSize: 16, fontWeight: '800', color: THEME.textMain },

    alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 16, borderRadius: 16, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
    alertIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(217, 119, 6, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    alertTitle: { fontSize: 12, fontWeight: '800', color: '#92400E', marginBottom: 2 },
    alertDesc: { fontSize: 11, color: '#B45309', fontWeight: '500' },

    sectionHeader: { fontSize: 16, fontWeight: '800', color: THEME.textMain, marginBottom: 15, marginLeft: 5 },
    
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'center' }, // centraliza gap para web e mobile
    gridCard: {
        width: '30%',
        minWidth: 98,
        backgroundColor: THEME.cardBg,
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
        marginBottom: 10
    },
    gridIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    gridCardText: { fontSize: 11, fontWeight: '700', color: THEME.textMain, textAlign: 'center' },
    
    notificationBubble: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
    notificationNumber: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

    footerSpacing: { marginTop: 40, marginBottom: 30, alignItems: 'center' },
    footerBrand: { fontSize: 11, fontWeight: '600', color: '#CBD5E1' }
});

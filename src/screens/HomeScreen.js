import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar as RNStatusBar, InteractionManager, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import WeatherWidget from '../components/WeatherWidget';
import SidebarDrawer from '../components/SidebarDrawer';
import AgroCard from '../components/ui/AgroCard';
import { getDashboardStats } from '../database/database';
import { pushLocalChanges, pullServerChanges } from '../services/SyncService';
import { MenuConfigService } from '../services/MenuConfigService';

export default function HomeScreen({ navigation }) {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    
    const [stats, setStats] = useState({ saldo: 0, colheitaHoje: 0, vendasHoje: 0, plantioAtivo: 0, maquinasAlert: 0, pendentes: 0 });
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [menuItems, setMenuItems] = useState([]);

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
            setTimeout(async () => {
                loadStats();
                autoSync();
                const cfg = await MenuConfigService.getMenuConfig();
                if(cfg && cfg.menu_items) setMenuItems(cfg.menu_items.filter(i => i.enabled));
            }, 50);
        });
        return () => task.cancel();
    }, []));

    const formatBRL = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Configuração dos Menus Departamentais conforme o Plano Diretor
    const CATEGORIES = [
        { title: '🌱 PRODUÇÃO', keys: ['caderno', 'plantio', 'monitoramento', 'adubacao', 'colheita', 'descarte'] },
        { title: '💰 COMERCIAL', keys: ['vendas', 'encomendas', 'compras'] },
        { title: '📦 CONTROLE', keys: ['estoque', 'custos', 'frota'] }
    ];

    const getGroupedMenus = () => {
        return CATEGORIES.map(cat => ({
            title: cat.title,
            items: menuItems.filter(item => cat.keys.includes((item.id || item.screen.toLowerCase()).replace('screen', '')))
        })).filter(g => g.items.length > 0); 
        // Remove grupo se estiver vazio (segurança)
    };

    const renderMenuGrid = (items) => (
        <View style={styles.gridContainer}>
            {items.map(item => {
                // Manter as cores de identificação originais ou usar accent padrao
                const baseColor = item.color || colors.accent;
                return (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.gridCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                        onPress={() => navigation.navigate(item.screen)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.gridIconCircle, { backgroundColor: baseColor + '15' }]}>
                            <Ionicons name={item.icon} size={24} color={baseColor} />
                        </View>
                        <Text style={styles.gridCardText} numberOfLines={1}>{item.label}</Text>
                        
                        {item.id === 'sync' && stats.pendentes > 0 && (
                            <View style={styles.notificationBubble}>
                                <Text style={styles.notificationNumber}>{stats.pendentes}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" backgroundColor={colors.headerBg[0]} />

            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
                
                {/* 🔝 HEADER & WEATHER */}
                <LinearGradient colors={colors.headerBg} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.headerCurveWrap}>
                    <View style={styles.headerContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                                <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuIconBox}>
                                    <Ionicons name="menu-outline" size={28} color="#FFF" />
                                </TouchableOpacity>
                                <View>
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <Image source={require('../../assets/logo.png')} style={{ width: 45, height: 45, marginRight: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} resizeMode="contain" />
                                        <Text style={styles.brandText}>AgroGB</Text>
                                        <View style={styles.proTag}><Text style={styles.proTagText}>PRO</Text></View>
                                    </View>
                                    <Text style={styles.salutationText}>Fazenda em tempo real</Text>
                                </View>
                            </View>
                        </View>
                        {/* 🌦 CARD DE CLIMA */}
                        <WeatherWidget />
                    </View>
                </LinearGradient>

                <View style={styles.mainContent}>
                    
                    {/* 📊 RESUMO RÁPIDO (Stats Glass Card) */}
                    {isReady && (
                        <AgroCard style={styles.statsCardFloating} noPadding>
                            <View style={styles.statsRow}>
                                <View style={styles.statBlock}>
                                    <Text style={styles.statLabel}>COLHEITA (Hoje)</Text>
                                    <View style={styles.statRowFlex}>
                                        <View style={[styles.statIconBox, { backgroundColor: colors.accent + '20' }]}>
                                            <Ionicons name="leaf" size={12} color={colors.accent} />
                                        </View>
                                        <Text style={styles.statNumber}>{stats.colheitaHoje} <Text style={{fontSize: 11, color: colors.textSub}}>kg</Text></Text>
                                    </View>
                                </View>
                                
                                <View style={styles.statDivider} />
                                
                                <View style={styles.statBlock}>
                                    <Text style={styles.statLabel}>VENDAS (Mês)</Text>
                                    <View style={styles.statRowFlex}>
                                        <View style={[styles.statIconBox, { backgroundColor: colors.info + '20' }]}>
                                            <Ionicons name="cash" size={12} color={colors.info} />
                                        </View>
                                        <Text style={styles.statNumber}>{formatBRL(stats.vendasHoje)}</Text>
                                    </View>
                                </View>
                            </View>
                        </AgroCard>
                    )}

                    {/* ALERTAS */}
                    {isReady && stats.maquinasAlert > 0 && (
                        <AgroCard style={styles.alertBanner} onPress={() => navigation.navigate('Frota')} noPadding>
                            <View style={[styles.alertIconCircle, { backgroundColor: colors.warning + '20' }]}>
                                <Ionicons name="warning" size={16} color={colors.warning} />
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={[styles.alertTitle, { color: colors.warning }]}>ATENÇÃO NA FROTA</Text>
                                <Text style={styles.alertDesc}>{stats.maquinasAlert} máquinas precisam de revisão.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.warning} />
                        </AgroCard>
                    )}

                    {/* ⚡ ACESSO RÁPIDO DIVIDIDO (CORAÇÃO DO APP) */}
                    {isReady ? (
                        <View style={{ marginTop: 10 }}>
                            {getGroupedMenus().map((group, index) => (
                                <View key={index} style={styles.menuSection}>
                                    <Text style={styles.sectionTitle}>{group.title}</Text>
                                    {renderMenuGrid(group.items)}
                                </View>
                            ))}

                            {/* Menu Extra (Itens que não caíram na classificação principal, ex Sync, Relatorios) */}
                            {renderMenuGrid(menuItems.filter(item => {
                                const allKeys = CATEGORIES.flatMap(c => c.keys);
                                return !allKeys.includes((item.id || item.screen.toLowerCase()).replace('screen', ''));
                            }))}
                        </View>
                    ) : (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <Ionicons name="apps-outline" size={30} color={colors.border} />
                            <Text style={{ marginTop: 10, color: colors.textSub, fontSize: 13 }}>Sincronizando painel...</Text>
                        </View>
                    )}

                    <View style={styles.footerSpacing}>
                         <Text style={styles.footerBrand}>AgroGB Premium System</Text>
                    </View>
                    
                </View>
            </ScrollView>

            <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    
    headerCurveWrap: {
        paddingTop: 50,
        paddingBottom: 70, // Espaco para overlap do card
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        zIndex: 1
    },
    headerContent: { paddingHorizontal: 24 },
    menuIconBox: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 6, borderRadius: 12 },
    brandText: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: 0.5, marginRight: 8 },
    salutationText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: 2 },
    proTag: { backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    proTagText: { color: '#FFF', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },

    mainContent: { flex: 1, paddingHorizontal: 20, marginTop: -40, zIndex: 10 },
    
    // OVERLAPPING CARD
    statsCardFloating: {
        marginBottom: 25,
    },
    statsRow: {
        flexDirection: 'row',
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    statBlock: { flex: 1 },
    statDivider: { width: 1, height: '100%', backgroundColor: colors.border, marginHorizontal: 15 },
    statLabel: { fontSize: 10, fontWeight: '700', color: colors.textSub, marginBottom: 8, letterSpacing: 0.5 },
    statRowFlex: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statIconBox: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    statNumber: { fontSize: 16, fontWeight: '800', color: colors.textMain },

    alertBanner: {
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        marginBottom: 20, 
        borderLeftWidth: 4, 
        borderLeftColor: colors.warning 
    },
    alertIconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    alertTitle: { fontSize: 12, fontWeight: '800', marginBottom: 2 },
    alertDesc: { fontSize: 11, color: colors.textSub },

    menuSection: { marginBottom: 25 },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.textSub, marginBottom: 15, letterSpacing: 0.5 },
    
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between' },
    gridCard: {
        width: '31%',
        minWidth: 95,
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.025)', // Card super glass
        shadowColor: 'transparent',
    },
    gridIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    gridCardText: { fontSize: 11, fontWeight: '700', color: colors.textMain, textAlign: 'center' },
    
    notificationBubble: { position: 'absolute', top: -5, right: -5, backgroundColor: colors.error, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.bg },
    notificationNumber: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

    footerSpacing: { marginTop: 30, marginBottom: 30, alignItems: 'center' },
    footerBrand: { fontSize: 11, fontWeight: '600', color: colors.border }
});

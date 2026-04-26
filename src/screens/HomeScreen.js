import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar as RNStatusBar, InteractionManager, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';
import { pushLocalChanges, pullServerChanges } from '../services/SyncService';
import { MenuConfigService } from '../services/MenuConfigService';

export default function HomeScreen({ navigation }) {
    const { colors } = useTheme();
    
    // stats: { saldo: 0, colheitaHoje: 0, vendasHoje: 0, plantioAtivo: 0, maquinasAlert: 0, pendentes: 0 }
    const [stats, setStats] = useState({});
    const [isReady, setIsReady] = useState(false);
    const [menuItems, setMenuItems] = useState([]);

    const loadStats = async () => {
        const data = await getDashboardStats();
        setStats(data || {});
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

    const formatBRL = (v) => v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';

    const CATEGORIES = [
        { title: 'PRODUÇÃO', keys: ['caderno', 'plantio', 'monitoramento', 'adubacao', 'colheita', 'descarte'] },
        { title: 'COMERCIAL', keys: ['vendas', 'encomendas', 'compras'] },
        { title: 'CONTROLE', keys: ['estoque', 'custos', 'frota', 'relatorios'] }
    ];

    const getGroupedMenus = () => {
        return CATEGORIES.map(cat => ({
            title: cat.title,
            items: menuItems.filter(item => cat.keys.includes((item.id || item.screen.toLowerCase()).replace('screen', '')))
        })).filter(g => g.items.length > 0); 
    };

    // Helper para extrair DADOS EXTRAS VIVOS (Igual Mockup) baseados no ID do menu
    const getCardValue = (id) => {
        switch(id) {
            case 'vendas': return { val: formatBRL(stats.vendasHoje), sub: 'Vendas Mês', highlight: true };
            case 'colheita': return { val: `${stats.colheitaHoje || 0} kg`, sub: 'Colheita Hoje', highlight: true };
            case 'custos': return { val: formatBRL(stats.saldo || 0), sub: 'Saldo Atual' };
            case 'plantio': return { val: `${stats.plantioAtivo || 0}`, sub: 'Lavouras Ativas' };
            case 'frota': return stats.maquinasAlert > 0 ? { val: `${stats.maquinasAlert} maq`, sub: 'Revisão Necessária', error: true } : { val: 'Ok', sub: 'Frota' };
            case 'sync': return stats.pendentes > 0 ? { val: stats.pendentes, sub: 'Pendentes' } : { val: '0', sub: 'Sincronizado' };
            case 'estoque': return { val: 'Gerenciador', sub: 'Volume' };
            default: return { val: 'Acessar', sub: 'Painel' };
        }
    };

    const renderCard = (item) => {
        const data = getCardValue(item.id);
        
        let customColor = '#34D399'; // Base Emerald
        let valColor = '#FFFFFF';
        if (item.id === 'vendas' || item.id === 'colheita' || item.id === 'financeiro' || item.id === 'adubacao') customColor = '#10B981';
        if (item.id === 'relatorios' || item.id === 'estoque' || item.id === 'faturamento') { customColor = '#3B82F6'; valColor = '#FFF'; }
        if (item.id === 'alertas' || item.id === 'pendentes' || item.id === 'descarte') { customColor = '#EF4444'; valColor = '#FFF'; }
        if (data.error) { customColor = '#EF4444'; valColor = '#EF4444'; }
        if (data.highlight) valColor = customColor; // Vendas / Colheita / Custos verde!

        // Limpeza dos Textos Sub/Padroes para imitar a tela Limpa da Esquerda do Mockup
        const isDefault = data.sub === 'Painel';
        
        return (
            <TouchableOpacity
                key={item.id}
                style={styles.cardBox}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.8}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.iconWrap, { backgroundColor: customColor + '18', borderColor: customColor + '40', borderWidth: 1 }]}>
                        <Ionicons name={item.icon} size={16} color={customColor} />
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.label}</Text>
                </View>
                
                <View style={styles.cardBody}>
                    {!isDefault && <Text style={styles.cardSubTitle}>{data.sub}</Text>}
                    <Text style={[
                        styles.cardValue, 
                        { color: valColor },
                        isDefault && { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 10 }
                    ]} numberOfLines={1}>
                        {isDefault ? 'Acessar módulo' : data.val}
                    </Text>
                </View>
                
                {/* Linha Falsa Fantasma do Grafico igual arte IA (somente no vendas/custos/etc) */}
                {(item.id === 'vendas' || item.id === 'relatorios') && (
                    <Ionicons name={item.id === 'vendas' ? "trending-up" : "bar-chart"} size={50} color={customColor} style={styles.bgIconPhantom} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* O SEGREDO DO MOCKUP: RADIAL GLOW NO FUNDO. Simulando com um view absoluto! */}
            <LinearGradient colors={['#05110E', '#0B1F1A', '#030806']} style={StyleSheet.absoluteFill} />
            <View style={[styles.ambientOrbTopRight, { backgroundColor: '#10B981', opacity: 0.20 }]} />
            <View style={[styles.ambientOrbLeft, { backgroundColor: '#0B1F1A', opacity: 0.3 }]} />
            
            <RNStatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* TOP NAVBAR Ouro */}
            <View style={styles.topNav}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Image source={require('../../assets/logo.png')} style={styles.logoImg} resizeMode="contain" />
                    <Text style={styles.brandTitle}>AgroGB</Text>
                </View>
                
                <View style={{ flexDirection: 'row', gap: 20 }}>
                     <TouchableOpacity><Ionicons name="search-outline" size={24} color="#A7B0B5" /></TouchableOpacity>
                     <TouchableOpacity>
                         <Ionicons name="notifications-outline" size={24} color="#A7B0B5" />
                         {stats.pendentes > 0 && <View style={styles.redDot} />}
                     </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {isReady ? (
                    <View style={styles.groupsContainer}>
                        {getGroupedMenus().map((group, index) => (
                            <View key={index} style={styles.sectionWrap}>
                                <Text style={styles.groupHead}>{group.title}</Text>
                                <View style={styles.gridBox}>
                                    {group.items.map(renderCard)}
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.loaderBox}>
                        <ActivityIndicator color="#10B981" size="large" />
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#05110E',
    },
    ambientOrbTopRight: {
        position: 'absolute',
        top: -150,
        right: -100,
        width: 450,
        height: 450,
        borderRadius: 225
    },
    ambientOrbLeft: {
        position: 'absolute',
        top: '30%',
        left: -150,
        width: 350,
        height: 350,
        borderRadius: 175
    },
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 20,
        zIndex: 10
    },
    logoImg: {
        width: 48,
        height: 48,
        borderRadius: 12,
        marginRight: 12
    },
    brandTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#F8FAFC',
        letterSpacing: 0.5
    },
    redDot: {
        position: 'absolute',
        top: 0, right: 2,
        width: 10, height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        borderWidth: 2, borderColor: '#071a14'
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40
    },
    loaderBox: {
        marginTop: 100,
        alignItems: 'center'
    },
    groupsContainer: {
        marginTop: 10,
    },
    sectionWrap: {
        marginBottom: 26
    },
    groupHead: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F1F5F9', // Cor brilhante
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4
    },
    gridBox: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    
    // Emerald Card Style - EXACT REPLICA OF THE IA ARTWORK
    cardBox: {
        width: '48%',
        backgroundColor: 'rgba(255, 255, 255, 0.035)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255, 0.05)',
        borderTopColor: 'rgba(255,255,255, 0.08)',
        position: 'relative',
        overflow: 'hidden'
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    iconWrap: {
        width: 30, height: 30,
        borderRadius: 8,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 10
    },
    cardTitle: {
        flex: 1,
        fontSize: 13,
        fontWeight: '800',
        color: '#F8FAFC'
    },
    cardBody: {
        marginBottom: 2
    },
    cardValue: {
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 24,
    },
    cardSubTitle: {
        fontSize: 10,
        color: '#9CA3AF',
        marginBottom: 4
    },
    bgIconPhantom: {
        position: 'absolute',
        bottom: 5,
        right: 0,
        opacity: 0.15,
        transform: [{ scale: 1.1 }]
    }
});

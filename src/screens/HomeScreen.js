import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar as RNStatusBar, InteractionManager, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';
import { pushLocalChanges, pullServerChanges } from '../services/SyncService';
import { MenuConfigService } from '../services/MenuConfigService';

const { width } = Dimensions.get('window');

// Diminuir padding lateral
const CARD_MARGIN = 6;
// 2 colunas com espacamento
const CARD_WIDTH = (width / 2) - 16 - CARD_MARGIN;

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
        const baseColor = item.color || '#10B981';
        
        return (
            <TouchableOpacity
                key={item.id}
                style={styles.cardBox}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.8}
            >
                {/* Efeito Glow Topo */}
                <View style={[styles.cardGlowTop, { backgroundColor: baseColor + '15' }]} />
                
                <View style={styles.cardHeader}>
                    <View style={[styles.iconWrap, { backgroundColor: baseColor + '20' }]}>
                        <Ionicons name={item.icon} size={20} color={baseColor} />
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.label}</Text>
                </View>
                
                <View style={styles.cardBody}>
                    <Text style={styles.cardSubTitle}>{data.sub}</Text>
                    <Text style={[
                        styles.cardValue, 
                        data.highlight && { color: '#E2E8F0' },
                        data.error && { color: '#EF4444' }
                    ]} numberOfLines={1}>
                        {data.val}
                    </Text>
                </View>
                
                {/* Linha/Icone Fantasma Inferior como no Design - Grafico Fake pra Comercial */}
                {item.id === 'vendas' && (
                    <Ionicons name="trending-up" size={40} color={baseColor} style={styles.bgIconPhantom} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        // FUNDO NEON ESRMERALDA MOCKUP VIBE (Gradiente Global)
        <LinearGradient 
            colors={['#071a14', '#141A1E', '#10161a']} 
            start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
            style={styles.container}
        >
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
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    },
    
    // Emerald Card Style (O que o usuário tanto queria)
    cardBox: {
        width: CARD_WIDTH,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 18,
        padding: 16,
        margin: CARD_MARGIN,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255, 0.08)',
        position: 'relative',
        overflow: 'hidden'
        // shadowColor: '#000', // Sombra nativa as vezes não fica legal com opacity
    },
    cardGlowTop: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
        opacity: 0.8
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18
    },
    iconWrap: {
        width: 34, height: 34,
        borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 10
    },
    cardTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#F8FAFC'
    },
    cardBody: {
        marginBottom: 4
    },
    cardSubTitle: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 4
    },
    cardValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#38BDF8' // Azul Neon claro para dar o ar de Dashboard moderno
    },
    bgIconPhantom: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        opacity: 0.15,
        transform: [{ scale: 1.2 }]
    }
});

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar as RNStatusBar, InteractionManager, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';
import { pushLocalChanges, pullServerChanges } from '../services/SyncService';
import { MenuConfigService } from '../services/MenuConfigService';

export default function HomeScreen({ navigation }) {
    const { colors } = useTheme();
    
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

    const getCardValue = (id) => {
        switch(id) {
            case 'vendas': return { val: formatBRL(stats.vendasHoje), sub: 'Vendas Mês' };
            case 'colheita': return { val: `${stats.colheitaHoje || 0} kg`, sub: 'Colheita Hoje' };
            case 'custos': return { val: formatBRL(stats.saldo || 0), sub: 'Saldo Atual' };
            case 'plantio': return { val: `${stats.plantioAtivo || 0}`, sub: 'Lavouras Ativas' };
            case 'frota': return stats.maquinasAlert > 0 ? { val: `${stats.maquinasAlert} maq`, sub: 'Revisão Necessária' } : { val: 'Ok', sub: 'Frota' };
            default: return { val: 'Acessar', sub: 'Painel' };
        }
    };

    const renderCard = (item) => {
        const data = getCardValue(item.id);
        let customColor = '#34D399';
        if (item.id === 'vendas' || item.id === 'colheita' || item.id === 'financeiro') customColor = '#10B981';
        if (item.id === 'relatorios' || item.id === 'estoque' || item.id === 'compras') customColor = '#3B82F6';
        if (item.id === 'alertas' || item.id === 'descarte') customColor = '#EF4444';
        
        return (
            <TouchableOpacity key={item.id} style={styles.cardBox} onPress={() => navigation.navigate(item.screen)}>
                {(item.id === 'vendas' || item.id === 'relatorios') && (
                    <Ionicons name={item.id === 'vendas' ? "trending-up" : "bar-chart"} size={40} color={customColor} style={styles.bgIconPhantom} />
                )}
                <View style={styles.cardHeader}>
                    <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }]}>
                        <Ionicons name={item.icon} size={14} color={customColor} />
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.label}</Text>
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.cardValue} numberOfLines={1}>{data.val}</Text>
                    <Text style={styles.cardSubTitle} numberOfLines={1}>{data.sub}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient 
                colors={['#0A0F0D', '#0D1A15', '#0E291F', '#06110E']} 
                start={{ x: 0.1, y: 0.1 }} end={{ x: 0.9, y: 0.9 }} 
                style={StyleSheet.absoluteFill} 
            />
            <RNStatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <View style={styles.topNav}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Image source={require('../../assets/logo.png')} style={styles.logoImg} resizeMode="contain" />
                    <Text style={styles.brandTitle}>AgroGB</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 20 }}>
                     <TouchableOpacity><Ionicons name="search-outline" size={24} color="#A7B0B5" /></TouchableOpacity>
                     <TouchableOpacity><Ionicons name="notifications-outline" size={24} color="#A7B0B5" /></TouchableOpacity>
                </View>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {isReady ? (
                    <View style={styles.groupsContainer}>
                        {getGroupedMenus().map((group, index) => (
                            <View key={index} style={styles.sectionWrap}>
                                <Text style={styles.groupHead}>{group.title}</Text>
                                <View style={styles.gridBox}>{group.items.map(renderCard)}</View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.loaderBox}><ActivityIndicator color="#10B981" size="large" /></View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 20, zIndex: 10 },
    logoImg: { width: 48, height: 48, borderRadius: 12, marginRight: 12 },
    brandTitle: { fontSize: 26, fontWeight: 'bold', color: '#F8FAFC', letterSpacing: 0.5 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
    loaderBox: { marginTop: 100, alignItems: 'center' },
    groupsContainer: { marginTop: 10 },
    sectionWrap: { marginBottom: 26 },
    groupHead: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', letterSpacing: 1, marginBottom: 16, marginLeft: 4 },
    gridBox: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    cardBox: { width: '31.5%', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 18, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)', elevation: 8, position: 'relative', overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconWrap: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    cardTitle: { flex: 1, fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
    cardBody: { marginTop: 4 },
    cardValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', textShadowColor: 'rgba(255,255,255,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
    cardSubTitle: { fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: '500' },
    bgIconPhantom: { position: 'absolute', bottom: -5, right: -5, opacity: 0.08 }
});

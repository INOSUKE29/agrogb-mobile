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
            case 'colheita': return { val: `${stats.colheitaHoje || 0} kg`, sub: 'Hoje' };
            case 'custos': return { val: formatBRL(stats.saldo || 0), sub: 'Saldo' };
            case 'plantio': return { val: `${stats.plantioAtivo || 0}`, sub: 'Lavouras' };
            case 'frota': return { val: stats.maquinasAlert > 0 ? `${stats.maquinasAlert} Alertas` : 'Ok', sub: 'Frota' };
            case 'estoque': return { val: 'Fértil', sub: 'Estoque' };
            default: return { val: 'Abrir', sub: 'Gerenciar' };
        }
    };

    const renderCard = (item) => {
        const data = getCardValue(item.id);
        let accent = '#34D399';
        if (item.id === 'vendas' || item.id === 'colheita' || item.id === 'financeiro') accent = '#4ADE80';
        if (item.id === 'relatorios' || item.id === 'estoque' || item.id === 'compras') accent = '#60A5FA';
        if (item.id === 'alertas' || item.id === 'descarte') accent = '#F87171';
        
        return (
            <TouchableOpacity key={item.id} style={styles.cardBox} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.75}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <Ionicons name={item.icon} size={15} color={accent} />
                    </View>
                    <Text style={styles.cardTitle}>{item.label}</Text>
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardMainValue}>{data.val}</Text>
                    <Text style={styles.cardSmallSub}>{data.sub}</Text>
                </View>
                {(item.id === 'vendas' || item.id === 'relatorios') && (
                    <Ionicons name="trending-up" size={45} color={accent} style={styles.phantomIcon} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#064E3B', '#022C22', '#011F18', '#000000']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
            <RNStatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            <View style={styles.headerBar}>
                <View style={styles.logoRow}>
                    <Image source={require('../../assets/logo.png')} style={styles.logoSquare} />
                    <Text style={styles.appName}>AgroGB</Text>
                </View>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconBtn}><Ionicons name="search-outline" size={24} color="#FFF" /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}><Ionicons name="notifications-outline" size={24} color="#FFF" /></TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {isReady ? (
                    getGroupedMenus().map((group, idx) => (
                        <View key={idx} style={styles.groupContainer}>
                            <Text style={styles.groupTitle}>{group.title}</Text>
                            <View style={styles.cardGrid}>{group.items.map(renderCard)}</View>
                        </View>
                    ))
                ) : (
                    <View style={styles.center}><ActivityIndicator color="#34D399" size="large" /></View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15 },
    logoRow: { flexDirection: 'row', alignItems: 'center' },
    logoSquare: { width: 44, height: 44, borderRadius: 10, marginRight: 12 },
    appName: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
    headerIcons: { flexDirection: 'row', gap: 15 },
    iconBtn: { padding: 4 },
    scrollArea: { paddingHorizontal: 16, paddingBottom: 30 },
    groupContainer: { marginBottom: 30 },
    groupTitle: { fontSize: 13, fontWeight: '900', color: 'rgba(255,255,255,0.6)', letterSpacing: 2, marginBottom: 15, paddingLeft: 4 },
    cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    cardBox: { 
        width: '31.5%', 
        backgroundColor: 'rgba(255, 255, 255, 0.08)', 
        borderRadius: 20, 
        padding: 12, 
        marginBottom: 12, 
        borderWidth: 1.5, 
        borderColor: 'rgba(255, 255, 255, 0.25)', 
        shadowColor: "#FFF", 
        shadowOffset: { width: 0, height: 0 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 10, 
        elevation: 10,
        overflow: 'hidden'
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
    cardTitle: { flex: 1, fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.95)' },
    cardInfo: { marginTop: 2 },
    cardMainValue: { fontSize: 15, fontWeight: '900', color: '#FFF' },
    cardSmallSub: { fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 1, fontWeight: '700' },
    phantomIcon: { position: 'absolute', bottom: -5, right: -5, opacity: 0.12 },
    center: { marginTop: 80, alignItems: 'center' }
});

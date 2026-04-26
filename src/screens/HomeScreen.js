import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar as RNStatusBar, InteractionManager, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';
import { MenuConfigService } from '../services/MenuConfigService';

const FALLBACK_MENU = [
    { id: "caderno", label: "Caderno", icon: "book-outline", screen: "CadernoCampo" },
    { id: "colheita", label: "Colheita", icon: "leaf-outline", screen: "Colheita" },
    { id: "vendas", label: "Vendas", icon: "cash-outline", screen: "Vendas" },
    { id: "estoque", label: "Estoque", icon: "cube-outline", screen: "Estoque" },
    { id: "monitoramento", label: "Monitorar", icon: "camera-outline", screen: "Monitoramento" },
    { id: "adubacao", label: "Adubação", icon: "flask-outline", screen: "AdubacaoList" },
    { id: "compras", label: "Compras", icon: "cart-outline", screen: "Compras" },
    { id: "encomendas", label: "Encomendas", icon: "clipboard-outline", screen: "Encomendas" },
    { id: "plantio", label: "Plantio", icon: "nutrition-outline", screen: "Plantio" },
    { id: "custos", label: "Custos", icon: "calculator-outline", screen: "Custos" },
    { id: "descarte", label: "Descarte", icon: "trash-outline", screen: "Descarte" },
    { id: "frota", label: "Frota", icon: "car-sport-outline", screen: "Frota" },
    { id: "relatorios", label: "Relatórios", icon: "pie-chart-outline", screen: "Relatorios" },
    { id: "cadastros", label: "Cadastros", icon: "create-outline", screen: "Cadastro" },
    { id: "clientes", label: "Clientes", icon: "people-outline", screen: "Clientes" },
    { id: "areas", label: "Áreas", icon: "map-outline", screen: "Culturas" },
    { id: "sync", label: "Sync", icon: "cloud-upload-outline", screen: "Sync" }
];

export default function HomeScreen({ navigation }) {
    const { colors } = useTheme();
    const [stats, setStats] = useState({ vendasHoje: 0, colheitaHoje: 0 });
    const [isReady, setIsReady] = useState(false);
    const [menuItems, setMenuItems] = useState(FALLBACK_MENU);

    const loadData = async () => {
        try {
            const data = await getDashboardStats();
            if (data) setStats(data);
            const cfg = await MenuConfigService.getMenuConfig();
            if(cfg && cfg.menu_items && cfg.menu_items.length > 0) {
                setMenuItems(cfg.menu_items.filter(i => i.enabled));
            }
        } catch (e) { }
    };

    useFocusEffect(useCallback(() => {
        setIsReady(true);
        loadData();
    }, []));

    const formatBRL = (v) => v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';

    const CATEGORIES = [
        { title: 'PRODUÇÃO', keys: ['caderno', 'plantio', 'monitoramento', 'adubacao', 'colheita', 'descarte', 'cadastros'] },
        { title: 'COMERCIAL', keys: ['vendas', 'encomendas', 'compras'] },
        { title: 'CONTROLE', keys: ['estoque', 'custos', 'frota', 'relatorios'] },
        { title: 'SISTEMA', keys: ['clientes', 'areas', 'sync'] }
    ];

    const getGroupedMenus = () => {
        return CATEGORIES.map(cat => ({
            title: cat.title,
            items: menuItems.filter(item => {
                let sId = (item.id || '').toLowerCase();
                if(!sId && item.screen) sId = item.screen.toLowerCase().replace('screen', '');
                if(sId === 'monitorar') sId = 'monitoramento';
                if(sId === 'cadastro') sId = 'cadastros';
                if(sId === 'culturas') sId = 'areas';
                return cat.keys.includes(sId);
            })
        })).filter(g => g.items.length > 0); 
    };

    const renderCard = (item) => {
        let accent = '#059669';
        return (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.8}>
                <View style={styles.iconCircle}><Ionicons name={item.icon} size={22} color={accent} /></View>
                <Text style={styles.cardLabel}>{item.label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* CORREÇÃO DO DEGRADÊ: Transição muito mais longa e suave para não atrapalhar a visão */}
            <LinearGradient 
                colors={['#065F46', '#047857', '#F3F4F6', '#FFFFFF']} 
                locations={[0, 0.4, 0.8, 1]}
                style={StyleSheet.absoluteFill} 
            />
            <RNStatusBar barStyle="light-content" translucent />
            
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                <View style={styles.header}>
                    <TouchableOpacity style={styles.menuBox}><Ionicons name="menu-outline" size={26} color="#FFF" /></TouchableOpacity>
                    <View style={styles.branding}>
                       {/* LOGO AUMENTADA CONFORME SOLICITADO */}
                        <Image source={require('../../assets/logo.png')} style={styles.logoLarge} />
                        <Text style={styles.brand}>AgroGB</Text>
                         {/* PALAVRA PRO REMOVIDA */}
                    </View>
                    <View style={{width: 40}} />
                </View>
                <Text style={styles.tagline}>Fazenda em tempo real</Text>

                <View style={styles.weather}>
                    <View style={styles.wRow}>
                        <Ionicons name="sunny-outline" size={42} color="#FFD700" />
                        <View style={{marginLeft: 15}}>
                            <Text style={styles.temp}>25°C</Text>
                            <Text style={styles.loc}>Local</Text>
                        </View>
                        <View style={styles.time}><Text style={styles.timeTxt}>18:51 (BRT)</Text></View>
                    </View>
                </View>

                <View style={styles.quickStats}>
                    <View style={styles.qCard}>
                        <Text style={styles.qLabel}>COLHEITA (Hoje)</Text>
                        <View style={styles.qRow}><Ionicons name="leaf" size={16} color="#059669" /><Text style={styles.qVal}>{stats.colheitaHoje || 0} kg</Text></View>
                    </View>
                    <View style={styles.qCard}>
                        <Text style={styles.qLabel}>VENDAS (Hoje)</Text>
                        <View style={styles.qRow}><Ionicons name="cash" size={16} color="#059669" /><Text style={styles.qVal}>{formatBRL(stats.vendasHoje)}</Text></View>
                    </View>
                </View>

                {isReady && getGroupedMenus().map((group, idx) => (
                    <View key={idx} style={styles.sec}>
                        <Text style={styles.secTitle}>{group.title}</Text>
                        <View style={styles.grid}>{group.items.map(renderCard)}</View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    scroll: { padding: 20, paddingTop: 55, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    menuBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    branding: { flexDirection: 'row', alignItems: 'center' },
    logoLarge: { width: 38, height: 38, marginRight: 10 },
    brand: { fontSize: 28, fontWeight: '900', color: '#FFF' },
    tagline: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: -5, marginLeft: 50, marginBottom: 20 },
    
    weather: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 28, padding: 22, marginTop: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', shadowColor: '#000', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.1, shadowRadius: 10 },
    wRow: { flexDirection: 'row', alignItems: 'center' },
    temp: { fontSize: 34, fontWeight: 'bold', color: '#FFF' },
    loc: { fontSize: 15, color: 'rgba(255,255,255,0.8)' },
    time: { position: 'absolute', right: 0, top: 0, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    timeTxt: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

    quickStats: { flexDirection: 'row', gap: 15, marginTop: 25 },
    qCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 26, padding: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 12}, shadowOpacity: 0.06, shadowRadius: 18, elevation: 6 },
    qLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 10, letterSpacing: 1 },
    qRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    qVal: { color: '#111827', fontSize: 18, fontWeight: '900' },

    sec: { marginTop: 40 },
    secTitle: { fontSize: 14, fontWeight: '900', color: '#4B5563', letterSpacing: 2, marginBottom: 20, marginLeft: 5 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: { width: '31%', aspectRatio: 1, backgroundColor: '#FFFFFF', borderRadius: 26, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 15}, shadowOpacity: 0.06, shadowRadius: 20, elevation: 8, borderWidth: 1, borderColor: '#F3F4F6' },
    iconCircle: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    cardLabel: { color: '#1F2937', fontSize: 11, fontWeight: '800' }
});

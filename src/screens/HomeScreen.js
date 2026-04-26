import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar as RNStatusBar, InteractionManager, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';
import { MenuConfigService } from '../services/MenuConfigService';
import FundoAnimado from '../components/FundoAnimado';

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
        let accent = '#34D399';
        if (item.id?.includes('venda')) accent = '#FBBF24';
        
        return (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.7}>
                <View style={styles.iconCircle}><Ionicons name={item.icon} size={22} color={accent} /></View>
                <Text style={styles.cardLabel}>{item.label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <FundoAnimado>
            <RNStatusBar barStyle="light-content" translucent />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                {/* HEADER COM ESPAÇO REDUZIDO NO TOPO */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.menuBox}><Ionicons name="menu-outline" size={26} color="#FFF" /></TouchableOpacity>
                    <View style={styles.branding}>
                        <Image source={require('../../assets/logo.png')} style={styles.logoGiant} />
                        <Text style={styles.brand}>AgroGB</Text>
                    </View>
                    <View style={{width: 44}} />
                </View>
                <Text style={styles.tagline}>Fazenda em tempo real</Text>

                <View style={styles.weather}>
                    <View style={styles.wRow}>
                        <Ionicons name="sunny-outline" size={38} color="#FFD700" />
                        <View style={{marginLeft: 12}}>
                            <Text style={styles.temp}>25°C</Text>
                            <Text style={styles.loc}>Local</Text>
                        </View>
                        <View style={styles.time}><Text style={styles.timeTxt}>18:51 (BRT)</Text></View>
                    </View>
                </View>

                <View style={styles.quickStats}>
                    <View style={styles.qCard}>
                        <Text style={styles.qLabel}>COLHEITA (Hoje)</Text>
                        <View style={styles.qRow}><Ionicons name="leaf" size={16} color="#10B981" /><Text style={styles.qVal}>{stats.colheitaHoje || 0} kg</Text></View>
                    </View>
                    <View style={styles.qCard}>
                        <Text style={styles.qLabel}>VENDAS (Hoje)</Text>
                        <View style={styles.qRow}><Ionicons name="cash" size={16} color="#FBBF24" /><Text style={styles.qVal}>{formatBRL(stats.vendasHoje)}</Text></View>
                    </View>
                </View>

                {isReady && getGroupedMenus().map((group, idx) => (
                    <View key={idx} style={styles.sec}>
                        <Text style={styles.secTitle}>{group.title}</Text>
                        <View style={styles.grid}>{group.items.map(renderCard)}</View>
                    </View>
                ))}
            </ScrollView>
        </FundoAnimado>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 20, paddingTop: 30, paddingBottom: 60 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
    menuBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
    branding: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
    logoGiant: { width: 100, height: 100, marginRight: 15 },
    brand: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
    tagline: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: -15, textAlign: 'center', marginBottom: 20 },
    
    weather: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 20, marginTop: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    wRow: { flexDirection: 'row', alignItems: 'center' },
    temp: { fontSize: 30, fontWeight: 'bold', color: '#FFF' },
    loc: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
    time: { position: 'absolute', right: 0, top: 0, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    timeTxt: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

    quickStats: { flexDirection: 'row', gap: 12, marginTop: 25 },
    qCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    qLabel: { fontSize: 10, fontWeight: 'bold', color: 'rgba(255,255,255,0.3)', marginBottom: 8 },
    qRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qVal: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    sec: { marginTop: 35 },
    secTitle: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, marginBottom: 18 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    card: { width: '31.3%', aspectRatio: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
    iconCircle: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.04)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    cardLabel: { color: '#FFF', fontSize: 11, fontWeight: '700' }
});

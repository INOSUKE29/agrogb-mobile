import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar as RNStatusBar, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';
import { MenuConfigService } from '../services/MenuConfigService';
import FundoAnimado from '../components/FundoAnimado';

const MENU_COLORS = {
    caderno: '#34D399', colheita: '#10B981', vendas: '#FBBF24', estoque: '#6366F1',
    monitoramento: '#8B5CF6', adubacao: '#06B6D4', compras: '#F87171', encomendas: '#FB923C',
    plantio: '#4ADE80', custos: '#EF4444', descarte: '#94A3B8', frota: '#3B82F6',
    relatorios: '#EC4899', cadastros: '#14B8A6', clientes: '#F472B6', areas: '#A855F7', sync: '#2DD4BF'
};

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
    const [stats, setStats] = useState({ vendasHoje: 0, colheitaHoje: 0 });
    const [isReady, setIsReady] = useState(false);
    const [menuItems, setMenuItems] = useState(FALLBACK_MENU);

    const loadData = async () => {
        try {
            const data = await getDashboardStats();
            if (data) setStats(data);
            const cfg = await MenuConfigService.getMenuConfig();
            if(cfg && cfg.menu_items?.length > 0) {
                setMenuItems(cfg.menu_items.filter(i => i.enabled));
            }
        } catch (e) { }
    };

    useFocusEffect(useCallback(() => { setIsReady(true); loadData(); }, []));

    const CATEGORIES = [
        { title: 'PRODUÇÃO', keys: ['caderno', 'plantio', 'monitoramento', 'adubacao', 'colheita', 'descarte', 'cadastros'] },
        { title: 'COMERCIAL', keys: ['vendas', 'encomendas', 'compras'] },
        { title: 'CONTROLE', keys: ['estoque', 'custos', 'frota', 'relatorios'] },
        { title: 'SISTEMA', keys: ['clientes', 'areas', 'sync'] }
    ];

    const getGroupedMenus = () => {
        return CATEGORIES.map(cat => ({
            title: cat.title,
            items: menuItems.map(item => {
                let sId = (item.id || '').toLowerCase();
                if(!sId && item.screen) sId = item.screen.toLowerCase().replace('screen', '');
                if(sId.includes('monitorar')) sId = 'monitoramento';
                if(sId === 'cadastro') sId = 'cadastros';
                if(sId === 'culturas') sId = 'areas';
                return { ...item, normalizedId: sId };
            }).filter(item => cat.keys.includes(item.normalizedId))
        })).filter(g => g.items.length > 0); 
    };

    return (
        <FundoAnimado>
            <RNStatusBar barStyle="light-content" translucent />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                {/* HEADER COM CONFIGURAÇÕES NAS PONTAS (Estilo Clássico) */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Profile')}>
                        <Ionicons name="person-circle-outline" size={28} color="#FFF" />
                    </TouchableOpacity>
                    
                    <View style={styles.branding}>
                        <Image source={require('../../assets/logo.png')} style={styles.logoGiant} />
                        <Text style={styles.brand}>AgroGB</Text>
                    </View>

                    <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Sync')}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.tagline}>Inteligência no campo</Text>

                <View style={styles.dashPanel}>
                    <View style={styles.dashItem}>
                        <Ionicons name="sunny-outline" size={22} color="#FFD700" />
                        <Text style={styles.dashVal}>25°C</Text>
                    </View>
                    <View style={styles.dashLine} />
                    <View style={styles.dashItem}>
                        <Text style={styles.dashLab}>COLHEITA</Text>
                        <Text style={styles.dashVal}>{stats.colheitaHoje || 0}kg</Text>
                    </View>
                    <View style={styles.dashLine} />
                    <View style={styles.dashItem}>
                        <Text style={styles.dashLab}>VENDAS</Text>
                        <Text style={styles.dashVal}>R$ {stats.vendasHoje?.toFixed(0) || '0'}</Text>
                    </View>
                </View>

                {isReady && getGroupedMenus().map((group, idx) => (
                    <View key={idx} style={styles.sec}>
                        <Text style={styles.secTitle}>{group.title}</Text>
                        <View style={styles.grid}>
                            {group.items.map(item => {
                                const accent = MENU_COLORS[item.normalizedId] || '#34D399';
                                return (
                                    <TouchableOpacity key={item.id} style={styles.card} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.7}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name={item.icon} size={28} color={accent} />
                                        </View>
                                        <Text style={styles.cardLabel} numberOfLines={1}>{item.label}</Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </FundoAnimado>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 15, paddingTop: 20, paddingBottom: 60 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
    headerBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
    branding: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
    logoGiant: { width: 90, height: 90, marginRight: 10 },
    brand: { fontSize: 26, fontWeight: '900', color: '#FFF' },
    tagline: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: -15, marginBottom: 20, fontWeight: 'bold' },

    dashPanel: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    dashItem: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dashLab: { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.4)' },
    dashVal: { color: '#FFF', fontSize: 14, fontWeight: '800' },
    dashLine: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)' },

    sec: { marginTop: 30 },
    secTitle: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 2.5, marginBottom: 15 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    // VOLTA PARA 3 COLUNAS
    card: { 
        width: '31%', 
        backgroundColor: 'rgba(255,255,255,0.1)', 
        borderRadius: 24, 
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FFF',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 6
    },
    iconCircle: { 
        width: 54, 
        height: 54, 
        borderRadius: 18, 
        backgroundColor: '#FFF',
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 10,
        shadowColor: '#FFF',
        shadowOpacity: 0.2,
        shadowRadius: 6
    },
    cardLabel: { color: '#FFF', fontSize: 10, fontWeight: '700', textAlign: 'center' }
});

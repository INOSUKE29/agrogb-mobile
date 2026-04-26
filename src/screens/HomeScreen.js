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
    caderno: '#00FF9D', colheita: '#34D399', vendas: '#FBBF24', estoque: '#3B82F6',
    monitoramento: '#A855F7', adubacao: '#06B6D4', compras: '#F87171', encomendas: '#FB923C',
    plantio: '#10B981', custos: '#EF4444', descarte: '#94A3B8', frota: '#6366F1',
    relatorios: '#EC4899', cadastros: '#14B8A6', clientes: '#F472B6', areas: '#2DD4BF', sync: '#00FF9D'
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
                
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Profile')}>
                        <Ionicons name="person-circle-outline" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <Image source={require('../../assets/logo.png')} style={styles.logo} />
                    <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Sync')}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.dashOverview}>
                    <View style={styles.dashCard}>
                        <Ionicons name="sunny" size={20} color="#00FF9D" />
                        <Text style={styles.dashVal}>25°C</Text>
                    </View>
                    <View style={styles.dashMain}>
                        <View style={styles.stat}>
                            <Text style={styles.statLab}>COLHEITA</Text>
                            <Text style={styles.statVal}>{stats.colheitaHoje || 0}kg</Text>
                        </View>
                        <View style={styles.statLine} />
                        <View style={styles.stat}>
                            <Text style={styles.statLab}>VENDAS</Text>
                            <Text style={styles.statVal}>R$ {stats.vendasHoje?.toFixed(0) || '0'}</Text>
                        </View>
                    </View>
                </View>

                {isReady && getGroupedMenus().map((group, idx) => (
                    <View key={idx} style={styles.sec}>
                        <Text style={styles.secTitle}>{group.title}</Text>
                        <View style={styles.grid}>
                            {group.items.map(item => {
                                const accent = MENU_COLORS[item.normalizedId] || '#00FF9D';
                                return (
                                    <TouchableOpacity key={item.id} style={styles.btn} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.7}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name={item.icon} size={30} color={accent} />
                                        </View>
                                        <Text style={styles.btnLab} numberOfLines={1}>{item.label}</Text>
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
    scroll: { padding: 20, paddingTop: 30, paddingBottom: 80 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
    headerBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
    logo: { width: 140, height: 45, resizeMode: 'contain' },

    dashOverview: { flexDirection: 'row', gap: 10, marginBottom: 30 },
    dashCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    dashVal: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
    dashMain: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    stat: { alignItems: 'center' },
    statLab: { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },
    statVal: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginTop: 2 },
    statLine: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.08)' },

    sec: { marginTop: 35 },
    secTitle: { fontSize: 12, fontWeight: '900', color: '#FFF', letterSpacing: 2, marginBottom: 18, opacity: 0.6 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
    btn: { width: '30%', alignItems: 'center', marginBottom: 20 },
    iconCircle: { 
        width: 65, 
        height: 65, 
        borderRadius: 22, 
        backgroundColor: '#FFF',
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 10,
        shadowColor: '#00FF9D',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10
    },
    btnLab: { color: '#FFF', fontSize: 11, fontWeight: '800', textAlign: 'center' }
});

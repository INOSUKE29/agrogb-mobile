import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar as RNStatusBar, InteractionManager, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';
import { MenuConfigService } from '../services/MenuConfigService';

// FALLBACK ESTRUTURAL SENIOR PARA GARANTIR QUE AS TELAS NUNCA SUMAM
const FALLBACK_MENU = [
    { id: "caderno", label: "Caderno", icon: "book-outline", screen: "CadernoCampo" },
    { id: "colheita", label: "Colheita", icon: "leaf-outline", screen: "Colheita" },
    { id: "monitoramento", label: "Monitorar", icon: "camera-outline", screen: "Monitoramento" },
    { id: "adubacao", label: "Adubação", icon: "flask-outline", screen: "AdubacaoList" },
    { id: "plantio", label: "Plantio", icon: "nutrition-outline", screen: "Plantio" },
    { id: "descarte", label: "Descarte", icon: "trash-outline", screen: "Descarte" },
    { id: "vendas", label: "Vendas", icon: "cash-outline", screen: "Vendas" },
    { id: "compras", label: "Compras", icon: "cart-outline", screen: "Compras" },
    { id: "encomendas", label: "Encomendas", icon: "clipboard-outline", screen: "Encomendas" },
    { id: "estoque", label: "Estoque", icon: "cube-outline", screen: "Estoque" },
    { id: "custos", label: "Custos", icon: "calculator-outline", screen: "Custos" },
    { id: "frota", label: "Frota", icon: "car-sport-outline", screen: "Frota" },
    { id: "relatorios", label: "Relatórios", icon: "pie-chart-outline", screen: "Relatorios" }
];

export default function HomeScreen({ navigation }) {
    const { colors } = useTheme();
    const [stats, setStats] = useState({ vendasHoje: 0, colheitaHoje: 0 });
    const [isReady, setIsReady] = useState(false);
    const [menuItems, setMenuItems] = useState(FALLBACK_MENU); // Começa com o fallback para evitar tela vazia

    const loadData = async () => {
        try {
            const data = await getDashboardStats();
            if (data) setStats(data);
            
            const cfg = await MenuConfigService.getMenuConfig();
            if(cfg && cfg.menu_items && cfg.menu_items.length > 0) {
                setMenuItems(cfg.menu_items.filter(i => i.enabled));
            }
        } catch (e) {
            console.log('Load failure:', e);
        }
    };

    useFocusEffect(useCallback(() => {
        setIsReady(true);
        loadData();
    }, []));

    // Garantia extra de montagem para Web
    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 500);
        return () => clearTimeout(timer);
    }, []);

    const formatBRL = (v) => v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';

    const CATEGORIES = [
        { title: 'PRODUÇÃO', keys: ['caderno', 'plantio', 'monitoramento', 'adubacao', 'colheita', 'descarte'] },
        { title: 'COMERCIAL', keys: ['vendas', 'encomendas', 'compras'] },
        { title: 'CONTROLE', keys: ['estoque', 'custos', 'frota', 'relatorios'] }
    ];

    const getGroupedMenus = () => {
        return CATEGORIES.map(cat => ({
            title: cat.title,
            items: menuItems.filter(item => {
                const searchKey = (item.id || item.screen.toLowerCase()).replace('screen', '').replace('monitorar', 'monitoramento');
                return cat.keys.includes(searchKey);
            })
        })).filter(g => g.items.length > 0); 
    };

    const renderCard = (item) => {
        let accent = '#10B981';
        if (item.id?.includes('venda') || item.id?.includes('colheita')) accent = '#34D399';
        if (item.label.includes('Custos') || item.label.includes('Financeiro')) accent = '#60A5FA';
        
        return (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.7}>
                <View style={styles.iconCircle}><Ionicons name={item.icon} size={20} color={accent} /></View>
                <Text style={styles.cardLabel}>{item.label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#05251E', '#061C18', '#010807']} style={StyleSheet.absoluteFill} />
            <RNStatusBar barStyle="light-content" translucent />
            
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                <View style={styles.header}>
                    <TouchableOpacity style={styles.menuBox}><Ionicons name="menu-outline" size={26} color="#FFF" /></TouchableOpacity>
                    <View style={styles.branding}>
                        <Image source={require('../../assets/logo.png')} style={styles.logo} />
                        <Text style={styles.brand}>AgroGB</Text>
                        <View style={styles.pro}><Text style={styles.proTxt}>PRO</Text></View>
                    </View>
                    <View style={{width: 40}} />
                </View>
                <Text style={styles.tagline}>Fazenda em tempo real</Text>

                <View style={styles.weather}>
                    <View style={styles.wRow}>
                        <Ionicons name="cloud-outline" size={36} color="#FFD700" />
                        <View style={{marginLeft: 12}}>
                            <Text style={styles.temp}>25°C</Text>
                            <Text style={styles.loc}>Local</Text>
                        </View>
                        <View style={styles.time}><Text style={styles.timeTxt}>18:51 (BRT)</Text></View>
                    </View>
                    <View style={styles.wMeta}>
                        <View style={styles.wItem}><Ionicons name="rainy" size={12} color="#60A5FA" /><Text style={styles.wTxt}>0% Chuva</Text></View>
                        <View style={styles.wItem}><Ionicons name="water" size={12} color="#60A5FA" /><Text style={styles.wTxt}>50%</Text></View>
                        <View style={styles.wItem}><Ionicons name="speedometer" size={12} color="#60A5FA" /><Text style={styles.wTxt}>10 km/h</Text></View>
                    </View>
                </View>

                <View style={styles.quickStats}>
                    <View style={styles.qCard}>
                        <Text style={styles.qLabel}>COLHEITA (Hoje)</Text>
                        <View style={styles.qRow}><Ionicons name="leaf" size={14} color="#10B981" /><Text style={styles.qVal}>{stats.colheitaHoje || 0} kg</Text></View>
                    </View>
                    <View style={styles.qCard}>
                        <Text style={styles.qLabel}>VENDAS (Mês)</Text>
                        <View style={styles.qRow}><Ionicons name="cash" size={14} color="#34D399" /><Text style={styles.qVal}>{formatBRL(stats.vendasHoje)}</Text></View>
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
    container: { flex: 1, backgroundColor: '#000' },
    scroll: { padding: 20, paddingTop: 50 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    menuBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    branding: { flexDirection: 'row', alignItems: 'center' },
    logo: { width: 22, height: 22, marginRight: 8 },
    brand: { fontSize: 24, fontWeight: '900', color: '#FFF' },
    pro: { backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
    proTxt: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    tagline: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4, marginLeft: 44 },
    
    weather: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 20, marginTop: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    wRow: { flexDirection: 'row', alignItems: 'center' },
    temp: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
    loc: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
    time: { position: 'absolute', right: 0, top: 0, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    timeTxt: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    wMeta: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 15 },
    wItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    wTxt: { color: '#FFF', fontSize: 11, fontWeight: '600' },

    quickStats: { flexDirection: 'row', gap: 12, marginTop: 25 },
    qCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    qLabel: { fontSize: 10, fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', marginBottom: 8 },
    qRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qVal: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    sec: { marginTop: 35 },
    secTitle: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 18 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    card: { width: '31.3%', aspectRatio: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', shadowColor: '#FFF', shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    iconCircle: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    cardLabel: { color: '#FFF', fontSize: 11, fontWeight: '700' }
});

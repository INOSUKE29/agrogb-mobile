import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar as RNStatusBar, Dimensions, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';

const { width } = Dimensions.get('window');

const ALL_MENU_ITEMS = [
    { id: 'AgronomistClients', label: 'Meus Clientes', icon: 'account-group-outline', darkColor: '#3B82F6', lightColor: '#2563EB' },
    { id: 'CreateRecommendation', label: 'Nova Receita', icon: 'flask-outline', darkColor: '#D8B4FE', lightColor: '#9333EA' },
    { id: 'Visitas', label: 'Agenda/Visitas', icon: 'calendar-clock-outline', darkColor: '#FBBF24', lightColor: '#D97706' },
    { id: 'Estoque', label: 'Ver Estoque', icon: 'cube-outline', darkColor: '#93C5FD', lightColor: '#3B82F6' },
    { id: 'Monitoramento', label: 'Monitoramento', icon: 'camera-outline', darkColor: '#F9A8D4', lightColor: '#EC4899' },
    { id: 'Culturas', label: 'Lavouras', icon: 'map-outline', darkColor: '#34D399', lightColor: '#059669' },
    { id: 'Relatorios', label: 'Relatórios', icon: 'chart-pie', darkColor: '#94A3B8', lightColor: '#475569' },
];

export default function HomeScreen({ navigation }) {
    const { isDark, colors } = useTheme();
    const [stats, setStats] = useState({ vendasHoje: 0, colheitaHoje: 0 });

    // --- NEWS BANNER STATES ---
    const [newsItems, setNewsItems] = useState([
        "Tudo sob controle, sua lavoura no topo! Agro GB, gestão inteligente para resultados reais."
    ]);
    const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // --- FETCH NEWS & DOLLAR ---
    useEffect(() => {
        const fetchNews = async () => {
            try {
                let items = ["Tudo sob controle, sua lavoura no topo! Agro GB."];
                
                // Fetch Dollar Quote
                try {
                    const resDollar = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
                    const dataDollar = await resDollar.json();
                    if (dataDollar?.USDBRL?.bid) {
                        items.unshift(`💵 Dólar Comercial: R$ ${parseFloat(dataDollar.USDBRL.bid).toFixed(2)} (Var: ${dataDollar.USDBRL.pctChange}%)`);
                    }
                } catch(e) {}
                
                // Fetch RSS Canal Rural
                try {
                    const resRss = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.canalrural.com.br/feed/');
                    const dataRss = await resRss.json();
                    if (dataRss?.items && dataRss.items.length > 0) {
                        dataRss.items.slice(0, 4).forEach(item => {
                            items.push(`📰 ${item.title}`);
                        });
                    }
                } catch(e) {}

                if (items.length > 1) {
                    setNewsItems(items);
                }
            } catch(e) {
                console.error("Erro ao buscar notícias:", e);
            }
        };

        fetchNews();
    }, []);

    // --- ROTATE NEWS ---
    useEffect(() => {
        if (newsItems.length <= 1) return;
        
        const interval = setInterval(() => {
            Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
                setCurrentNewsIndex(prev => (prev + 1) % newsItems.length);
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
            });
        }, 6000); // Roda a cada 6 segundos

        return () => clearInterval(interval);
    }, [newsItems, fadeAnim]);

    useFocusEffect(useCallback(() => {
        const fetch = async () => { try { const d = await getDashboardStats(); if (d) setStats(d); } catch (e) {} };
        fetch();
    }, []));

    const MenuItem = ({ item }) => {
        const iconColor = isDark ? item.darkColor : item.lightColor;
        const balloonBg = isDark ? iconColor + '20' : iconColor + '15'; // 20% opacity no dark, 15% no light

        return (
            <TouchableOpacity 
                style={styles.gridItem} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate(item.id)}
            >
                <View style={[styles.cardInternal, { backgroundColor: colors.cardBg }]}>
                    <View style={[styles.balloon, { backgroundColor: balloonBg }]}>
                        <MaterialCommunityIcons name={item.icon} size={28} color={iconColor} />
                    </View>
                    <Text style={[styles.itemLabel, { color: colors.textMain }]} numberOfLines={1}>{item.label}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <RNStatusBar barStyle="light-content" translucent />
            
            {/* HERDER MEGA LOGO (FIDELIDADE TOTAL) */}
            <LinearGradient
                colors={colors.headerBg || ['#0F3D2E', '#1B5E20']}
                style={styles.header}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            >
                <View style={styles.topRow}>
                    <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.navigate('Profile')}>
                        <Ionicons name="person" size={26} color="#FFF" />
                    </TouchableOpacity>
                    
                    <View style={styles.brandingCenter}>
                        <View style={styles.logoRow}>
                            <Image source={require('../../assets/logo.png')} style={styles.megaLogo} />
                            <Text style={styles.brandTitle}>
                                <Text style={{color: '#FFF'}}>Agro</Text>
                                <Text style={{color: '#81C784'}}>GB</Text>
                            </Text>
                        </View>
                        <Text style={styles.slogan}>Inteligência no campo</Text>
                    </View>

                    <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.navigate('Config')}>
                        <View style={styles.badge} />
                        <Ionicons name="notifications" size={26} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView 
                style={{ marginTop: -80, zIndex: 1 }} 
                contentContainerStyle={styles.scroll} 
                showsVerticalScrollIndicator={false}
            >
                
                {/* DASHBOARD CARD ÚNICO */}
                <View style={[styles.dashCardSingle, styles.shadow, { backgroundColor: colors.cardBg }]}>
                    {/* Seção 1: Clima */}
                    <View style={styles.dashSec}>
                        <Ionicons name="sunny" size={30} color="#FDC010" />
                        <View style={styles.dashTxts}>
                            <Text style={[styles.dashLab, { color: colors.accent }]}>Clima</Text>
                            <Text style={[styles.dashVal, { color: colors.textMain }]}>25°C</Text>
                            <Text style={[styles.dashMeta, { color: colors.textSub }]}>Ensolarado</Text>
                        </View>
                    </View>

                    <View style={styles.vDivider} />

                    {/* Seção 2: Colheita */}
                    <View style={styles.dashSec}>
                        <MaterialCommunityIcons name="leaf" size={28} color="#4CAF50" />
                        <View style={styles.dashTxts}>
                            <Text style={[styles.dashLab, { color: colors.accent }]}>Colheita</Text>
                            <Text style={[styles.dashVal, { color: colors.textMain }]}>{stats.colheitaHoje || 0} kg</Text>
                            <Text style={[styles.dashMeta, { color: colors.textSub }]}>Total colhido</Text>
                        </View>
                    </View>

                    <View style={styles.vDivider} />

                    {/* Seção 3: Vendas */}
                    <View style={styles.dashSec}>
                        <View style={[styles.greenCircle, { backgroundColor: colors.accent }]}><MaterialCommunityIcons name="currency-usd" size={18} color="#FFF" /></View>
                        <View style={styles.dashTxts}>
                            <Text style={[styles.dashLab, { color: colors.accent }]}>Vendas</Text>
                            <Text style={[styles.dashVal, { color: colors.textMain }]}>R$ {stats.vendasHoje || '0,00'}</Text>
                            <Text style={[styles.dashMeta, { color: colors.textSub }]}>Faturamento</Text>
                        </View>
                    </View>
                </View>

                {/* NOVO MÓDULO CRM (V2) */}
                <TouchableOpacity style={styles.crmCard} onPress={() => navigation.navigate('AgronomistClients')} activeOpacity={0.9}>
                    <LinearGradient colors={['#1565C0', '#0D47A1']} style={styles.crmGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <View style={styles.crmIconBox}>
                            <Ionicons name="people" size={28} color="#1565C0" />
                        </View>
                        <View style={styles.crmTexts}>
                            <Text style={styles.crmTitle}>Gestão de Clientes</Text>
                            <Text style={styles.crmSubtitle}>3 solicitações pendentes</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.sectionWrap}>
                    <View style={styles.secHeader}>
                        <Text style={[styles.secTitle, { color: colors.textMain }]}>Ferramentas do Consultor</Text>
                        <Text style={{fontSize: 12, color: colors.textSub}}>Acesso Compartilhado</Text>
                    </View>
                    
                    {/* 🔥 GRID 4 COLUNAS SEM CATEGORIAS */}
                    <View style={styles.gridContainer}>
                        {ALL_MENU_ITEMS.map((item, i) => <MenuItem key={i} item={item} />)}
                    </View>
                </View>
                
                {/* Banner na base - similar ao do figma */}
                <View style={styles.bannerContainer}>
                    <LinearGradient
                        colors={['#0F3D2E', '#1B5E20']}
                        style={styles.bannerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <View style={styles.bannerContent}>
                            <Text style={styles.bannerTitle}>Painel Agro</Text>
                            <Animated.View style={{ opacity: fadeAnim }}>
                                <Text style={styles.bannerText}>{newsItems[currentNewsIndex]}</Text>
                            </Animated.View>
                        </View>
                        <MaterialCommunityIcons name="leaf" size={70} color="rgba(255,255,255,0.2)" style={styles.bannerIcon} />
                    </LinearGradient>
                </View>

            </ScrollView>

            {/* TAB BAR FIGMA PERFECT */}
            <View style={[styles.bottomNav, { backgroundColor: isDark ? '#0B121E' : '#FFFFFF', borderTopColor: colors.border }]}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
                    <Ionicons name="home" size={26} color={colors.accent} />
                    <Text style={[styles.navLab, {color: colors.accent}]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Relatorios')}>
                    <Ionicons name="bar-chart-outline" size={26} color={colors.textSub} />
                    <Text style={[styles.navLab, {color: colors.textSub}]}>Relatórios</Text>
                </TouchableOpacity>
                
                {/* Botão Central de Ação Rápida */}
                <TouchableOpacity style={[styles.centerNavBtn, { backgroundColor: colors.accent, borderColor: colors.bg }]} onPress={() => navigation.navigate('MenuOperacional')}>
                    <Ionicons name="add" size={32} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Sync')}>
                    <Ionicons name="sync" size={26} color={colors.textSub} />
                    <Text style={[styles.navLab, {color: colors.textSub}]}>Sync</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="person-outline" size={26} color={colors.textSub} />
                    <Text style={[styles.navLab, {color: colors.textSub}]}>Perfil</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { height: 280, paddingTop: 60, paddingHorizontal: 20 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    circleBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    brandingCenter: { alignItems: 'center' },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    megaLogo: { width: 85, height: 85, borderRadius: 22, shadowColor: '#FFF', shadowOpacity: 0.3, shadowRadius: 10 },
    brandTitle: { fontSize: 38, fontWeight: 'bold' },
    slogan: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: -2, fontWeight: '700' },
    badge: { position: 'absolute', top: 12, right: 12, width: 9, height: 9, borderRadius: 5, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#1B5E20', zIndex: 1 },

    scroll: { paddingHorizontal: 16, paddingBottom: 140 },
    
    // 🔥 DASHBOARD CARD ÚNICO
    dashCardSingle: { 
        flexDirection: 'row', 
        borderRadius: 24, 
        paddingVertical: 20, 
        paddingHorizontal: 10,
        marginBottom: 20,
        minHeight: 120,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    dashSec: { flex: 1, alignItems: 'center' },
    vDivider: { width: 1, height: 40, backgroundColor: 'rgba(150,150,150,0.2)', alignSelf: 'center' },
    shadow: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, elevation: 8 },
    
    dashTxts: { alignItems: 'center', marginTop: 10 },
    dashLab: { fontSize: 11, fontWeight: 'bold' },
    dashVal: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
    dashMeta: { fontSize: 9, fontWeight: 'bold', marginTop: 2 },
    greenCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    // 🔥 CRM CARD STYLES
    crmCard: { borderRadius: 20, marginBottom: 20, elevation: 6, shadowColor: '#1565C0', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
    crmGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20 },
    crmIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    crmTexts: { flex: 1 },
    crmTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
    crmSubtitle: { color: '#BBDEFB', fontSize: 12, fontWeight: '600' },

    sectionWrap: { marginTop: 10 },
    secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginLeft: 5 },
    secTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    // 🔥 GRID 4 COLUNAS SEM CATEGORIAS (Responsivo)
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
    gridItem: { 
        width: '33.33%', // 3 Colunas como no Figma
        paddingHorizontal: 8,
        paddingVertical: 8,
        marginBottom: 8
    },
    cardInternal: {
        borderRadius: 22,
        paddingVertical: 22,
        paddingHorizontal: 5,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
        height: 125, // Cartões mais altos como no print
        justifyContent: 'center'
    },
    balloon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    itemLabel: { fontSize: 11, fontWeight: 'bold', color: '#333', textAlign: 'center' },

    bannerContainer: { marginTop: 20, marginBottom: 10 },
    bannerGradient: { borderRadius: 20, padding: 25, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', height: 120 },
    bannerContent: { flex: 1, zIndex: 2 },
    bannerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    bannerText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 18 },
    bannerIcon: { position: 'absolute', right: -15, bottom: -15, zIndex: 1 },

    bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 90, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 25, borderTopWidth: 1, zIndex: 10 },
    navItem: { alignItems: 'center', width: 60 },
    navLab: { fontSize: 11, fontWeight: '600', marginTop: 4 },
    centerNavBtn: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginTop: -40, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8, borderWidth: 5 }
});

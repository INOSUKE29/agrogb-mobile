import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar as RNStatusBar, Image, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getDashboardStats } from '../database/database';
import FundoAnimado from '../components/FundoAnimado';

const { width } = Dimensions.get('window');

const MENU_COLORS = {
    caderno: '#00FF9D', colheita: '#34D399', vendas: '#FBBF24', estoque: '#3B82F6',
    monitoramento: '#A855F7', adubacao: '#06B6D4', compras: '#F87171', encomendas: '#FB923C',
    plantio: '#10B981', custos: '#EF4444', descarte: '#94A3B8', frota: '#6366F1',
    relatorios: '#EC4899', cadastros: '#14B8A6', clientes: '#F472B6', areas: '#2DD4BF', sync: '#00FF9D'
};

const MAIN_MENU = [
    { id: "caderno", label: "Caderno", icon: "book-outline", screen: "CadernoCampo" },
    { id: "colheita", label: "Colheita", icon: "leaf-outline", screen: "Colheita" },
    { id: "monitoramento", label: "Monitorar", icon: "camera-outline", screen: "Monitoramento" },
    { id: "adubacao", label: "Adubação", icon: "flask-outline", screen: "AdubacaoList" },
    { id: "plantio", label: "Plantio", icon: "nutrition-outline", screen: "Plantio" },
    { id: "descarte", label: "Descarte", icon: "trash-outline", screen: "Descarte" },
    { id: "vendas", label: "Vendas", icon: "cash-outline", screen: "Vendas" },
    { id: "compras", label: "Compras", icon: "cart-outline", screen: "Compras" },
    { id: "encomendas", label: "Entregas", icon: "clipboard-outline", screen: "Encomendas" },
    { id: "estoque", label: "Estoque", icon: "cube-outline", screen: "Estoque" },
    { id: "custos", label: "Custos", icon: "calculator-outline", screen: "Custos" },
    { id: "frota", label: "Frota", icon: "car-sport-outline", screen: "Frota" },
    { id: "relatorios", label: "Relatórios", icon: "pie-chart-outline", screen: "Relatorios" },
    { id: "cadastros", label: "Cadastros", icon: "create-outline", screen: "Cadastro" },
    { id: "areas", label: "Fazendas", icon: "map-outline", screen: "Culturas" },
    { id: "sync", label: "Sincronia", icon: "cloud-upload-outline", screen: "Sync" }
];

export default function HomeScreen({ navigation }) {
    const [stats, setStats] = useState({ vendasHoje: 0, colheitaHoje: 0 });

    useFocusEffect(useCallback(() => {
        const fetch = async () => { try { const d = await getDashboardStats(); if(d) setStats(d); } catch(e){} };
        fetch();
    }, []));

    const StatCard = ({ icon, label, val, sub, color = '#00FF9D' }) => (
        <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
                <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon} size={18} color={color} />
                </View>
                <Text style={styles.statLabel}>{label}</Text>
            </View>
            <Text style={styles.statVal}>{val}</Text>
            <Text style={styles.statSub}>{sub}</Text>
        </View>
    );

    return (
        <FundoAnimado>
            <RNStatusBar barStyle="light-content" translucent />
            
            {/* TOP BAR LUXO */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.roundBtn}>
                    <Ionicons name="person-circle-outline" size={30} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.logoBox}>
                    <Image source={require('../../assets/logo.png')} style={styles.megaLogo} />
                    <Text style={styles.brandTitle}>AgroGB</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Sync')} style={styles.roundBtn}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>
            <Text style={styles.slogan}>Inteligência no campo</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                
                {/* 🛰 DASHBOARD HORIZONTAL PRO */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dashScroll}>
                    <StatCard icon="sunny" label="Previsão" val="25°C" sub="Sol entre nuvens" />
                    <StatCard icon="analytics" label="Plantio" val="10.62 ha" sub="Safra 2026/01" color="#34D399" />
                    <StatCard icon="wallet" label="Financeiro" val={`R$ ${stats.vendasHoje || '0'}`} sub="Vendas de hoje" color="#FBBF24" />
                    <StatCard icon="alert-circle" label="Alertas" val="3 Ativos" sub="Ver pendências" color="#EF4444" />
                </ScrollView>

                <View style={styles.menuContainer}>
                    <View style={styles.grid}>
                        {MAIN_MENU.map((item) => {
                            const accent = MENU_COLORS[item.id] || '#00FF9D';
                            return (
                                <TouchableOpacity key={item.id} style={styles.menuBtn} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.7}>
                                    <View style={styles.iconSquare}>
                                        <Ionicons name={item.icon} size={28} color={accent} />
                                    </View>
                                    <Text style={styles.menuLabel}>{item.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerTxt}>Versão Ouro • 2026.04</Text>
                </View>
            </ScrollView>
        </FundoAnimado>
    );
}

const styles = StyleSheet.create({
    scroll: { paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 40, marginBottom: 5 },
    roundBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    logoBox: { flexDirection: 'row', alignItems: 'center' },
    megaLogo: { width: 100, height: 100, marginRight: 10 },
    brandTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
    slogan: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '800', marginTop: -20, marginBottom: 20 },

    dashScroll: { paddingHorizontal: 20, gap: 15, marginBottom: 35 },
    statCard: { 
        width: 160, 
        backgroundColor: 'rgba(255,255,255,0.06)', 
        borderRadius: 25, 
        padding: 18, 
        borderWidth: 1, 
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10
    },
    statCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    statIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    statVal: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    statSub: { color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 2, fontWeight: 'bold' },

    menuContainer: { paddingHorizontal: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    menuBtn: { width: '31%', alignItems: 'center', marginBottom: 25 },
    iconSquare: { 
        width: 65, 
        height: 65, 
        borderRadius: 22, 
        backgroundColor: '#FFF', 
        justifyContent: 'center', 
        alignItems: 'center',
        shadowColor: '#00FF9D',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10
    },
    menuLabel: { color: '#FFF', fontSize: 11, fontWeight: '800', marginTop: 10, textAlign: 'center' },

    footer: { marginTop: 40, alignItems: 'center' },
    footerTxt: { color: 'rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 'bold' }
});

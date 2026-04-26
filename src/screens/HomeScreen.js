import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar as RNStatusBar, Dimensions, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';

const { width } = Dimensions.get('window');

const SECTIONS = [
    {
        title: 'PRODUÇÃO',
        items: [
            { id: 'caderno', label: 'Caderno', icon: 'book-open-variant', color: '#1B5E20' },
            { id: 'colheita', label: 'Colheita', icon: 'leaf', color: '#1B5E20' },
            { id: 'monitorar', label: 'Monitorar', icon: 'camera', color: '#1B5E20' },
            { id: 'adubacao', label: 'Adubação', icon: 'flask-outline', color: '#1B5E20' },
            { id: 'plantio', label: 'Plantio', icon: 'sprout', color: '#1B5E20' },
            { id: 'descarte', label: 'Descarte', icon: 'trash-can-outline', color: '#1B5E20' },
            { id: 'cadastros', label: 'Cadastros', icon: 'clipboard-edit-outline', color: '#1B5E20' },
        ]
    },
    {
        title: 'COMERCIAL',
        items: [
            { id: 'vendas', label: 'Vendas', icon: 'cash-multiple', color: '#1B5E20' },
            { id: 'compras', label: 'Compras', icon: 'cart-outline', color: '#1B5E20' },
            { id: 'encomendas', label: 'Encomendas', icon: 'clipboard-text-clock-outline', color: '#1B5E20' },
        ]
    },
    {
        title: 'CONTROLE',
        items: [
            { id: 'funcionarios', label: 'Funcionários', icon: 'account-group', color: '#1B5E20' },
            { id: 'maquinas', label: 'Máquinas', icon: 'tractor', color: '#1B5E20' },
            { id: 'relatorios', label: 'Relatórios', icon: 'chart-pie', color: '#1B5E20' },
        ]
    }
];

export default function HomeScreen({ navigation }) {
    const { isDarkMode } = useTheme();
    const [stats, setStats] = useState({ vendasHoje: 0, colheitaHoje: 0 });

    useFocusEffect(useCallback(() => {
        const fetch = async () => { try { const d = await getDashboardStats(); if (d) setStats(d); } catch (e) {} };
        fetch();
    }, []));

    const MenuItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.gridItem} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate(item.id === 'vendas' ? 'Financeiro' : item.id === 'cadastros' ? 'Cadastro' : item.id)}
        >
            <View style={styles.cardInternal}>
                <View style={styles.balloon}>
                    <MaterialCommunityIcons name={item.icon} size={30} color="#1B5E20" />
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" translucent />
            
            {/* HERDER MEGA LOGO (FIDELIDADE TOTAL) */}
            <LinearGradient
                colors={['#0F3D2E', '#1B5E20', 'transparent']}
                style={styles.header}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            >
                <View style={styles.topRow}>
                    <TouchableOpacity style={styles.circleBtn}>
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

                    <TouchableOpacity style={styles.circleBtn}>
                        <View style={styles.badge} />
                        <Ionicons name="notifications" size={26} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                {/* DASHBOARD CARD FLUTUANTE */}
                <View style={[styles.dashCard, styles.shadow]}>
                    <View style={styles.dashSec}>
                        <Ionicons name="sunny" size={32} color="#FDC010" />
                        <View style={styles.dashTxts}>
                            <Text style={styles.dashLab}>Clima</Text>
                            <Text style={styles.dashVal}>25°C</Text>
                            <Text style={styles.dashMeta}>Ensolarado</Text>
                        </View>
                    </View>
                    <View style={styles.vDivider} />
                    <View style={styles.dashSec}>
                        <MaterialCommunityIcons name="leaf" size={30} color="#4CAF50" />
                        <View style={styles.dashTxts}>
                            <Text style={[styles.dashLab, {color: '#4CAF50'}]}>Colheita</Text>
                            <Text style={styles.dashVal}>{stats.colheitaHoje || 0} kg</Text>
                            <Text style={styles.dashMeta}>Total colhido</Text>
                        </View>
                    </View>
                    <View style={styles.vDivider} />
                    <View style={styles.dashSec}>
                        <View style={styles.greenCircle}><MaterialCommunityIcons name="currency-usd" size={20} color="#FFF" /></View>
                        <View style={styles.dashTxts}>
                            <Text style={[styles.dashLab, {color: '#2E7D32'}]}>Vendas</Text>
                            <Text style={styles.dashVal}>R$ {stats.vendasHoje || '0,00'}</Text>
                            <Text style={styles.dashMeta}>Faturamento</Text>
                        </View>
                    </View>
                </View>

                {SECTIONS.map((sec, idx) => (
                    <View key={idx} style={styles.sectionWrap}>
                        <View style={styles.secHeader}>
                            <Text style={styles.secTitle}>{sec.title}</Text>
                            <TouchableOpacity><Text style={styles.verTudo}>Ver tudo {'>'}</Text></TouchableOpacity>
                        </View>
                        
                        {/* 🔥 GRID RIGIDAMENTE CONTROLADO EM 25% (4 COLUNAS) */}
                        <View style={styles.gridContainer}>
                            {sec.items.map((item, i) => <MenuItem key={i} item={item} />)}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* TAB BAR FIGMA PERFECT */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="home" size={26} color="#1B5E20" />
                    <Text style={[styles.navLab, {color: '#1B5E20'}]}>Início</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="leaf-outline" size={26} color="#90A4AE" />
                    <Text style={styles.navLab}>Atalhos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="settings-outline" size={26} color="#90A4AE" />
                    <Text style={styles.navLab}>Configurações</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { height: 260, paddingTop: 60, paddingHorizontal: 20 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    circleBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    brandingCenter: { alignItems: 'center' },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    megaLogo: { width: 85, height: 85, borderRadius: 22, shadowColor: '#FFF', shadowOpacity: 0.3, shadowRadius: 10 },
    brandTitle: { fontSize: 38, fontWeight: 'bold' },
    slogan: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: -2, fontWeight: '700' },
    badge: { position: 'absolute', top: 12, right: 12, width: 9, height: 9, borderRadius: 5, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#1B5E20', zIndex: 1 },

    scroll: { paddingHorizontal: 16, paddingBottom: 120 },
    dashCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 22, flexDirection: 'row', marginTop: -65, marginBottom: 25 },
    shadow: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    dashSec: { flex: 1, alignItems: 'center' },
    vDivider: { width: 1, height: 40, backgroundColor: '#F0F0F0', alignSelf: 'center' },
    dashTxts: { alignItems: 'center', marginTop: 10 },
    dashLab: { fontSize: 10, color: '#1B5E20', fontWeight: 'bold' },
    dashVal: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    dashMeta: { fontSize: 8, color: '#90A4AE', fontWeight: 'bold' },
    greenCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center' },

    sectionWrap: { marginTop: 30 },
    secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    secTitle: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20' },
    verTudo: { color: '#1B5E20', fontSize: 12, fontWeight: 'bold' },

    // 🔥 GRID RESTAURADO COM CATEGORIAS (4 COLUNAS)
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
    gridItem: { 
        width: '25%', // PARA PRESERVAR 4 COLUNAS EM QUALQUER DISPOSITIVO
        padding: 5,
        marginBottom: 10
    },
    cardInternal: {
        backgroundColor: '#FFF',
        borderRadius: 22,
        paddingVertical: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
    },
    balloon: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: 'rgba(27, 94, 32, 0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    itemLabel: { fontSize: 10, fontWeight: 'bold', color: '#455A64', textAlign: 'center' },

    bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 95, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 30, borderTopWidth: 1, borderColor: '#F5F5F5' },
    navItem: { alignItems: 'center' },
    navLab: { fontSize: 12, fontWeight: 'bold', color: '#90A4AE', marginTop: 5 }
});

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar as RNStatusBar, Dimensions, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';

const MENU_DATA = [
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
            style={styles.cardCell} 
            activeOpacity={0.7} 
            onPress={() => navigation.navigate(item.id === 'cadastros' ? 'Cadastro' : item.id)}
        >
            <View style={styles.cardInternal}>
                <View style={styles.balloon}>
                    <MaterialCommunityIcons name={item.icon} size={28} color="#1B5E20" />
                </View>
                <Text style={styles.cardLabel}>{item.label}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" translucent />
            
            {/* HERDER DEGRADÊ ATMOSFÉRICO (IDÊNTICO AO MOCKUP) */}
            <LinearGradient
                colors={['#0F3D2E', '#1B5E20', 'transparent']}
                style={styles.header}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            >
                <View style={styles.topRow}>
                    <TouchableOpacity style={styles.circleBtn}>
                        <Ionicons name="person-circle" size={32} color="#FFF" />
                    </TouchableOpacity>
                    
                    <View style={styles.branding}>
                        <View style={styles.logoBox}>
                            <Image source={require('../../assets/logo.png')} style={styles.logo} />
                            <Text style={styles.agroGBText}>
                                <Text style={{color: '#FFF'}}>Agro</Text>
                                <Text style={{color: '#81C784'}}>GB</Text>
                            </Text>
                        </View>
                        <Text style={styles.tagline}>Inteligência no campo</Text>
                    </View>

                    <TouchableOpacity style={styles.circleBtn}>
                        <View style={styles.notifBadge} />
                        <Ionicons name="notifications" size={26} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                {/* 💳 DASHBOARD CARD (REPLICADO 100%) */}
                <View style={styles.dashCard}>
                    <View style={styles.dashSection}>
                        <Ionicons name="sunny" size={28} color="#FDC010" />
                        <View style={styles.dashContent}>
                            <Text style={styles.dashTitle}>Clima</Text>
                            <Text style={styles.dashVal}>25°C</Text>
                            <Text style={styles.dashSub}>Ensolarado</Text>
                        </View>
                    </View>
                    <View style={styles.vLine} />
                    <View style={styles.dashSection}>
                        <MaterialCommunityIcons name="leaf" size={28} color="#4CAF50" />
                        <View style={styles.dashContent}>
                            <Text style={[styles.dashTitle, {color: '#4CAF50'}]}>Colheita</Text>
                            <Text style={styles.dashVal}>{stats.colheitaHoje || 0} kg</Text>
                            <Text style={styles.dashSub}>Total colhido</Text>
                        </View>
                    </View>
                    <View style={styles.vLine} />
                    <View style={styles.dashSection}>
                        <View style={styles.cashIcon}>
                            <MaterialCommunityIcons name="currency-usd" size={20} color="#FFF" />
                        </View>
                        <View style={styles.dashContent}>
                            <Text style={[styles.dashTitle, {color: '#2D6A4F'}]}>Vendas</Text>
                            <Text style={styles.dashVal}>R$ {stats.vendasHoje || '0,00'}</Text>
                            <Text style={styles.dashSub}>Faturamento</Text>
                        </View>
                    </View>
                </View>

                {MENU_DATA.map((section, idx) => (
                    <View key={idx} style={styles.sectionWrap}>
                        <View style={styles.secHeader}>
                            <Text style={styles.secTitle}>{section.title}</Text>
                            <TouchableOpacity><Text style={styles.seeAll}>Ver tudo {'>'}</Text></TouchableOpacity>
                        </View>
                        
                        {/* 🔥 GRID ULTRA RIGIDO (4 COLUNAS MOBILE-READY) */}
                        <View style={styles.menuGrid}>
                            {section.items.map((item, i) => <MenuItem key={i} item={item} />)}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* TAB BAR (3 ITENS IGUAL AO MOCKUP ORIGINAL) */}
            <View style={styles.tabBar}>
                <TouchableOpacity style={styles.tabItem}>
                    <Ionicons name="home" size={26} color="#1B5E20" />
                    <Text style={[styles.tabLabel, {color: '#1B5E20'}]}>Início</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem}>
                    <Ionicons name="leaf-outline" size={26} color="#90A4AE" />
                    <Text style={styles.tabLabel}>Atalhos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem}>
                    <Ionicons name="settings-outline" size={26} color="#90A4AE" />
                    <Text style={styles.tabLabel}>Configurações</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { height: 240, paddingTop: 60, paddingHorizontal: 20 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    circleBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    branding: { alignItems: 'center' },
    logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logo: { width: 42, height: 42, borderRadius: 10 },
    agroGBText: { fontSize: 28, fontWeight: 'bold' },
    tagline: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: -2 },
    notifBadge: { position: 'absolute', top: 12, right: 12, width: 9, height: 9, borderRadius: 5, backgroundColor: '#4CAF50', borderWidth: 1.5, borderColor: '#1B5E20', zIndex: 1 },

    scroll: { paddingHorizontal: 16, paddingBottom: 120 },
    
    dashCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 22,
        flexDirection: 'row',
        marginTop: -55,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
        marginBottom: 20
    },
    dashSection: { flex: 1, alignItems: 'center' },
    dashContent: { alignItems: 'center', marginTop: 10 },
    dashTitle: { fontSize: 10, color: '#1B5E20', fontWeight: 'bold' },
    dashVal: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    dashSub: { fontSize: 9, color: '#999', fontWeight: 'bold' },
    vLine: { width: 1, backgroundColor: '#F0F0F0', height: 40, alignSelf: 'center' },
    cashIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1B5E20', justifyContent: 'center', alignItems: 'center' },

    sectionWrap: { marginTop: 30 },
    secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    secTitle: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20' },
    seeAll: { color: '#1B5E20', fontSize: 12, fontWeight: 'bold' },

    // 🔥 GRID MOBILE-FIRST (ESTRATÉGIA DE CÉLULAS)
    menuGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        marginHorizontal: -5 
    },
    cardCell: { 
        width: '25%', // EXATAMENTE 4 COLUNAS EM QUALQUER DISPOSITIVO
        padding: 5,
        marginBottom: 10
    },
    cardInternal: {
        backgroundColor: '#FFF',
        borderRadius: 18,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    balloon: {
        backgroundColor: 'rgba(27, 94, 32, 0.06)',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    cardLabel: { fontSize: 10, fontWeight: 'bold', color: '#333', textAlign: 'center' },

    tabBar: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 90,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 25,
        borderTopWidth: 1,
        borderColor: '#F0F0F0'
    },
    tabItem: { alignItems: 'center' },
    tabLabel: { fontSize: 12, fontWeight: 'bold', color: '#90A4AE', marginTop: 4 }
});

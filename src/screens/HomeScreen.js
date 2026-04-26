import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar as RNStatusBar, Dimensions, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';

const MENU_DATA = [
    { title: 'PRODUÇÃO', items: [
        { id: 'caderno', label: 'Caderno', icon: 'book-open-variant', color: '#1B5E20' },
        { id: 'colheita', label: 'Colheita', icon: 'leaf', color: '#1B5E20' },
        { id: 'monitorar', label: 'Monitorar', icon: 'camera', color: '#1B5E20' },
        { id: 'adubacao', label: 'Adubação', icon: 'flask-outline', color: '#1B5E20' },
        { id: 'plantio', label: 'Plantio', icon: 'sprout', color: '#1B5E20' },
        { id: 'descarte', label: 'Descarte', icon: 'trash-can-outline', color: '#1B5E20' },
        { id: 'cadastros', label: 'Cadastros', icon: 'clipboard-edit-outline', color: '#1B5E20' },
    ]},
    { title: 'COMERCIAL', items: [
        { id: 'vendas', label: 'Vendas', icon: 'cash-multiple', color: '#1B5E20' },
        { id: 'compras', label: 'Compras', icon: 'cart-outline', color: '#1B5E20' },
        { id: 'encomendas', label: 'Encomendas', icon: 'clipboard-text-clock-outline', color: '#1B5E20' },
    ]},
    { title: 'CONTROLE', items: [
        { id: 'funcionarios', label: 'Funcionários', icon: 'account-group', color: '#1B5E20' },
        { id: 'maquinas', label: 'Máquinas', icon: 'tractor', color: '#1B5E20' },
        { id: 'relatorios', label: 'Relatórios', icon: 'chart-pie', color: '#1B5E20' },
    ]}
];

export default function HomeScreen({ navigation }) {
    const [stats, setStats] = useState({ vendasHoje: 0, colheitaHoje: 0 });

    useFocusEffect(useCallback(() => {
        const fetch = async () => { try { const d = await getDashboardStats(); if (d) setStats(d); } catch (e) {} };
        fetch();
    }, []));

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" translucent />
            
            {/* HEADER DESIGN ULTRA PREMIUM */}
            <LinearGradient
                colors={['#0F3D2E', '#1B5E20']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.roundIconBtn}>
                        <Ionicons name="person" size={24} color="#FFF" />
                    </TouchableOpacity>
                    
                    <View style={styles.brandBox}>
                        <View style={styles.logoRow}>
                            <Image source={require('../../assets/logo.png')} style={styles.megaLogo} />
                            <Text style={styles.logoText}>
                                <Text style={{color: '#FFF'}}>Agro</Text>
                                <Text style={{color: '#81C784'}}>GB</Text>
                            </Text>
                        </View>
                        <Text style={styles.slogan}>Inteligência no campo</Text>
                    </View>

                    <TouchableOpacity style={styles.roundIconBtn}>
                        <View style={styles.notifDot} />
                        <Ionicons name="notifications" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                {/* DASHBOARD CARD UNIFICADO (FLUTUANTE) */}
                <View style={styles.summaryCard}>
                    <View style={styles.sumItem}>
                        <Ionicons name="sunny" size={32} color="#FDC010" />
                        <View style={styles.sumTexts}>
                            <Text style={styles.sumTitle}>Clima</Text>
                            <Text style={styles.sumVal}>25°C</Text>
                            <Text style={styles.sumSub}>Ensolarado</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.sumItem}>
                        <MaterialCommunityIcons name="leaf" size={32} color="#4CAF50" />
                        <View style={styles.sumTexts}>
                            <Text style={styles.sumTitle}>Colheita</Text>
                            <Text style={styles.sumVal}>{stats.colheitaHoje || 0} kg</Text>
                            <Text style={styles.sumSub}>Total colhido</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.sumItem}>
                        <MaterialCommunityIcons name="currency-usd-circle" size={32} color="#2E7D32" />
                        <View style={styles.sumTexts}>
                            <Text style={styles.sumTitle}>Vendas</Text>
                            <Text style={styles.sumVal}>R$ {stats.vendasHoje?.toFixed(2) || '0,00'}</Text>
                            <Text style={styles.sumSub}>Faturamento</Text>
                        </View>
                    </View>
                </View>

                {MENU_DATA.map((section, idx) => (
                    <View key={idx} style={styles.sec}>
                        <View style={styles.secHeader}>
                            <Text style={styles.secTitle}>{section.title}</Text>
                            <TouchableOpacity><Text style={styles.verTudo}>Ver tudo {'>'}</Text></TouchableOpacity>
                        </View>
                        <View style={styles.grid}>
                            {section.items.map((item, i) => (
                                <TouchableOpacity key={i} style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate(item.id === 'cadastros' ? 'Cadastro' : item.id)}>
                                    <View style={styles.balloon}>
                                        <MaterialCommunityIcons name={item.icon} size={30} color="#1B5E20" />
                                    </View>
                                    <Text style={styles.label}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* TAB BAR (NAV) */}
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
    container: { flex: 1, backgroundColor: '#F5F7F8' },
    header: {
        paddingTop: 60,
        paddingBottom: 60,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    roundIconBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    brandBox: { alignItems: 'center' },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    megaLogo: { width: 45, height: 45, borderRadius: 12 },
    logoText: { fontSize: 32, fontWeight: 'bold', letterSpacing: -1 },
    slogan: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', marginTop: -2 },
    notifDot: { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50', zIndex: 1, borderWidth: 2, borderColor: '#1B5E20' },

    scroll: { paddingHorizontal: 16, paddingBottom: 120 },
    
    summaryCard: {
        backgroundColor: '#FFF',
        borderRadius: 25,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -45,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
        marginBottom: 20
    },
    sumItem: { flex: 1, alignItems: 'center' },
    sumTexts: { alignItems: 'center', marginTop: 10 },
    sumTitle: { fontSize: 11, color: '#1B5E20', fontWeight: 'bold' },
    sumVal: { fontSize: 18, fontWeight: 'bold', color: '#263238', marginVertical: 2 },
    sumSub: { fontSize: 10, color: '#90A4AE', fontWeight: '600' },
    divider: { width: 1, backgroundColor: '#F0F0F0', height: 45, alignSelf: 'center' },

    sec: { marginTop: 30 },
    secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    secTitle: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20' },
    verTudo: { color: '#1B5E20', fontSize: 13, fontWeight: 'bold' },

    // CORREÇÃO DO GRID: FLEX-DIRECTION ROW + FLEX-WRAP WRAP
    grid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'flex-start',
        marginHorizontal: -5 
    },
    card: { 
        width: '22.5%', // OBRIGA 4 COLUNAS EM QUALQUER TELA
        backgroundColor: '#FFF', 
        borderRadius: 22, 
        paddingVertical: 20, 
        alignItems: 'center', 
        marginBottom: 12,
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3
    },
    balloon: {
        backgroundColor: 'rgba(27, 94, 32, 0.08)',
        width: 55,
        height: 55,
        borderRadius: 27.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
    },
    label: { fontSize: 11, fontWeight: 'bold', color: '#455A64', textAlign: 'center' },

    tabBar: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: '#FFF',
        height: 100,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 35,
        borderTopWidth: 1,
        borderColor: '#F1F1F1',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 15
    },
    tabItem: { alignItems: 'center' },
    tabLabel: { fontSize: 12, fontWeight: 'bold', color: '#90A4AE', marginTop: 5 }
});

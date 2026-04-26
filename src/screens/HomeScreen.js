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

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" translucent />
            
            {/* 🌿 O DEGRADÊ ATMOSFÉRICO (IDÊNTICO AO MOCKUP) */}
            <LinearGradient
                colors={['#0F3D2E', '#1B5E20', 'transparent']}
                style={styles.atmosphereHeader}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.headerCircle}>
                        <Ionicons name="person" size={24} color="#FFF" />
                    </TouchableOpacity>
                    
                    <View style={styles.brandingCenter}>
                        <View style={styles.logoGroup}>
                            <View style={styles.logoGlow}>
                                <Image source={require('../../assets/logo.png')} style={styles.logoImg} />
                            </View>
                            <Text style={styles.agroGB}>
                                <Text style={{color: '#FFF'}}>Agro</Text>
                                <Text style={{color: '#66BB6A'}}>GB</Text>
                            </Text>
                        </View>
                        <Text style={styles.slogan}>Inteligência no campo</Text>
                    </View>

                    <TouchableOpacity style={styles.headerCircle}>
                        <View style={styles.notifAlert} />
                        <Ionicons name="notifications" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                {/* 💳 DASHBOARD CARD (REPLICA PIXEL-PERFECT) */}
                <View style={styles.dashboardCard}>
                    <View style={styles.dashSec}>
                        <Ionicons name="sunny" size={32} color="#FDC010" />
                        <View style={styles.dashTxts}>
                            <Text style={styles.dashLabel}>Clima</Text>
                            <Text style={styles.dashVal}>25°C</Text>
                            <Text style={styles.dashSub}>Ensolarado</Text>
                        </View>
                    </View>
                    
                    <View style={styles.vLine} />

                    <View style={styles.dashSec}>
                        <MaterialCommunityIcons name="leaf" size={32} color="#4CAF50" />
                        <View style={styles.dashTxts}>
                            <Text style={[styles.dashLabel, {color: '#4CAF50'}]}>Colheita</Text>
                            <Text style={styles.dashVal}>{stats.colheitaHoje || 0} kg</Text>
                            <Text style={styles.dashSub}>Total colhido</Text>
                        </View>
                    </View>

                    <View style={styles.vLine} />

                    <View style={styles.dashSec}>
                        <View style={styles.moneyCircle}>
                            <MaterialCommunityIcons name="currency-usd" size={20} color="#FFF" />
                        </View>
                        <View style={styles.dashTxts}>
                            <Text style={[styles.dashLabel, {color: '#2E7D32'}]}>Vendas</Text>
                            <Text style={styles.dashVal}>R$ {stats.vendasHoje || '0,00'}</Text>
                            <Text style={styles.dashSub}>Faturamento</Text>
                        </View>
                    </View>
                </View>

                {SECTIONS.map((sec, idx) => (
                    <View key={idx} style={styles.sectionWrap}>
                        <View style={styles.secHeader}>
                            <Text style={styles.secTitle}>{sec.title}</Text>
                            <TouchableOpacity><Text style={styles.verTudo}>Ver tudo {'>'}</Text></TouchableOpacity>
                        </View>
                        <View style={styles.grid}>
                            {sec.items.map((item, i) => (
                                <TouchableOpacity key={i} style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate(item.id === 'cadastros' ? 'Cadastro' : item.id)}>
                                    <View style={styles.balloon}>
                                        <MaterialCommunityIcons name={item.icon} size={32} color="#1B5E20" />
                                    </View>
                                    <Text style={styles.label}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* 📱 BOTTOM BAR (EXATAMENTE 3 ITENS COMO NO MOCKUP) */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.tabBtn}>
                    <Ionicons name="home" size={26} color="#1B5E20" />
                    <Text style={[styles.tabLabel, {color: '#1B5E20'}]}>Início</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBtn}>
                    <Ionicons name="leaf-outline" size={26} color="#90A4AE" />
                    <Text style={styles.tabLabel}>Atalhos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBtn}>
                    <Ionicons name="settings-outline" size={26} color="#90A4AE" />
                    <Text style={styles.tabLabel}>Configurações</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    atmosphereHeader: {
        height: 250,
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    brandingCenter: { alignItems: 'center' },
    logoGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoGlow: { shadowColor: '#FFF', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
    logoImg: { width: 45, height: 45, borderRadius: 12 },
    agroGB: { fontSize: 28, fontWeight: 'bold' },
    slogan: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: -2, fontWeight: '500' },
    notifAlert: { position: 'absolute', top: 12, right: 12, width: 9, height: 9, borderRadius: 5, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#1B5E20', zIndex: 1 },

    scroll: { paddingHorizontal: 18, paddingBottom: 110 },
    
    dashboardCard: {
        backgroundColor: '#FFF',
        borderRadius: 28,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -60, // FUNDO FLUTUANTE REAL
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
        marginBottom: 20
    },
    dashSec: { flex: 1, alignItems: 'center' },
    dashTxts: { alignItems: 'center', marginTop: 12 },
    dashLabel: { fontSize: 11, color: '#1B5E20', fontWeight: 'bold', marginBottom: 2 },
    dashVal: { fontSize: 18, fontWeight: 'bold', color: '#263238' },
    dashSub: { fontSize: 10, color: '#90A4AE', fontWeight: 'bold' },
    vLine: { width: 1, backgroundColor: '#F0F0F0', height: '80%', alignSelf: 'center' },
    moneyCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center' },

    sectionWrap: { marginTop: 30 },
    secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    secTitle: { fontSize: 17, fontWeight: 'bold', color: '#1B5E20' },
    verTudo: { color: '#1B5E20', fontSize: 13, fontWeight: 'bold' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginHorizontal: -5 },
    card: { 
        width: (width - 36 - 32) / 4, 
        backgroundColor: '#FFF', 
        borderRadius: 24, 
        paddingVertical: 22, 
        alignItems: 'center', 
        marginBottom: 12,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3
    },
    balloon: {
        backgroundColor: 'rgba(27, 94, 32, 0.06)',
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    label: { fontSize: 11, fontWeight: 'bold', color: '#455A64', textAlign: 'center' },

    bottomNav: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: '#FFF',
        height: 90,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 25,
        borderTopWidth: 1,
        borderColor: '#F5F5F5'
    },
    tabBtn: { alignItems: 'center' },
    tabLabel: { fontSize: 12, fontWeight: 'bold', color: '#90A4AE', marginTop: 5 }
});

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar as RNStatusBar, Dimensions, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';

const { width } = Dimensions.get('window');

const MENU_DATA = [
    { title: 'PRODUÇÃO', items: [
        { id: 'caderno', label: 'Caderno', icon: 'book-open-variant', color: '#2D6A4F' },
        { id: 'colheita', label: 'Colheita', icon: 'leaf', color: '#2D6A4F' },
        { id: 'monitorar', label: 'Monitorar', icon: 'camera', color: '#2D6A4F' },
        { id: 'adubacao', label: 'Adubação', icon: 'flask-outline', color: '#2D6A4F' },
        { id: 'plantio', label: 'Plantio', icon: 'sprout', color: '#2D6A4F' },
        { id: 'descarte', label: 'Descarte', icon: 'trash-can-outline', color: '#2D6A4F' },
        { id: 'cadastros', label: 'Cadastros', icon: 'clipboard-edit-outline', color: '#2D6A4F' },
    ]},
    { title: 'COMERCIAL', items: [
        { id: 'vendas', label: 'Vendas', icon: 'cash-multiple', color: '#2D6A4F' },
        { id: 'compras', label: 'Compras', icon: 'cart-outline', color: '#2D6A4F' },
        { id: 'encomendas', label: 'Encomendas', icon: 'clipboard-text-clock-outline', color: '#2D6A4F' },
    ]},
    { title: 'CONTROLE', items: [
        { id: 'funcionarios', label: 'Funcionários', icon: 'account-group', color: '#2D6A4F' },
        { id: 'maquinas', label: 'Máquinas', icon: 'tractor', color: '#2D6A4F' },
        { id: 'relatorios', label: 'Relatórios', icon: 'chart-pie', color: '#2D6A4F' },
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
            
            {/* HEADER CÊNICO (DEGRADÊ SUAVE IGUAL MOCKUP) */}
            <LinearGradient
                colors={['#0F3D2E', '#1B5E20', '#F5F6F7']} // Fundo que vaza para o branco
                style={styles.headerGradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.topBtn}>
                        <Ionicons name="person-circle" size={32} color="#FFF" />
                    </TouchableOpacity>
                    
                    <View style={styles.brandingCenter}>
                        <View style={styles.logoRow}>
                            <Image source={require('../../assets/logo.png')} style={styles.logoImg} />
                            <Text style={styles.brandTitle}>
                                <Text style={{color: '#FFF'}}>Agro</Text>
                                <Text style={{color: '#81C784'}}>GB</Text>
                            </Text>
                        </View>
                        <Text style={styles.brandSubtitle}>Inteligência no campo</Text>
                    </View>

                    <TouchableOpacity style={styles.topBtn}>
                        <View style={styles.notifBadge} />
                        <Ionicons name="notifications" size={28} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* DASHBOARD CARD (ESTILO PREMIUM COM CORES REAIS) */}
                <View style={styles.dashCard}>
                    <View style={styles.dashSec}>
                        <Ionicons name="sunny" size={30} color="#FDC010" />
                        <View style={styles.dashTxts}>
                            <Text style={styles.dashLabel}>Clima</Text>
                            <Text style={styles.dashVal}>25°C</Text>
                            <Text style={styles.dashSub}>Ensolarado</Text>
                        </View>
                    </View>
                    
                    <View style={styles.dashDivider} />

                    <View style={styles.dashSec}>
                        <MaterialCommunityIcons name="leaf" size={28} color="#4CAF50" />
                        <View style={styles.dashTxts}>
                            <Text style={styles.dashLabel}>Colheita</Text>
                            <Text style={styles.dashVal}>{stats.colheitaHoje || 0} kg</Text>
                            <Text style={styles.dashSub}>Total colhido</Text>
                        </View>
                    </View>

                    <View style={styles.dashDivider} />

                    <View style={styles.dashSec}>
                        <View style={styles.cashCircle}>
                            <MaterialCommunityIcons name="currency-usd" size={22} color="#FFF" />
                        </View>
                        <View style={styles.dashTxts}>
                            <Text style={styles.dashLabel}>Vendas</Text>
                            <Text style={styles.dashVal}>R$ {stats.vendasHoje?.toFixed(2) || '0,00'}</Text>
                            <Text style={styles.dashSub}>Faturamento</Text>
                        </View>
                    </View>
                </View>

                {MENU_DATA.map((section, idx) => (
                    <View key={idx} style={styles.sectionArea}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            <TouchableOpacity style={styles.verTudo}>
                                <Text style={styles.verTudoText}>Ver tudo</Text>
                                <Ionicons name="chevron-forward" size={14} color="#1B5E20" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.menuGrid}>
                            {section.items.map((item, i) => (
                                <TouchableOpacity key={i} style={styles.menuCard} activeOpacity={0.7} onPress={() => navigation.navigate(item.id === 'cadastros' ? 'Cadastro' : item.id)}>
                                    <View style={styles.iconBalloon}>
                                        <MaterialCommunityIcons name={item.icon} size={28} color="#1B5E20" />
                                    </View>
                                    <Text style={styles.menuLabelText}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* TAB BAR IPHONE (FIDELIDADE MÁXIMA) */}
            <View style={styles.fixedBottomNav}>
                <TouchableOpacity style={styles.tabBtn}>
                    <Ionicons name="home" size={24} color="#1B5E20" />
                    <Text style={[styles.tabLabel, {color: '#1B5E20'}]}>Início</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBtn}>
                    <Ionicons name="leaf-outline" size={24} color="#90A4AE" />
                    <Text style={styles.tabLabel}>Atalhos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBtn}>
                    <Ionicons name="settings-outline" size={24} color="#90A4AE" />
                    <Text style={styles.tabLabel}>Configurações</Text>
                </TouchableOpacity>
                {Platform.OS === 'ios' && <View style={styles.iosIndicator} />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6F7' },
    headerGradient: {
        height: 220,
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    topBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    brandingCenter: { alignItems: 'center' },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoImg: { width: 45, height: 45, borderRadius: 12 },
    brandTitle: { fontSize: 26, fontWeight: 'bold', letterSpacing: -0.5 },
    brandSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: -2, fontWeight: '500' },
    notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', zIndex: 1, borderWidth: 1.5, borderColor: '#1B5E20' },

    scrollContent: { paddingHorizontal: 16, paddingBottom: 110 },
    
    dashCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -45, // Efeito flutuante profundo
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
        marginBottom: 20
    },
    dashSec: { flex: 1, alignItems: 'center' },
    dashTxts: { alignItems: 'center', marginTop: 10 },
    dashLabel: { fontSize: 10, color: '#1B5E20', fontWeight: 'bold', marginBottom: 2 },
    dashVal: { fontSize: 16, fontWeight: 'bold', color: '#263238' },
    dashSub: { fontSize: 9, color: '#90A4AE', fontWeight: '600' },
    dashDivider: { width: 1, backgroundColor: '#ECEFF1', height: 40, alignSelf: 'center' },
    cashCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center' },

    sectionArea: { marginTop: 25 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1B5E20', letterSpacing: 0.5 },
    verTudo: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    verTudoText: { color: '#1B5E20', fontSize: 12, fontWeight: 'bold' },

    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginHorizontal: -5 },
    menuCard: { 
        width: (width - 32 - 40) / 4, 
        backgroundColor: '#FFF', 
        borderRadius: 20, 
        paddingVertical: 18, 
        alignItems: 'center', 
        marginBottom: 12,
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3
    },
    iconBalloon: {
        backgroundColor: 'rgba(46, 125, 50, 0.08)',
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
    },
    menuLabelText: { fontSize: 10, fontWeight: 'bold', color: '#455A64', textAlign: 'center' },

    fixedBottomNav: {
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
        borderColor: '#F1F1F1',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 15
    },
    tabBtn: { alignItems: 'center' },
    tabLabel: { fontSize: 11, fontWeight: 'bold', color: '#90A4AE', marginTop: 5 },
    iosIndicator: { position: 'absolute', bottom: 8, width: 140, height: 5, borderRadius: 3, backgroundColor: '#EEE' }
});

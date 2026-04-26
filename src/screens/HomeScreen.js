import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar as RNStatusBar, Dimensions, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';

const { width } = Dimensions.get('window');

const SECTIONS = [
    {
        title: 'PRODUÇÃO',
        items: [
            { id: 'caderno', label: 'Caderno', icon: 'book-open-outline', color: '#10B981' },
            { id: 'colheita', label: 'Colheita', icon: 'leaf-outline', color: '#1B5E20' },
            { id: 'monitorar', label: 'Monitorar', icon: 'camera-outline', color: '#8B5CF6' },
            { id: 'adubacao', label: 'Adubação', icon: 'flask-outline', color: '#3B82F6' },
            { id: 'plantio', label: 'Plantio', icon: 'sprout-outline', color: '#F59E0B' },
            { id: 'descarte', label: 'Descarte', icon: 'trash-can-outline', color: '#EF4444' },
            { id: 'cadastros', label: 'Cadastros', icon: 'clipboard-edit-outline', color: '#14B8A6' },
            { id: 'pragas', label: 'Pragas', icon: 'bug-outline', color: '#B91C1C' },
        ]
    },
    {
        title: 'COMERCIAL',
        items: [
            { id: 'vendas', label: 'Vendas', icon: 'cash-outline', color: '#059669' },
            { id: 'compras', label: 'Compras', icon: 'cart-outline', color: '#3B82F6' },
            { id: 'encomendas', label: 'Encomendas', icon: 'clipboard-text-outline', color: '#F472B6' },
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
            style={[styles.menuCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF' }]} 
            onPress={() => navigation.navigate(item.id === 'cadastros' ? 'Cadastro' : item.id === 'vendas' ? 'Financeiro' : item.id)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconBalloon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={26} color={item.color} />
            </View>
            <Text style={[styles.menuLabel, { color: isDarkMode ? '#FFF' : '#333' }]} numberOfLines={1}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#0D0D0D' : '#F5F6F7' }]}>
            <RNStatusBar barStyle="light-content" translucent />
            
            {/* HEADER DESIGN FIDELIDADE MÁXIMA */}
            <LinearGradient
                colors={isDarkMode ? ['#05150D', '#0D0D0D'] : ['#0D5C3E', '#166534']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.topBtn}>
                        <Ionicons name="person-circle" size={30} color="#FFF" />
                    </TouchableOpacity>
                    
                    <View style={styles.branding}>
                        <Image source={require('../../assets/logo.png')} style={styles.logoImg} />
                        <View style={styles.brandTexts}>
                            <Text style={styles.brandName}>
                                <Text style={{color: '#FFF'}}>Agro</Text>
                                <Text style={{color: '#4CAF50'}}>GB</Text>
                            </Text>
                            <Text style={styles.brandSub}>Inteligência no campo</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.topBtn}>
                        <View style={styles.dot} />
                        <Ionicons name="notifications-outline" size={26} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                {/* 💳 DASHBOARD FLUTUANTE PIXEL-PERFECT */}
                <View style={[styles.dashCard, { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFF' }]}>
                    <View style={styles.dashSec}>
                        <Ionicons name="sunny" size={28} color="#FFC107" />
                        <View style={styles.dashInfo}>
                            <Text style={styles.dashTitle}>Clima</Text>
                            <Text style={[styles.dashValue, {color: isDarkMode ? '#FFF' : '#000'}]}>25°C</Text>
                            <Text style={styles.dashMeta}>Ensolarado</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.dashSec}>
                        <Ionicons name="leaf" size={28} color="#4CAF50" />
                        <View style={styles.dashInfo}>
                            <Text style={[styles.dashTitle, {color: '#4CAF50'}]}>Colheita</Text>
                            <Text style={[styles.dashValue, {color: isDarkMode ? '#FFF' : '#000'}]}>{stats.colheitaHoje || 0} kg</Text>
                            <Text style={styles.dashMeta}>Total colhido</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.dashSec}>
                        <View style={styles.greenCircle}>
                            <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 18}}>$</Text>
                        </View>
                        <View style={styles.dashInfo}>
                            <Text style={[styles.dashTitle, {color: '#2E7D32'}]}>Vendas</Text>
                            <Text style={[styles.dashValue, {color: isDarkMode ? '#FFF' : '#000'}]}>R$ {stats.vendasHoje || '0,00'}</Text>
                            <Text style={styles.dashMeta}>Faturamento</Text>
                        </View>
                    </View>
                </View>

                {SECTIONS.map((section, idx) => (
                    <View key={idx} style={styles.sectionArea}>
                        <View style={styles.secHeader}>
                            <Text style={styles.secTitle}>{section.title}</Text>
                            <TouchableOpacity><Text style={styles.verTudoText}>Ver tudo {'>'}</Text></TouchableOpacity>
                        </View>
                        <View style={styles.grid}>
                            {section.items.map((item, i) => <MenuItem key={i} item={item} />)}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* BARRA DE NAVEGAÇÃO IPHONE (ESTILO DESIGNER) */}
            <View style={[styles.bottomBar, { backgroundColor: isDarkMode ? '#111' : '#FFF' }]}>
                <View style={styles.tabItem}>
                    <Ionicons name="home" size={24} color="#166534" />
                    <Text style={[styles.tabLabel, {color: '#166534'}]}>Início</Text>
                </View>
                <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Financeiro')}>
                    <Ionicons name="stats-chart-outline" size={24} color="#999" />
                    <Text style={styles.tabLabel}>Finanças</Text>
                </TouchableOpacity>
                <View style={[styles.fab, {backgroundColor: '#166534'}]}>
                    <Ionicons name="add" size={32} color="#FFF" />
                </View>
                <View style={styles.tabItem}>
                    <Ionicons name="pie-chart-outline" size={24} color="#999" />
                    <Text style={styles.tabLabel}>Relatórios</Text>
                </View>
                <View style={styles.tabItem}>
                    <Ionicons name="menu" size={24} color="#999" />
                    <Text style={styles.tabLabel}>Mais</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 60, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    topBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    branding: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoImg: { width: 42, height: 42, borderRadius: 12 },
    brandTexts: { justifyContent: 'center' },
    brandName: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    brandSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: -2 },
    dot: { position: 'absolute', top: 10, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: '#4CAF50', zIndex: 1, borderWidth: 2, borderColor: '#166534' },

    scroll: { paddingHorizontal: 16, paddingBottom: 110 },
    
    dashCard: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 22,
        marginTop: -35,
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 8,
        marginBottom: 20
    },
    dashSec: { flex: 1, alignItems: 'center' },
    dashInfo: { alignItems: 'center', marginTop: 8 },
    dashTitle: { fontSize: 10, color: '#166534', fontWeight: 'bold' },
    dashValue: { fontSize: 16, fontWeight: 'bold', marginVertical: 2 },
    dashMeta: { fontSize: 8, color: '#999', fontWeight: 'bold' },
    divider: { width: 1, height: 40, backgroundColor: '#F0F0F0', alignSelf: 'center' },
    greenCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center' },

    sectionArea: { marginTop: 25 },
    secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    secTitle: { fontSize: 15, fontWeight: 'bold', color: '#166534' },
    verTudoText: { color: '#166534', fontSize: 12, fontWeight: 'bold' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginHorizontal: -5 },
    menuCard: { 
        width: (width - 32 - 40) / 4, 
        borderRadius: 18, 
        paddingVertical: 18, 
        alignItems: 'center', 
        marginBottom: 12,
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    iconBalloon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    menuLabel: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' },

    bottomBar: { 
        position: 'absolute', bottom: 0, width: '100%', height: 95, 
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
        paddingBottom: 30, borderTopWidth: 1, borderColor: '#F0F0F0',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15
    },
    tabItem: { alignItems: 'center' },
    tabLabel: { fontSize: 11, fontWeight: 'bold', color: '#999', marginTop: 4 },
    fab: { width: 55, height: 55, borderRadius: 28, marginTop: -40, justifyContent: 'center', alignItems: 'center', shadowColor: '#166534', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }
});

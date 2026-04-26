import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar as RNStatusBar, Image, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getDashboardStats } from '../database/database';
import FundoAnimado from '../components/FundoAnimado';

const { width } = Dimensions.get('window');

const MENU_DATA = [
    { id: "caderno", label: "Caderno", icon: "book-outline", color: "#10B981", cat: 'PRODUÇÃO' },
    { id: "colheita", label: "Colheita", icon: "leaf-outline", color: "#34D399", cat: 'PRODUÇÃO' },
    { id: "monitoramento", label: "Monitorar", icon: "camera-outline", color: "#8B5CF6", cat: 'PRODUÇÃO' },
    { id: "adubacao", label: "Adubação", icon: "flask-outline", color: "#3B82F6", cat: 'PRODUÇÃO' },
    { id: "plantio", label: "Plantio", icon: "nutrition-outline", color: "#F59E0B", cat: 'PRODUÇÃO' },
    { id: "descarte", label: "Descarte", icon: "trash-outline", color: "#EF4444", cat: 'PRODUÇÃO' },
    { id: "cadastros", label: "Cadastros", icon: "create-outline", color: "#10B981", cat: 'PRODUÇÃO' },
    { id: "vendas", label: "Vendas", icon: "cash-outline", color: "#FBBF24", cat: 'COMERCIAL' },
    { id: "compras", label: "Compras", icon: "cart-outline", color: "#3B82F6", cat: 'COMERCIAL' },
    { id: "encomendas", label: "Encomendas", icon: "clipboard-outline", color: "#F472B6", cat: 'COMERCIAL' },
    { id: "estoque", label: "Estoque", icon: "cube-outline", color: "#6366F1", cat: 'CONTROLE' },
    { id: "custos", label: "Custos", icon: "calculator-outline", color: "#EF4444", cat: 'CONTROLE' },
    { id: "frota", label: "Frota", icon: "car-sport-outline", color: "#3B82F6", cat: 'CONTROLE' },
    { id: "relatorios", label: "Relatórios", icon: "pie-chart-outline", color: "#A855F7", cat: 'CONTROLE' },
    { id: "clientes", label: "Clientes", icon: "people-outline", color: "#F472B6", cat: 'SISTEMA' },
    { id: "areas", label: "Áreas", icon: "map-outline", color: "#10B981", cat: 'SISTEMA' },
    { id: "sync", label: "Sync", icon: "cloud-upload-outline", color: "#14B8A6", cat: 'SISTEMA' }
];

export default function HomeScreen({ navigation }) {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const [stats, setStats] = useState({ vendasHoje: 0, colheitaHoje: 0 });

    useFocusEffect(useCallback(() => {
        const fetch = async () => { try { const d = await getDashboardStats(); if(d) setStats(d); } catch(e){} };
        fetch();
    }, []));

    const renderGrid = (category) => (
        <View style={styles.grid}>
            {MENU_DATA.filter(item => item.cat === category).map(item => (
                <TouchableOpacity key={item.id} style={styles.item} onPress={() => navigation.navigate(item.id === 'sync' ? 'Sync' : item.id === 'cadastros' ? 'Cadastro' : item.id)}>
                    <View style={[styles.ball, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FFF' }]}>
                        <Ionicons name={item.icon} size={28} color={item.color} />
                    </View>
                    <Text style={[styles.label, { color: isDarkMode ? '#FFF' : '#374151' }]}>{item.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <FundoAnimado>
            <RNStatusBar barStyle="light-content" translucent />
            
            {/* HEADER DESIGN TOP */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => toggleTheme()}>
                    <Ionicons name={isDarkMode ? "sunny" : "person-circle"} size={30} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.branding}>
                    <Image source={require('../../assets/logo.png')} style={styles.logo} />
                    <View>
                        <Text style={styles.brand}>AgroGB</Text>
                        <Text style={styles.tagline}>Inteligência no campo</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Sync')}>
                    <Ionicons name="notifications-outline" size={26} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                
                {/* FLOATING GLASS DASHBOARD */}
                <View style={[styles.dashCard, { backgroundColor: '#FFF' }]}>
                    <View style={styles.dashItem}>
                        <Ionicons name="sunny" size={24} color="#FBBF24" />
                        <View style={styles.dashTextCol}>
                            <Text style={styles.dashLabel}>Clima</Text>
                            <Text style={styles.dashValue}>25°C</Text>
                            <Text style={styles.dashSub}>Ensolarado</Text>
                        </View>
                    </View>
                    <View style={styles.vertLine} />
                    <View style={styles.dashItem}>
                        <Ionicons name="leaf" size={24} color="#10B981" />
                        <View style={styles.dashTextCol}>
                            <Text style={styles.dashLabel}>Colheita</Text>
                            <Text style={styles.dashValue}>{stats.colheitaHoje || 0} kg</Text>
                            <Text style={styles.dashSub}>Total colhido</Text>
                        </View>
                    </View>
                    <View style={styles.vertLine} />
                    <View style={styles.dashItem}>
                        <Ionicons name="cash" size={24} color="#10B981" />
                        <View style={styles.dashTextCol}>
                            <Text style={styles.dashLabel}>Vendas</Text>
                            <Text style={styles.dashValue}>R$ {stats.vendasHoje || 0}</Text>
                            <Text style={styles.dashSub}>Faturamento</Text>
                        </View>
                    </View>
                </View>

                {['PRODUÇÃO', 'COMERCIAL', 'CONTROLE', 'SISTEMA'].map(cat => (
                    <View key={cat} style={styles.section}>
                        <View style={styles.secHeader}>
                            <Text style={[styles.secTitle, { color: isDarkMode ? '#10B981' : '#166534' }]}>{cat}</Text>
                            <TouchableOpacity><Text style={styles.verTudo}>Ver tudo {'>'}</Text></TouchableOpacity>
                        </View>
                        {renderGrid(cat)}
                    </View>
                ))}
            </ScrollView>

            {/* BOTTOM NAV BAR (ESTILO IPHONE) */}
            <View style={[styles.bottomNav, { backgroundColor: isDarkMode ? '#111' : '#FFF' }]}>
                <View style={styles.navItem}>
                    <Ionicons name="home" size={24} color="#10B981" />
                    <Text style={styles.navTextActive}>Início</Text>
                </View>
                <View style={styles.navItem}>
                    <Ionicons name="leaf-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.navText}>Atalhos</Text>
                </View>
                <View style={styles.navItem}>
                    <Ionicons name="settings-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.navText}>Configs</Text>
                </View>
            </View>
        </FundoAnimado>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 20, paddingTop: 10, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, marginBottom: 20 },
    headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    branding: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logo: { width: 55, height: 55 },
    brand: { color: '#FFF', fontSize: 24, fontWeight: '900' },
    tagline: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '500' },

    dashCard: { 
        flexDirection: 'row', 
        padding: 20, 
        borderRadius: 25, 
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
        marginBottom: 30
    },
    dashItem: { flex: 1, alignItems: 'center' },
    dashTextCol: { alignItems: 'center', marginTop: 8 },
    dashLabel: { fontSize: 9, fontWeight: 'bold', color: '#059669' },
    dashValue: { fontSize: 18, fontWeight: '900', color: '#1F2937', marginVertical: 2 },
    dashSub: { fontSize: 8, color: '#9CA3AF', fontWeight: 'bold' },
    vertLine: { width: 1, height: '80%', backgroundColor: '#F3F4F6' },

    section: { marginBottom: 30 },
    secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    secTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    verTudo: { fontSize: 10, color: '#10B981', fontWeight: 'bold' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    item: { width: '22%', alignItems: 'center', marginBottom: 20 },
    ball: { 
        width: 68, 
        height: 68, 
        borderRadius: 20, 
        justifyContent: 'center', 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3
    },
    label: { fontSize: 10, fontWeight: '800', marginTop: 8, textAlign: 'center' },

    bottomNav: { 
        flexDirection: 'row', 
        height: 85, 
        paddingBottom: 25, 
        borderTopWidth: 1, 
        borderColor: 'rgba(0,0,0,0.05)', 
        justifyContent: 'space-around', 
        alignItems: 'center' 
    },
    navItem: { alignItems: 'center' },
    navText: { fontSize: 10, color: '#9CA3AF', marginTop: 4, fontWeight: '700' },
    navTextActive: { fontSize: 10, color: '#10B981', marginTop: 4, fontWeight: '900' }
});

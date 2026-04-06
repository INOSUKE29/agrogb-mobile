import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, StatusBar, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const navigation = useNavigation();
    const { isDark, setTheme } = useTheme();

    return (
        <View style={styles.webContainer}>
            <LinearGradient 
                colors={['#1c2921', '#111b15', '#09100c']} 
                style={StyleSheet.absoluteFill}
            />
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <View style={styles.mobileFrame}>
                <SafeAreaView style={{ flex: 1 }}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollArea}>
                        
                        {/* HEADER */}
                        <View style={styles.header}>
                            <View style={styles.headerTop}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Image source={require('../../assets/logo.png')} style={{width: 32, height: 32, marginRight: 10}} resizeMode="contain" />
                                    <View>
                                        <Text style={styles.greeting}>Olá, Bruno</Text>
                                        <Text style={styles.subtext}>SISTEMA DE GESTÃO</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
                                    <TouchableOpacity onPress={() => setTheme(isDark ? 'light' : 'dark')}>
                                        <Ionicons name={isDark ? "sunny" : "moon"} size={26} color="#D1FAE5" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                                        <Ionicons name="menu-outline" size={30} color="#D1FAE5" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* RESUMO MENSAL CARD */}
                        <View style={styles.glassCard}>
                            <View style={styles.cardTop}>
                                <Text style={styles.glassTitle}>RESUMO MENSAL</Text>
                                <Ionicons name="stats-chart" size={16} color="#A7F3D0" />
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.statCol}>
                                    <View style={styles.statLabelRow}>
                                        <View style={[styles.dot, { backgroundColor: '#34D399' }]} />
                                        <Text style={styles.statLabel}>TOTAL VENDAS</Text>
                                    </View>
                                    <Text style={styles.statValuePositive}>R$ 5.000</Text>
                                </View>
                                <View style={styles.statCol}>
                                    <View style={styles.statLabelRow}>
                                        <View style={[styles.dot, { backgroundColor: '#F87171' }]} />
                                        <Text style={styles.statLabel}>CUSTOS TOTAIS</Text>
                                    </View>
                                    <Text style={styles.statValueNegative}>R$ 3.000</Text>
                                </View>
                            </View>
                            <Text style={styles.cardFooter}>PERDAS (MÊS): <Text style={styles.cardFooterBold}>0 kg</Text></Text>
                        </View>

                        {/* 3 RETÂNGULOS DE AÇÃO (REGISTRAR) */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#224a32' }]} onPress={() => navigation.navigate('Vendas')}>
                                <Text style={styles.actionBtnText}>+ Registrar{"\n"}Venda</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4a4422' }]} onPress={() => navigation.navigate('Custos')}>
                                <Text style={styles.actionBtnText}>+ Registrar{"\n"}Custo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2d3b32' }]} onPress={() => navigation.navigate('Colheita')}>
                                <Text style={styles.actionBtnText}>+ Registrar{"\n"}Colheita</Text>
                            </TouchableOpacity>
                        </View>

                        {/* SECTIONS & GRID COM BOTÕES PÍLULA */}
                        {/* GESTÃO OPERACIONAL */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.verticalBar} />
                                <Text style={styles.sectionTitle}>GESTÃO OPERACIONAL</Text>
                            </View>
                            <View style={styles.grid}>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('CadernoCampo')}>
                                    <Ionicons name="book-outline" size={18} color="#15803d" />
                                    <Text style={styles.pillText}>Caderno</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Colheita')}>
                                    <Ionicons name="leaf-outline" size={18} color="#15803d" />
                                    <Text style={styles.pillText}>Colheita</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Plantio')}>
                                    <Ionicons name="flower-outline" size={18} color="#15803d" />
                                    <Text style={styles.pillText}>Plantio</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Monitoramento')}>
                                    <Ionicons name="eye-outline" size={18} color="#15803d" />
                                    <Text style={styles.pillText}>Monitorar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Estoque')}>
                                    <Ionicons name="cube-outline" size={18} color="#15803d" />
                                    <Text style={styles.pillText}>Estoque</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('MenuCadastros')}>
                                    <Ionicons name="list-outline" size={18} color="#15803d" />
                                    <Text style={styles.pillText}>Cadastros</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('AdubacaoList')}>
                                    <Ionicons name="flask-outline" size={18} color="#15803d" />
                                    <Text style={styles.pillText}>Adubação</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* COMERCIAL & FINANÇAS */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.verticalBar, {backgroundColor: '#60A5FA'}]} />
                                <Text style={styles.sectionTitle}>FINANÇAS & COMERCIAL</Text>
                            </View>
                            <View style={styles.grid}>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Vendas')}>
                                    <Ionicons name="cart-outline" size={18} color="#1d4ed8" />
                                    <Text style={[styles.pillText, {color: '#1e3a8a'}]}>Vendas</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Compras')}>
                                    <Ionicons name="basket-outline" size={18} color="#1d4ed8" />
                                    <Text style={[styles.pillText, {color: '#1e3a8a'}]}>Compras</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Custos')}>
                                    <Ionicons name="wallet-outline" size={18} color="#1d4ed8" />
                                    <Text style={[styles.pillText, {color: '#1e3a8a'}]}>Lançar Custo</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('CategoriasDespesa')}>
                                    <Ionicons name="pricetags-outline" size={18} color="#1d4ed8" />
                                    <Text style={[styles.pillText, {color: '#1e3a8a'}]}>Categorias</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('FinancialAccounts')}>
                                    <Ionicons name="business-outline" size={18} color="#1d4ed8" />
                                    <Text style={[styles.pillText, {color: '#1e3a8a'}]}>Contas / Bancos</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Clientes')}>
                                    <Ionicons name="people-outline" size={18} color="#1d4ed8" />
                                    <Text style={[styles.pillText, {color: '#1e3a8a'}]}>Clientes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Encomendas')}>
                                    <Ionicons name="gift-outline" size={18} color="#1d4ed8" />
                                    <Text style={[styles.pillText, {color: '#1e3a8a'}]}>Encomendas</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Relatorios')}>
                                    <Ionicons name="bar-chart-outline" size={18} color="#1d4ed8" />
                                    <Text style={[styles.pillText, {color: '#1e3a8a'}]}>Relatórios</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* SISTEMA & FROTA */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.verticalBar, {backgroundColor: '#A78BFA'}]} />
                                <Text style={styles.sectionTitle}>SISTEMA & FROTA</Text>
                            </View>
                            <View style={styles.grid}>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Frota')}>
                                    <Ionicons name="bus-outline" size={18} color="#4c1d95" />
                                    <Text style={[styles.pillText, {color: '#4c1d95'}]}>Frota</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Scanner')}>
                                    <Ionicons name="camera-outline" size={18} color="#4c1d95" />
                                    <Text style={[styles.pillText, {color: '#4c1d95'}]}>Scanner</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Culturas')}>
                                    <Ionicons name="map-outline" size={18} color="#4c1d95" />
                                    <Text style={[styles.pillText, {color: '#4c1d95'}]}>Culturas</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Usuarios')}>
                                    <Ionicons name="people-circle-outline" size={18} color="#4c1d95" />
                                    <Text style={[styles.pillText, {color: '#4c1d95'}]}>Equipe</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Sync')}>
                                    <Ionicons name="sync-outline" size={18} color="#4c1d95" />
                                    <Text style={[styles.pillText, {color: '#4c1d95'}]}>Sincronizar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pillBtn} onPress={() => navigation.navigate('Settings')}>
                                    <Ionicons name="settings-outline" size={18} color="#4c1d95" />
                                    <Text style={[styles.pillText, {color: '#4c1d95'}]}>Ajustes</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                    </ScrollView>

                    {/* BOTTOM NAVIGATION FIXED */}
                    <View style={styles.bottomNav}>
                        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
                            <Ionicons name="home" size={24} color="#A3E635" />
                            <Text style={[styles.navText, { color: '#A3E635' }]}>Home</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Relatorios')}>
                            <Ionicons name="bar-chart-outline" size={24} color="#9CA3AF" />
                            <Text style={styles.navText}>Relatórios</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Sync')}>
                            <Ionicons name="refresh-outline" size={24} color="#9CA3AF" />
                            <Text style={styles.navText}>Sync</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
                            <Ionicons name="person-outline" size={24} color="#9CA3AF" />
                            <Text style={styles.navText}>Perfil</Text>
                        </TouchableOpacity>
                    </View>

                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    webContainer: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#000',
    },
    mobileFrame: {
        flex: 1,
        width: '100%',
        maxWidth: 480, 
        position: 'relative',
    },
    scrollArea: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
        paddingBottom: 120,
    },
    header: { marginBottom: 25 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 24, fontWeight: '700', color: '#FFF' },
    subtext: { fontSize: 10, color: '#34D399', fontWeight: 'bold', letterSpacing: 1.5, marginTop: 2 },

    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    glassTitle: { color: '#A7F3D0', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
    
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statCol: { flex: 1 },
    statLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statLabel: { color: '#D1FAE5', fontSize: 10, fontWeight: 'bold' },
    statValuePositive: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
    statValueNegative: { color: '#FCD34D', fontSize: 26, fontWeight: 'bold' },
    
    cardFooter: { color: '#9CA3AF', fontSize: 11, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15 },
    cardFooterBold: { color: '#FFF', fontWeight: 'bold' },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, gap: 8 },
    actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18 },

    section: { marginBottom: 25 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    verticalBar: { width: 4, height: 16, backgroundColor: '#86EFAC', borderRadius: 2, marginRight: 10 },
    sectionTitle: { color: '#D1FAE5', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
    pillBtn: { width: '48%', backgroundColor: '#D1FAE5', paddingVertical: 14, paddingHorizontal: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
    pillText: { color: '#064E3B', fontSize: 14, fontWeight: 'bold' },

    bottomNav: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#0a100d',
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
        paddingVertical: Platform.OS === 'android' ? 15 : 25,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
        borderTopLeftRadius: 25, borderTopRightRadius: 25
    },
    navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    navText: { color: '#9CA3AF', fontSize: 10, marginTop: 5, fontWeight: '600' }
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAnalytics } from '../modules/analytics/hooks/useAnalytics';
import DashboardContent from '../ui/components/DashboardContent';

const { width } = Dimensions.get('window');

/**
 * HomeScreen - AgroGB Diamond Pro 2026 💎
 * Arquitetura em Camadas: UI (esta tela) consome o Hook (Lógica).
 */
export default function HomeScreen() {
    const navigation = useNavigation();
    const { isDark, setTheme } = useTheme();
    const analytics = useAnalytics();

    return (
        <View style={styles.webContainer}>
            <LinearGradient 
                colors={['#1c2921', '#111b15', '#09100c']} 
                style={StyleSheet.absoluteFill}
            />
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <View style={styles.mobileFrame}>
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Image source={require('../../assets/logo.png')} style={{width: 32, height: 32, marginRight: 10}} resizeMode="contain" />
                                <View>
                                    <Text style={styles.greeting}>Olá, Produtor</Text>
                                    <Text style={styles.subtext}>AGROGB DIAMOND PRO</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => setTheme(isDark ? 'light' : 'dark')}>
                                    <Ionicons name={isDark ? "sunny" : "moon"} size={26} color="#A3E635" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                                    <Ionicons name="menu-outline" size={30} color="#A3E635" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <ScrollView 
                        showsVerticalScrollIndicator={false} 
                        contentContainerStyle={styles.scrollArea}
                        refreshControl={
                            <RefreshControl 
                                refreshing={analytics.refreshing} 
                                onRefresh={analytics.refresh} 
                                tintColor="#A3E635"
                            />
                        }
                    >
                        <DashboardContent data={analytics} />

                        {/* INTELIGÊNCIA & ESTRATÉGIA */}
                        <View style={styles.quickAccess}>
                            <Text style={styles.sectionLabel}>INTELIGÊNCIA & ESTRATÉGIA</Text>
                            <View style={styles.gridRow}>
                                <QuickBtn icon="bulb" label="IA Agro" color="#FCD34D" onPress={() => navigation.navigate('Intelligence')} />
                                <QuickBtn icon="bar-chart" label="BI Geral" color="#3B82F6" onPress={() => navigation.navigate('Relatorios')} />
                                <QuickBtn icon="analytics" label="Gráficos" color="#8B5CF6" onPress={() => navigation.navigate('Graficos')} />
                                <QuickBtn icon="leaf" label="Planos" color="#A3E635" onPress={() => navigation.navigate('AdubacaoList')} />
                            </View>
                        </View>

                        {/* GESTÃO OPERACIONAL */}
                        <View style={styles.quickAccess}>
                            <Text style={styles.sectionLabel}>GESTÃO OPERACIONAL</Text>
                            <View style={styles.gridRow}>
                                <QuickBtn icon="seedling" label="Plantio" color="#10B981" onPress={() => navigation.navigate('Plantio')} />
                                <QuickBtn icon="calendar" label="Monitor" color="#3B82F6" onPress={() => navigation.navigate('Monitoramento')} />
                                <QuickBtn icon="basket" label="Colheita" color="#F59E0B" onPress={() => navigation.navigate('Colheita')} />
                                <QuickBtn icon="cube" label="Estoque" color="#6366F1" onPress={() => navigation.navigate('Estoque')} />
                            </View>
                            <View style={[styles.gridRow, { marginTop: 15 }]}>
                                <QuickBtn icon="cart" label="Compras" color="#EC4899" onPress={() => navigation.navigate('Compras')} />
                                <QuickBtn icon="cash" label="Vendas" color="#A3E635" onPress={() => navigation.navigate('Vendas')} />
                                <QuickBtn icon="wallet" label="Custos" color="#EF4444" onPress={() => navigation.navigate('Custos')} />
                                <QuickBtn icon="cube-outline" label="Encomendas" color="#14B8A6" onPress={() => navigation.navigate('Encomendas')} />
                            </View>
                        </View>

                        {/* ADMINISTRAÇÃO */}
                        <View style={styles.quickAccess}>
                            <Text style={styles.sectionLabel}>ADMINISTRAÇÃO</Text>
                            <View style={styles.gridRow}>
                                <QuickBtn icon="people" label="Clientes" color="#10B981" onPress={() => navigation.navigate('Cadastros')} />
                                <QuickBtn icon="document-text" label="Registro" color="#3B82F6" onPress={() => navigation.navigate('MenuCadastros')} />
                                <QuickBtn icon="car" label="Frota" color="#F59E0B" onPress={() => navigation.navigate('Frota')} />
                                <QuickBtn icon="book" label="Campo" color="#8B5CF6" onPress={() => navigation.navigate('CadernoCampo')} />
                            </View>
                        </View>
                        
                        <View style={{ height: 120 }} />
                    </ScrollView>

                    {/* BOTTOM NAV SIMULADO (Para visual de App Grande) */}
                    <View style={styles.bottomNav}>
                        <NavBtn icon="home" label="Início" active />
                        <NavBtn icon="stats-chart" label="BI" onPress={() => navigation.navigate('Relatorios')} />
                        <NavBtn icon="sync" label="Sinc" onPress={() => navigation.navigate('Sync')} />
                        <NavBtn icon="person" label="Perfil" onPress={() => navigation.navigate('Profile')} />
                    </View>
                </SafeAreaView>
            </View>
        </View>
    );
}

const QuickBtn = ({ icon, label, color, onPress }) => (
    <TouchableOpacity style={styles.qBtn} onPress={onPress}>
        <View style={[styles.qIconBg, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.qLabel}>{label}</Text>
    </TouchableOpacity>
);

const NavBtn = ({ icon, label, active, onPress }) => (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
        <Ionicons name={icon} size={24} color={active ? "#A3E635" : "rgba(255,255,255,0.4)"} />
        <Text style={[styles.navText, { color: active ? "#A3E635" : "rgba(255,255,255,0.4)" }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    webContainer: { flex: 1, backgroundColor: '#09100c' },
    mobileFrame: { flex: 1, width: '100%' },
    scrollArea: { paddingBottom: 120 },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    subtext: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5 },
    
    quickAccess: { paddingHorizontal: 20, marginTop: 10, marginBottom: 15 },
    sectionLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 15 },
    gridRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    qBtn: { alignItems: 'center', width: (width - 70) / 4 }, // Distributes 4 items equally
    qIconBg: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    qLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 'bold', textAlign: 'center' },

    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: '#09100c',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)'
    },
    navItem: { alignItems: 'center' },
    navText: { fontSize: 10, marginTop: 4, fontWeight: 'bold' }
});

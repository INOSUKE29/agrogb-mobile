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
                        <DashboardContent data={analytics}                        {/* BOTÕES DE AÇÃO RÁPIDA (Pills) */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionPillsRow}>
                            <TouchableOpacity style={styles.actionPill} onPress={() => navigation.navigate('Vendas')}>
                                <Ionicons name="add" size={16} color="#A3E635" />
                                <Text style={styles.actionPillText}>Registrar Venda</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionPill, styles.actionPillHighlight]} onPress={() => navigation.navigate('Custos')}>
                                <Ionicons name="add" size={16} color="#FFF" />
                                <Text style={[styles.actionPillText, { color: '#FFF' }]}>Registrar Custo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionPill} onPress={() => navigation.navigate('Colheita')}>
                                <Ionicons name="add" size={16} color="#A3E635" />
                                <Text style={styles.actionPillText}>Registrar Colheita</Text>
                            </TouchableOpacity>
                        </ScrollView>

                        {/* GESTÃO OPERACIONAL */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionTitleRow}>
                                <View style={styles.sectionTitleDash} />
                                <Text style={styles.sectionTitle}>GESTÃO OPERACIONAL</Text>
                            </View>
                            <View style={styles.bigGridRow}>
                                <BigCard icon="leaf" label="Plantio" color="#10B981" onPress={() => navigation.navigate('Plantio')} />
                                <BigCard icon="basket" label="Colheita" color="#A3E635" onPress={() => navigation.navigate('Colheita')} />
                                <BigCard icon="calendar" label="Monitorar" color="#3B82F6" onPress={() => navigation.navigate('Monitoramento')} />
                                <BigCard icon="flask" label="Adubação" color="#8B5CF6" onPress={() => navigation.navigate('AdubacaoList')} />
                            </View>
                        </View>

                        {/* COMERCIAL & FINANCEIRO */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionTitleRow}>
                                <View style={[styles.sectionTitleDash, { backgroundColor: '#3B82F6' }]} />
                                <Text style={styles.sectionTitle}>COMERCIAL & FINANCEIRO</Text>
                            </View>
                            <View style={styles.bigGridRow}>
                                <BigCard icon="cart" label="Vendas" color="#3B82F6" onPress={() => navigation.navigate('Vendas')} />
                                <BigCard icon="cube" label="Estoque" color="#F59E0B" onPress={() => navigation.navigate('Estoque')} />
                                <BigCard icon="wallet" label="Despesas" color="#EF4444" onPress={() => navigation.navigate('Custos')} />
                                <BigCard icon="car" label="Compras" color="#14B8A6" onPress={() => navigation.navigate('Compras')} />
                            </View>
                        </View>

                        {/* SISTEMA & INTELIGÊNCIA */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionTitleRow}>
                                <View style={[styles.sectionTitleDash, { backgroundColor: '#FCD34D' }]} />
                                <Text style={styles.sectionTitle}>SISTEMA</Text>
                            </View>
                            <View style={styles.bigGridRow}>
                                <BigCard icon="people" label="Cadastros" color="#64748B" onPress={() => navigation.navigate('MenuCadastros')} />
                                <BigCard icon="bulb" label="Inteligência" color="#FCD34D" onPress={() => navigation.navigate('Intelligence')} />
                            </View>
                        </View>
                        
                        <View style={{ height: 120 }} />
                    </ScrollView>

                    {/* BOTTOM NAV SIMULADO (Para visual de App Grande) */}
                    <View style={styles.bottomNav}>
                        <NavBtn icon="home" label="Home" active />
                        <NavBtn icon="bar-chart" label="Relatórios" onPress={() => navigation.navigate('Relatorios')} />
                        <NavBtn icon="sync" label="Sync" onPress={() => navigation.navigate('Sync')} />
                        <NavBtn icon="person" label="Perfil" onPress={() => navigation.navigate('Profile')} />
                    </View>
                </SafeAreaView>
            </View>
        </View>
    );
}

// NOVO COMPONENTE: BIG CARD (Estilo do Print Oficial)
const BigCard = ({ icon, label, color, onPress }) => (
    <TouchableOpacity style={styles.bigCard} onPress={onPress} activeOpacity={0.8}>
        <Ionicons name={icon} size={28} color={color} style={{ marginBottom: 10 }} />
        <Text style={styles.bigCardText}>{label}</Text>
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
    greeting: { color: '#FFF', fontSize: 20, fontWeight: '900' },
    subtext: { color: '#A3E635', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginTop: 2 },
    
    // Action Pills (Registrar)
    actionPillsRow: { paddingHorizontal: 20, marginBottom: 25, gap: 10 },
    actionPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, height: 45 },
    actionPillHighlight: { backgroundColor: 'rgba(163, 230, 53, 0.15)', borderColor: '#A3E635' },
    actionPillText: { color: '#E2E8F0', fontSize: 13, fontWeight: 'bold', marginLeft: 8 },

    // Sections
    sectionContainer: { paddingHorizontal: 20, marginBottom: 20 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitleDash: { width: 4, height: 16, backgroundColor: '#A3E635', borderRadius: 2, marginRight: 8 },
    sectionTitle: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
    
    // Big Grid (2x2)
    bigGridRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
    bigCard: { width: '48%', backgroundColor: '#F8FAFC', borderRadius: 16, paddingVertical: 20, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
    bigCardText: { color: '#0F172A', fontSize: 13, fontWeight: '800' },

    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: '#0A1211', // Corzinha levemente cinza base do app
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)'
    },
    navItem: { alignItems: 'center' },
    navText: { fontSize: 10, marginTop: 4, fontWeight: 'bold' }
});Weight: 'bold' }
});

import React from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, ScrollView, 
    SafeAreaView, StatusBar, Dimensions, Platform, RefreshControl 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAnalytics } from '../modules/analytics/hooks/useAnalytics';
import SafeBlurView from '../ui/SafeBlurView';

const { width } = Dimensions.get('window');

/**
 * HomeScreen - AGROGB DIAMOND PRO: MASTER EDITION 💎
 * Grid otimizado em 3 grupos lógicos com navegação aninhada (Hubs).
 */
export default function HomeScreen() {
    const navigation = useNavigation();
    const analytics = useAnalytics();

    const totalVendas = analytics.receita || 0;
    const totalCustos = analytics.despesa || 0;
    const roi = analytics.roi || "0.0";
    const harvest = analytics.harvest || { percentual: 0, colhido: 0, estimado: 0 };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <LinearGradient 
                colors={['#0F172A', '#0B121E', '#080C14']} 
                style={StyleSheet.absoluteFill} 
            />
            
            <View style={[styles.ambientOrb, { top: -60, right: -100, backgroundColor: '#10B981', opacity: 0.08 }]} />
            <View style={[styles.ambientOrb, { bottom: 150, left: -120, backgroundColor: '#D4AF37', opacity: 0.06 }]} />
            
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    {/* LOGO AGROGB */}
                    <View style={styles.headerLogoBox}>
                        <View style={styles.logoBadge}>
                            <Ionicons name="leaf" size={18} color="#10B981" />
                        </View>
                        <View>
                            <Text style={styles.logoText}>AgroGB</Text>
                            <Text style={styles.logoSub}>Olá, Bruno 👋</Text>
                        </View>
                    </View>
                    {/* AÇÕES DO HEADER: PERFIL + ENGRENAGEM */}
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('Profile')}>
                            <SafeBlurView intensity={20} style={styles.menuIconBox}>
                                <Ionicons name="person-outline" size={21} color="#FFF" />
                            </SafeBlurView>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.menuBtn, { marginLeft: 10 }]} onPress={() => navigation.navigate('Config')}>
                            <SafeBlurView intensity={20} style={styles.menuIconBox}>
                                <Ionicons name="settings-outline" size={21} color="#FFF" />
                            </SafeBlurView>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={analytics.refreshing} onRefresh={analytics.refresh} tintColor="#10B981" />
                    }
                >
                    <SafeBlurView intensity={10} style={styles.dashboardCard}>
                        <View style={styles.dashHeader}>
                            <Text style={styles.dashTitle}>RESUMO MENSAL</Text>
                            <Ionicons name="stats-chart" size={18} color="rgba(255,255,255,0.4)" />
                        </View>
                        
                        <View style={styles.dashStatsRow}>
                            <View style={styles.statBox}>
                                <View style={styles.statLabelRow}>
                                    <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                                    <Text style={styles.statLabel}>TOTAL VENDAS</Text>
                                </View>
                                <Text style={styles.statValue}>R$ {totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                            </View>
                            
                            <View style={styles.statBox}>
                                <View style={styles.statLabelRow}>
                                    <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                                    <Text style={styles.statLabel}>CUSTOS TOTAIS</Text>
                                </View>
                                <Text style={[styles.statValue, { color: '#FCD34D' }]}>R$ {totalCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                            </View>
                        </View>

                        <View style={styles.intelRow}>
                            <View style={styles.intelItem}>
                                <Text style={styles.intelLabel}>ROI ATUAL</Text>
                                <Text style={[styles.intelValue, { color: '#10B981' }]}>{roi}%</Text>
                            </View>
                            <View style={styles.intelDivider} />
                            <View style={styles.intelItem}>
                                <Text style={styles.intelLabel}>PROGRESSO SAFRA</Text>
                                <View style={styles.progressContainer}>
                                    <View style={[styles.progressBar, { width: `${harvest.percentual}%` }]} />
                                    <Text style={styles.progressText}>{harvest.percentual}%</Text>
                                </View>
                            </View>
                        </View>
                    </SafeBlurView>

                    {/* ⚡ ACTION PILLS (INCLUDES INTELLIGENCE) */}
                    <View style={styles.actionPills}>
                        <TouchableOpacity style={styles.pillActiveWrapper} onPress={() => navigation.navigate('Intelligence')}>
                            <LinearGradient 
                                colors={['#10B981', '#065F46']} 
                                style={styles.pillActive}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                <MaterialCommunityIcons name="robot" size={20} color="#FFF" />
                                <Text style={[styles.pillText, { color: '#FFF' }]}>Inteligência IA</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.pill} onPress={() => navigation.navigate('Vendas')}>
                            <Ionicons name="add" size={18} color="#10B981" />
                            <Text style={styles.pillText}>Venda</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.pill} onPress={() => navigation.navigate('Custos')}>
                            <Ionicons name="add" size={18} color="#D4AF37" />
                            <Text style={styles.pillText}>Custo</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 🚜 GRUPO 1: GESTÃO OPERACIONAL */}
                    <View style={styles.sectionHeader}>
                        <View style={[styles.indicator, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.sectionTitle}>GESTÃO OPERACIONAL</Text>
                    </View>
                    <View style={styles.grid}>
                        <BalloonButton icon="leaf" label="Plantio" route="Plantio" color="#10B981" />
                        <BalloonButton icon="basket" label="Colheita" route="Colheita" color="#10B981" />
                        <BalloonButton icon="flask" label="Adubação" route="AdubacaoList" color="#10B981" />
                        <BalloonButton icon="book" label="Caderno" route="CadernoCampo" color="#10B981" />
                        <BalloonButton icon="layers" label="Cadastros" route="Cadastro" color="#10B981" />
                        <BalloonButton icon="people" label="Equipes" route="Usuarios" color="#10B981" />
                        <BalloonButton icon="monitor-dashboard" iconType="MCI" label="Monitoramento" route="Monitoramento" color="#10B981" />
                        <BalloonButton icon="trash-outline" label="Perdas" route="Processamento" color="#10B981" />
                    </View>

                    {/* 💰 GRUPO 2: COMERCIAL & FINANCEIRO */}
                    <View style={styles.sectionHeader}>
                        <View style={[styles.indicator, { backgroundColor: '#3B82F6' }]} />
                        <Text style={styles.sectionTitle}>COMERCIAL & FINANCEIRO</Text>
                    </View>
                    <View style={styles.grid}>
                        <BalloonButton icon="cash" label="Vendas" route="Vendas" color="#3B82F6" />
                        <BalloonButton icon="cart" label="Compras" route="Compras" color="#3B82F6" />
                        <BalloonButton icon="wallet" label="Custos" route="Custos" color="#3B82F6" />
                        <BalloonButton icon="cube" label="Estoque" route="Estoque" color="#3B82F6" />
                        <BalloonButton icon="truck-delivery-outline" iconType="MCI" label="Encomendas" route="Encomendas" color="#3B82F6" />
                        <BalloonButton icon="office-building" iconType="MCI" label="Contas" route="FinancialAccounts" color="#3B82F6" />
                        <BalloonButton icon="tractor" iconType="MCI" label="Frota" route="Frota" color="#3B82F6" />
                        <BalloonButton icon="people-circle" label="Clientes" route="Clientes" color="#3B82F6" />
                        <BalloonButton icon="bar-chart" label="Gráficos" route="Graficos" color="#3B82F6" />
                        <BalloonButton icon="pie-chart" label="Relatórios" route="Relatorios" color="#3B82F6" />
                    </View>

                    {/* ⚙️ GRUPO 3: SISTEMA */}
                    <View style={styles.sectionHeader}>
                        <View style={[styles.indicator, { backgroundColor: '#64748B' }]} />
                        <Text style={styles.sectionTitle}>SISTEMA</Text>
                    </View>
                    <View style={styles.grid}>
                        <BalloonButton icon="person" label="Perfil" route="Profile" color="#64748B" />
                        <BalloonButton icon="scan" label="Scanner" route="Scanner" color="#64748B" />
                        <BalloonButton icon="sync" label="Sincronia" route="Sync" color="#3B82F6" />
                        <BalloonButton icon="settings" label="Ajustes" route="Settings" color="#64748B" />
                        <BalloonButton icon="construct" label="Config" route="Config" color="#64748B" />
                    </View>

                    <View style={{ height: 120 }} />
                </ScrollView>

                {/* ── BOTTOM NAV ── */}
                <View style={styles.bottomNav}>
                    <NavIcon icon="home" label="Home" active />
                    <NavIcon icon="bar-chart" label="Relatórios" onPress={() => navigation.navigate('Relatorios')} />
                    <NavIcon icon="sync" label="Sync" onPress={() => navigation.navigate('Sync')} />
                    <NavIcon icon="person" label="Perfil" onPress={() => navigation.navigate('Profile')} />
                </View>

            </SafeAreaView>
        </View>
    );
}

const BalloonButton = ({ icon, label, route, color, iconType }) => {
    const navigation = useNavigation();
    const IconComponent = iconType === 'MCI' ? MaterialCommunityIcons : Ionicons;
    return (
        <TouchableOpacity style={styles.balloon} onPress={() => navigation.navigate(route)}>
            <IconComponent name={icon} size={28} color={color} />
            <Text style={styles.balloonText}>{label}</Text>
        </TouchableOpacity>
    );
};

const NavIcon = ({ icon, label, active, onPress }) => (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
        <Ionicons name={icon} size={24} color={active ? "#10B981" : "rgba(255,255,255,0.4)"} />
        <Text style={[styles.navText, { color: active ? "#10B981" : "rgba(255,255,255,0.4)" }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B121E' },
    safeArea: { flex: 1 },
    ambientOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, zIndex: -1 },
    
    header: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15 
    },
    headerLogoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)' },
    logoText: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
    logoSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600', marginTop: 1 },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    headerTitleBox: { flexDirection: 'row', alignItems: 'center' },
    greeting: { color: '#FFF', fontSize: 24, fontWeight: '700' },
    menuBtn: { width: 44, height: 44, borderRadius: 12, overflow: 'hidden' },
    menuIconBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

    dashboardCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    dashTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    dashStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { flex: 1 },
    statLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800' },
    statValue: { color: '#FFF', fontSize: 22, fontWeight: '900' },

    intelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 12 },
    intelItem: { flex: 1, alignItems: 'center' },
    intelDivider: { width: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.1)' },
    intelLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', marginBottom: 4 },
    intelValue: { fontSize: 16, fontWeight: '900' },
    progressContainer: { flexDirection: 'row', alignItems: 'center' },
    progressBar: { height: 4, backgroundColor: '#10B981', borderRadius: 2 },
    progressText: { color: '#FFF', fontSize: 12, fontWeight: '900', marginLeft: 6 },

    // Action Pills
    actionPills: { flexDirection: 'row', marginBottom: 30, gap: 8 },
    pill: { 
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 54, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', 
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)'
    },
    pillActiveWrapper: { flex: 1.4, height: 54, borderRadius: 16, overflow: 'hidden' },
    pillActive: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    pillText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '900', textAlign: 'center' },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10 },
    indicator: { width: 4, height: 18, borderRadius: 2, marginRight: 10 },
    sectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
    balloon: { 
        width: '48.5%', 
        backgroundColor: '#FFFFFF', 
        borderRadius: 24, 
        paddingVertical: 25, 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    balloonText: { color: '#1E293B', fontSize: 15, fontWeight: '700', marginTop: 10 },

    bottomNav: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 85,
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
        backgroundColor: '#0B121E', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
        paddingBottom: 20
    },
    navItem: { alignItems: 'center' },
    navText: { fontSize: 10, fontWeight: '800', marginTop: 4 }
});

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, StatusBar as RNStatusBar, Modal, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboardStats } from '../database/database';
import { syncTable } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SidebarDrawer from '../components/SidebarDrawer';
import HeaderProfileMenu from '../components/HeaderProfileMenu';
import { COLORS, SPACING } from '../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Removed axios. Using native fetch

const WEATHER_API_KEY = "b6b553c391219b626ab0bd4aa12acdc1"; // CHAVE PÚBLICA OPENWEATHER (Ou similar para testes, a ser gerida pelo cliente)


const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
    const [stats, setStats] = useState({
        saldo: 0,
        colheitaHoje: 0,
        vendasHoje: 0,
        plantioAtivo: 0,
        maquinasAlert: 0,
        pendentes: 0
    });
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [fabOpen, setFabOpen] = useState(false);
    const [weather, setWeather] = useState({ temp: '--', condition: 'Aguardando', humidity: '--', lastUpdate: 'Nunca' });
    const [weatherLoading, setWeatherLoading] = useState(false);

    // --- LOAD DATA ---
    const loadStats = async () => {
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (e) { console.error('Stats Load Error', e); }
    };

    const fetchWeather = async () => {
        setWeatherLoading(true);
        try {
            // Tentativa Online (Mock de localização para Fazenda base)
            const lat = -23.5505; const lon = -46.6333; // Mock location
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const json = await res.json();

            const data = {
                temp: Math.round(json.main.temp),
                condition: json.weather[0].description,
                humidity: json.main.humidity,
                lastUpdate: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            };
            setWeather(data);
            await AsyncStorage.setItem('@weather_cache', JSON.stringify(data));
        } catch (e) {
            // Em caso de offline, busca o cache
            const cached = await AsyncStorage.getItem('@weather_cache');
            if (cached) {
                setWeather(JSON.parse(cached));
            } else {
                setWeather({ temp: '--', condition: 'Offline', humidity: '--', lastUpdate: 'N/A' });
            }
        } finally {
            setWeatherLoading(false);
        }
    };

    const autoSync = async () => {
        const tables = ['colheitas', 'vendas', 'monitoramento_entidade'];
        for (const tab of tables) {
            try { await syncTable(tab); } catch (e) { }
        }
    };

    useFocusEffect(useCallback(() => {
        loadStats();
        fetchWeather();
        // autoSync(); // Mantido desativado para validação offline
    }, []));

    // --- QUICK ACTIONS GRID ---
    const QuickAction = ({ label, icon, color, screen, lib: IconLib = Ionicons }) => (
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate(screen)} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <IconLib name={icon} size={24} color={color || COLORS.primaryLight} />
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
    );


    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="dark-content" backgroundColor="#10B981" />
            {/* Removido o LinearGradient de fundo global (substituído pelo fundo branco do container) */}

            {/* SIDEBAR & OVERLAY */}
            <SidebarDrawer
                navigation={navigation}
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
            />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* HEADER */}
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.header}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuBtn}>
                            <Ionicons name="menu" size={28} color={COLORS.white} />
                        </TouchableOpacity>
                        <Text style={styles.appTitle}>AGRO<Text style={{ color: COLORS.accent }}>GB</Text></Text>
                        <HeaderProfileMenu />
                    </View>

                    {/* KPI CARDS (Horizontal Scroll) */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                        <View style={[styles.kpiContainer, { marginRight: 10, width: width * 0.85 }]}>
                            <View style={styles.kpiItem}>
                                <Text style={styles.kpiLabel}>SALDO DO MÊS</Text>
                                <Text style={[styles.kpiValue, { color: stats.saldo >= 0 ? COLORS.success : COLORS.destructive, fontSize: 18 }]}>
                                    R$ {stats.saldo.toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.vr} />
                            <View style={styles.kpiItem}>
                                <Text style={styles.kpiLabel}>VENDAS HOJE</Text>
                                <Text style={[styles.kpiValue, { color: COLORS.text }]}>R$ {stats.vendasHoje.toFixed(2)}</Text>
                            </View>
                            <View style={styles.vr} />
                            <View style={styles.kpiItem}>
                                <Text style={styles.kpiLabel}>COLHEITA HOJE</Text>
                                <Text style={[styles.kpiValue, { color: COLORS.text }]}>{stats.colheitaHoje} kg</Text>
                            </View>
                        </View>
                    </ScrollView>
                </LinearGradient>

                <View style={styles.content}>

                    {/* WEATHER CARD */}
                    <View style={styles.weatherCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="partly-sunny" size={32} color="#F59E0B" />
                            <View style={{ marginLeft: 15, flex: 1 }}>
                                <Text style={styles.weatherTemp}>{weather.temp}°C {weatherLoading && <ActivityIndicator size="small" />}</Text>
                                <Text style={styles.weatherCondition}>{weather.condition} • {weather.humidity}% UR</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 10, color: '#9CA3AF' }}>Ultima Att.</Text>
                                <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: 'bold' }}>{weather.lastUpdate}</Text>
                            </View>
                        </View>
                    </View>

                    {/* ALERTAS */}
                    {stats.maquinasAlert > 0 && (
                        <TouchableOpacity style={styles.alertBox} onPress={() => navigation.navigate('Frota')}>
                            <Ionicons name="warning" size={20} color="#F59E0B" />
                            <Text style={styles.alertText}>{stats.maquinasAlert} Máquinas precisam de manutenção</Text>
                        </TouchableOpacity>
                    )}

                    {/* MENU GRID REORGANIZADO */}
                    <Text style={styles.sectionTitle}>PRODUÇÃO</Text>
                    <View style={styles.grid}>
                        <QuickAction label="CADERNO" icon="book" color="#A78BFA" screen="CadernoCampo" />
                        <QuickAction label="PLANTIO" icon="analytics" color={COLORS.accent} screen="Plantio" />
                        <QuickAction label="MONITORAR" icon="eye" color="#60A5FA" screen="Monitoramento" />
                    </View>

                    <Text style={styles.sectionTitle}>MOVIMENTAÇÃO</Text>
                    <View style={styles.grid}>
                        <QuickAction label="COMPRAS" icon="cart-outline" color="#FBBF24" screen="Compras" />
                        <QuickAction label="ESTOQUE" icon="cube" color="#9CA3AF" screen="Estoque" />
                        <QuickAction label="COLHEITA" icon="leaf" color={COLORS.success} screen="Colheita" />
                        <QuickAction label="DESCARTE" icon="trash-bin" color="#F87171" screen="Descarte" />
                    </View>

                    <Text style={styles.sectionTitle}>GESTÃO</Text>
                    <View style={styles.grid}>
                        <QuickAction label="VENDAS" icon="cash" color={COLORS.primaryLight} screen="Vendas" />
                        <QuickAction label="CADASTROS" icon="create" color="#9CA3AF" screen="MenuCadastros" />
                        <QuickAction label="RELATÓRIOS" icon="bar-chart" color="#34D399" screen="Relatorios" />
                        <QuickAction label="FROTA" icon="tractor" color="#FBBF24" screen="Frota" lib={require('@expo/vector-icons').MaterialCommunityIcons} />
                        <QuickAction label="CLIENTES" icon="people" color="#60A5FA" screen="Clientes" />
                        <QuickAction label="CULTURAS" icon="flower" color="#F472B6" screen="Culturas" />
                        <QuickAction label="ADUBAÇÃO" icon="flask" color="#C084FC" screen="AdubacaoList" />
                        <QuickAction label="C. DE CUSTO" icon="pie-chart" color={COLORS.destructive} screen="Custos" />
                        <QuickAction label="USUÁRIOS" icon="id-card" color="#94A3B8" screen="Usuarios" />
                        <QuickAction label="CONFIG" icon="settings" color="#9CA3AF" screen="Settings" />
                    </View>

                </View>
            </ScrollView>

            {/* FAB BUTTON (Quick Add) */}
            <View style={styles.fab}>
                {fabOpen && (
                    <View style={{ position: 'absolute', bottom: 70, right: 0, alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.navigate('Colheita')} style={{ marginBottom: 10, backgroundColor: COLORS.success, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="leaf" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Vendas')} style={{ marginBottom: 10, backgroundColor: COLORS.primaryLight, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="cart" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}
                <TouchableOpacity onPress={() => setFabOpen(!fabOpen)}>
                    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.fabGradient}>
                        <Ionicons name={fabOpen ? "close" : "add"} size={30} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' }, // Fundo branco na tela
    header: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    menuBtn: { padding: 4 },
    appTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
        letterSpacing: 1
    },

    content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },

    kpiContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF', // Fundo Branco
        borderRadius: SPACING.radius,
        padding: SPACING.paddingMedium,
        justifyContent: 'space-between',
        marginBottom: 20,
        elevation: 3, // Sombra material design em branco
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    kpiItem: { alignItems: 'center', flex: 1 },
    kpiLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', marginBottom: 4, letterSpacing: 0.5 },
    kpiValue: { fontSize: 14, fontWeight: 'bold' }, // Cor passada dinamicamente
    vr: { width: 1, height: '70%', backgroundColor: '#E5E7EB', alignSelf: 'center' },

    weatherCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // Fundo Branco
        borderRadius: SPACING.radius,
        padding: SPACING.paddingMedium,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    weatherTemp: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    weatherCondition: { fontSize: 12, color: '#6B7280', textTransform: 'capitalize' },

    alertBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)', // Glass Orange
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)'
    },
    alertText: { marginLeft: 10, color: '#FCD34D', fontWeight: 'bold', fontSize: 12 },

    sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray500, marginBottom: 12, marginTop: 8, letterSpacing: 1, textTransform: 'uppercase' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 24 },

    actionCard: {
        width: (width - 64) / 3,
        backgroundColor: '#FFFFFF', // Fundo Branco
        borderRadius: SPACING.radius,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 1, // Sombra levíssima
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    actionIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginBottom: 8, backgroundColor: '#F3F4F6' },
    actionLabel: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },

    // FAB STYLES
    fab: { position: 'absolute', bottom: 30, right: 30, elevation: 8, borderRadius: 28, overflow: 'hidden' },
    fabGradient: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },

    fabOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }, // Darker Overlay
    fabMenu: { backgroundColor: COLORS.backgroundDark, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 40, borderWidth: 1, borderColor: COLORS.glassBorder },
    fabHeader: { fontSize: 16, fontWeight: 'bold', color: COLORS.white, marginBottom: 20, textAlign: 'center' },
    fabItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
    fabIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    fabLabel: { fontSize: 16, fontWeight: '600', color: COLORS.white }
});

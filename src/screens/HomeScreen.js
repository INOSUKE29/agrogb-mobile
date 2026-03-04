import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar as RNStatusBar,
    InteractionManager, Vibration, Animated
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import WeatherWidget from '../components/WeatherWidget';
import { getDashboardStats } from '../database/database';
import { syncTable } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SidebarDrawer from '../components/SidebarDrawer';
import { DARK, GLOW_CARD_SHADOW, BG_GRADIENT } from '../styles/darkTheme';
import { getMenuOrder, saveManualOrder, recordUsage } from '../services/MenuService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLS = 3;
const CARD_GAP = 12;
const CARD_SIZE = (SCREEN_WIDTH - 40 - CARD_GAP * (NUM_COLS - 1)) / NUM_COLS;

export default function HomeScreen({ navigation }) {
    const [stats, setStats] = useState({ saldo: 0, colheitaHoje: 0, vendasHoje: 0, plantioAtivo: 0, maquinasAlert: 0, pendentes: 0 });
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [menuItems, setMenuItems] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const loadStats = async () => {
        const data = await getDashboardStats();
        setStats(data);
    };

    const autoSync = async () => {
        const tables = ['colheitas', 'vendas', 'compras', 'plantio', 'custos', 'descarte', 'clientes', 'culturas', 'cadastro', 'maquinas', 'manutencao_frota', 'monitoramento_entidade', 'analise_ia', 'monitoramento_media'];
        for (const tab of tables) { syncTable(tab).catch(() => { }); }
    };

    useFocusEffect(useCallback(() => {
        const task = InteractionManager.runAfterInteractions(async () => {
            setIsReady(true);
            loadStats();
            autoSync();
            const items = await getMenuOrder();
            setMenuItems(items);
        });
        return () => task.cancel();
    }, []));

    const startShake = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 2, duration: 60, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -2, duration: 60, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
            ]),
            { iterations: 3 }
        ).start();
    };

    const handleDragEnd = async ({ data }) => {
        setIsDragging(false);
        setMenuItems(data);
        await saveManualOrder(data.map(i => i.id));
    };

    const handleNavPress = (item) => {
        recordUsage(item.id);
        navigation.navigate(item.route);
    };

    const formatBRL = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const renderItem = ({ item, drag, isActive }) => (
        <ScaleDecorator activeScale={0.95}>
            <Animated.View style={[{ transform: [{ translateX: isActive ? 0 : shakeAnim }] }]}>
                <TouchableOpacity
                    style={[styles.card, isActive && styles.cardDragging]}
                    onPress={() => !isDragging && handleNavPress(item)}
                    onLongPress={() => {
                        Vibration.vibrate(80);
                        startShake();
                        setIsDragging(true);
                        drag();
                    }}
                    delayLongPress={600}
                    activeOpacity={0.75}
                >
                    <View style={styles.iconCircle}>
                        <Ionicons name={item.icon} size={22} color={DARK.glow} />
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.label}</Text>
                </TouchableOpacity>
            </Animated.View>
        </ScaleDecorator>
    );

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <RNStatusBar barStyle="light-content" backgroundColor={DARK.bg} />

                {/* HEADER */}
                <LinearGradient colors={['#0D3526', '#1A6B4A']} style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%' }}>
                        <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuBtn}>
                            <Ionicons name="menu" size={26} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.brand}>AgroGB</Text>
                            <Text style={styles.salutation}>PAINEL GERENCIAL</Text>
                        </View>
                    </View>
                    <View style={{ marginTop: 14, width: '100%' }}>
                        <WeatherWidget />
                    </View>

                    {/* KPI ROW */}
                    {isReady && (
                        <View style={styles.kpiRow}>
                            <View style={styles.kpiItem}>
                                <Text style={styles.kpiLabel}>COLHEITA HOJE</Text>
                                <Text style={styles.kpiValue}>{stats.colheitaHoje} <Text style={styles.unit}>kg</Text></Text>
                            </View>
                            <View style={styles.vr} />
                            <View style={styles.kpiItem}>
                                <Text style={styles.kpiLabel}>VENDAS HOJE</Text>
                                <Text style={styles.kpiValue}>{formatBRL(stats.vendasHoje)}</Text>
                            </View>
                            <View style={styles.vr} />
                            <View style={styles.kpiItem}>
                                <Text style={styles.kpiLabel}>RESULTADO MÊS</Text>
                                <Text style={[styles.kpiValue, { color: (stats.saldo || 0) >= 0 ? '#4ADE80' : '#FCA5A5' }]}>
                                    {formatBRL(stats.saldo)}
                                </Text>
                            </View>
                        </View>
                    )}
                    <View style={styles.glowLine} />
                </LinearGradient>

                {/* CONTENT */}
                <View style={styles.content}>
                    {stats.maquinasAlert > 0 && (
                        <TouchableOpacity style={styles.alertBar} onPress={() => navigation.navigate('Frota')}>
                            <Ionicons name="warning" size={18} color={DARK.warning} />
                            <Text style={styles.alertText}>{stats.maquinasAlert} MÁQUINAS PRECISAM DE REVISÃO</Text>
                            <Ionicons name="chevron-forward" size={18} color={DARK.warning} />
                        </TouchableOpacity>
                    )}

                    <Text style={styles.sectionTitle}>ACESSO RÁPIDO</Text>
                    {isDragging && (
                        <Text style={styles.dragHint}>Solte para reposicionar • Toque longo para mover</Text>
                    )}

                    {menuItems.length > 0 && (
                        <DraggableFlatList
                            data={menuItems}
                            keyExtractor={item => item.id}
                            renderItem={renderItem}
                            onDragEnd={handleDragEnd}
                            numColumns={NUM_COLS}
                            columnWrapperStyle={styles.gridRow}
                            contentContainerStyle={styles.gridContent}
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={
                                <View style={styles.footer}>
                                    <Text style={styles.version}>AgroGB Mobile v8.1 • Dark Agro Tech</Text>
                                    <Text style={styles.dragTip}>Pressione e segure um card para reorganizar</Text>
                                </View>
                            }
                        />
                    )}
                </View>

                <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F3D2E' },
    header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
    menuBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    brand: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
    salutation: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
    glowLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 16 },

    kpiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', padding: 14, borderRadius: 14, marginTop: 16 },
    kpiItem: { flex: 1, alignItems: 'center' },
    kpiLabel: { fontSize: 8, color: 'rgba(255,255,255,0.7)', fontWeight: '900', marginBottom: 5, letterSpacing: 0.8 },
    kpiValue: { fontSize: 13, color: '#FFFFFF', fontWeight: 'bold' },
    unit: { fontSize: 10, color: 'rgba(255,255,255,0.65)' },
    vr: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

    content: { flex: 1, paddingTop: 16, paddingHorizontal: 20 },

    alertBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: '#F59E0B', padding: 12, borderRadius: 14, marginBottom: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    alertText: { flex: 1, fontSize: 11, fontWeight: 'bold', color: '#92400E' },

    sectionTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.8)', marginBottom: 12, letterSpacing: 1.5 },
    dragHint: { fontSize: 10, color: '#FFFFFF', textAlign: 'center', marginBottom: 10, fontWeight: 'bold' },

    gridContent: { paddingBottom: 40 },
    gridRow: { gap: CARD_GAP, marginBottom: CARD_GAP },
    card: {
        width: CARD_SIZE,
        height: CARD_SIZE * 0.85,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
    },
    cardDragging: {
        borderColor: '#1F7A5A',
        shadowColor: '#1F7A5A',
        shadowOpacity: 0.35,
        elevation: 14,
        transform: [{ scale: 1.04 }],
    },
    iconCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(31,122,90,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 10, fontWeight: '700', color: '#334155', textAlign: 'center' },

    footer: { marginTop: 24, alignItems: 'center' },
    version: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 'bold' },
    dragTip: { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 4 },
});

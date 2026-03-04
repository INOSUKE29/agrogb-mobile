import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar as RNStatusBar,
    InteractionManager, Vibration, Animated
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import WeatherWidget from '../components/WeatherWidget';
import { executeQuery, getDashboardStats } from '../database/database';
import { syncTable } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SidebarDrawer from '../components/SidebarDrawer';
import { DARK, GLOW_CARD_SHADOW } from '../styles/darkTheme';
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
                <LinearGradient colors={['#061E1A', '#0B2E26']} style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%' }}>
                        <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuBtn}>
                            <Ionicons name="menu" size={28} color={DARK.glow} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.brand}>AgroGB</Text>
                            <Text style={styles.salutation}>PAINEL GERENCIAL</Text>
                        </View>
                    </View>
                    <View style={{ marginTop: 16, width: '100%' }}>
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
                                <Text style={[styles.kpiValue, { color: (stats.saldo || 0) >= 0 ? DARK.glow : DARK.danger }]}>
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
    container: { flex: 1, backgroundColor: DARK.bg },
    header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
    menuBtn: { padding: 8, backgroundColor: 'rgba(0,255,156,0.1)', borderRadius: 12, borderWidth: 1, borderColor: DARK.glowBorder },
    brand: { fontSize: 22, fontWeight: '900', color: DARK.glow, letterSpacing: 0.5 },
    salutation: { fontSize: 10, color: DARK.textSecondary, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
    glowLine: { height: 1, backgroundColor: DARK.glowLine, marginTop: 16 },

    kpiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,255,156,0.05)', borderWidth: 1, borderColor: DARK.glowBorder, padding: 14, borderRadius: 14, marginTop: 16 },
    kpiItem: { flex: 1, alignItems: 'center' },
    kpiLabel: { fontSize: 8, color: DARK.textMuted, fontWeight: '900', marginBottom: 5, letterSpacing: 0.8 },
    kpiValue: { fontSize: 13, color: DARK.textPrimary, fontWeight: 'bold' },
    unit: { fontSize: 10, color: DARK.textMuted },
    vr: { width: 1, height: 28, backgroundColor: DARK.glowBorder },

    content: { flex: 1, paddingTop: 16, paddingHorizontal: 20 },

    alertBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', padding: 12, borderRadius: 12, marginBottom: 16, gap: 10 },
    alertText: { flex: 1, fontSize: 11, fontWeight: 'bold', color: DARK.warning },

    sectionTitle: { fontSize: 10, fontWeight: '900', color: DARK.textMuted, marginBottom: 12, letterSpacing: 1.5 },
    dragHint: { fontSize: 10, color: DARK.glow, textAlign: 'center', marginBottom: 10, fontWeight: 'bold' },

    gridContent: { paddingBottom: 40 },
    gridRow: { gap: CARD_GAP, marginBottom: CARD_GAP },
    card: {
        width: CARD_SIZE,
        height: CARD_SIZE * 0.85,
        backgroundColor: DARK.card,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: DARK.glowBorder,
        ...GLOW_CARD_SHADOW,
    },
    cardDragging: {
        borderColor: DARK.glow,
        shadowColor: '#00FF9C',
        shadowOpacity: 0.5,
        elevation: 10,
    },
    iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,255,156,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 10, fontWeight: 'bold', color: DARK.textSecondary, textAlign: 'center' },

    footer: { marginTop: 24, alignItems: 'center' },
    version: { color: DARK.textMuted, fontSize: 10, fontWeight: 'bold' },
    dragTip: { color: DARK.textMuted, fontSize: 10, marginTop: 4, opacity: 0.6 },
});

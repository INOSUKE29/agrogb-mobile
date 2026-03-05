import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar as RNStatusBar,
    InteractionManager, PanResponder, Animated, Vibration, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import WeatherWidget from '../components/WeatherWidget';
import { getDashboardStats } from '../database/database';
import { syncTable } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SidebarDrawer from '../components/SidebarDrawer';
import { DARK } from '../styles/darkTheme';
import { getMenuOrder, saveManualOrder, recordUsage } from '../services/MenuService';

// --- CONFIGURAÇÕES DO GRID ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLS = 3;
const CARD_GAP = 12;
const CARD_SIZE = (SCREEN_WIDTH - 40 - CARD_GAP * (NUM_COLS - 1)) / NUM_COLS;
const CARD_HEIGHT = CARD_SIZE * 0.85;

const getPosition = (index) => {
    const col = index % NUM_COLS;
    const row = Math.floor(index / NUM_COLS);
    return {
        x: col * (CARD_SIZE + CARD_GAP),
        y: row * (CARD_HEIGHT + CARD_GAP)
    };
};

const GridItem = ({ item, index, isEditMode, shakeAnim, onMoveItem, onDropItem, onPress, onLongPress }) => {
    const pos = getPosition(index);
    const pan = useRef(new Animated.ValueXY(pos)).current;
    const [isDragging, setIsDragging] = useState(false);

    // Anima o card suavemente para nova posição quando a ordem muda
    useEffect(() => {
        if (!isDragging) {
            Animated.spring(pan, {
                toValue: getPosition(index),
                useNativeDriver: false,
                friction: 6,
                tension: 40
            }).start();
        }
    }, [index, isDragging, pan]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => isEditMode,
            onMoveShouldSetPanResponder: () => isEditMode,
            onPanResponderGrant: () => {
                setIsDragging(true);
                pan.setOffset({ x: pan.x._value, y: pan.y._value });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: (e, gesture) => {
                pan.setValue({ x: gesture.dx, y: gesture.dy });

                // Calcula o centro do elemento durante o arrasto
                const currentX = pan.x._value + pan.x._offset;
                const currentY = pan.y._value + pan.y._offset;
                const centerX = currentX + (CARD_SIZE / 2);
                const centerY = currentY + (CARD_HEIGHT / 2);

                const col = Math.max(0, Math.min(NUM_COLS - 1, Math.floor(centerX / (CARD_SIZE + CARD_GAP))));
                const row = Math.max(0, Math.floor(centerY / (CARD_HEIGHT + CARD_GAP)));

                onMoveItem(item.id, col, row);
            },
            onPanResponderRelease: () => {
                pan.flattenOffset();
                setIsDragging(false);
                onDropItem();
            }
        })
    ).current;

    const rotation = shakeAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-1.5deg', '1.5deg']
    });

    return (
        <Animated.View
            style={[
                { position: 'absolute', width: CARD_SIZE, height: CARD_HEIGHT },
                isDragging ? {
                    zIndex: 999,
                    elevation: 99,
                    transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: 1.15 }]
                } : {
                    zIndex: 1,
                    elevation: 1,
                    transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate: isEditMode ? rotation : '0deg' }]
                }
            ]}
            {...(isEditMode ? panResponder.panHandlers : {})}
        >
            <TouchableOpacity
                style={[styles.card, (isDragging ? styles.cardDragging : (isEditMode ? styles.cardEditMode : null)), { width: '100%', height: '100%' }]}
                onPress={onPress}
                onLongPress={onLongPress}
                delayLongPress={500}
                activeOpacity={isEditMode ? 1 : 0.75}
            >
                <View style={[styles.iconCircle, isDragging && { backgroundColor: DARK.glow }]}>
                    <Ionicons name={item.icon} size={22} color={isDragging ? '#FFF' : DARK.glow} />
                </View>
                <Text style={[styles.cardTitle, isDragging && { color: DARK.glow }]} numberOfLines={1}>{item.label}</Text>
                {isEditMode && !isDragging && (
                    <View style={styles.editBadge}>
                        <Ionicons name="move" size={12} color="#fff" />
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function HomeScreen({ navigation }) {
    const [stats, setStats] = useState({ saldo: 0, colheitaHoje: 0, vendasHoje: 0, plantioAtivo: 0, maquinasAlert: 0, pendentes: 0 });
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const [menuItems, setMenuItems] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
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

    const toggleEditMode = () => {
        if (!isEditMode) {
            Vibration.vibrate(80);
            setIsEditMode(true);
            Animated.loop(
                Animated.sequence([
                    Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
                ])
            ).start();
        } else {
            setIsEditMode(false);
            shakeAnim.setValue(0);
            shakeAnim.stopAnimation();
            saveManualOrder(menuItems.map(i => i.id));
        }
    };

    const handleMoveItem = (id, col, row) => {
        const maxRow = Math.ceil(menuItems.length / NUM_COLS) - 1;
        const validRow = Math.max(0, Math.min(maxRow, row));
        let targetIndex = validRow * NUM_COLS + col;
        targetIndex = Math.max(0, Math.min(menuItems.length - 1, targetIndex));

        const currentIndex = menuItems.findIndex(i => i.id === id);
        if (currentIndex !== targetIndex && currentIndex !== -1) {
            setMenuItems(prev => {
                const newItems = [...prev];
                const item = newItems.splice(currentIndex, 1)[0];
                newItems.splice(targetIndex, 0, item);
                return newItems;
            });
        }
    };

    const handleNavPress = (item) => {
        recordUsage(item.id);
        navigation.navigate(item.route);
    };

    const formatBRL = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Calcula altura total necessária para o grid absoluto
    const totalRowsCount = Math.ceil(menuItems.length / NUM_COLS);
    const containerHeight = totalRowsCount * (CARD_HEIGHT + CARD_GAP);

    return (
        <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.container}>
            <RNStatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />

            {/* HEADER */}
            <LinearGradient colors={DARK.bgGradient} style={styles.header}>
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
                            <Text style={[styles.kpiValue, { color: (stats.saldo || 0) >= 0 ? '#10B981' : '#FCA5A5' }]}>
                                {formatBRL(stats.saldo)}
                            </Text>
                        </View>
                    </View>
                )}
                <View style={styles.glowLine} />
            </LinearGradient>

            {/* CONTENT */}
            <View style={styles.content}>
                {stats.maquinasAlert > 0 && !isEditMode && (
                    <TouchableOpacity style={styles.alertBar} onPress={() => navigation.navigate('Frota')}>
                        <Ionicons name="warning" size={18} color={DARK.warningDark} />
                        <Text style={styles.alertText}>{stats.maquinasAlert} MÁQUINAS PRECISAM DE REVISÃO</Text>
                        <Ionicons name="chevron-forward" size={18} color={DARK.warningDark} />
                    </TouchableOpacity>
                )}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{isEditMode ? 'MODO DE ORGANIZAÇÃO' : 'ACESSO RÁPIDO'}</Text>
                    {isEditMode && (
                        <TouchableOpacity style={styles.doneBtn} onPress={toggleEditMode}>
                            <Text style={styles.doneBtnText}>CONCLUIR</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {isEditMode && (
                    <Text style={styles.dragHintText}>As telas não se sobrepõem mais, mova livremente</Text>
                )}

                {menuItems.length > 0 && (
                    <ScrollView
                        contentContainerStyle={styles.gridContent}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={!isEditMode}
                    >
                        <View style={[styles.gridContainer, { height: containerHeight }]}>
                            {menuItems.map((item, index) => (
                                <GridItem
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    isEditMode={isEditMode}
                                    shakeAnim={shakeAnim}
                                    onMoveItem={handleMoveItem}
                                    onDropItem={() => saveManualOrder(menuItems.map(i => i.id))}
                                    onPress={() => !isEditMode && handleNavPress(item)}
                                    onLongPress={toggleEditMode}
                                />
                            ))}
                        </View>
                        <View style={styles.footer}>
                            <Text style={styles.version}>AgroGB Mobile v8.3 • Soft Shadow</Text>
                        </View>
                    </ScrollView>
                )}
            </View>

            <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8, zIndex: 10 },
    menuBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
    brand: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
    salutation: { fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
    glowLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 16 },

    kpiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 14, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    kpiItem: { flex: 1, alignItems: 'center' },
    kpiLabel: { fontSize: 8, color: 'rgba(255,255,255,0.9)', fontWeight: '900', marginBottom: 5, letterSpacing: 0.8 },
    kpiValue: { fontSize: 13, color: '#FFFFFF', fontWeight: 'bold' },
    unit: { fontSize: 10, color: 'rgba(255,255,255,0.85)' },
    vr: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.3)' },

    content: { flex: 1, paddingTop: 20, paddingHorizontal: 20 },

    alertBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B', padding: 12, borderRadius: 14, marginBottom: 16, gap: 10, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
    alertText: { flex: 1, fontSize: 11, fontWeight: 'bold', color: '#92400E' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#334155', letterSpacing: 1.2 },
    doneBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
    doneBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
    dragHintText: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 14 },

    gridContent: { paddingBottom: 40, paddingTop: 6 },
    gridContainer: { width: '100%', position: 'relative' },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    cardEditMode: {
        borderColor: '#4CAF50',
        borderWidth: 1.5,
        backgroundColor: '#F7FEFA',
        borderStyle: 'dashed',
    },
    cardDragging: {
        backgroundColor: '#FFFFFF',
        borderColor: '#2E7D32',
        borderWidth: 2,
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
    },
    editBadge: { position: 'absolute', top: -5, right: -5, width: 22, height: 22, borderRadius: 11, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
    iconCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(76,175,80,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 10, fontWeight: '700', color: '#1E293B', textAlign: 'center', paddingHorizontal: 4 },

    footer: { position: 'absolute', bottom: -40, left: 0, right: 0, alignItems: 'center' },
    version: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold' },
});

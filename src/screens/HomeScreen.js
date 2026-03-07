import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar as RNStatusBar,
    InteractionManager, PanResponder, Animated, Vibration, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import WeatherWidget from '../ui/WeatherWidget';
import { getDashboardStats } from '../database/database';
import { syncAllMaster, testConnection } from '../services/supabase';
// ... outras importações

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SidebarDrawer from '../ui/SidebarDrawer';
import { useTheme } from '../theme/ThemeContext';
import { getMenuOrder, saveManualOrder, recordUsage } from '../services/MenuService';
import { SPACING } from '../design/spacing';
import { RADIUS } from '../design/radius';
import { TYPOGRAPHY } from '../design/typography';

// --- CONFIGURAÇÕES DO GRID ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLS = 3;
const CARD_GAP = SPACING.md;
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

const GridItem = ({ item, index, isEditMode, shakeAnim, onMoveItem, onDropItem, onPress, onLongPress, colors }) => {
    const pos = getPosition(index);
    const pan = useRef(new Animated.ValueXY(pos)).current;
    const [isDragging, setIsDragging] = useState(false);

    const initialPos = useRef({ x: pos.x, y: pos.y });

    useEffect(() => {
        if (!isDragging) {
            initialPos.current = getPosition(index);
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
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setIsDragging(true);
                // Reseta a base do arrasto para a última posição correta salva no Ref
                pan.setOffset({ x: initialPos.current.x, y: initialPos.current.y });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: (e, gesture) => {
                pan.setValue({ x: gesture.dx, y: gesture.dy });

                // Calcula o centro do elemento durante o arrasto baseado no toque relativo
                const currentX = initialPos.current.x + gesture.dx;
                const currentY = initialPos.current.y + gesture.dy;
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
                style={[styles.card, (isDragging ? styles.cardDragging : (isEditMode ? styles.cardEditMode : null)), { width: '100%', height: '100%', backgroundColor: colors.card, borderColor: colors.glassBorder }]}
                onPress={onPress}
                onLongPress={onLongPress}
                delayLongPress={500}
                activeOpacity={isEditMode ? 1 : 0.75}
            >
                <View style={[styles.iconCircle, isDragging && { backgroundColor: colors.glow }]}>
                    <Ionicons name={item.icon} size={22} color={isDragging ? '#FFF' : colors.glow} />
                </View>
                <Text style={[styles.cardTitle, isDragging && { color: colors.glow }, { color: colors.textPrimary }]} numberOfLines={1}>{item.label}</Text>
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
    const { colors, theme } = useTheme();
    const [stats, setStats] = useState({ saldo: 0, colheitaHoje: 0, vendasHoje: 0, custosMes: 0, plantioAtivo: 0, maquinasAlert: 0, pendentes: 0 });
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const [menuItems, setMenuItems] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    const loadStats = async () => {
        const data = await getDashboardStats();
        setStats(data);
    };

    const autoSync = async () => {
        setIsOffline(false);
        try {
            const isConnected = await testConnection();
            if (!isConnected) {
                setIsOffline(true);
                return;
            }
            await syncAllMaster();
        } catch (e) {
            setIsOffline(true);
        }
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
                    Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: false }),
                    Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: false }),
                    Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: false }),
                ])
            ).start();
        } else {
            setIsEditMode(false);
            shakeAnim.setValue(0);
            shakeAnim.stopAnimation();
            saveManualOrder(menuItems.map(i => i.id));
        }
    };

    const handleMoveItem = useCallback((id, col, row) => {
        setMenuItems(prev => {
            const maxRow = Math.ceil(prev.length / NUM_COLS) - 1;
            const validRow = Math.max(0, Math.min(maxRow, row));
            let targetIndex = validRow * NUM_COLS + col;
            targetIndex = Math.max(0, Math.min(prev.length - 1, targetIndex));

            const currentIndex = prev.findIndex(i => i.id === id);
            if (currentIndex !== targetIndex && currentIndex !== -1) {
                const newItems = [...prev];
                const item = newItems.splice(currentIndex, 1)[0];
                newItems.splice(targetIndex, 0, item);
                return newItems;
            }
            return prev;
        });
    }, []);

    // Atualiza a persistência corretamente lendo a Ref ou valor em momento não-stale
    const handleDropItem = useCallback(() => {
        // Enforce save from the LATEST state (React 18 style flush) 
        setMenuItems(latest => {
            saveManualOrder(latest.map(i => i.id));
            return latest;
        });
    }, []);

    const handleNavPress = (item) => {
        recordUsage(item.id);
        navigation.navigate(item.route);
    };

    const formatBRL = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Calcula altura total necessária para o grid absoluto
    const totalRowsCount = Math.ceil(menuItems.length / NUM_COLS);
    // Sync Indicator Helpers
    const getSyncColor = () => {
        if (isOffline) return "#EF4444"; // Red
        if (stats.pendentes > 0) return "#FCD34D"; // Yellow
        return "#34D399"; // Green
    };
    const getSyncIcon = () => {
        if (isOffline) return "cloud-offline";
        if (stats.pendentes > 0) return "cloud-upload";
        return "cloud-done";
    };
    const getSyncText = () => {
        if (isOffline) return "OFFLINE";
        if (stats.pendentes > 0) return `${stats.pendentes} PENDENTES`;
        return "SYNC OK";
    };

    return (
        <LinearGradient colors={colors.bgGradient} style={styles.container}>
            <RNStatusBar barStyle={theme === 'dark' || (theme === 'system' && colors.effectiveTheme === 'dark') ? 'light-content' : 'dark-content'} />

            {/* HEADER */}
            <LinearGradient colors={colors.bgGradient} style={[styles.header, { shadowColor: colors.shadow || '#000' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%' }}>
                    <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuBtn}>
                        <Ionicons name="menu" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.brand}>AgroGB</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.salutation}>PAINEL GERENCIAL</Text>
                            {isReady && (
                                <TouchableOpacity onPress={() => navigation.navigate('Sync')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, marginTop: 2 }}>
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: getSyncColor() }} />
                                    <Text style={{ fontSize: 9, color: '#FFF', fontWeight: '900', letterSpacing: 0.5 }}>
                                        {getSyncText().split(' ')[0]} {/* Apenas SYNC ou OFFLINE */}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
                <View style={{ marginTop: 14, width: '100%' }}>
                    <WeatherWidget />
                </View>

                {/* KPI ROW - HORIZONTAL SCROLL FOR 4 CARDS */}
                {isReady && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }} style={{ marginTop: 16 }}>
                        <View style={styles.kpiContainer}>
                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiLabel}>PRODUÇÃO</Text>
                                <Text style={styles.kpiValue}>{stats.colheitaHoje} <Text style={styles.unit}>kg</Text></Text>
                            </View>

                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiLabel}>VENDAS HOJE</Text>
                                <Text style={[styles.kpiValue, { color: '#34D399' }]}>{formatBRL(stats.vendasHoje)}</Text>
                            </View>

                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiLabel}>CUSTOS MÊS</Text>
                                <Text style={[styles.kpiValue, { color: '#FCD34D' }]}>{formatBRL(stats.custosMes)}</Text>
                            </View>

                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiLabel}>LUCRO MÊS</Text>
                                <Text style={[styles.kpiValue, { color: (stats.saldo || 0) >= 0 ? '#34D399' : '#F87171' }]}>
                                    {formatBRL(stats.saldo)}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                )}
                <View style={styles.glowLine} />
            </LinearGradient>

            {/* CONTENT */}
            <View style={styles.content}>
                {stats.maquinasAlert > 0 && !isEditMode && (
                    <TouchableOpacity
                        style={[styles.alertBar, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}
                        onPress={() => navigation.navigate('Frota')}
                    >
                        <Ionicons name="warning" size={18} color={colors.warningDark} />
                        <Text style={[styles.alertText, { color: colors.warningDark }]}>{stats.maquinasAlert} MÁQUINAS PRECISAM DE REVISÃO</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.warningDark} />
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
                                    colors={colors}
                                    isEditMode={isEditMode}
                                    shakeAnim={shakeAnim}
                                    onMoveItem={handleMoveItem}
                                    onDropItem={handleDropItem}
                                    onPress={() => !isEditMode && handleNavPress(item)}
                                    onLongPress={toggleEditMode}
                                />
                            ))}
                        </View>
                        <View style={styles.footer}>
                            <Text style={[styles.version, { color: colors.textMuted }]}>AgroGB Mobile v8.5 Master • Backend Pro</Text>
                        </View>
                    </ScrollView>
                )}
            </View>

            <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
        </LinearGradient >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8, zIndex: 10 },
    menuBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
    brand: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
    salutation: { fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
    glowLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 16 },

    kpiContainer: { flexDirection: 'row', gap: 12 },
    kpiCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', padding: 14, borderRadius: 16, minWidth: 110, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
    kpiLabel: { fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: '800', marginBottom: 6, letterSpacing: 0.5 },
    kpiValue: { fontSize: 16, color: '#FFFFFF', fontWeight: '900' },
    unit: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },

    content: { flex: 1, paddingTop: 20, paddingHorizontal: 20 },

    alertBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B', padding: 12, borderRadius: 14, marginBottom: 16, gap: 10, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
    alertText: { flex: 1, fontSize: 11, fontWeight: 'bold', color: '#92400E' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 4 },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 1.5 },
    doneBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
    doneBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
    dragHintText: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 14 },

    shortcutBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', gap: 6, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
    shortcutText: { fontSize: 11, fontWeight: '800', color: '#475569' },

    gridContent: { paddingBottom: 40, paddingTop: 6 },
    gridContainer: { width: '100%', position: 'relative' },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 14,
        elevation: 4,
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
    iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    cardTitle: { fontSize: 10, fontWeight: '700', color: '#1E293B', textAlign: 'center', paddingHorizontal: 4 },

    footer: { width: '100%', alignItems: 'center', marginTop: 20, marginBottom: 20 },
    version: { fontSize: 10, fontWeight: 'bold' },
});

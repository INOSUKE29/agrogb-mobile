import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar as RNStatusBar,
    InteractionManager, FlatList, PanResponder, Animated, Vibration
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

const DraggableCard = ({ item, index, onMove, shakeAnim }) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const [dragging, setDragging] = useState(false);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setDragging(true);
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
            onPanResponderRelease: (e, gesture) => {
                setDragging(false);
                const colMove = Math.round(gesture.dx / (CARD_SIZE + CARD_GAP));
                const rowMove = Math.round(gesture.dy / (CARD_SIZE + CARD_GAP * 0.85));

                Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
                if (colMove !== 0 || rowMove !== 0) {
                    onMove(index, colMove, rowMove);
                }
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
                { zIndex: dragging ? 999 : 1, elevation: dragging ? 99 : 1 },
                { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate: dragging ? '0deg' : rotation }] }
            ]}
            {...panResponder.panHandlers}
        >
            <View style={[styles.card, dragging ? styles.cardDragging : styles.cardEditMode]}>
                <View style={styles.iconCircle}>
                    <Ionicons name={item.icon} size={22} color={DARK.glow} />
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.label}</Text>
                {!dragging && (
                    <View style={styles.editBadge}>
                        <Ionicons name="move" size={12} color="#fff" />
                    </View>
                )}
            </View>
        </Animated.View>
    );
};

export default function HomeScreen({ navigation }) {
    const [stats, setStats] = useState({ saldo: 0, colheitaHoje: 0, vendasHoje: 0, plantioAtivo: 0, maquinasAlert: 0, pendentes: 0 });
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [menuItems, setMenuItems] = useState([]);

    // ESTADOS PARA O DRAG & DROP NATIVO
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

    const handleMove = (fromIndex, colMove, rowMove) => {
        let targetCol = (fromIndex % NUM_COLS) + colMove;
        let targetRow = Math.floor(fromIndex / NUM_COLS) + rowMove;

        targetCol = Math.max(0, Math.min(NUM_COLS - 1, targetCol));
        const maxRow = Math.floor((menuItems.length - 1) / NUM_COLS);
        targetRow = Math.max(0, Math.min(maxRow, targetRow));

        let targetIndex = targetRow * NUM_COLS + targetCol;
        targetIndex = Math.max(0, Math.min(menuItems.length - 1, targetIndex));

        if (targetIndex !== fromIndex) {
            setMenuItems(prev => {
                const newItems = [...prev];
                const item = newItems.splice(fromIndex, 1)[0];
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

    const renderItem = ({ item, index }) => {
        if (isEditMode) {
            return <DraggableCard item={item} index={index} onMove={handleMove} shakeAnim={shakeAnim} />;
        }
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleNavPress(item)}
                onLongPress={toggleEditMode}
                delayLongPress={600}
                activeOpacity={0.75}
            >
                <View style={styles.iconCircle}>
                    <Ionicons name={item.icon} size={22} color={DARK.glow} />
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.label}</Text>
            </TouchableOpacity>
        );
    };

    return (
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
                {stats.maquinasAlert > 0 && !isEditMode && (
                    <TouchableOpacity style={styles.alertBar} onPress={() => navigation.navigate('Frota')}>
                        <Ionicons name="warning" size={18} color={DARK.warning} />
                        <Text style={styles.alertText}>{stats.maquinasAlert} MÁQUINAS PRECISAM DE REVISÃO</Text>
                        <Ionicons name="chevron-forward" size={18} color={DARK.warning} />
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
                    <Text style={styles.dragHintText}>Arraste os ícones para mudar a ordem</Text>
                )}

                {menuItems.length > 0 && (
                    <FlatList
                        data={menuItems}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        numColumns={NUM_COLS}
                        columnWrapperStyle={styles.gridRow}
                        contentContainerStyle={styles.gridContent}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={!isEditMode}
                        ListFooterComponent={
                            <View style={styles.footer}>
                                <Text style={styles.version}>AgroGB Mobile v8.2 • Dark Agro Tech</Text>
                            </View>
                        }
                    />
                )}
            </View>

            <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
        </View>
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

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.8)', letterSpacing: 1.5 },
    doneBtn: { backgroundColor: '#4ADE80', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    doneBtnText: { color: '#064E3B', fontSize: 10, fontWeight: '900' },
    dragHintText: { fontSize: 11, color: '#A7F3D0', fontWeight: 'bold', marginBottom: 14 },

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
    cardEditMode: {
        borderColor: '#10B981',
        borderWidth: 1.5,
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    cardDragging: {
        backgroundColor: '#FFFFFF',
        borderColor: '#059669',
        borderWidth: 2,
        transform: [{ scale: 1.1 }],
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 15,
    },
    editBadge: { position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    iconCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(31,122,90,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 10, fontWeight: '700', color: '#334155', textAlign: 'center', paddingHorizontal: 4 },

    footer: { marginTop: 24, alignItems: 'center' },
    version: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 'bold' },
});

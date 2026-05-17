import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    StatusBar,
    SafeAreaView,
    Platform,
    ScrollView,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { executeQuery } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SafeBlurView from '../ui/SafeBlurView';
import { showToast } from '../ui/Toast';

export default function EncomendasScreen() {
    const navigation = useNavigation();

    // ── VIEW ──────────────────────────────────────────────────────────────────
    const [view, setView] = useState('LIST');
    const [filter, setFilter] = useState('TODOS');

    // ── DATA ────────────────────────────────────────────────────────────────
    const [encomendas, setEncomendas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState({ totalValor: 0, totalAtivas: 0 });

    // ── LOAD ─────────────────────────────────────────────────────────────────
    const loadEncomendas = useCallback(async () => {
        setLoading(true);
        try {
            const query = `
                SELECT o.*, c.nome as cliente_nome, p.nome as produto_nome
                FROM orders o
                LEFT JOIN clientes c ON o.cliente_id = c.uuid
                LEFT JOIN cadastro p ON o.produto_id = p.uuid
                WHERE o.is_deleted = 0
                ORDER BY o.data_prevista ASC`;
            const result = await executeQuery(query);
            const data = [];
            let totalValue = 0;
            let activeCount = 0;

            for (let i = 0; i < result.rows.length; i++) {
                const item = result.rows.item(i);
                data.push(item);
                if (item.status === 'PENDENTE' || item.status === 'PARCIAL') {
                    activeCount++;
                    totalValue += (item.quantidade_total * (item.valor_unitario || 0));
                }
            }
            setEncomendas(data);
            setDashboardData({ totalValor: totalValue, totalAtivas: activeCount });
        } catch (e) {
            setEncomendas([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadEncomendas(); }, [loadEncomendas]));

    // ── COMPUTED ────────────────────────────────────────────────────────────
    const filteredData = useMemo(() => {
        let list = encomendas;
        if (filter === 'PENDENTE') list = encomendas.filter(e => e.status === 'PENDENTE' || e.status === 'PARCIAL');
        else if (filter === 'ENTREGUE') list = encomendas.filter(e => e.status === 'CONCLUIDA');
        else if (filter === 'CANCELADA') list = encomendas.filter(e => e.status === 'CANCELADA');

        return list.sort((a, b) => {
            if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1;
            if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1;
            return 0;
        });
    }, [encomendas, filter]);

    const statusConfig = (status) => {
        switch (status) {
            case 'PENDENTE':  return { color: '#F59E0B', icon: 'time',              label: 'PENDENTE' };
            case 'PARCIAL':   return { color: '#3B82F6', icon: 'sync-circle',       label: 'PARCIAL'  };
            case 'CONCLUIDA': return { color: '#10B981', icon: 'checkmark-circle',  label: 'ENTREGUE' };
            case 'CANCELADA': return { color: '#EF4444', icon: 'close-circle',      label: 'CANCELADA'};
            default:          return { color: '#64748B', icon: 'help-circle',       label: 'N/A'      };
        }
    };

    // ── RENDER LIST ──────────────────────────────────────────────────────────
    const renderList = () => (
        <View style={{ flex: 1, paddingHorizontal: 22 }}>
            {/* HEADER */}
            <View style={[styles.header, { paddingHorizontal: 0 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
                    <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.headerTitle}>ENCOMENDAS</Text>
                    <Text style={styles.headerSub}>LOGÍSTICA & ENTREGAS</Text>
                </View>
                <View style={{ width: 42 }} />
            </View>

            {/* DASHBOARD STRIP */}
            <SafeBlurView intensity={20} style={styles.dashStrip} webFallbackColor="rgba(255,255,255,0.03)">
                <View>
                    <Text style={styles.dashLabel}>EM ABERTO</Text>
                    <Text style={styles.dashValue}>
                        R$ {dashboardData.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                </View>
                <View style={styles.dashBadge}>
                    <Text style={styles.dashBadgeNum}>{dashboardData.totalAtivas}</Text>
                    <Text style={styles.dashBadgeLbl}>ATIVAS</Text>
                </View>
            </SafeBlurView>

            {/* FILTER CHIPS */}
            <View style={styles.filterRow}>
                {['TODOS', 'PENDENTE', 'ENTREGUE', 'CANCELADA'].map(chip => {
                    const active = filter === chip;
                    return (
                        <TouchableOpacity
                            key={chip}
                            style={[styles.filterChip, active && styles.filterChipActive]}
                            onPress={() => setFilter(chip)}
                        >
                            <Text style={[styles.filterText, active && styles.filterTextActive]}>
                                {chip === 'ENTREGUE' ? 'ENTREGUES' : chip === 'CANCELADA' ? 'CANCELADAS' : chip}
                            </Text>
                            {active && <View style={styles.filterDot} />}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* LIST */}
            {loading ? (
                <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} />
            ) : filteredData.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="rocket-outline" size={48} color="rgba(255,255,255,0.1)" />
                    <Text style={[styles.emptyText, { marginTop: 16 }]}>Sem encomendas aqui.</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
                    {filteredData.map(item => {
                        const cfg = statusConfig(item.status);
                        const total = item.quantidade_total * (item.valor_unitario || 0);
                        return (
                            <SafeBlurView key={item.id?.toString()} intensity={15} style={styles.orderCard} webFallbackColor="rgba(255,255,255,0.02)">
                                <View style={[styles.orderIndicator, { backgroundColor: cfg.color }]} />
                                <View style={{ flex: 1, padding: 16 }}>
                                    {/* Card Header */}
                                    <View style={styles.cardHeaderRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.clientName}>{item.cliente_nome || 'CLIENTE NÃO INFORMADO'}</Text>
                                            <Text style={styles.dateText}>
                                                {item.data_prevista
                                                    ? new Date(item.data_prevista).toLocaleDateString('pt-BR')
                                                    : 'Sem data definida'}
                                            </Text>
                                        </View>
                                        <View style={[styles.statusPill, { backgroundColor: cfg.color + '22' }]}>
                                            <Ionicons name={cfg.icon} size={12} color={cfg.color} style={{ marginRight: 4 }} />
                                            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    {/* Card Details */}
                                    <View style={styles.detailsRow}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <View style={styles.prodIconBox}>
                                                <Ionicons name="cube-outline" size={18} color="#94A3B8" />
                                            </View>
                                            <View style={{ marginLeft: 10 }}>
                                                <Text style={styles.productName}>{item.produto_nome || 'Produto'}</Text>
                                                <Text style={styles.productQtd}>{item.quantidade_total} {item.unidade || 'UN'}</Text>
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.valueLabel}>VALOR TOTAL</Text>
                                            <Text style={styles.valueAmount}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                                        </View>
                                    </View>

                                    {/* Actions */}
                                    <View style={styles.actionRow}>
                                        <TouchableOpacity
                                            style={styles.ghostBtn}
                                            onPress={() => navigation.navigate('NovaEncomenda', { encomenda: item })}
                                        >
                                            <Text style={styles.ghostBtnText}>Editar Pedido</Text>
                                        </TouchableOpacity>

                                        {(item.status === 'PENDENTE' || item.status === 'PARCIAL') && (
                                            <TouchableOpacity
                                                style={styles.actionBtn}
                                                onPress={() => navigation.navigate('Vendas', {
                                                    autoFill: true,
                                                    cliente: item.cliente_nome,
                                                    produto: item.produto_nome,
                                                    quantidade: item.quantidade_restante?.toString(),
                                                    order_id: item.id
                                                })}
                                            >
                                                <Text style={styles.actionBtnText}>Dar Baixa</Text>
                                                <Ionicons name="arrow-forward" size={13} color="#FFF" style={{ marginLeft: 4 }} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </SafeBlurView>
                        );
                    })}
                </ScrollView>
            )}

            {/* FAB DIAMOND PRO */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => navigation.navigate('NovaEncomenda')}>
                <LinearGradient colors={['#D4AF37', '#9A7B2C']} style={styles.fabGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="add" size={30} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    // ── MAIN RENDER ──────────────────────────────────────────────────────────
    return (
        <View style={styles.webContainer}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#020617', '#0A0F1C', '#030712']} style={StyleSheet.absoluteFill} />

            {/* AMBIENT ORBS */}
            <View style={[styles.ambientOrb, { top: -60, right: -40, backgroundColor: '#D4AF37', opacity: 0.08 }]} />
            <View style={[styles.ambientOrb, { bottom: 40, left: -60, backgroundColor: '#10B981', opacity: 0.1 }]} />

            <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
                {renderList()}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    webContainer: { flex: 1, backgroundColor: '#020617' },
    ambientOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, zIndex: -1 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 22,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
        paddingBottom: 20,
    },
    backBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 13, fontWeight: '900', color: '#F8FAFC', letterSpacing: 2 },
    headerSub: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: 1, marginTop: 4 },

    dashStrip: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderRadius: 20, padding: 20, marginBottom: 18,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    dashLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
    dashValue: { color: '#10B981', fontSize: 24, fontWeight: '900', marginTop: 4, letterSpacing: -0.5 },
    dashBadge: {
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingVertical: 10, paddingHorizontal: 18,
        borderRadius: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    dashBadgeNum: { color: '#10B981', fontSize: 20, fontWeight: '900' },
    dashBadgeLbl: { color: '#10B981', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 2 },

    filterRow: { flexDirection: 'row', marginBottom: 16 },
    filterChip: { paddingVertical: 10, paddingHorizontal: 12, marginRight: 6, borderRadius: 24, alignItems: 'center' },
    filterChipActive: { backgroundColor: 'rgba(255,255,255,0.05)' },
    filterText: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    filterTextActive: { color: '#FFF' },
    filterDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#10B981', marginTop: 4 },

    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: '600' },

    orderCard: {
        flexDirection: 'row', borderRadius: 22, marginBottom: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
    },
    orderIndicator: { width: 5 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    clientName: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
    dateText: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '500', marginTop: 4 },
    statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 14 },

    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    prodIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    productName: { color: '#CBD5E1', fontSize: 14, fontWeight: '700' },
    productQtd: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
    valueLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    valueAmount: { color: '#F8FAFC', fontSize: 17, fontWeight: '900' },

    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16, gap: 12 },
    ghostBtn: { paddingVertical: 8, paddingHorizontal: 12 },
    ghostBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700' },
    actionBtn: {
        backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14,
    },
    actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

    fab: {
        position: 'absolute', right: 0, bottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4, shadowRadius: 15, elevation: 10,
    },
    fabGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});

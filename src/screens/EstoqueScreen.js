import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert, ScrollView } from 'react-native';
import { getEstoque, atualizarEstoque } from '../database/database';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import MetricCard from '../components/common/MetricCard';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

export default function EstoqueScreen({ navigation }) {
    const { theme } = useTheme();
    const [originalItems, setOriginalItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('TODOS');
    const [searchText, setSearchText] = useState('');

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [actionType, setActionType] = useState('ENTRADA');
    const [qty, setQty] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getEstoque();
            const sorted = data.sort((a, b) => a.produto.localeCompare(b.produto));
            setOriginalItems(sorted);
            applyFilter(sorted, filter, searchText);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));
    useEffect(() => { applyFilter(originalItems, filter, searchText); }, [filter, searchText, originalItems]);

    const applyFilter = (data, mode, text) => {
        let res = data;
        if (mode === 'LOW') res = res.filter(i => i.quantidade > 0 && i.quantidade <= 10);
        if (mode === 'ZERO') res = res.filter(i => i.quantidade <= 0);
        if (text) res = res.filter(i => i.produto.toUpperCase().includes(text.toUpperCase()));
        setFilteredItems(res);
    };

    const getStatusInfo = (qtd) => {
        if (qtd <= 0) return { color: '#EF4444', label: 'Esgotado', bg: '#FEF2F2' };
        if (qtd <= 10) return { color: '#F59E0B', label: 'Baixo', bg: '#FFFBEB' };
        return { color: '#10B981', label: 'Normal', bg: '#F0FDF4' };
    };

    const openModal = (item, type) => {
        setSelectedItem(item);
        setActionType(type);
        setQty('');
        setModalVisible(true);
    };

    const confirmAction = async () => {
        if (!qty || isNaN(qty) || parseFloat(qty) <= 0) { Alert.alert('Erro', 'Valor inválido.'); return; }
        const delta = actionType === 'ENTRADA' ? parseFloat(qty) : -parseFloat(qty);
        try {
            await atualizarEstoque(selectedItem.produto, delta);
            setModalVisible(false);
            loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao atualizar.'); }
    };

    const lowStockCount = originalItems.filter(i => i.quantidade <= 10).length;

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>CONTROLE DE ESTOQUE</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.summaryRow}>
                    <MetricCard 
                        title="Alertas (Baixo)" 
                        value={lowStockCount.toString()} 
                        icon="alert-circle" 
                        color="#FFF"
                        style={styles.summaryCard}
                    />
                    <MetricCard 
                        title="Total Itens" 
                        value={originalItems.length.toString()} 
                        icon="cube" 
                        color="#FFF"
                        style={styles.summaryCard}
                    />
                </View>
            </LinearGradient>

            <View style={styles.searchContainer}>
                <AgroInput 
                    placeholder="Buscar produto no estoque..."
                    value={searchText}
                    onChangeText={setSearchText}
                    icon="search"
                    style={styles.searchBar}
                />
            </View>

            <View style={styles.tabsContainer}>
                {['TODOS', 'LOW', 'ZERO'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, filter === tab && styles.tabActive]}
                        onPress={() => setFilter(tab)}
                    >
                        <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
                            {tab === 'TODOS' ? 'Todos' : tab === 'LOW' ? 'Baixo' : 'Acabou'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? <ActivityIndicator color={theme?.colors?.primary} style={{ marginTop: 50 }} /> :
                <FlatList
                    data={filteredItems}
                    keyExtractor={i => i.produto}
                    renderItem={({ item }) => {
                        const st = getStatusInfo(item.quantidade);
                        return (
                            <Card style={styles.itemCard} noPadding>
                                <View style={styles.row}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName}>{item.produto}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                                            <View style={[styles.statusDot, { backgroundColor: st.color }]} />
                                            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.itemQtyBox}>
                                        <Text style={styles.itemQty}>{item.quantidade}</Text>
                                        <Text style={styles.itemUnit}>{item.unidade || 'un'}</Text>
                                    </View>
                                    <View style={styles.actions}>
                                        <TouchableOpacity onPress={() => openModal(item, 'ENTRADA')} style={styles.actionBtn}>
                                            <Ionicons name="add" size={20} color="#10B981" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => openModal(item, 'SAIDA')} style={[styles.actionBtn, { marginLeft: 8 }]}>
                                            <Ionicons name="remove" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Card>
                        );
                    }}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListEmptyComponent={<Text style={styles.empty}>Nenhum registro encontrado.</Text>}
                />
            }

            {/* ADJUSTMENT MODAL */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <Card style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{actionType === 'ENTRADA' ? 'ENTRADA DE ESTOQUE' : 'BAIXA DE ESTOQUE'}</Text>
                        <Text style={styles.modalSub}>{selectedItem?.produto}</Text>

                        <AgroInput 
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={qty}
                            onChangeText={setQty}
                            style={styles.modalInput}
                            autoFocus
                        />

                        <View style={styles.modalActions}>
                            <AgroButton title="CANCELAR" onPress={() => setModalVisible(false)} variant="secondary" style={{ flex: 1 }} />
                            <AgroButton 
                                title="CONFIRMAR" 
                                onPress={confirmAction} 
                                color={actionType === 'ENTRADA' ? '#10B981' : '#EF4444'} 
                                style={{ flex: 1 }} 
                            />
                        </View>
                    </Card>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    summaryRow: { flexDirection: 'row', gap: 10 },
    summaryCard: { flex: 1, height: 90, marginHorizontal: 0 },
    searchContainer: { paddingHorizontal: 20, marginTop: -25 },
    searchBar: { backgroundColor: '#FFF', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginVertical: 15, gap: 10 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: '#E5E7EB' },
    tabActive: { backgroundColor: '#10B981' },
    tabText: { fontSize: 12, fontWeight: 'bold', color: '#4B5563' },
    tabTextActive: { color: '#FFF' },
    itemCard: { marginBottom: 10 },
    row: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    itemInfo: { flex: 2 },
    itemName: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginBottom: 5 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', gap: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    itemQtyBox: { flex: 1, alignItems: 'center' },
    itemQty: { fontSize: 18, fontWeight: '900', color: '#1F2937' },
    itemUnit: { fontSize: 10, color: '#9CA3AF' },
    actions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
    actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { padding: 25 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#111827', textAlign: 'center' },
    modalSub: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
    modalInput: { textAlign: 'center', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    modalActions: { flexDirection: 'row', gap: 10 }
});

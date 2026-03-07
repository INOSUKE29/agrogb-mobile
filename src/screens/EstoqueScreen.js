import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert, ScrollView } from 'react-native';
import { getEstoque, atualizarEstoque, registrarAjusteEstoqueInicial } from '../services/EstoqueService';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { showToast } from '../ui/Toast';
import { useTheme } from '../context/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';
import SkeletonCard from '../ui/SkeletonCard';

export default function EstoqueScreen({ navigation }) {
    const { colors, theme } = useTheme();
    const [originalItems, setOriginalItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('TODOS');
    const [searchText, setSearchText] = useState('');

    // Modal Ajuste Rápido (Antigo / + e -)
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [actionType, setActionType] = useState('ENTRADA');
    const [qty, setQty] = useState('');

    // Modal Estoque Inicial (Novo Fluxo)
    const [modalAjusteVisible, setModalAjusteVisible] = useState(false);
    const [newEstoque, setNewEstoque] = useState({ produto: '', quantidade: '', unidade: 'kg', observacao: '' });

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getEstoque();
            const sorted = data.sort((a, b) => {
                if (a.produto < b.produto) return -1;
                if (a.produto > b.produto) return 1;
                return 0;
            });
            setOriginalItems(sorted);
            applyFilter(sorted, filter, searchText);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));
    useEffect(() => { applyFilter(originalItems, filter, searchText); }, [filter, searchText]);

    const applyFilter = (data, mode, text) => {
        let res = data;
        if (mode === 'LOW') res = res.filter(i => i.quantidade > 0 && i.quantidade <= 10);
        if (mode === 'ZERO') res = res.filter(i => i.quantidade <= 0);
        if (text) res = res.filter(i => i.produto.toUpperCase().includes(text.toUpperCase()));
        setFilteredItems(res);
    };

    const getStatusInfo = (qtd) => {
        if (qtd <= 0) return { color: colors.danger, label: 'ESGOTADO', bg: colors.danger + '15' };
        if (qtd <= 10) return { color: colors.warningDark, label: 'BAIXO', bg: colors.warning + '15' };
        return { color: colors.primary, label: 'NORMAL', bg: colors.primary + '15' };
    };

    const openModal = (item, type) => {
        setSelectedItem(item);
        setActionType(type);
        setQty('');
        setModalVisible(true);
    };

    const confirmAction = async () => {
        if (!qty || isNaN(qty) || parseFloat(qty) <= 0) {
            Alert.alert('Erro', 'Por favor, informe um valor válido.');
            return;
        }
        const delta = actionType === 'ENTRADA' ? parseFloat(qty) : -parseFloat(qty);
        try {
            await atualizarEstoque(selectedItem.produto, delta);
            setModalVisible(false);
            showToast('Estoque atualizado com sucesso!');
            loadData();
        } catch (e) {
            Alert.alert('Erro', 'Falha ao atualizar o estoque.');
        }
    };

    const handleSalvarAjuste = async () => {
        if (!newEstoque.produto || !newEstoque.quantidade) {
            Alert.alert('Atenção', 'Campos obrigatórios não preenchidos.');
            return;
        }
        try {
            await registrarAjusteEstoqueInicial({
                uuid: uuidv4(),
                produto: newEstoque.produto.toUpperCase(),
                quantidade: parseFloat(newEstoque.quantidade),
                unidade: (newEstoque.unidade || 'kg').toLowerCase(),
                observacao: newEstoque.observacao.toUpperCase()
            });
            setModalAjusteVisible(false);
            setNewEstoque({ produto: '', quantidade: '', unidade: 'kg', observacao: '' });
            showToast('Lançamento inicial registrado!');
            loadData();
        } catch (e) {
            Alert.alert('Erro', 'Falha ao salvar o ajuste.');
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={colors.placeholder} />
                <TextInput
                    style={[styles.inputSearch, { color: colors.textPrimary }]}
                    placeholder="Filtrar por nome do produto..."
                    placeholderTextColor={colors.placeholder}
                    value={searchText}
                    onChangeText={setSearchText}
                />
            </View>

            <View style={styles.tabsContainer}>
                {['TODOS', 'LOW', 'ZERO'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tab,
                            { borderColor: colors.glassBorder },
                            filter === tab && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                        onPress={() => setFilter(tab)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: colors.textSecondary },
                            filter === tab && { color: '#FFF' }
                        ]}>
                            {tab === 'TODOS' ? 'Todos' : tab === 'LOW' ? 'Baixo' : 'Zerado'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderItem = ({ item }) => {
        const st = getStatusInfo(item.quantidade);
        return (
            <GlowCard style={styles.itemCard}>
                <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>{item.produto}</Text>
                    <Text style={[styles.itemCat, { color: colors.textMuted }]}>{item.tipo || 'CATEGORIA GERAL'}</Text>

                    <View style={styles.itemStatsRow}>
                        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                            <View style={[styles.statusDot, { backgroundColor: st.color }]} />
                            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                        </View>
                        <Text style={[styles.qtyLabel, { color: colors.textSecondary }]}>
                            Disponível: <Text style={{ color: colors.primary, fontWeight: '900' }}>{item.quantidade} {item.unidade || 'un'}</Text>
                        </Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={() => openModal(item, 'ENTRADA')}
                        style={[styles.miniBtn, { backgroundColor: colors.primary + '10' }]}
                    >
                        <Ionicons name="add" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => openModal(item, 'SAIDA')}
                        style={[styles.miniBtn, { backgroundColor: colors.danger + '10' }]}
                    >
                        <Ionicons name="remove" size={18} color={colors.danger} />
                    </TouchableOpacity>
                </View>
            </GlowCard>
        );
    };

    return (
        <AppContainer>
            <ScreenHeader
                title="ESTOQUE & INSUMOS"
                onBack={() => navigation.goBack()}
                rightElement={
                    <TouchableOpacity onPress={() => setModalAjusteVisible(true)}>
                        <Ionicons name="add-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                }
            />

            <FlatList
                data={loading ? [] : filteredItems}
                keyExtractor={(item, index) => item.produto + index}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                ListLoadingComponent={
                    <View style={{ padding: 20 }}>
                        <SkeletonCard height={80} />
                        <SkeletonCard height={80} />
                        <SkeletonCard height={80} />
                    </View>
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cube-outline" size={48} color={colors.placeholder} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                Nenhum produto encontrado com os filtros aplicados.
                            </Text>
                        </View>
                    )
                }
            />

            {/* MODAL AJUSTE RÁPIDO */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <GlowCard style={styles.miniModal}>
                        <Text style={[styles.miniModalTitle, { color: colors.textPrimary }]}>
                            {actionType === 'ENTRADA' ? 'ENTRADA MANUAL' : 'SAÍDA MANUAL'}
                        </Text>
                        <Text style={[styles.miniModalSub, { color: colors.textMuted }]}>{selectedItem?.produto}</Text>

                        <View style={styles.inputWrap}>
                            <TextInput
                                style={[styles.modalInput, { color: colors.textPrimary, borderBottomColor: colors.glassBorder }]}
                                placeholder="0.00"
                                placeholderTextColor={colors.placeholder}
                                keyboardType="decimal-pad"
                                autoFocus
                                value={qty}
                                onChangeText={setQty}
                            />
                            <Text style={[styles.modalUnit, { color: colors.textMuted }]}>{selectedItem?.unidade}</Text>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={[styles.modalBtnCancel, { borderColor: colors.glassBorder }]}
                            >
                                <Text style={{ color: colors.textMuted, fontWeight: 'bold' }}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmAction}
                                style={[
                                    styles.modalBtnConfirm,
                                    { backgroundColor: actionType === 'ENTRADA' ? colors.primary : colors.danger }
                                ]}
                            >
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>CONFIRMAR</Text>
                            </TouchableOpacity>
                        </View>
                    </GlowCard>
                </View>
            </Modal>

            {/* MODAL ESTOQUE INICIAL */}
            <Modal visible={modalAjusteVisible} transparent={false} animationType="slide">
                <AppContainer>
                    <ScreenHeader
                        title="ESTOQUE INICIAL"
                        onBack={() => setModalAjusteVisible(false)}
                    />

                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, padding: 20 }}>
                        <GlowCard style={{ padding: 20 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>NOME DO PRODUTO *</Text>
                            <GlowInput
                                placeholder="Ex: ADUBO NPK 10-10-10"
                                value={newEstoque.produto}
                                onChangeText={(t) => setNewEstoque(prev => ({ ...prev, produto: t }))}
                            />

                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>QUANTIDADE *</Text>
                                    <GlowInput
                                        placeholder="0.00"
                                        keyboardType="decimal-pad"
                                        value={newEstoque.quantidade}
                                        onChangeText={(t) => setNewEstoque(prev => ({ ...prev, quantidade: t }))}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>UNIDADE</Text>
                                    <GlowInput
                                        placeholder="Ex: KG, UN, LT"
                                        value={newEstoque.unidade}
                                        onChangeText={(t) => setNewEstoque(prev => ({ ...prev, unidade: t }))}
                                    />
                                </View>
                            </View>

                            <Text style={[styles.label, { color: colors.textSecondary }]}>OBSERVAÇÃO (OPCIONAL)</Text>
                            <GlowInput
                                placeholder="Lote, validade, anotações..."
                                multiline
                                style={{ height: 100, textAlignVertical: 'top' }}
                                value={newEstoque.observacao}
                                onChangeText={(t) => setNewEstoque(prev => ({ ...prev, observacao: t }))}
                            />

                            <View style={[styles.infoBox, { backgroundColor: colors.primary + '10' }]}>
                                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                                <Text style={[styles.helperText, { color: colors.textMuted }]}>
                                    O lançamento inicial serve para ajustar o inventário sem gerar registros financeiros de custo.
                                </Text>
                            </View>

                            <PrimaryButton
                                label="SALVAR NO ESTOQUE"
                                onPress={handleSalvarAjuste}
                                icon="checkmark-circle"
                                style={{ marginTop: 20 }}
                            />
                        </GlowCard>
                    </ScrollView>
                </AppContainer>
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 15 },
    searchBar: {
        flexDirection: 'row',
        height: 50,
        borderRadius: 14,
        paddingHorizontal: 15,
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    inputSearch: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '500' },

    tabsContainer: { flexDirection: 'row', gap: 8 },
    tab: { flex: 1, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    tabText: { fontSize: 11, fontWeight: '900' },

    listContent: { paddingBottom: 100 },
    itemCard: { marginHorizontal: 20, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 15, fontWeight: 'bold' },
    itemCat: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, marginTop: 2 },

    itemStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
    statusDot: { width: 5, height: 5, borderRadius: 3 },
    statusText: { fontSize: 9, fontWeight: '900' },
    qtyLabel: { fontSize: 11, fontWeight: '500' },

    actions: { flexDirection: 'row', gap: 6 },
    miniBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    emptyContainer: { alignItems: 'center', marginTop: 80, opacity: 0.5 },
    emptyText: { textAlign: 'center', fontSize: 13, fontWeight: '500', marginTop: 15, paddingHorizontal: 40 },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 25 },
    miniModal: { padding: 25, borderRadius: 24 },
    miniModalTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center', marginBottom: 5 },
    miniModalSub: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 25 },

    inputWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
    modalInput: { fontSize: 42, fontWeight: '900', minWidth: 100, textAlign: 'center', borderBottomWidth: 2 },
    modalUnit: { fontSize: 14, marginLeft: 10, fontWeight: '900', opacity: 0.6 },

    modalActions: { flexDirection: 'row', gap: 12 },
    modalBtnCancel: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    modalBtnConfirm: { flex: 2, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

    label: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    row: { flexDirection: 'row', gap: 15 },
    infoBox: { flexDirection: 'row', gap: 10, padding: 15, borderRadius: 12, marginTop: 10, alignItems: 'center' },
    helperText: { flex: 1, fontSize: 11, fontStyle: 'italic', lineHeight: 16 }
});

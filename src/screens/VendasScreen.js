import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, Animated } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { getCadastro, getClientes, insertCliente } from '../database/database';
import { insertVenda, getVendasRecentes, deleteVenda, updateVenda, marcarVendaRecebida } from '../services/VendaService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AutoSyncService from '../services/AutoSyncService';
import { showToast } from '../ui/Toast';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfirmModal from '../ui/ConfirmModal';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';

export default function VendasScreen({ navigation, route }) {
    const { colors, theme } = useTheme();
    const [cliente, setCliente] = useState('');
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valor, setValor] = useState('');
    const [observacao, setObservacao] = useState('');
    const [statusPagamento, setStatusPagamento] = useState('A_RECEBER');
    const [editingUuid, setEditingUuid] = useState(null);

    // Data State
    const [history, setHistory] = useState([]);
    const [filterStatus, setFilterStatus] = useState('TODAS');
    const [refreshing, setRefreshing] = useState(false);

    // Modal States
    const [modalVisible, setModalVisible] = useState(false); // Product
    const [clientModalVisible, setClientModalVisible] = useState(false); // Client

    // Recebimento modal
    const [recebimentoModal, setRecebimentoModal] = useState(false);
    const [recebimentoItem, setRecebimentoItem] = useState(null);
    const [valorRecebido, setValorRecebido] = useState('');

    // Lists
    const [items, setItems] = useState([]);
    const [clients, setClients] = useState([]);

    // Search
    const [searchText, setSearchText] = useState('');
    const [clientSearchText, setClientSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    // Delete State
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const DRAFT_KEY = '@draft_VendasScreen_v2';

    const isDark = theme === 'dark' || theme === 'ultra_premium';

    // Rascunho - Recuperação
    useEffect(() => {
        const checkDraft = async () => {
            try {
                const saved = await AsyncStorage.getItem(DRAFT_KEY);
                if (saved) {
                    Alert.alert(
                        'Rascunho Encontrado',
                        'Existe uma venda não finalizada. Deseja continuá-la?',
                        [
                            { text: 'Descartar', style: 'destructive', onPress: () => AsyncStorage.removeItem(DRAFT_KEY) },
                            {
                                text: 'Continuar', onPress: () => {
                                    const draft = JSON.parse(saved);
                                    setCliente(draft.cliente || '');
                                    setProduto(draft.produto || '');
                                    setQuantidade(draft.quantidade || '');
                                    setValor(draft.valor || '');
                                    setObservacao(draft.observacao || '');
                                    setStatusPagamento(draft.statusPagamento || 'A_RECEBER');
                                }
                            }
                        ]
                    );
                }
            } catch (e) { console.log('Draft error:', e); }
        };
        setTimeout(checkDraft, 600);
    }, []);

    // Rascunho - Auto-Save
    useEffect(() => {
        const saveDraft = async () => {
            if (!editingUuid && (cliente || produto || quantidade || valor)) {
                await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ cliente, produto, quantidade, valor, observacao, statusPagamento }));
            } else if (!editingUuid && !cliente && !produto && !quantidade && !valor) {
                await AsyncStorage.removeItem(DRAFT_KEY);
            }
        };
        const timer = setTimeout(saveDraft, 1000);
        return () => clearTimeout(timer);
    }, [cliente, produto, quantidade, valor, observacao, statusPagamento, editingUuid]);

    useFocusEffect(useCallback(() => {
        loadInitialData();
        loadHistory();
    }, []));

    useEffect(() => {
        if (route?.params?.newClient) {
            setCliente(route.params.newClient.nome.toUpperCase());
            getClientes().then(setClients);
            navigation.setParams({ newClient: undefined });
        }
    }, [route?.params?.newClient]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const allItems = await getCadastro();
            const sellable = allItems.filter(i => i.vendavel === 1 || i.vendavel === true || i.vendavel === "1");
            setItems(sellable);

            const allClients = await getClientes();
            setClients(allClients);
        } catch (e) {
            console.error('[SCREEN ERROR]', e);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        const data = await getVendasRecentes();
        setHistory(data);
    };

    const up = (t, setter) => setter(t.toUpperCase());

    const salvar = async () => {
        if (!produto || !quantidade || !valor) {
            Alert.alert('Atenção', 'Produto, Qtd e Valor são obrigatórios.');
            return;
        }

        const dados = {
            uuid: editingUuid || uuidv4(),
            cliente: (cliente || 'BALCÃO').toUpperCase(),
            produto: produto.toUpperCase(),
            quantidade: parseFloat(quantidade),
            valor: parseFloat(valor),
            observacao: observacao.toUpperCase(),
            data: new Date().toISOString().split('T')[0],
            status_pagamento: statusPagamento,
            data_recebimento: statusPagamento === 'RECEBIDO' ? new Date().toISOString() : null
        };

        try {
            if (editingUuid) {
                await updateVenda(editingUuid, dados);
                showToast('Venda atualizada com sucesso!');
                setEditingUuid(null);
            } else {
                await insertVenda(dados);
                showToast('Venda registrada com sucesso!');
            }

            setProduto('');
            setQuantidade('');
            setValor('');
            setObservacao('');
            setStatusPagamento('A_RECEBER');

            await AsyncStorage.removeItem(DRAFT_KEY);
            loadHistory();
            AutoSyncService.trigger();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao processar venda.');
        }
    };

    const handleEdit = (item) => {
        setEditingUuid(item.uuid);
        setCliente(item.cliente);
        setProduto(item.produto);
        setQuantidade(item.quantidade.toString());
        setValor(item.valor.toString());
        setObservacao(item.observacao || '');
        setStatusPagamento(item.status_pagamento || 'A_RECEBER');
    };

    const handleDelete = (item) => {
        setItemToDelete(item);
        setConfirmVisible(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            await deleteVenda(itemToDelete.uuid);
            setConfirmVisible(false);
            setItemToDelete(null);
            showToast('Venda excluída com sucesso!');
            loadHistory();
        }
    };

    const getFilteredItems = () => {
        if (!searchText) return items;
        return items.filter(i => i.nome.includes(searchText.toUpperCase()));
    };

    const getFilteredClients = () => {
        if (!clientSearchText) return clients;
        return clients.filter(c => c.nome.includes(clientSearchText.toUpperCase()));
    };

    const handleBaixar = (item) => {
        setRecebimentoItem(item);
        setValorRecebido(item.valor ? item.valor.toString() : '');
        setRecebimentoModal(true);
    };

    const confirmarRecebimento = async () => {
        if (!valorRecebido || isNaN(parseFloat(valorRecebido))) {
            Alert.alert('Atenção', 'Informe o valor recebido.');
            return;
        }
        try {
            await marcarVendaRecebida(recebimentoItem.uuid, parseFloat(valorRecebido));
            setRecebimentoModal(false);
            setRecebimentoItem(null);
            setValorRecebido('');
            loadHistory();
            Alert.alert('✅ Recebido!', `Venda de ${recebimentoItem.produto} marcada como recebida.`);
        } catch (e) {
            Alert.alert('Erro', 'Falha ao marcar como recebido.');
        }
    };

    const getFilteredHistory = () => {
        if (filterStatus === 'TODAS') return history;
        if (filterStatus === 'A_RECEBER') return history.filter(h => h.status_pagamento !== 'RECEBIDO');
        return history.filter(h => h.status_pagamento === 'RECEBIDO');
    };

    return (
        <AppContainer>
            <ScreenHeader
                title="VENDAS & SAÍDAS"
                onBack={() => navigation.goBack()}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* BLOCO DE ENTRADA */}
                <GlowCard style={styles.card}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>DADOS DA TRANSAÇÃO</Text>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>CLIENTE / PARCEIRO</Text>
                    <TouchableOpacity
                        style={[styles.selectBtn, { backgroundColor: colors.cardAlt, borderColor: colors.glassBorder }]}
                        onPress={() => setClientModalVisible(true)}
                    >
                        <Text style={[styles.selectText, { color: colors.textPrimary }, !cliente && { color: colors.placeholder }]}>
                            {cliente || 'SELECIONAR CLIENTE...'}
                        </Text>
                        <Ionicons name="people-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>PRODUTO VENDIDO *</Text>
                    <TouchableOpacity
                        style={[styles.selectBtn, { backgroundColor: colors.cardAlt, borderColor: colors.glassBorder }]}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={[styles.selectText, { color: colors.textPrimary }, !produto && { color: colors.placeholder }]}>
                            {produto || 'SELECIONAR PRODUTO...'}
                        </Text>
                        <Ionicons name="cube-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>QTD *</Text>
                            <GlowInput
                                placeholder="0.00"
                                value={quantidade}
                                onChangeText={setQuantidade}
                                keyboardType="decimal-pad"
                                style={{ marginBottom: 0 }}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>VALOR TOTAL R$ *</Text>
                            <GlowInput
                                placeholder="0.00"
                                value={valor}
                                onChangeText={setValor}
                                keyboardType="decimal-pad"
                                style={{ marginBottom: 0 }}
                            />
                        </View>
                    </View>

                    <Text style={[styles.label, { color: colors.textSecondary, marginTop: 15 }]}>OBSERVAÇÕES (OPCIONAL)</Text>
                    <GlowInput
                        placeholder="Detalhes adicionais..."
                        value={observacao}
                        onChangeText={(t) => up(t, setObservacao)}
                        multiline
                        style={{ height: 80, textAlignVertical: 'top' }}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>STATUS FINANCEIRO</Text>
                    <View style={styles.radioGroup}>
                        <TouchableOpacity
                            style={[
                                styles.radioBtn,
                                { backgroundColor: colors.cardAlt, borderColor: colors.glassBorder },
                                statusPagamento === 'A_RECEBER' && { borderColor: colors.warning, backgroundColor: colors.warning + '10' }
                            ]}
                            onPress={() => setStatusPagamento('A_RECEBER')}
                        >
                            <View style={[styles.radioDot, { borderColor: colors.placeholder }, statusPagamento === 'A_RECEBER' && { borderColor: colors.warning, backgroundColor: colors.warning }]} />
                            <Text style={[styles.radioText, { color: colors.textSecondary }, statusPagamento === 'A_RECEBER' && { color: colors.warningDark, fontWeight: '900' }]}>A RECEBER</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.radioBtn,
                                { backgroundColor: colors.cardAlt, borderColor: colors.glassBorder },
                                statusPagamento === 'RECEBIDO' && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                            ]}
                            onPress={() => setStatusPagamento('RECEBIDO')}
                        >
                            <View style={[styles.radioDot, { borderColor: colors.placeholder }, statusPagamento === 'RECEBIDO' && { borderColor: colors.primary, backgroundColor: colors.primary }]} />
                            <Text style={[styles.radioText, { color: colors.textSecondary }, statusPagamento === 'RECEBIDO' && { color: colors.primary, fontWeight: '900' }]} >RECEBIDO</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <PrimaryButton
                            label={editingUuid ? 'ATUALIZAR VENDA' : 'CONFIRMAR VENDA'}
                            onPress={salvar}
                            icon={editingUuid ? "save-outline" : "checkmark-circle-outline"}
                        />
                        {editingUuid && (
                            <TouchableOpacity
                                style={styles.cancelLink}
                                onPress={() => { setEditingUuid(null); setProduto(''); setQuantidade(''); setValor(''); setObservacao(''); setStatusPagamento('A_RECEBER'); }}
                            >
                                <Text style={{ color: colors.danger, fontWeight: 'bold', fontSize: 12 }}>CANCELAR EDIÇÃO</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </GlowCard>

                {/* HISTÓRICO */}
                <View style={styles.historySection}>
                    <Text style={[styles.historyTitle, { color: colors.textMuted }]}>ÚLTIMOS REGISTROS</Text>

                    <View style={styles.filterBar}>
                        {['TODAS', 'A_RECEBER', 'RECEBIDAS'].map((f) => (
                            <TouchableOpacity
                                key={f}
                                style={[
                                    styles.filterPill,
                                    { backgroundColor: colors.card, borderColor: colors.glassBorder },
                                    filterStatus === f && { backgroundColor: colors.primary, borderColor: colors.primary }
                                ]}
                                onPress={() => setFilterStatus(f)}
                            >
                                <Text style={[styles.filterPillText, { color: colors.textSecondary }, filterStatus === f && { color: '#FFF' }]}>
                                    {f === 'RECEBIDAS' ? 'PAGAS' : f.replace('_', ' ')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {getFilteredHistory().map(item => {
                        const isReceived = item.status_pagamento === 'RECEBIDO';
                        return (
                            <GlowCard key={item.uuid} style={styles.historyItem}>
                                <View style={styles.historyInfo}>
                                    <View style={styles.historyHeaderRow}>
                                        <Text style={[styles.hProd, { color: colors.textPrimary }]}>{item.produto}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: isReceived ? colors.primary + '15' : colors.warning + '15' }]}>
                                            <Text style={[styles.statusBadgeText, { color: isReceived ? colors.primary : colors.warningDark }]}>
                                                {isReceived ? 'PAGO' : 'PENDENTE'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.hSub, { color: colors.textMuted }]}>
                                        {item.cliente} • {new Date(item.data).toLocaleDateString('pt-BR')}
                                    </Text>
                                    <Text style={[styles.hVal, { color: colors.primary }]}>
                                        {item.quantidade} un • R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </Text>
                                </View>

                                <View style={styles.actions}>
                                    {!isReceived && (
                                        <TouchableOpacity onPress={() => handleBaixar(item)} style={[styles.actionBtn, { backgroundColor: colors.primary + '10' }]}>
                                            <Ionicons name="cash" size={18} color={colors.primary} />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.actionBtn, { backgroundColor: colors.cardAlt }]}>
                                        <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.actionBtn, { backgroundColor: colors.cardAlt }]}>
                                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </GlowCard>
                        );
                    })}
                </View>

                {getFilteredHistory().length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={48} color={colors.placeholder} />
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhuma venda encontrada no filtro selecionado.</Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* MODALS */}
            <Modal visible={modalVisible} animationType="slide">
                <AppContainer>
                    <ScreenHeader title="SELECIONAR PRODUTO" onBack={() => setModalVisible(false)} />
                    <View style={styles.modalContent}>
                        <GlowInput
                            placeholder="Pesquisar produto..."
                            value={searchText}
                            onChangeText={t => up(t, setSearchText)}
                            autoFocus
                        />
                        <FlatList
                            data={getFilteredItems()}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
                                    onPress={() => { setProduto(item.nome); setModalVisible(false); }}
                                >
                                    <View>
                                        <Text style={[styles.listItemTitle, { color: colors.textPrimary }]}>{item.nome}</Text>
                                        <Text style={[styles.listItemSub, { color: colors.textMuted }]}>{item.unidade}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </AppContainer>
            </Modal>

            <Modal visible={clientModalVisible} animationType="slide">
                <AppContainer>
                    <ScreenHeader
                        title="CLIENTE / PARCEIRO"
                        onBack={() => setClientModalVisible(false)}
                        rightElement={
                            <TouchableOpacity onPress={() => { setClientModalVisible(false); navigation.navigate('ClienteForm', { returnTo: 'Vendas' }); }}>
                                <Ionicons name="person-add" size={22} color={colors.primary} />
                            </TouchableOpacity>
                        }
                    />
                    <View style={styles.modalContent}>
                        <GlowInput
                            placeholder="Filtrar por nome..."
                            value={clientSearchText}
                            onChangeText={t => up(t, setClientSearchText)}
                            autoFocus
                        />
                        <FlatList
                            data={getFilteredClients()}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            ListHeaderComponent={
                                <TouchableOpacity
                                    style={[styles.listItem, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
                                    onPress={() => { setCliente('BALCÃO'); setClientModalVisible(false); }}
                                >
                                    <View>
                                        <Text style={[styles.listItemTitle, { color: colors.primary }]}>BALCÃO / CONSUMIDOR FINAL</Text>
                                        <Text style={[styles.listItemSub, { color: colors.primary }]}>Venda rápida sem identificação</Text>
                                    </View>
                                    <Ionicons name="flash-outline" size={18} color={colors.primary} />
                                </TouchableOpacity>
                            }
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
                                    onPress={() => { setCliente(item.nome); setClientModalVisible(false); }}
                                >
                                    <View>
                                        <Text style={[styles.listItemTitle, { color: colors.textPrimary }]}>{item.nome}</Text>
                                        <Text style={[styles.listItemSub, { color: colors.textMuted }]}>{item.telefone || 'Sem contato'}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </AppContainer>
            </Modal>

            {/* CONFIRMAR RECEBIMENTO MODAL */}
            <Modal visible={recebimentoModal} transparent animationType="fade">
                <View style={styles.overlayCenter}>
                    <GlowCard style={styles.miniModal}>
                        <Text style={[styles.miniModalTitle, { color: colors.textPrimary }]}>CONFIRMAR RECEBIMENTO</Text>
                        {recebimentoItem && (
                            <View style={[styles.receivedSummary, { backgroundColor: colors.cardAlt }]}>
                                <Text style={[styles.summaryText, { color: colors.textMuted }]}>Produto: <Text style={{ color: colors.textPrimary }}>{recebimentoItem.produto}</Text></Text>
                                <Text style={[styles.summaryText, { color: colors.textMuted }]}>Valor Original: <Text style={{ color: colors.textPrimary }}>R$ {recebimentoItem.valor.toFixed(2)}</Text></Text>
                            </View>
                        )}

                        <Text style={[styles.label, { color: colors.textSecondary }]}>VALOR RECEBIDO</Text>
                        <GlowInput
                            placeholder="0.00"
                            value={valorRecebido}
                            onChangeText={setValorRecebido}
                            keyboardType="decimal-pad"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtnCancel, { borderColor: colors.glassBorder }]}
                                onPress={() => { setRecebimentoModal(false); setRecebimentoItem(null); }}
                            >
                                <Text style={{ color: colors.textMuted, fontWeight: 'bold' }}>VOLTAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtnConfirm, { backgroundColor: colors.primary }]} onPress={confirmarRecebimento}>
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>BAIXAR PAGAMENTO</Text>
                            </TouchableOpacity>
                        </View>
                    </GlowCard>
                </View>
            </Modal>

            <ConfirmModal
                visible={confirmVisible}
                title="EXCLUIR REGISTRO"
                message="Deseja realmente apagar esta venda? Esta ação não pode ser desfeita."
                onConfirm={confirmDelete}
                onCancel={() => setConfirmVisible(false)}
            />
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scrollContent: { padding: 20 },
    card: { padding: 20, marginBottom: 25 },
    sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },
    label: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 15 },
    selectBtn: { height: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    selectText: { fontSize: 15, fontWeight: '600' },
    radioGroup: { flexDirection: 'row', gap: 10, marginTop: 5 },
    radioBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 15, gap: 10 },
    radioDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
    radioText: { fontSize: 11 },
    cancelLink: { marginTop: 15, padding: 5, alignSelf: 'center' },

    historySection: { marginTop: 10 },
    historyTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15, marginLeft: 5 },
    historyItem: { padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    historyInfo: { flex: 1 },
    historyHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    hProd: { fontSize: 15, fontWeight: 'bold' },
    hSub: { fontSize: 11, marginBottom: 4 },
    hVal: { fontSize: 13, fontWeight: '900' },

    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusBadgeText: { fontSize: 9, fontWeight: '900' },

    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },

    filterBar: { flexDirection: 'row', gap: 8, marginBottom: 15 },
    filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    filterPillText: { fontSize: 10, fontWeight: '900' },

    modalContent: { flex: 1, padding: 20 },
    listItem: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    listItemTitle: { fontSize: 15, fontWeight: 'bold' },
    listItemSub: { fontSize: 12, marginTop: 2 },

    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 25 },
    miniModal: { padding: 25, borderRadius: 24 },
    miniModalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
    receivedSummary: { padding: 15, borderRadius: 12, marginBottom: 20 },
    summaryText: { fontSize: 13, marginBottom: 5 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
    modalBtnCancel: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    modalBtnConfirm: { flex: 2, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

    emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
    emptyText: { fontSize: 12, fontWeight: 'bold', marginTop: 10, textAlign: 'center' }
});

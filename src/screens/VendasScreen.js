import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { getCadastro, getClientes } from '../database/database';
import { insertVenda, getVendasRecentes, deleteVenda, updateVenda, marcarVendaRecebida } from '../services/VendaService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AutoSyncService from '../services/AutoSyncService';
import { showToast } from '../ui/Toast';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfirmModal from '../ui/ConfirmModal';
// UI Components
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { Card } from '../ui/components/Card';
import AgroInput from '../ui/components/AgroInput';
import AgroButton from '../ui/components/AgroButton';

export default function VendasScreen({ navigation, route }) {
    const { colors, isDark } = useTheme();
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

    // Delete State
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const DRAFT_KEY = '@draft_VendasScreen_v2';

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
            } catch { console.log('Draft error'); }
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
    }, [route?.params?.newClient, navigation]);

    const loadInitialData = async () => {
        try {
            const allItems = await getCadastro();
            const sellable = allItems.filter(i => i.vendavel === 1 || i.vendavel === true || i.vendavel === "1");
            setItems(sellable);

            const allClients = await getClientes();
            setClients(allClients);
        } catch (err) {
            console.error('[SCREEN ERROR]', err);
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
        } catch {
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
        } catch {
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
                <Card style={styles.card}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DADOS DA TRANSAÇÃO</Text>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>CLIENTE / PARCEIRO</Text>
                    <TouchableOpacity
                        style={[styles.selectBtn, { backgroundColor: isDark ? colors.input : '#F9FAFB', borderColor: colors.border }]}
                        onPress={() => setClientModalVisible(true)}
                    >
                        <Text style={[styles.selectText, { color: colors.textPrimary, opacity: cliente ? 1 : 0.5 }]}>
                            {cliente || 'SELECIONAR CLIENTE...'}
                        </Text>
                        <Ionicons name="people-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>PRODUTO VENDIDO *</Text>
                    <TouchableOpacity
                        style={[styles.selectBtn, { backgroundColor: isDark ? colors.input : '#F9FAFB', borderColor: colors.border }]}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={[styles.selectText, { color: colors.textPrimary, opacity: produto ? 1 : 0.5 }]}>
                            {produto || 'SELECIONAR PRODUTO...'}
                        </Text>
                        <Ionicons name="cube-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <AgroInput
                                label="QTD *"
                                placeholder="0.00"
                                value={quantidade}
                                onChangeText={setQuantidade}
                                keyboardType="decimal-pad"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AgroInput
                                label="VALOR TOTAL R$ *"
                                placeholder="0.00"
                                value={valor}
                                onChangeText={setValor}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    <AgroInput
                        label="OBSERVAÇÕES (OPCIONAL)"
                        placeholder="Detalhes adicionais..."
                        value={observacao}
                        onChangeText={(t) => up(t, setObservacao)}
                        multiline
                        style={{ height: 80 }}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 10 }]}>STATUS FINANCEIRO</Text>
                    <View style={styles.radioGroup}>
                        <TouchableOpacity
                            style={[
                                styles.radioBtn,
                                { backgroundColor: isDark ? colors.input : '#F9FAFB', borderColor: colors.border },
                                statusPagamento === 'A_RECEBER' && { borderColor: colors.warning, backgroundColor: (colors.warning || '#F59E0B') + '15' }
                            ]}
                            onPress={() => setStatusPagamento('A_RECEBER')}
                        >
                            <View style={[styles.radioDot, { borderColor: colors.border }, statusPagamento === 'A_RECEBER' && { borderColor: colors.warning, backgroundColor: colors.warning }]} />
                            <Text style={[styles.radioText, { color: colors.textSecondary }, statusPagamento === 'A_RECEBER' && { color: colors.warning, fontWeight: '900' }]}>A RECEBER</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.radioBtn,
                                { backgroundColor: isDark ? colors.input : '#F9FAFB', borderColor: colors.border },
                                statusPagamento === 'RECEBIDO' && { borderColor: colors.primary, backgroundColor: (colors.primary || '#1E8E5A') + '15' }
                            ]}
                            onPress={() => setStatusPagamento('RECEBIDO')}
                        >
                            <View style={[styles.radioDot, { borderColor: colors.border }, statusPagamento === 'RECEBIDO' && { borderColor: colors.primary, backgroundColor: colors.primary }]} />
                            <Text style={[styles.radioText, { color: colors.textSecondary }, statusPagamento === 'RECEBIDO' && { color: colors.primary, fontWeight: '900' }]} >RECEBIDO</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <AgroButton
                            title={editingUuid ? 'ATUALIZAR VENDA' : 'CONFIRMAR VENDA'}
                            onPress={salvar}
                            icon={editingUuid ? "save" : "checkmark-circle"}
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
                </Card>

                {/* HISTÓRICO */}
                <View style={styles.historySection}>
                    <Text style={[styles.historyTitle, { color: colors.textSecondary }]}>ÚLTIMOS REGISTROS</Text>

                    <View style={styles.filterBar}>
                        {['TODAS', 'A_RECEBER', 'RECEBIDAS'].map((f) => (
                            <TouchableOpacity
                                key={f}
                                style={[
                                    styles.filterPill,
                                    { backgroundColor: colors.card, borderColor: colors.border },
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
                            <Card key={item.uuid} style={styles.historyItem}>
                                <View style={styles.historyInfo}>
                                    <View style={styles.historyHeaderRow}>
                                        <Text style={[styles.hProd, { color: colors.textPrimary }]}>{item.produto}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: isReceived ? (colors.primary || '#1E8E5A') + '15' : (colors.warning || '#F59E0B') + '15' }]}>
                                            <Text style={[styles.statusBadgeText, { color: isReceived ? colors.primary : colors.warning }]}>
                                                {isReceived ? 'PAGO' : 'PENDENTE'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.hSub, { color: colors.textSecondary }]}>
                                        {item.cliente} • {new Date(item.data).toLocaleDateString('pt-BR')}
                                    </Text>
                                    <Text style={[styles.hVal, { color: colors.primary }]}>
                                        {item.quantidade} un • R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </Text>
                                </View>

                                <View style={styles.actions}>
                                    {!isReceived && (
                                        <TouchableOpacity onPress={() => handleBaixar(item)} style={[styles.actionBtn, { backgroundColor: (colors.primary || '#1E8E5A') + '10', borderColor: (colors.primary || '#1E8E5A') + '20' }]}>
                                            <Ionicons name="cash" size={18} color={colors.primary} />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderColor: colors.border }]}>
                                        <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderColor: colors.border }]}>
                                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </Card>
                        );
                    })}
                </View>

                {getFilteredHistory().length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={48} color={colors.placeholder} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma venda encontrada no filtro selecionado.</Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* MODALS */}
            <Modal visible={modalVisible} animationType="slide">
                <AppContainer>
                    <ScreenHeader title="SELECIONAR PRODUTO" onBack={() => setModalVisible(false)} />
                    <View style={styles.modalContent}>
                        <AgroInput
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
                                    style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    onPress={() => { setProduto(item.nome); setModalVisible(false); }}
                                >
                                    <View>
                                        <Text style={[styles.listItemTitle, { color: colors.textPrimary }]}>{item.nome}</Text>
                                        <Text style={[styles.listItemSub, { color: colors.textSecondary }]}>{item.unidade}</Text>
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
                        <AgroInput
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
                                    style={[styles.listItem, { backgroundColor: (colors.primary || '#1E8E5A') + '10', borderColor: (colors.primary || '#1E8E5A') + '30' }]}
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
                                    style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    onPress={() => { setCliente(item.nome); setClientModalVisible(false); }}
                                >
                                    <View>
                                        <Text style={[styles.listItemTitle, { color: colors.textPrimary }]}>{item.nome}</Text>
                                        <Text style={[styles.listItemSub, { color: colors.textSecondary }]}>{item.telefone || 'Sem contato'}</Text>
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
                    <Card style={styles.miniModal} noPadding>
                        <View style={{ padding: 25 }}>
                            <Text style={[styles.miniModalTitle, { color: colors.textPrimary }]}>CONFIRMAR RECEBIMENTO</Text>
                            {recebimentoItem && (
                                <View style={[styles.receivedSummary, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB' }]}>
                                    <Text style={[styles.summaryText, { color: colors.textSecondary }]}>Produto: <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{recebimentoItem.produto}</Text></Text>
                                    <Text style={[styles.summaryText, { color: colors.textSecondary }]}>Valor Original: <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>R$ {recebimentoItem.valor.toFixed(2)}</Text></Text>
                                </View>
                            )}

                            <AgroInput
                                label="VALOR RECEBIDO"
                                placeholder="0.00"
                                value={valorRecebido}
                                onChangeText={setValorRecebido}
                                keyboardType="decimal-pad"
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalBtnCancel, { borderColor: colors.border }]}
                                    onPress={() => { setRecebimentoModal(false); setRecebimentoItem(null); }}
                                >
                                    <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>VOLTAR</Text>
                                </TouchableOpacity>
                                <AgroButton
                                    title="BAIXAR"
                                    onPress={confirmarRecebimento}
                                    style={{ flex: 1.5 }}
                                />
                            </View>
                        </View>
                    </Card>
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
    row: { flexDirection: 'row', gap: 12 },
    selectBtn: { height: 54, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    selectText: { fontSize: 14, fontWeight: '700' },
    radioGroup: { flexDirection: 'row', gap: 10 },
    radioBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, padding: 15, gap: 10 },
    radioDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
    radioText: { fontSize: 11, fontWeight: '800' },
    cancelLink: { marginTop: 15, padding: 5, alignSelf: 'center' },

    historySection: { marginTop: 10 },
    historyTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15, marginLeft: 5 },
    historyItem: { padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    historyInfo: { flex: 1 },
    historyHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    hProd: { fontSize: 15, fontWeight: 'bold' },
    hSub: { fontSize: 11, marginBottom: 4 },
    hVal: { fontSize: 13, fontWeight: '900' },

    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusBadgeText: { fontSize: 9, fontWeight: '900' },

    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },

    filterBar: { flexDirection: 'row', gap: 8, marginBottom: 15 },
    filterPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1 },
    filterPillText: { fontSize: 10, fontWeight: '900' },

    modalContent: { flex: 1, padding: 20 },
    listItem: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    listItemTitle: { fontSize: 15, fontWeight: 'bold' },
    listItemSub: { fontSize: 12, marginTop: 2 },

    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 25 },
    miniModal: { width: '100%', elevation: 15 },
    miniModalTitle: { fontSize: 16, fontWeight: '900', marginBottom: 20, textAlign: 'center', letterSpacing: 1 },
    receivedSummary: { padding: 15, borderRadius: 14, marginBottom: 20 },
    summaryText: { fontSize: 13, marginBottom: 5 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
    modalBtnCancel: { flex: 1, height: 54, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },

    emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
    emptyText: { fontSize: 12, fontWeight: 'bold', marginTop: 10, textAlign: 'center' }
});

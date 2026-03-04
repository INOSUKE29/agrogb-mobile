import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, Animated } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertVenda, getCadastro, getClientes, insertCliente, getVendasRecentes, deleteVenda, updateVenda, marcarVendaRecebida } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { DARK } from '../styles/darkTheme';

export default function VendasScreen({ navigation }) {
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
    const [newClientModal, setNewClientModal] = useState(false);

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

    // New Client Form State
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');

    useFocusEffect(useCallback(() => {
        loadInitialData();
        loadHistory();
    }, []));

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const allItems = await getCadastro();
            const sellable = allItems.filter(i => i.vendavel === 1 || i.vendavel === true || i.vendavel === "1");
            setItems(sellable);

            const allClients = await getClientes();
            setClients(allClients);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        const data = await getVendasRecentes();
        setHistory(data);
    };

    const up = (t, setter) => setter(t.toUpperCase());

    const handleSaveClient = async () => {
        if (!newClientName.trim()) return Alert.alert('Erro', 'Nome do cliente obrigatório');
        try {
            const uuid = uuidv4();
            await insertCliente({
                uuid,
                nome: newClientName,
                telefone: newClientPhone,
                endereco: '',
                cpf_cnpj: '',
                observacao: 'CADASTRADO NA VENDA'
            });
            setNewClientName('');
            setNewClientPhone('');
            setNewClientModal(false);

            // Reload clients and select the new one
            const updatedClients = await getClientes();
            setClients(updatedClients);
            setCliente(newClientName.toUpperCase());
            setClientModalVisible(false);
        } catch (e) {
            Alert.alert('Erro', 'Falha ao criar cliente');
        }
    };

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
                Alert.alert('Sucesso', 'Venda atualizada!');
                setEditingUuid(null);
            } else {
                await insertVenda(dados);
                Alert.alert('Sucesso', 'Venda registrada!');
            }

            // Reset Form (keep Client maybe? No, reset all for fresh sale)
            setProduto('');
            setQuantidade('');
            setValor('');
            setObservacao('');
            setStatusPagamento('A_RECEBER');
            // setCliente(''); // Optional: keep client selected for rapid entry

            loadHistory();
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
        // Scroll to top?
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir', 'Deseja excluir esta venda?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                    await deleteVenda(item.uuid);
                    loadHistory();
                }
            }
        ]);
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

    const scaleAnim = new Animated.Value(1);
    const pressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
    const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    return (
        <LinearGradient colors={['#0F3D2E', '#145C43']} style={{ flex: 1 }}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{editingUuid ? 'EDITAR VENDA' : 'REGISTRAR VENDA'}</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>FATURAMENTO E SAÍDA DE ESTOQUE</Text>

                    <Text style={styles.label}>CLIENTE / PARCEIRO</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setClientModalVisible(true)}>
                        <Text style={[styles.selectText, !cliente && { color: '#6B7280' }]}>{cliente || 'SELECIONAR CLIENTE...'}</Text>
                        <Ionicons name="people-outline" size={18} color="#34D399" />
                    </TouchableOpacity>

                    <Text style={styles.label}>PRODUTO VENDIDO *</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setModalVisible(true)}>
                        <Text style={[styles.selectText, !produto && { color: '#6B7280' }]}>{produto || 'SELECIONAR PRODUTO...'}</Text>
                        <Ionicons name="chevron-down" size={18} color="#34D399" />
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>QTD *</Text>
                            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#6B7280" value={quantidade} onChangeText={setQuantidade} keyboardType="decimal-pad" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>VALOR R$ *</Text>
                            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#6B7280" value={valor} onChangeText={setValor} keyboardType="decimal-pad" />
                        </View>
                    </View>

                    <Text style={styles.label}>OBSERVAÇÕES</Text>
                    <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]} placeholder="Detalhes..." placeholderTextColor="#6B7280" value={observacao} onChangeText={(t) => up(t, setObservacao)} multiline />

                    <Text style={styles.label}>STATUS DO PAGAMENTO</Text>
                    <View style={styles.radioGroup}>
                        <TouchableOpacity style={[styles.radioBtn, statusPagamento === 'A_RECEBER' && styles.radioActiveA]} onPress={() => setStatusPagamento('A_RECEBER')}>
                            <View style={[styles.radioDot, statusPagamento === 'A_RECEBER' && styles.radioDotActiveA]} />
                            <Text style={[styles.radioText, statusPagamento === 'A_RECEBER' && { color: '#FCD34D' }]}>A RECEBER</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.radioBtn, statusPagamento === 'RECEBIDO' && styles.radioActiveR]} onPress={() => setStatusPagamento('RECEBIDO')}>
                            <View style={[styles.radioDot, statusPagamento === 'RECEBIDO' && styles.radioDotActiveR]} />
                            <Text style={[styles.radioText, statusPagamento === 'RECEBIDO' && { color: '#34D399' }]}>RECEBIDO</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        {editingUuid && (
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444', flex: 1 }]} onPress={() => { setEditingUuid(null); setProduto(''); setQuantidade(''); setValor(''); setObservacao(''); }}>
                                <Text style={styles.btnText}>CANCELAR</Text>
                            </TouchableOpacity>
                        )}
                        <Animated.View style={[{ flex: 2 }, { transform: [{ scale: scaleAnim }] }]}>
                            <TouchableOpacity style={styles.btn} onPress={salvar} onPressIn={pressIn} onPressOut={pressOut}>
                                <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.btnText}>{editingUuid ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR VENDA'}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View>

                {/* HISTÓRICO */}
                <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>ÚCTIMAS VENDAS</Text>
                    <View style={styles.filterGroup}>
                        {['TODAS', 'A_RECEBER', 'RECEBIDAS'].map((f) => (
                            <TouchableOpacity key={f} style={[styles.filterPill, filterStatus === f && styles.filterPillActive]} onPress={() => setFilterStatus(f)}>
                                <Text style={[styles.filterPillText, filterStatus === f && styles.filterPillTextActive]}>{f === 'A_RECEBER' ? 'A RECEBER' : f}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {getFilteredHistory().map(item => {
                    const isReceived = item.status_pagamento === 'RECEBIDO';
                    return (
                        <View key={item.uuid} style={styles.historyItem}>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                    <Text style={styles.hProd}>{item.produto}</Text>
                                    <View style={[styles.statusBadge, isReceived ? styles.badgeGreen : styles.badgeYellow]}>
                                        <Text style={[styles.statusBadgeText, isReceived ? styles.badgeTextGreen : styles.badgeTextYellow]}>
                                            {isReceived ? 'RECEBIDO' : 'A RECEBER'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.hSub}>{item.cliente} • {new Date(item.data).toLocaleDateString()}</Text>
                                <Text style={styles.hVal}>{item.quantidade} x R$ {item.valor.toFixed(2)}</Text>
                            </View>
                            <View style={styles.actions}>
                                {!isReceived && (
                                    <TouchableOpacity onPress={() => handleBaixar(item)} style={[styles.actionBtn, { backgroundColor: 'rgba(52,211,153,0.15)' }]}>
                                        <Ionicons name="checkmark-done" size={18} color="#34D399" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                                    <Ionicons name="create-outline" size={18} color="#60A5FA" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            {/* PRODUCT MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR PRODUTO</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        <TextInput style={styles.searchBar} placeholder="Buscar..." placeholderTextColor="#9CA3AF" value={searchText} onChangeText={t => up(t, setSearchText)} />
                        <FlatList data={getFilteredItems()} keyExtractor={i => i.uuid || i.id.toString()} renderItem={({ item }) => (
                            <TouchableOpacity style={styles.itemRow} onPress={() => { setProduto(item.nome); setModalVisible(false); }}>
                                <Text style={styles.itemText}>{item.nome}</Text>
                                <Text style={styles.itemSub}>{item.unidade}</Text>
                            </TouchableOpacity>
                        )} />
                    </View>
                </View>
            </Modal>

            {/* CLIENT MODAL */}
            <Modal visible={clientModalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR CLIENTE</Text>
                            <TouchableOpacity onPress={() => setClientModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.newClientBtn} onPress={() => setNewClientModal(true)}>
                            <Ionicons name="add-circle" size={22} color="#FFF" />
                            <Text style={styles.newClientText}>CADASTRAR NOVO CLIENTE</Text>
                        </TouchableOpacity>
                        <TextInput style={styles.searchBar} placeholder="Buscar cliente..." placeholderTextColor="#9CA3AF" value={clientSearchText} onChangeText={t => up(t, setClientSearchText)} />
                        <FlatList data={getFilteredClients()} keyExtractor={i => i.uuid || i.id.toString()} renderItem={({ item }) => (
                            <TouchableOpacity style={styles.itemRow} onPress={() => { setCliente(item.nome); setClientModalVisible(false); }}>
                                <Text style={styles.itemText}>{item.nome}</Text>
                                <Text style={styles.itemSub}>{item.telefone || 'Sem telefone'}</Text>
                            </TouchableOpacity>
                        )} ListHeaderComponent={
                            <TouchableOpacity style={styles.itemRow} onPress={() => { setCliente('BALCÃO'); setClientModalVisible(false); }}>
                                <Text style={styles.itemText}>BALCÃO / AVULSO</Text>
                                <Text style={styles.itemSub}>Venda sem cadastro</Text>
                            </TouchableOpacity>
                        } />
                    </View>
                </View>
            </Modal>

            {/* NEW CLIENT FORM */}
            <Modal visible={newClientModal} animationType="fade" transparent>
                <View style={styles.overlayCenter}>
                    <View style={styles.miniModal}>
                        <Text style={styles.modalTitle}>Novo Cliente</Text>
                        <TextInput style={[styles.input, { marginTop: 16 }]} placeholder="Nome *" placeholderTextColor="#6B7280" value={newClientName} onChangeText={t => up(t, setNewClientName)} />
                        <TextInput style={styles.input} placeholder="Telefone" placeholderTextColor="#6B7280" value={newClientPhone} onChangeText={setNewClientPhone} keyboardType="phone-pad" />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#6B7280', flex: 1 }]} onPress={() => setNewClientModal(false)}>
                                <Text style={styles.btnText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={handleSaveClient}>
                                <Text style={styles.btnText}>SALVAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL MARCAR COMO RECEBIDO */}
            <Modal visible={recebimentoModal} transparent animationType="fade">
                <View style={styles.overlayCenter}>
                    <View style={styles.miniModal}>
                        <Text style={styles.modalTitle}>✅ CONFIRMAR RECEBIMENTO</Text>
                        {recebimentoItem && (
                            <Text style={{ color: DARK.textSecondary, marginVertical: 12, fontSize: 13 }}>
                                Venda: <Text style={{ color: DARK.textPrimary, fontWeight: 'bold' }}>{recebimentoItem.produto}</Text>{'\n'}
                                Cliente: <Text style={{ color: DARK.textPrimary, fontWeight: 'bold' }}>{recebimentoItem.cliente}</Text>
                            </Text>
                        )}
                        <Text style={styles.label}>VALOR RECEBIDO (R$)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor={DARK.textMuted}
                            value={valorRecebido}
                            onChangeText={setValorRecebido}
                            keyboardType="decimal-pad"
                        />
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                            <TouchableOpacity
                                style={[styles.btn, { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', shadowOpacity: 0 }]}
                                onPress={() => { setRecebimentoModal(false); setRecebimentoItem(null); }}
                            >
                                <Text style={[styles.btnText, { color: DARK.textMuted }]}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={confirmarRecebimento}>
                                <Ionicons name="checkmark-circle" size={18} color="#061E1A" />
                                <Text style={[styles.btnText, { marginLeft: 6 }]}>CONFIRMAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}


const styles = StyleSheet.create({
    header: { paddingTop: 55, paddingBottom: 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: DARK.textPrimary, letterSpacing: 0.5 },

    card: { backgroundColor: DARK.card, borderRadius: 22, padding: 22, borderWidth: 1, borderColor: DARK.glowBorder, marginBottom: 28, elevation: 5, shadowColor: '#00FF9C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
    cardLabel: { fontSize: 11, fontWeight: '900', color: DARK.glow, letterSpacing: 1.5, marginBottom: 18 },

    label: { fontSize: 10, fontWeight: '900', color: DARK.textMuted, letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
    input: { backgroundColor: DARK.card, borderWidth: 1, borderColor: DARK.glowBorderStrong, borderRadius: 14, padding: 15, fontSize: 15, color: DARK.textPrimary, marginBottom: 16 },
    selectBtn: { backgroundColor: DARK.card, borderWidth: 1, borderColor: DARK.glowBorderStrong, borderRadius: 14, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    selectText: { fontSize: 14, fontWeight: '600', color: DARK.textPrimary },

    btn: { backgroundColor: DARK.glow, paddingVertical: 17, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', elevation: 4, shadowColor: '#00FF9C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.45, shadowRadius: 8 },
    btnText: { color: '#061E1A', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

    historyHeader: { paddingHorizontal: 4, marginBottom: 14 },
    historyTitle: { fontSize: 11, fontWeight: '900', color: DARK.textMuted, letterSpacing: 1.2, marginBottom: 10 },
    historyItem: { backgroundColor: DARK.card, padding: 16, borderRadius: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: DARK.glowBorder },
    hProd: { fontSize: 14, fontWeight: 'bold', color: DARK.textPrimary },
    hSub: { fontSize: 11, color: DARK.textSecondary, marginTop: 2 },
    hVal: { fontSize: 12, fontWeight: '900', color: DARK.glow, marginTop: 4 },
    actions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    actionBtn: { padding: 8, backgroundColor: 'rgba(0,255,156,0.08)', borderRadius: 10, borderWidth: 1, borderColor: DARK.glowBorder },

    radioGroup: { flexDirection: 'row', gap: 10, marginBottom: 4 },
    radioBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,255,156,0.04)', borderWidth: 1, borderColor: DARK.glowBorder, borderRadius: 14, padding: 14 },
    radioDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: DARK.textMuted, marginRight: 10 },
    radioText: { fontSize: 12, fontWeight: 'bold', color: DARK.textMuted },
    radioActiveA: { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.1)' },
    radioDotActiveA: { borderColor: '#B45309', backgroundColor: '#F59E0B' },
    radioActiveR: { borderColor: DARK.glow, backgroundColor: 'rgba(0,255,156,0.1)' },
    radioDotActiveR: { borderColor: '#047857', backgroundColor: DARK.glow },

    filterGroup: { flexDirection: 'row', gap: 8, marginTop: 8 },
    filterPill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(0,255,156,0.05)', borderWidth: 1, borderColor: DARK.glowBorder },
    filterPillActive: { backgroundColor: DARK.glow, borderColor: DARK.glow },
    filterPillText: { fontSize: 10, fontWeight: 'bold', color: DARK.textMuted },
    filterPillTextActive: { color: '#061E1A' },

    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
    statusBadgeText: { fontSize: 9, fontWeight: 'bold' },
    badgeYellow: { backgroundColor: 'rgba(245,158,11,0.2)' },
    badgeTextYellow: { color: '#FCD34D' },
    badgeGreen: { backgroundColor: 'rgba(0,255,156,0.15)' },
    badgeTextGreen: { color: DARK.glow },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 25 },
    modalBg: { backgroundColor: DARK.modal, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 22, borderWidth: 1, borderColor: DARK.glowBorder },
    miniModal: { backgroundColor: DARK.modal, borderRadius: 22, padding: 28, borderWidth: 1, borderColor: DARK.glowBorder },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: DARK.textPrimary },
    searchBar: { backgroundColor: DARK.card, padding: 13, borderRadius: 12, marginBottom: 12, fontSize: 14, color: DARK.textPrimary, borderWidth: 1, borderColor: DARK.glowBorder },
    itemRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    itemText: { fontSize: 14, fontWeight: 'bold', color: DARK.textPrimary },
    itemSub: { fontSize: 10, color: DARK.textMuted, marginTop: 2 },
    newClientBtn: { flexDirection: 'row', backgroundColor: DARK.glow, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    newClientText: { color: '#061E1A', fontWeight: 'bold', marginLeft: 10, fontSize: 12 },
});

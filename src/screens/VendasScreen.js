import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertVenda, getCadastro, getClientes, insertCliente, getVendasRecentes, deleteVenda, updateVenda, executeQuery } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

export default function VendasScreen({ route, navigation }) {
    const [cliente, setCliente] = useState('');
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valor, setValor] = useState('');
    const [observacao, setObservacao] = useState('');
    const [editingUuid, setEditingUuid] = useState(null);

    // States do Fluxo B2B
    const [pendingOrdersFound, setPendingOrdersFound] = useState([]);
    const [orderPromptModal, setOrderPromptModal] = useState(false);
    const [orderListModal, setOrderListModal] = useState(false);
    const [ignoreOrdersCheck, setIgnoreOrdersCheck] = useState('');
    const [selectedOrderToBind, setSelectedOrderToBind] = useState(null);

    // Efeito para receber dados vindos de Encomendas
    useEffect(() => {
        if (route.params?.autoFill) {
            if (route.params.cliente) setCliente(route.params.cliente);
            if (route.params.produto) setProduto(route.params.produto);
            if (route.params.quantidade) setQuantidade(route.params.quantidade);
            if (route.params.order_id) {
                // Auto bind from deep link
                const mockOrder = { id: route.params.order_id, unidade: 'UN', quantidade_restante: parseFloat(route.params.quantidade) };
                setSelectedOrderToBind(mockOrder);
                setIgnoreOrdersCheck(route.params.cliente + '-' + route.params.produto);
            }
        }
    }, [route.params]);

    // Verificação Automática (Ao selecionar Cliente + Produto)
    useEffect(() => {
        const checkPending = async () => {
            if (cliente && cliente !== 'BALCÃO' && produto && !editingUuid) {
                const combined = cliente + '-' + produto;
                if (ignoreOrdersCheck === combined) return;

                const q = `SELECT o.* FROM orders o LEFT JOIN clientes c ON o.cliente_id = c.uuid LEFT JOIN cadastro p ON o.produto_id = p.uuid WHERE upper(c.nome) = ? AND upper(p.nome) = ? AND o.status IN ('PENDENTE', 'PARCIAL') AND o.is_deleted = 0`;
                const searchRes = await executeQuery(q, [cliente.toUpperCase(), produto.toUpperCase()]);

                const found = [];
                for (let i = 0; i < searchRes.rows.length; i++) found.push(searchRes.rows.item(i));

                if (found.length > 0 && selectedOrderToBind === null) {
                    setPendingOrdersFound(found);
                    setOrderPromptModal(true);
                }
            }
        };
        checkPending();
    }, [cliente, produto, ignoreOrdersCheck, selectedOrderToBind, editingUuid]);

    // Data State
    const [history, setHistory] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Modal States
    const [modalVisible, setModalVisible] = useState(false); // Product
    const [clientModalVisible, setClientModalVisible] = useState(false); // Client
    const [newClientModal, setNewClientModal] = useState(false); // New Client Form

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

        const qtdVendida = parseFloat(quantidade.replace(',', '.'));
        if (isNaN(qtdVendida) || qtdVendida <= 0) {
            Alert.alert('Atenção', 'Quantidade inválida.');
            return;
        }

        const dados = {
            uuid: editingUuid || uuidv4(),
            cliente: (cliente || 'BALCÃO').toUpperCase(),
            produto: produto.toUpperCase(),
            quantidade: qtdVendida,
            valor: parseFloat(valor.toString().replace(',', '.')),
            observacao: observacao.toUpperCase(),
            data: new Date().toISOString().split('T')[0],
            order_id: null
        };

        if (selectedOrderToBind) {
            await processarVendaComEncomenda(dados, selectedOrderToBind);
        } else {
            await processarVendaFinal(dados);
        }
    };

    const processarVendaComEncomenda = async (dadosDaVenda, orderItem) => {
        try {
            let restante = orderItem.quantidade_restante - dadosDaVenda.quantidade;
            if (restante < 0) restante = 0; // Evitar negativo caso venda seja maior

            let novoStatus = restante <= 0 ? 'CONCLUIDA' : 'PARCIAL';

            await executeQuery(
                `UPDATE orders SET quantidade_restante = ?, status = ?, sync_status = 0, last_updated = ? WHERE id = ?`,
                [restante, novoStatus, new Date().toISOString(), orderItem.id]
            );

            // Vincula a ID da venda
            dadosDaVenda.order_id = orderItem.id;

            await processarVendaFinal(dadosDaVenda);
            if (restante <= 0) {
                Alert.alert('Encomenda Concluída', 'Esta venda bateu toda a quantidade da encomenda e o pedido foi finalizado!');
            } else {
                Alert.alert('Encomenda Parcial', `Faltam ${restante} ${orderItem.unidade} para concluir a encomenda do cliente.`);
            }

        } catch (e) {
            console.error('Erro vincular encomenda:', e);
            Alert.alert('Erro', 'Ocorreu um problema ao vincular a encomenda.');
        }
    };

    const processarVendaFinal = async (dados) => {
        try {
            if (editingUuid) {
                await updateVenda(editingUuid, dados);
                Alert.alert('Sucesso', 'Venda atualizada!');
                setEditingUuid(null);
            } else {
                await insertVenda(dados);
                Alert.alert('Sucesso', 'Venda registrada!');
            }

            setProduto('');
            setQuantidade('');
            setValor('');
            setObservacao('');
            setIgnoreOrdersCheck('');
            setSelectedOrderToBind(null);
            loadHistory();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao processar venda final.');
        }
    };

    const handleEdit = (item) => {
        setEditingUuid(item.uuid);
        setCliente(item.cliente);
        setProduto(item.produto);
        setQuantidade(item.quantidade.toString());
        setValor(item.valor.toString());
        setObservacao(item.observacao || '');
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

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.card}>
                    <LinearGradient colors={['#3B82F6', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardHeader}>
                        <Text style={styles.headerTitle}>{editingUuid ? 'EDITAR VENDA' : 'FLUXO DE VENDAS'}</Text>
                        <Text style={styles.headerSub}>{editingUuid ? 'Alterando registro existente' : 'Faturamento e Saída de Estoque'}</Text>
                    </LinearGradient>

                    <View style={styles.form}>
                        <View style={styles.field}>
                            <Text style={styles.label}>CLIENTE / PARCEIRO</Text>
                            <TouchableOpacity style={styles.selectBtn} onPress={() => setClientModalVisible(true)}>
                                <Text style={[styles.selectText, !cliente && { color: '#9CA3AF' }]}>
                                    {cliente || "SELECIONAR CLIENTE..."}
                                </Text>
                                <Ionicons name="people" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>PRODUTO VENDIDO *</Text>
                            <TouchableOpacity style={styles.selectBtn} onPress={() => setModalVisible(true)}>
                                <Text style={[styles.selectText, !produto && { color: '#9CA3AF' }]}>
                                    {produto || "SELECIONAR PRODUTO..."}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>QTD *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0.00"
                                    value={quantidade}
                                    onChangeText={setQuantidade}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>VALOR R$ *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0.00"
                                    value={valor}
                                    onChangeText={setValor}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>NOTAS / OBSERVAÇÃO</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Detalhes..."
                                value={observacao}
                                onChangeText={(t) => up(t, setObservacao)}
                                multiline
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.row}>
                            {editingUuid && (
                                <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444', flex: 1, marginRight: 10 }]} onPress={() => { setEditingUuid(null); setProduto(''); setQuantidade(''); setValor(''); setObservacao(''); }}>
                                    <Text style={styles.btnText}>CANCELAR</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={[styles.btn, { flex: 2 }]} onPress={salvar}>
                                <Text style={styles.btnText}>{editingUuid ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR VENDA'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* HISTÓRICO */}
                <Text style={styles.historyTitle}>ÚLTIMAS VENDAS</Text>
                {history.map(item => (
                    <View key={item.uuid} style={styles.historyItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.hProd}>{item.produto}</Text>
                            <Text style={styles.hSub}>{item.cliente} • {new Date(item.data).toLocaleDateString()}</Text>
                            <Text style={styles.hVal}>{item.quantidade} x R$ {item.valor.toFixed(2)}</Text>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                                <Ionicons name="create-outline" size={20} color="#3B82F6" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* PRODUCT MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR PRODUTO</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <TextInput style={styles.searchBar} placeholder="Buscar..." value={searchText} onChangeText={t => up(t, setSearchText)} autoCapitalize="characters" />
                        <FlatList
                            data={getFilteredItems()}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemRow} onPress={() => { setProduto(item.nome); setModalVisible(false); }}>
                                    <Text style={styles.itemText}>{item.nome}</Text>
                                    <Text style={styles.itemSub}>{item.unidade}</Text>
                                </TouchableOpacity>
                            )}
                        />
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
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.newClientBtn} onPress={() => setNewClientModal(true)}>
                            <Ionicons name="add-circle" size={24} color="#FFF" />
                            <Text style={styles.newClientText}>CADASTRAR NOVO CLIENTE</Text>
                        </TouchableOpacity>

                        <TextInput style={styles.searchBar} placeholder="Buscar cliente..." value={clientSearchText} onChangeText={t => up(t, setClientSearchText)} autoCapitalize="characters" />

                        <FlatList
                            data={getFilteredClients()}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemRow} onPress={() => { setCliente(item.nome); setClientModalVisible(false); }}>
                                    <Text style={styles.itemText}>{item.nome}</Text>
                                    <Text style={styles.itemSub}>{item.telefone || 'Sem telefone'}</Text>
                                </TouchableOpacity>
                            )}
                            ListHeaderComponent={
                                <TouchableOpacity style={styles.itemRow} onPress={() => { setCliente('BALCÃO'); setClientModalVisible(false); }}>
                                    <Text style={styles.itemText}>BALCÃO / AVULSO</Text>
                                    <Text style={styles.itemSub}>Venda sem cadastro</Text>
                                </TouchableOpacity>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* NEW CLIENT MINI-FORM */}
            <Modal visible={newClientModal} animationType="fade" transparent>
                <View style={styles.overlayCenter}>
                    <View style={styles.miniModal}>
                        <Text style={styles.modalTitle}>Novo Cliente</Text>
                        <TextInput style={[styles.input, { marginTop: 20 }]} placeholder="Nome *" value={newClientName} onChangeText={t => up(t, setNewClientName)} />
                        <TextInput style={[styles.input, { marginTop: 10 }]} placeholder="Telefone" value={newClientPhone} onChangeText={setNewClientPhone} keyboardType="phone-pad" />
                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#9CA3AF', flex: 1, marginRight: 10 }]} onPress={() => setNewClientModal(false)}>
                                <Text style={styles.btnText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={handleSaveClient}>
                                <Text style={styles.btnText}>SALVAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ORDER PROMPT MODAL */}
            <Modal visible={orderPromptModal} animationType="fade" transparent>
                <View style={styles.overlayCenter}>
                    <View style={styles.premiumModal}>
                        {/* Header Gradiente */}
                        <LinearGradient colors={['#1D4ED8', '#3B82F6', '#60A5FA']} style={styles.premiumModalHeader}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="receipt-outline" size={36} color="#FFF" />
                            </View>
                            <Text style={styles.premiumModalTitle}>Encomenda Encontrada</Text>
                            <Text style={styles.premiumModalSub}>Este cliente possui pedido(s) pendente(s)</Text>
                        </LinearGradient>

                        {/* Corpo */}
                        <View style={styles.premiumModalBody}>
                            <View style={styles.infoRow}>
                                <Ionicons name="cube-outline" size={16} color="#3B82F6" />
                                <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Produto: </Text>{produto}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="person-outline" size={16} color="#3B82F6" />
                                <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Cliente: </Text>{cliente}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="albums-outline" size={16} color="#3B82F6" />
                                <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>{pendingOrdersFound.length}</Text> encomenda(s) encontrada(s)</Text>
                            </View>

                            <Text style={styles.premiumModalQuestion}>Deseja vincular esta venda a uma encomenda existente?</Text>

                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                                <TouchableOpacity
                                    style={[styles.premiumBtn, { backgroundColor: '#F3F4F6', flex: 1 }]}
                                    onPress={() => { setIgnoreOrdersCheck(cliente + '-' + produto); setOrderPromptModal(false); }}
                                >
                                    <Ionicons name="close-circle-outline" size={18} color="#6B7280" />
                                    <Text style={[styles.premiumBtnText, { color: '#6B7280' }]}>Ignorar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.premiumBtn, { backgroundColor: '#3B82F6', flex: 1 }]}
                                    onPress={() => { setOrderPromptModal(false); setOrderListModal(true); }}
                                >
                                    <Ionicons name="link-outline" size={18} color="#FFF" />
                                    <Text style={styles.premiumBtnText}>Vincular</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ORDER LIST MODAL */}
            <Modal visible={orderListModal} animationType="slide" transparent>
                <View style={styles.overlayCenter}>
                    <View style={[styles.modalBg, { height: '65%', borderRadius: 24 }]}>
                        <LinearGradient colors={['#059669', '#10B981']} style={{ padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900' }}>Selecionar Encomenda</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 }}>Toque para vincular à venda</Text>
                                </View>
                                <TouchableOpacity
                                    style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 6 }}
                                    onPress={() => setOrderListModal(false)}
                                >
                                    <Ionicons name="close" size={22} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                        <FlatList
                            data={pendingOrdersFound}
                            keyExtractor={i => i.id.toString()}
                            contentContainerStyle={{ padding: 15 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.orderCard}
                                    onPress={() => {
                                        setSelectedOrderToBind(item);
                                        setQuantidade(item.quantidade_restante.toString());
                                        setIgnoreOrdersCheck(cliente + '-' + produto);
                                        setOrderListModal(false);
                                    }}
                                >
                                    {/* Badge de Status */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <View style={[styles.statusBadge, { backgroundColor: item.status === 'PENDENTE' ? '#FEF3C7' : '#DBEAFE' }]}>
                                            <Text style={[styles.statusBadgeText, { color: item.status === 'PENDENTE' ? '#D97706' : '#2563EB' }]}>{item.status}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color="#10B981" />
                                    </View>

                                    {/* Quantidade restante em destaque */}
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 28, fontWeight: '900', color: '#10B981' }}>{item.quantidade_restante}</Text>
                                        <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 5 }}>{item.unidade} restantes</Text>
                                    </View>

                                    {/* Linha Detalhes */}
                                    <View style={{ flexDirection: 'row', gap: 15 }}>
                                        {item.data_prevista ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
                                                <Text style={[styles.itemSub, { marginLeft: 4 }]}>{item.data_prevista}</Text>
                                            </View>
                                        ) : null}
                                        {item.valor_unitario ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name="pricetag-outline" size={13} color="#9CA3AF" />
                                                <Text style={[styles.itemSub, { marginLeft: 4, color: '#374151', fontWeight: 'bold' }]}>R$ {item.valor_unitario}/{item.unidade}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F5', padding: 16 },
    card: { backgroundColor: '#FFF', borderRadius: 18, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, marginBottom: 24 },
    cardHeader: { padding: 24, backgroundColor: '#176E46' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: '600' },
    form: { padding: 20 },
    field: { marginBottom: 18 },
    row: { flexDirection: 'row' },
    label: { fontSize: 11, fontWeight: '700', color: '#6E6E6E', letterSpacing: 0.5, marginBottom: 7, textTransform: 'uppercase' },
    input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E1E1E' },
    textArea: { height: 80, textAlignVertical: 'top' },
    btn: { backgroundColor: '#1F8A5B', paddingVertical: 17, borderRadius: 14, alignItems: 'center', marginTop: 10, shadowColor: '#1F8A5B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 },
    btnText: { color: '#FFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    selectBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selectText: { fontSize: 15, fontWeight: '600', color: '#1E1E1E' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 28 },
    modalBg: { backgroundColor: '#FFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, height: '80%', padding: 20 },
    miniModal: { backgroundColor: '#FFF', borderRadius: 22, padding: 28 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 16, fontWeight: '800', color: '#1E1E1E' },
    searchBar: { backgroundColor: '#F4F6F5', padding: 12, borderRadius: 12, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#D9D9D9', color: '#1E1E1E' },
    itemRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F4F6F5' },
    itemText: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
    itemSub: { fontSize: 10, color: '#6E6E6E' },
    newClientBtn: { flexDirection: 'row', backgroundColor: '#1F8A5B', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    newClientText: { color: '#FFF', fontWeight: '700', marginLeft: 10, fontSize: 12 },
    historyTitle: { fontSize: 12, fontWeight: '800', color: '#6E6E6E', letterSpacing: 0.5, marginBottom: 14, marginLeft: 4 },
    historyItem: { backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
    hProd: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
    hSub: { fontSize: 11, color: '#6E6E6E' },
    hVal: { fontSize: 12, fontWeight: '900', color: '#1F8A5B', marginTop: 4 },
    actions: { flexDirection: 'row', gap: 10 },
    actionBtn: { padding: 8, backgroundColor: '#F0F4F1', borderRadius: 10 },
    premiumModal: { backgroundColor: '#FFF', borderRadius: 22, overflow: 'hidden', elevation: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20 },
    premiumModalHeader: { padding: 28, alignItems: 'center' },
    iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    premiumModalTitle: { color: '#FFF', fontSize: 19, fontWeight: '900', letterSpacing: 0.3 },
    premiumModalSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 5 },
    premiumModalBody: { padding: 22 },
    infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5EE', borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 },
    infoText: { fontSize: 13, color: '#1E1E1E', flex: 1 },
    premiumModalQuestion: { textAlign: 'center', marginTop: 18, marginBottom: 14, color: '#6E6E6E', fontSize: 13, lineHeight: 20 },
    premiumBtn: { flexDirection: 'row', gap: 6, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    premiumBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
    orderCard: { backgroundColor: '#F4F6F5', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#D9D9D9' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    statusBadgeText: { fontSize: 11, fontWeight: '900' },
});







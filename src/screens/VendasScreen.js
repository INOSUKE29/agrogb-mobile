import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, StatusBar as RNStatusBar } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertVenda, getCadastro, getClientes, insertCliente, getVendasRecentes, deleteVenda, updateVenda } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../styles/theme';
import { AppInput } from '../ui/components/AppInput';
import { AppButton } from '../ui/components/AppButton';

export default function VendasScreen({ navigation, route }) {
    const [cliente, setCliente] = useState('');
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valor, setValor] = useState('');
    const [observacao, setObservacao] = useState('');
    const [editingUuid, setEditingUuid] = useState(null);

    // Data State
    const [history, setHistory] = useState([]);

    // Modal States
    const [modalVisible, setModalVisible] = useState(false); // Product
    const [clientModalVisible, setClientModalVisible] = useState(false); // Client

    // Lists
    const [items, setItems] = useState([]);
    const [clients, setClients] = useState([]);

    // Search
    const [searchText, setSearchText] = useState('');
    const [clientSearchText, setClientSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    useFocusEffect(useCallback(() => {
        loadInitialData();
        loadHistory();

        if (route.params?.newClient) {
            const newClient = route.params.newClient;
            setCliente(newClient.nome.toUpperCase());
            navigation.setParams({ newClient: null });
        }
    }, [route.params?.newClient]));

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

    const handleNewClient = () => {
        setClientModalVisible(false);
        navigation.navigate('ClienteForm', { returnTo: 'Vendas' });
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
            data: new Date().toISOString().split('T')[0]
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
            setProduto('');
            setQuantidade('');
            setValor('');
            setObservacao('');
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
            <RNStatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />
            <LinearGradient colors={[COLORS.backgroundDark, '#052e22']} style={StyleSheet.absoluteFill} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, padding: 20 }}>

                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>{editingUuid ? 'EDITAR VENDA' : 'REGISTRAR VENDA'}</Text>
                        <Text style={styles.headerSub}>Faturamento e Saída de Estoque</Text>
                    </View>
                    <Ionicons name="cart-outline" size={24} color={COLORS.primaryLight} />
                </View>

                {/* FORM CARD */}
                <View style={styles.card}>

                    {/* CLIENTE */}
                    <Text style={styles.sectionLabel}>CLIENTE / PARCEIRO</Text>
                    <TouchableOpacity style={styles.selector} onPress={() => setClientModalVisible(true)}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                            <Ionicons name="people-outline" size={20} color="#60A5FA" />
                        </View>
                        <Text style={[styles.selectorText, !cliente && { color: COLORS.gray500 }]}>
                            {cliente || "Selecionar Cliente..."}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
                    </TouchableOpacity>

                    <View style={{ height: 20 }} />

                    {/* PRODUTO */}
                    <Text style={styles.sectionLabel}>PRODUTO VENDIDO *</Text>
                    <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                            <Ionicons name="cube-outline" size={20} color={COLORS.primaryLight} />
                        </View>
                        <Text style={[styles.selectorText, !produto && { color: COLORS.gray500 }]}>
                            {produto || "Selecionar Produto..."}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
                    </TouchableOpacity>

                    <View style={{ height: 20 }} />

                    {/* QUANTIDADE & VALOR */}
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <AppInput
                                label="QUANTIDADE *"
                                placeholder="0.00"
                                value={quantidade}
                                onChangeText={setQuantidade}
                                keyboardType="decimal-pad"
                                variant="glass"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppInput
                                label="VALOR TOTAL (R$)"
                                placeholder="0.00"
                                value={valor}
                                onChangeText={setValor}
                                keyboardType="decimal-pad"
                                variant="glass"
                            />
                        </View>
                    </View>

                    <AppInput
                        label="OBSERVAÇÕES (OPCIONAL)"
                        placeholder="Detalhes da negociação..."
                        value={observacao}
                        onChangeText={(t) => up(t, setObservacao)}
                        variant="glass"
                        style={{ marginBottom: 0 }}
                    />
                </View>

                {/* HISTÓRICO */}
                <Text style={styles.historyTitle}>ÚLTIMAS VENDAS</Text>
                {history.map(item => (
                    <View key={item.uuid} style={styles.historyItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.hProd}>{item.produto}</Text>
                            <Text style={styles.hSub}>{item.cliente || 'BALCÃO'} • {new Date(item.data).toLocaleDateString()}</Text>
                            <Text style={styles.hVal}>{item.quantidade} x R$ {item.valor.toFixed(2)}</Text>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                                <Ionicons name="create-outline" size={20} color="#60A5FA" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                                <Ionicons name="trash-outline" size={20} color={COLORS.destructive} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

            </ScrollView>

            {/* ACTION BUTTON */}
            <View style={styles.footer}>
                {editingUuid && (
                    <TouchableOpacity style={styles.cancelLink} onPress={() => { setEditingUuid(null); setProduto(''); setQuantidade(''); setValor(''); setObservacao(''); setCliente(''); }}>
                        <Text style={styles.cancelText}>CANCELAR EDIÇÃO</Text>
                    </TouchableOpacity>
                )}
                <AppButton
                    title={editingUuid ? "SALVAR ALTERAÇÕES" : "REGISTRAR VENDA"}
                    onPress={salvar}
                    style={{ marginBottom: 0 }}
                />
            </View>

            {/* --- MODALS --- */}

            {/* PRODUCT MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR PRODUTO</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.gray200} />
                            </TouchableOpacity>
                        </View>
                        <TextInput style={styles.searchBar} placeholder="Buscar..." placeholderTextColor={COLORS.gray500} value={searchText} onChangeText={t => up(t, setSearchText)} autoCapitalize="characters" />
                        <FlatList
                            data={getFilteredItems()}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemRow} onPress={() => { setProduto(item.nome); setModalVisible(false); }}>
                                    <View style={[styles.miniIcon, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                        <Ionicons name="cube-outline" size={18} color={COLORS.primaryLight} />
                                    </View>
                                    <View>
                                        <Text style={styles.itemText}>{item.nome}</Text>
                                        <Text style={styles.itemSub}>{item.unidade}</Text>
                                    </View>
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
                                <Ionicons name="close" size={24} color={COLORS.gray200} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.newClientBtn} onPress={handleNewClient}>
                            <Ionicons name="add-circle" size={24} color="#FFF" />
                            <Text style={styles.newClientText}>CADASTRAR NOVO CLIENTE</Text>
                        </TouchableOpacity>

                        <TextInput style={styles.searchBar} placeholder="Buscar cliente..." placeholderTextColor={COLORS.gray500} value={clientSearchText} onChangeText={t => up(t, setClientSearchText)} autoCapitalize="characters" />

                        <FlatList
                            data={getFilteredClients()}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemRow} onPress={() => { setCliente(item.nome); setClientModalVisible(false); }}>
                                    <View style={[styles.miniIcon, { backgroundColor: 'rgba(96, 165, 250, 0.2)' }]}>
                                        <Ionicons name="person-outline" size={18} color="#60A5FA" />
                                    </View>
                                    <View>
                                        <Text style={styles.itemText}>{item.nome}</Text>
                                        <Text style={styles.itemSub}>{item.telefone || 'Sem telefone'}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListHeaderComponent={
                                <TouchableOpacity style={styles.itemRow} onPress={() => { setCliente('BALCÃO'); setClientModalVisible(false); }}>
                                    <View style={[styles.miniIcon, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                        <Ionicons name="storefront-outline" size={18} color={COLORS.gray500} />
                                    </View>
                                    <View>
                                        <Text style={styles.itemText}>BALCÃO / AVULSO</Text>
                                        <Text style={styles.itemSub}>Venda sem cadastro</Text>
                                    </View>
                                </TouchableOpacity>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundDark },

    header: {
        paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        marginBottom: 10
    },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 24, padding: 20,
        marginBottom: 20,
        borderWidth: 1, borderColor: COLORS.glassBorder
    },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: COLORS.primaryLight ?? '#A7F3D0', marginBottom: 8, letterSpacing: 0.5, marginLeft: 4 },

    selector: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 12, borderRadius: 12,
        borderWidth: 1, borderColor: COLORS.glassBorder
    },
    selectorText: { flex: 1, fontSize: 16, color: COLORS.white, fontWeight: '600' },
    iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },

    row: { flexDirection: 'row', justifyContent: 'space-between' },

    footer: {
        padding: 20, paddingBottom: 30,
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        position: 'absolute', bottom: 0, left: 0, right: 0,
        borderTopWidth: 1, borderTopColor: COLORS.glassBorder
    },
    cancelLink: { alignItems: 'center', marginBottom: 10 },
    cancelText: { color: COLORS.destructive, fontWeight: 'bold', fontSize: 12 },

    historyTitle: { marginLeft: 10, fontSize: 11, fontWeight: 'bold', color: COLORS.gray500, marginBottom: 10, marginTop: 5, letterSpacing: 1 },
    historyItem: {
        backgroundColor: COLORS.surface,
        marginHorizontal: 0, marginBottom: 10, borderRadius: 16, padding: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.glassBorder
    },
    hProd: { fontWeight: 'bold', color: COLORS.white, fontSize: 15 },
    hSub: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
    hVal: { fontSize: 13, fontWeight: 'bold', color: COLORS.primaryLight, marginTop: 4 },
    actions: { flexDirection: 'row', gap: 10 },
    actionBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalBg: { backgroundColor: COLORS.backgroundDark, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 25, borderWidth: 1, borderColor: COLORS.glassBorder },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
    modalTitle: { fontWeight: '900', fontSize: 18, marginBottom: 20, color: COLORS.white },
    searchBar: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 14, marginBottom: 15, fontSize: 16, color: 'white', borderWidth: 1, borderColor: COLORS.glassBorder },
    itemRow: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder, flexDirection: 'row', alignItems: 'center' },
    miniIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemText: { fontWeight: 'bold', fontSize: 16, color: COLORS.white },
    itemSub: { fontSize: 12, color: COLORS.gray500 },
    newClientBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    newClientText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10, fontSize: 13 },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, Vibration } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCompra, getCadastro, getComprasRecentes, updateCompra, deleteCompra, insertCadastro as insertCadastros } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';

export default function ComprasScreen({ navigation }) {
    const [item, setItem] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valor, setValor] = useState('');
    const [cultura, setCultura] = useState('');
    const [observacao, setObservacao] = useState('');
    const [detalhes, setDetalhes] = useState(''); // Bula / Info Técnica
    const [editingUuid, setEditingUuid] = useState(null);

    const [history, setHistory] = useState([]);

    // Selection Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [items, setItems] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    // Quick Add State
    const [quickAddModal, setQuickAddModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    // Camera State
    const [hasPermission, setHasPermission] = useState(null);
    const [anexoUri, setAnexoUri] = useState(null);

    useFocusEffect(useCallback(() => {
        loadItems();
        loadHistory();
    }, []));

    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const loadItems = async () => {
        setLoading(true);
        try {
            const all = await getCadastro();
            // Strict Filter: INSUMO or EMBALAGEM for Compras
            const inputs = all.filter(i => ['INSUMO', 'EMBALAGEM'].includes(i.tipo));
            setItems(inputs);
        } catch (e) { } finally { setLoading(false); }
    };

    const loadHistory = async () => {
        const data = await getComprasRecentes();
        setHistory(data);
    };

    const anexarNota = async () => {
        try {
            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.5,
                allowsEditing: true,
                aspect: [3, 4],
            });

            if (!result.canceled) {
                setAnexoUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível capturar a nota.');
        }
    };

    const getFilteredItems = () => {
        if (!searchText) return items;
        return items.filter(i => i.nome.includes(searchText.toUpperCase()));
    };

    const up = (t, setter) => setter(t.toUpperCase());

    const quickSave = async () => {
        if (!newItemName.trim()) { Alert.alert('Ops', 'Nome é obrigatório'); return; }
        const newUuid = uuidv4();
        try {
            await insertCadastros({
                uuid: newUuid,
                nome: newItemName,
                tipo: 'INSUMO',
                unidade: 'UN',
                observacao: 'Cadastrado na Compra (Quick)',
                estocavel: 1,
                vendavel: 0
            });
            // Reload
            // Reload Strict
            const all = await getCadastro();
            const inputs = all.filter(i => ['INSUMO', 'EMBALAGEM'].includes(i.tipo));
            setItems(inputs);

            // Select
            // Select
            handleEdit({ item: newItemName, uuid: null, quantidade: '', valor: '', cultura: '', observacao: '', detalhes: '' }); // Just set item name really
            setItem(newItemName);
            setModalVisible(false); // Close main modal
            setQuickAddModal(false);
            setNewItemName('');
        } catch (e) { Alert.alert('Erro', 'Falha ao criar item.'); }
    };

    const salvar = async () => {
        if (!item || !quantidade || !valor) {
            Alert.alert('Alerta', 'Preencha os campos obrigatórios (*)');
            return;
        }

        const dados = {
            uuid: editingUuid || uuidv4(),
            item: item.toUpperCase(),
            quantidade: parseFloat(quantidade) || 0,
            valor: parseFloat(valor) || 0,
            cultura: (cultura || 'GERAL').toUpperCase(),
            observacao: observacao.toUpperCase(),
            detalhes: detalhes.toUpperCase(),
            data: new Date().toISOString().split('T')[0],
            anexo: anexoUri
        };

        try {
            if (editingUuid) {
                await updateCompra(editingUuid, dados);
                Alert.alert('Sucesso', 'Registro atualizado.');
                setEditingUuid(null);
            } else {
                await insertCompra(dados);
                Alert.alert('Sucesso', 'Entrada registrada.');
            }

            setItem('');
            setQuantidade('');
            setValor('');
            setQuantidade('');
            setValor('');
            setObservacao('');
            setDetalhes('');
            setAnexoUri(null);

            loadHistory();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao salvar compra.');
        }
    };

    const handleEdit = (rec) => {
        setEditingUuid(rec.uuid);
        setItem(rec.item);
        setQuantidade(rec.quantidade.toString());
        setValor(rec.valor.toString());
        setCultura(rec.cultura);
        setObservacao(rec.observacao || '');
        setDetalhes(rec.detalhes || '');
        setAnexoUri(rec.anexo || null);
    };

    const handleDelete = (rec) => {
        Alert.alert('Excluir', 'Confirmar exclusão?', [
            { text: 'Não', style: 'cancel' },
            {
                text: 'Sim',
                style: 'destructive',
                onPress: async () => {
                    await deleteCompra(rec.uuid);
                    loadHistory();
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.card}>
                    <LinearGradient colors={['#6366F1', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardHeader}>
                        <Text style={styles.headerTitle}>{editingUuid ? 'EDITAR COMPRA' : 'ENTRADA DE INSUMOS'}</Text>
                        <Text style={styles.headerSub}>Compras e Suprimentos da Fazenda</Text>
                    </LinearGradient>

                    <View style={styles.form}>
                        {/* CAMERA BUTTON */}
                        <TouchableOpacity style={[styles.scanBtn, anexoUri ? { borderColor: '#10B981', backgroundColor: '#ECFDF5' } : null]} onPress={() => {
                            if (!hasPermission) {
                                Alert.alert('Permissão', 'Acesso à câmera necessário.');
                                return;
                            }
                            anexarNota();
                        }}>
                            <Ionicons name={anexoUri ? "checkmark-circle" : "camera"} size={20} color={anexoUri ? "#10B981" : "#4F46E5"} />
                            <Text style={[styles.scanText, anexoUri ? { color: '#10B981' } : null]}>
                                {anexoUri ? 'NOTA ANEXADA COM SUCESSO' : 'ANEXAR FOTO DA NOTA (OPCIONAL)'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.field}>
                            <Text style={styles.label}>PRODUTO / INSUMO COMPRADO *</Text>
                            <TouchableOpacity style={styles.selectBtn} onPress={() => setModalVisible(true)}>
                                <Text style={[styles.selectText, !item && { color: '#9CA3AF' }]}>
                                    {item || "SELECIONAR ITEM..."}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>QUANTIDADE *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0"
                                    value={quantidade}
                                    onChangeText={setQuantidade}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>VALOR TOTAL R$ *</Text>
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
                            <Text style={styles.label}>VINCULAR À CULTURA</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="EX: MORANGO ALBION ou GERAL"
                                value={cultura}
                                onChangeText={(t) => up(t, setCultura)}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>DETALHES TÉCNICOS / BULA</Text>
                            <TextInput
                                style={[styles.input, { height: 60 }]}
                                placeholder="EX: NPK 04-14-08, APLICAÇÃO FOLIAR..."
                                value={detalhes}
                                onChangeText={(t) => up(t, setDetalhes)}
                                multiline
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>DETALHES / FORNECEDOR / NOTA</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="NOTAS SOBRE A COMPRA..."
                                value={observacao}
                                onChangeText={(t) => up(t, setObservacao)}
                                multiline
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.row}>
                            {editingUuid && (
                                <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444', flex: 1, marginRight: 10 }]} onPress={() => { setEditingUuid(null); setItem(''); setQuantidade(''); setValor(''); setObservacao(''); setDetalhes(''); setCultura(''); setAnexoUri(null); }}>
                                    <Text style={styles.btnText}>CANCELAR</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={[styles.btn, { flex: 2 }]} onPress={salvar}>
                                <Text style={styles.btnText}>{editingUuid ? 'SALVAR ALTERAÇÕES' : 'REGISTRAR ENTRADA'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* HISTÓRICO */}
                <Text style={styles.historyTitle}>ENTRADAS RECENTES</Text>
                {history.map(rec => (
                    <View key={rec.uuid} style={styles.historyItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.hProd}>{rec.item}</Text>
                            <Text style={styles.hSub}>{new Date(rec.data).toLocaleDateString()} • {rec.cultura || 'Geral'}</Text>
                            <Text style={styles.hVal}>{rec.quantidade} un • R$ {rec.valor.toFixed(2)}</Text>
                            {rec.detalhes ? <Text style={[styles.hObs, { color: '#4B5563', fontWeight: 'bold' }]}>📦 {rec.detalhes}</Text> : null}
                            {rec.observacao ? <Text style={styles.hObs}>📝 {rec.observacao}</Text> : null}
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => handleEdit(rec)} style={styles.actionBtn}>
                                <Ionicons name="create-outline" size={20} color="#4F46E5" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(rec)} style={styles.actionBtn}>
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>



            {/* SELECTION MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR MATERIAL</Text>
                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                <TouchableOpacity onPress={() => { setModalVisible(false); setQuickAddModal(true); }}>
                                    <Ionicons name="add-circle" size={28} color="#6366F1" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#374151" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TextInput
                            style={styles.searchBar}
                            placeholder="Buscar item..."
                            value={searchText}
                            onChangeText={t => up(t, setSearchText)}
                            autoCapitalize="characters"
                        />

                        {loading ? <ActivityIndicator color="#6366F1" /> :
                            <FlatList
                                data={getFilteredItems()}
                                keyExtractor={i => i.uuid || i.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.itemRow} onPress={() => { setItem(item.nome); setModalVisible(false); }}>
                                        <Text style={styles.itemText}>{item.nome}</Text>
                                        <Text style={styles.itemSub}>{item.tipo} • {item.unidade}</Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={<Text style={styles.empty}>Nenhum material encontrado.</Text>}
                            />
                        }
                    </View>
                </View>
            </Modal>

            {/* QUICK ADD MODAL */}
            <Modal visible={quickAddModal} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalBg, { height: 'auto', paddingBottom: 40 }]}>
                        <Text style={styles.modalTitle}>NOVO INSUMO RÁPIDO</Text>
                        <View style={styles.field}>
                            <Text style={styles.label}>NOME DO ITEM</Text>
                            <TextInput style={styles.input} value={newItemName} onChangeText={t => up(t, setNewItemName)} autoCapitalize="characters" placeholder="EX: ADUBO ORGANICO" />
                        </View>
                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444', flex: 1, marginRight: 10 }]} onPress={() => setQuickAddModal(false)}>
                                <Text style={styles.btnText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={quickSave}>
                                <Text style={styles.btnText}>SALVAR</Text>
                            </TouchableOpacity>
                        </View>
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
    scanBtn: { flexDirection: 'row', backgroundColor: '#E8F5EE', padding: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 18, borderWidth: 1, borderColor: '#B7DFCA' },
    scanText: { color: '#1F8A5B', fontWeight: '700', marginLeft: 8, fontSize: 12, letterSpacing: 0.5 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBg: { backgroundColor: '#FFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, height: '80%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 16, fontWeight: '800', color: '#1E1E1E' },
    searchBar: { backgroundColor: '#F4F6F5', padding: 12, borderRadius: 12, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#D9D9D9', color: '#1E1E1E' },
    itemRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F4F6F5' },
    itemText: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
    itemSub: { fontSize: 10, color: '#6E6E6E' },
    empty: { textAlign: 'center', marginTop: 20, color: '#6E6E6E' },
    historyTitle: { fontSize: 12, fontWeight: '800', color: '#6E6E6E', letterSpacing: 0.5, marginBottom: 14, marginLeft: 4 },
    historyItem: { backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
    hProd: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
    hSub: { fontSize: 11, color: '#6E6E6E' },
    hVal: { fontSize: 12, fontWeight: '800', color: '#1F8A5B', marginTop: 4 },
    hObs: { fontSize: 10, color: '#6E6E6E', marginTop: 2, fontStyle: 'italic' },
    actions: { flexDirection: 'row', gap: 10 },
    actionBtn: { padding: 8, backgroundColor: '#F0F4F1', borderRadius: 10 },
    cameraOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
    scanBox: { width: 250, height: 250, borderWidth: 2, borderColor: '#FFF', borderRadius: 20 },
    closeCamera: { position: 'absolute', bottom: 50, backgroundColor: '#FFF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
    closeCameraText: { color: '#000', fontWeight: 'bold' }
});





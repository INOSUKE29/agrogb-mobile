import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, Vibration, Animated } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCompra, getCadastro, getComprasRecentes, updateCompra, deleteCompra, insertCadastro as insertCadastros } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { DARK } from '../styles/darkTheme';

export default function ComprasScreen({ navigation }) {
    const [item, setItem] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valor, setValor] = useState('');
    const [cultura, setCultura] = useState('');
    const [observacao, setObservacao] = useState('');
    const [detalhes, setDetalhes] = useState(''); // Bula / Info TÃ©cnica
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
            Alert.alert('Erro', 'NÃ£o foi possÃ­vel capturar a nota.');
        }
    };

    const getFilteredItems = () => {
        if (!searchText) return items;
        return items.filter(i => i.nome.includes(searchText.toUpperCase()));
    };

    const up = (t, setter) => setter(t.toUpperCase());

    const quickSave = async () => {
        if (!newItemName.trim()) { Alert.alert('Ops', 'Nome Ã© obrigatÃ³rio'); return; }
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
            Alert.alert('Alerta', 'Preencha os campos obrigatÃ³rios (*)');
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
        Alert.alert('Excluir', 'Confirmar exclusÃ£o?', [
            { text: 'NÃ£o', style: 'cancel' },
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
                <Text style={styles.headerTitle}>{editingUuid ? 'EDITAR COMPRA' : 'ENTRADA DE INSUMOS'}</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>COMPRAS E SUPRIMENTOS</Text>

                    {/* CAMERA BUTTON */}
                    <TouchableOpacity style={[styles.scanBtn, anexoUri ? styles.scanBtnOk : null]} onPress={() => {
                        if (!hasPermission) { Alert.alert('PermissÃ£o', 'Acesso Ã  cÃ¢mera necessÃ¡rio.'); return; }
                        anexarNota();
                    }}>
                        <Ionicons name={anexoUri ? "checkmark-circle" : "camera"} size={20} color={anexoUri ? "#34D399" : "#9CA3AF"} />
                        <Text style={[styles.scanText, anexoUri ? { color: '#34D399' } : null]}>
                            {anexoUri ? 'NOTA ANEXADA COM SUCESSO' : 'ANEXAR FOTO DA NOTA (OPCIONAL)'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>PRODUTO / INSUMO COMPRADO *</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setModalVisible(true)}>
                        <Text style={[styles.selectText, !item && { color: '#6B7280' }]}>{item || 'SELECIONAR ITEM...'}</Text>
                        <Ionicons name="chevron-down" size={18} color="#34D399" />
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>QUANTIDADE *</Text>
                            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#6B7280" value={quantidade} onChangeText={setQuantidade} keyboardType="decimal-pad" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>VALOR TOTAL R$ *</Text>
                            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#6B7280" value={valor} onChangeText={setValor} keyboardType="decimal-pad" />
                        </View>
                    </View>

                    <Text style={styles.label}>VINCULAR Ã€ CULTURA</Text>
                    <TextInput style={styles.input} placeholder="EX: MORANGO ALBION ou GERAL" placeholderTextColor="#6B7280" value={cultura} onChangeText={(t) => up(t, setCultura)} />

                    <Text style={styles.label}>DETALHES TÃ‰CNICOS / BULA</Text>
                    <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="EX: NPK 04-14-08, APLICAÃ‡ÃƒO FOLIAR..." placeholderTextColor="#6B7280" value={detalhes} onChangeText={(t) => up(t, setDetalhes)} multiline />

                    <Text style={styles.label}>DETALHES / FORNECEDOR / NOTA</Text>
                    <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="NOTAS SOBRE A COMPRA..." placeholderTextColor="#6B7280" value={observacao} onChangeText={(t) => up(t, setObservacao)} multiline />

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        {editingUuid && (
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444', flex: 1 }]} onPress={() => { setEditingUuid(null); setItem(''); setQuantidade(''); setValor(''); setObservacao(''); setDetalhes(''); setCultura(''); setAnexoUri(null); }}>
                                <Text style={styles.btnText}>CANCELAR</Text>
                            </TouchableOpacity>
                        )}
                        <Animated.View style={[{ flex: 2 }, { transform: [{ scale: scaleAnim }] }]}>
                            <TouchableOpacity style={styles.btn} onPress={salvar} onPressIn={pressIn} onPressOut={pressOut}>
                                <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.btnText}>{editingUuid ? 'SALVAR ALTERAÃ‡Ã•ES' : 'REGISTRAR ENTRADA'}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View>

                {/* HISTÃ“RICO */}
                <Text style={styles.historyTitle}>ENTRADAS RECENTES</Text>
                {history.map(rec => (
                    <View key={rec.uuid} style={styles.historyItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.hProd}>{rec.item}</Text>
                            <Text style={styles.hSub}>{new Date(rec.data).toLocaleDateString()} â€¢ {rec.cultura || 'Geral'}</Text>
                            <Text style={styles.hVal}>{rec.quantidade} un â€¢ R$ {rec.valor.toFixed(2)}</Text>
                            {rec.detalhes ? <Text style={styles.hObs}>ðŸ“¦ {rec.detalhes}</Text> : null}
                            {rec.observacao ? <Text style={styles.hObs}>ðŸ“ {rec.observacao}</Text> : null}
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => handleEdit(rec)} style={styles.actionBtn}>
                                <Ionicons name="create-outline" size={18} color="#34D399" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(rec)} style={styles.actionBtn}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
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
                                    <Ionicons name="add-circle" size={28} color="#10B981" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TextInput style={styles.searchBar} placeholder="Buscar item..." placeholderTextColor="#9CA3AF" value={searchText} onChangeText={t => up(t, setSearchText)} />
                        {loading ? <ActivityIndicator color="#10B981" style={{ marginTop: 20 }} /> :
                            <FlatList data={getFilteredItems()} keyExtractor={i => i.uuid || i.id.toString()} renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemRow} onPress={() => { setItem(item.nome); setModalVisible(false); }}>
                                    <Text style={styles.itemText}>{item.nome}</Text>
                                    <Text style={styles.itemSub}>{item.tipo} â€¢ {item.unidade}</Text>
                                </TouchableOpacity>
                            )} ListEmptyComponent={<Text style={styles.empty}>Nenhum material encontrado.</Text>} />
                        }
                    </View>
                </View>
            </Modal>

            {/* QUICK ADD MODAL */}
            <Modal visible={quickAddModal} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalBg, { height: 'auto', paddingBottom: 40 }]}>
                        <Text style={styles.modalTitle}>NOVO INSUMO RÃPIDO</Text>
                        <Text style={styles.label}>NOME DO ITEM</Text>
                        <TextInput style={styles.input} value={newItemName} onChangeText={t => up(t, setNewItemName)} placeholder="EX: ADUBO ORGANICO" placeholderTextColor="#6B7280" />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444', flex: 1 }]} onPress={() => setQuickAddModal(false)}>
                                <Text style={styles.btnText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={quickSave}>
                                <Text style={styles.btnText}>SALVAR</Text>
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
    scanBtn: { flexDirection: 'row', backgroundColor: 'rgba(0,255,156,0.06)', padding: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 18, borderWidth: 1, borderColor: DARK.glowBorder },
    scanBtnOk: { borderColor: DARK.glow, backgroundColor: 'rgba(0,255,156,0.12)' },
    scanText: { color: DARK.textMuted, fontWeight: 'bold', marginLeft: 10, fontSize: 12, letterSpacing: 0.5 },

    btn: { backgroundColor: DARK.glow, paddingVertical: 17, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', elevation: 4, shadowColor: '#00FF9C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.45, shadowRadius: 8 },
    btnText: { color: '#061E1A', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

    historyTitle: { fontSize: 11, fontWeight: '900', color: DARK.textMuted, letterSpacing: 1.2, marginBottom: 14, paddingLeft: 4 },
    historyItem: { backgroundColor: DARK.card, padding: 16, borderRadius: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: DARK.glowBorder },
    hProd: { fontSize: 14, fontWeight: 'bold', color: DARK.textPrimary },
    hSub: { fontSize: 11, color: DARK.textSecondary, marginTop: 2 },
    hVal: { fontSize: 12, fontWeight: '900', color: DARK.glow, marginTop: 4 },
    hObs: { fontSize: 10, color: DARK.textMuted, marginTop: 2, fontStyle: 'italic' },
    actions: { flexDirection: 'row', gap: 10 },
    actionBtn: { padding: 8, backgroundColor: 'rgba(0,255,156,0.08)', borderRadius: 10, borderWidth: 1, borderColor: DARK.glowBorder },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalBg: { backgroundColor: DARK.modal, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 22, borderWidth: 1, borderColor: DARK.glowBorder },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: DARK.textPrimary, marginBottom: 14 },
    searchBar: { backgroundColor: DARK.card, padding: 13, borderRadius: 12, marginBottom: 12, fontSize: 14, color: DARK.textPrimary, borderWidth: 1, borderColor: DARK.glowBorder },
    itemRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    itemText: { fontSize: 14, fontWeight: 'bold', color: DARK.textPrimary },
    itemSub: { fontSize: 10, color: DARK.textMuted, marginTop: 2 },
    empty: { textAlign: 'center', marginTop: 20, color: DARK.textMuted },
});


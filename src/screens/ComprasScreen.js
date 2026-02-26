import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, Vibration, StatusBar as RNStatusBar } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCompra, getCadastro, getComprasRecentes, updateCompra, deleteCompra, insertCadastro as insertCadastros, executeQuery } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import CultureSelector from '../components/CultureSelector';
import { COLORS } from '../styles/theme';
import { AppInput } from '../ui/components/AppInput';
import { AppButton } from '../ui/components/AppButton';

export default function ComprasScreen({ navigation }) {
    // Form State
    const [item, setItem] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valor, setValor] = useState('');
    const [observacao, setObservacao] = useState('');
    const [detalhes, setDetalhes] = useState(''); // Compatibility

    // Culture State 
    const [selectedCulture, setSelectedCulture] = useState(null);
    const [culturesList, setCulturesList] = useState([]);
    const [loadingCultures, setLoadingCultures] = useState(false);

    const [editingUuid, setEditingUuid] = useState(null);

    // History & Items
    const [history, setHistory] = useState([]);
    const [items, setItems] = useState([]);

    // Modals
    const [modalVisible, setModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    // Quick Add
    const [quickAddModal, setQuickAddModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    // Anexos (Nota)
    const [anexoUri, setAnexoUri] = useState(null);

    useFocusEffect(useCallback(() => {
        loadItems();
        loadHistory();
        loadCultures();
    }, []));

    const handleAnexarNota = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Aviso', 'Precisamos de permissão para acessar suas fotos.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
        });

        if (!result.canceled) {
            const sourceUri = result.assets[0].uri;
            const filename = sourceUri.split('/').pop();
            const newPath = FileSystem.documentDirectory + filename;
            try {
                await FileSystem.copyAsync({ from: sourceUri, to: newPath });
                setAnexoUri(newPath);
                Alert.alert('Sucesso', 'Nota anexada com sucesso!');
            } catch (e) {
                console.error("Erro ao salvar nota", e);
                Alert.alert('Erro', 'Não foi possível salvar o anexo localmente.');
            }
        }
    };

    const loadCultures = async () => {
        setLoadingCultures(true);
        try {
            const res = await executeQuery('SELECT * FROM culturas ORDER BY nome ASC');
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) {
                rows.push(res.rows.item(i));
            }
            setCulturesList(rows);
            if (rows.length === 1 && !selectedCulture) {
                setSelectedCulture(rows[0]);
            }
        } catch (e) {
            console.error("Erro ao carregar culturas", e);
        } finally {
            setLoadingCultures(false);
        }
    };

    const loadItems = async () => {
        setLoading(true);
        try {
            const all = await getCadastro();
            const inputs = all.filter(i => ['INSUMO', 'EMBALAGEM'].includes(i.tipo));
            setItems(inputs);
        } catch (e) { } finally { setLoading(false); }
    };

    const loadHistory = async () => {
        const data = await getComprasRecentes();
        setHistory(data);
    };

    // Handlers legacy de câmera removidos para dar lugar à compressão nativa

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
            const all = await getCadastro();
            const inputs = all.filter(i => ['INSUMO', 'EMBALAGEM'].includes(i.tipo));
            setItems(inputs);
            setItem(newItemName);
            setModalVisible(false);
            setQuickAddModal(false);
            setNewItemName('');
        } catch (e) { Alert.alert('Erro', 'Falha ao criar item.'); }
    };

    const salvar = async () => {
        if (!item || !quantidade || !valor) {
            Alert.alert('Alerta', 'Preencha Produto, Quantidade e Valor.');
            return;
        }

        if (!selectedCulture) {
            Alert.alert('Atenção', 'Selecione uma cultura para vincular a compra.');
            return;
        }

        const dados = {
            uuid: editingUuid || uuidv4(),
            item: item.toUpperCase(),
            quantidade: parseFloat(quantidade) || 0,
            valor: parseFloat(valor) || 0,
            cultura: selectedCulture.nome.toUpperCase(),
            cultureId: selectedCulture.uuid || selectedCulture.id,
            observacao: observacao.toUpperCase(),
            detalhes: anexoUri ? anexoUri : detalhes.toUpperCase(),

            data: new Date().toISOString().split('T')[0]
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
        setObservacao(rec.observacao || '');
        setDetalhes(rec.detalhes || '');
        if (rec.detalhes && rec.detalhes.includes('file://')) {
            setAnexoUri(rec.detalhes);
        } else {
            setAnexoUri(null);
        }
        const found = culturesList.find(c => c.nome === rec.cultura);
        if (found) {
            setSelectedCulture(found);
        } else if (rec.cultura) {
            setSelectedCulture({ id: 'legacy', nome: rec.cultura, uuid: null });
        }
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
            <RNStatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />
            <LinearGradient colors={[COLORS.backgroundDark, '#052e22']} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{editingUuid ? 'EDITAR COMPRA' : 'REGISTRAR COMPRA'}</Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, padding: 20 }}>

                {/* CARD FOR FORM - GLASS */}
                <View style={styles.card}>

                    {/* BOTAO ANEXAR NOTA */}
                    <TouchableOpacity style={styles.scanBtn} onPress={handleAnexarNota}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.scanIconBg, { backgroundColor: anexoUri ? '#10B981' : 'rgba(255,255,255,0.1)' }]}>
                                <Ionicons name={anexoUri ? "checkmark-circle" : "document-attach-outline"} size={24} color={COLORS.white} />
                            </View>
                            <View style={{ marginLeft: 15 }}>
                                <Text style={styles.scanTitle}>{anexoUri ? "NOTA ANEXADA" : "ANEXAR NOTA"}</Text>
                                <Text style={styles.scanSub}>{anexoUri ? "Salvo no celular (Offline)" : "Tirar foto ou galeria"}</Text>
                            </View>
                        </View>
                        {anexoUri ?
                            <TouchableOpacity onPress={() => setAnexoUri(null)} style={{ padding: 5 }}>
                                <Ionicons name="trash-outline" size={20} color="#F87171" />
                            </TouchableOpacity>
                            :
                            <Ionicons name="image-outline" size={20} color={COLORS.glassBorder} />
                        }
                    </TouchableOpacity>

                    {/* PRODUTO */}
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <AppInput
                            label="PRODUTO / INSUMO *"
                            value={item}
                            placeholder="Buscar no catálogo..."
                            icon="search"
                            style={{ pointerEvents: 'none' }}
                            editable={false}
                            variant="glass"
                        />
                    </TouchableOpacity>

                    {/* QUANTITY & VALUE */}
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <AppInput
                                label="QUANTIDADE *"
                                value={quantidade}
                                onChangeText={setQuantidade}
                                placeholder="0"
                                keyboardType="decimal-pad"
                                variant="glass"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppInput
                                label="VALOR (R$)"
                                value={valor}
                                onChangeText={setValor}
                                placeholder="0,00"
                                keyboardType="decimal-pad"
                                variant="glass"
                            />
                        </View>
                    </View>

                    {/* CULTURE */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={styles.label}>CULTURA (DESTINO) *</Text>
                        <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: COLORS.glassBorder }}>
                            <CultureSelector
                                cultures={culturesList}
                                selectedCulture={selectedCulture ? (selectedCulture.nome || selectedCulture.id) : null}
                                onSelect={setSelectedCulture}
                                loading={loadingCultures}
                                dark={true} // Hypothetical prop, or just renders better on dark
                            />
                        </View>
                    </View>

                    {/* ACTIONS */}
                    <View style={styles.actionRow}>
                        {editingUuid && (
                            <AppButton
                                title="CANCELAR"
                                onPress={() => { setEditingUuid(null); setItem(''); setQuantidade(''); setValor(''); setObservacao(''); setDetalhes(''); setAnexoUri(null); setSelectedCulture(null); }}
                                variant="glass"
                                style={{ flex: 1, marginRight: 10 }}
                                textStyle={{ color: COLORS.white }}
                            />
                        )}
                        <AppButton
                            title={editingUuid ? 'SALVAR ALTERAÇÕES' : 'SALVAR COMPRA'}
                            onPress={salvar}
                            style={{ flex: 1 }}
                        />
                    </View>
                </View>

                {/* HISTÓRICO - DARK Items */}
                <Text style={styles.historyTitle}>ENTRADAS RECENTES</Text>
                {history.map(rec => (
                    <View key={rec.uuid} style={styles.historyItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.hProd}>{rec.item}</Text>
                            <Text style={styles.hSub}>{new Date(rec.data).toLocaleDateString()} • {rec.cultura || 'Geral'}</Text>
                            <Text style={styles.hVal}>{rec.quantidade} un • R$ {rec.valor.toFixed(2)}</Text>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => handleEdit(rec)} style={styles.actionBtn}>
                                <Ionicons name="create-outline" size={20} color={COLORS.primaryLight} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(rec)} style={styles.actionBtn}>
                                <Ionicons name="trash-outline" size={20} color={COLORS.destructive} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* CAMERA MODAL REMOVIDA (Substituída por nativo ImagePicker) */}

            {/* SELECTION MODAL - Dark? Or keep light for contrast? Keeping Light Modal is safer for lists usually, but let's try Dark Modal for consistency */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR MATERIAL</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.gray200} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchBar}
                            placeholder="Buscar item..."
                            placeholderTextColor={COLORS.gray500}
                            value={searchText}
                            onChangeText={t => up(t, setSearchText)}
                            autoCapitalize="characters"
                        />

                        {loading ? <ActivityIndicator color={COLORS.primary} /> :
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
                        <TouchableOpacity
                            style={styles.quickAddBtn}
                            onPress={() => { setModalVisible(false); setQuickAddModal(true); }}
                        >
                            <Text style={styles.quickAddText}>+ CADASTRAR NOVO</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* QUICK ADD MODAL */}
            <Modal visible={quickAddModal} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalBg, { height: 'auto', paddingBottom: 40 }]}>
                        <Text style={styles.modalTitle}>NOVO INSUMO RÁPIDO</Text>
                        <View style={styles.field}>
                            <AppInput label="NOME DO ITEM" value={newItemName} onChangeText={t => up(t, setNewItemName)} placeholder="EX: ADUBO ORGANICO" variant="glass" />
                        </View>
                        <View style={styles.row}>
                            <AppButton title="CANCELAR" onPress={() => setQuickAddModal(false)} variant="glass" style={{ flex: 1, marginRight: 10 }} textStyle={{ color: 'white' }} />
                            <AppButton title="SALVAR" onPress={quickSave} style={{ flex: 1 }} />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundDark },
    header: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, letterSpacing: 1 },

    card: {
        backgroundColor: COLORS.surface, // Dark Green
        borderRadius: 24,
        padding: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: COLORS.glassBorder
    },
    row: { flexDirection: 'row' },
    label: { fontSize: 12, fontWeight: 'bold', color: COLORS.primaryLight, marginBottom: 8, letterSpacing: 0.5, marginLeft: 4 },

    // Scanner
    scanBtn: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.glassBorder
    },
    scanIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    scanTitle: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
    scanSub: { color: COLORS.gray500, fontSize: 12 },

    // Actions
    actionRow: { flexDirection: 'row', marginTop: 10 },

    // History
    historyTitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.gray500, marginBottom: 10, paddingLeft: 5, letterSpacing: 1 },
    historyItem: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.glassBorder
    },
    hProd: { fontSize: 14, fontWeight: 'bold', color: COLORS.white },
    hSub: { fontSize: 11, color: COLORS.gray500, marginTop: 2 },
    hVal: { fontSize: 13, fontWeight: 'bold', color: COLORS.primaryLight, marginTop: 2 },
    actions: { flexDirection: 'row', gap: 10 },
    actionBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 },

    // Modals
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalBg: { backgroundColor: COLORS.backgroundDark, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
    searchBar: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12, marginBottom: 10, color: 'white', borderWidth: 1, borderColor: COLORS.glassBorder },
    itemRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
    itemText: { fontSize: 14, fontWeight: 'bold', color: COLORS.white, marginBottom: 2 },
    itemSub: { fontSize: 11, color: COLORS.gray500 },
    empty: { textAlign: 'center', marginTop: 20, color: COLORS.gray500 },
    quickAddBtn: { marginTop: 10, padding: 15, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
    quickAddText: { color: COLORS.primaryLight, fontWeight: 'bold' },
    field: { marginBottom: 10 },

    // Camera
    cameraOverlay: { flex: 1 },
    scanBox: { flex: 1, margin: 40, borderWidth: 2, borderColor: '#FFF', borderRadius: 20 },
    closeCamera: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#FFF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
    closeCameraText: { fontWeight: 'bold' }
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, Image } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCompra, getCadastro, getComprasRecentes, updateCompra, deleteCompra, insertCadastro as insertCadastros } from '../database/database';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { showToast } from '../ui/Toast';
import { useTheme } from '../context/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';
import DangerButton from '../ui/DangerButton';

export default function ComprasScreen({ navigation }) {
    const { colors } = useTheme();
    const [item, setItem] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valor, setValor] = useState('');
    const [cultura, setCultura] = useState('');
    const [observacao, setObservacao] = useState('');
    const [detalhes, setDetalhes] = useState('');
    const [editingUuid, setEditingUuid] = useState(null);
    const [history, setHistory] = useState([]);

    const [modalVisible, setModalVisible] = useState(false);
    const [items, setItems] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    const [quickAddModal, setQuickAddModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [anexoUri, setAnexoUri] = useState(null);

    useFocusEffect(useCallback(() => {
        loadItems();
        loadHistory();
    }, []));

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

    const anexarNota = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão', 'Acesso à câmera necessário.');
                return;
            }

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
            await loadItems();
            setItem(newItemName);
            setModalVisible(false);
            setQuickAddModal(false);
            setNewItemName('');
            showToast('Novo insumo cadastrado!');
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
                showToast('Compra atualizada!');
                setEditingUuid(null);
            } else {
                await insertCompra(dados);
                showToast('Entrada registrada!');
            }

            setItem(''); setQuantidade(''); setValor(''); setObservacao(''); setDetalhes(''); setCultura(''); setAnexoUri(null);
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
        Alert.alert('Excluir', 'Confirmar exclusão desta entrada?', [
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

    const renderItem = ({ item: rec }) => (
        <GlowCard style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
            <View style={styles.historyTop}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.hProd, { color: colors.textPrimary }]}>{rec.item}</Text>
                    <Text style={[styles.hSub, { color: colors.textSecondary }]}>
                        {new Date(rec.data).toLocaleDateString()} • {rec.cultura || 'Geral'}
                    </Text>
                </View>
                <View style={styles.hValBadge}>
                    <Text style={[styles.hValText, { color: colors.primary }]}>R$ {rec.valor.toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.hDetails}>
                <Text style={[styles.hQty, { color: colors.textPrimary }]}>{rec.quantidade} UN</Text>
                {rec.anexo && <Ionicons name="image" size={14} color={colors.primary} />}
            </View>

            {(rec.detalhes || rec.observacao) && (
                <View style={styles.hObsContainer}>
                    {rec.detalhes ? <Text style={[styles.hObs, { color: colors.textMuted }]}>📦 {rec.detalhes}</Text> : null}
                    {rec.observacao ? <Text style={[styles.hObs, { color: colors.textMuted }]}>📝 {rec.observacao}</Text> : null}
                </View>
            )}

            <View style={styles.hActions}>
                <TouchableOpacity onPress={() => handleEdit(rec)} style={[styles.actionBtn, { borderColor: colors.glassBorder }]}>
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.textPrimary }]}>EDITAR</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(rec)} style={[styles.actionBtn, { borderColor: colors.glassBorder }]}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>EXCLUIR</Text>
                </TouchableOpacity>
            </View>
        </GlowCard>
    );

    return (
        <AppContainer>
            <ScreenHeader
                title={editingUuid ? 'CONFERIR ENTRADA' : 'LOGÍSTICA & COMPRAS'}
                onBack={() => navigation.goBack()}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <GlowCard style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
                    <Text style={[styles.cardTitle, { color: colors.primary }]}>REGISTRAR ENTRADA</Text>

                    {/* FOTO DA NOTA */}
                    <TouchableOpacity
                        style={[styles.scanBtn, { backgroundColor: colors.background, borderColor: anexoUri ? colors.primary : colors.glassBorder }]}
                        onPress={anexarNota}
                    >
                        {anexoUri ? (
                            <Image source={{ uri: anexoUri }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.scanPlaceholder}>
                                <Ionicons name="camera" size={24} color={colors.textMuted} />
                                <Text style={[styles.scanText, { color: colors.textMuted }]}>FOTO DA NOTA (OPCIONAL)</Text>
                            </View>
                        )}
                        {anexoUri && (
                            <View style={styles.scanOverlay}>
                                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                <Text style={styles.scanOverlayText}>ALTERAR FOTO</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>PRODUTO / INSUMO *</Text>
                    <TouchableOpacity
                        style={[styles.selectorBtn, { backgroundColor: colors.background, borderColor: colors.glassBorder }]}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={[styles.selectorText, { color: item ? colors.textPrimary : colors.placeholder }]}>
                            {item || 'SELECIONAR MATERIAL...'}
                        </Text>
                        <Ionicons name="search" size={18} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>QUANTIDADE *</Text>
                            <GlowInput placeholder="0.00" value={quantidade} onChangeText={setQuantidade} keyboardType="decimal-pad" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>VALOR TOTAL R$ *</Text>
                            <GlowInput placeholder="0.00" value={valor} onChangeText={setValor} keyboardType="decimal-pad" />
                        </View>
                    </View>

                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>VINCULAR À CULTURA</Text>
                    <GlowInput placeholder="EX: MORANGO ou GERAL" value={cultura} onChangeText={t => setCultura(t.toUpperCase())} />

                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>DETALHES TÉCNICOS / BULA</Text>
                    <GlowInput placeholder="EX: NPK 04-14-08..." value={detalhes} onChangeText={t => setDetalhes(t.toUpperCase())} />

                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>OBSERVAÇÕES / FORNECEDOR</Text>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.glassBorder, color: colors.textPrimary }]}
                        placeholder="Notas adicionais..."
                        placeholderTextColor={colors.placeholder}
                        value={observacao}
                        onChangeText={t => setObservacao(t.toUpperCase())}
                        multiline
                    />

                    <View style={styles.buttonRow}>
                        {editingUuid && (
                            <DangerButton
                                label="CANCELAR"
                                onPress={() => { setEditingUuid(null); setItem(''); setQuantidade(''); setValor(''); setObservacao(''); setDetalhes(''); setCultura(''); setAnexoUri(null); }}
                                style={{ flex: 1 }}
                            />
                        )}
                        <PrimaryButton
                            label={editingUuid ? 'SALVAR' : 'REGISTRAR'}
                            icon="checkmark-circle"
                            onPress={salvar}
                            style={{ flex: 2 }}
                        />
                    </View>
                </GlowCard>

                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>ENTRADAS RECENTES</Text>

                <FlatList
                    data={history}
                    keyExtractor={rec => rec.uuid}
                    renderItem={renderItem}
                    scrollEnabled={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="cart-off" size={48} color={colors.glassBorder} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma compra registrada.</Text>
                        </View>
                    }
                />
            </ScrollView>

            {/* SELECTION MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent={false}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <ScreenHeader
                        title="SELECIONAR MATERIAL"
                        onBack={() => setModalVisible(false)}
                        rightElement={
                            <TouchableOpacity onPress={() => { setModalVisible(false); setQuickAddModal(true); }}>
                                <Ionicons name="add" size={28} color={colors.primary} />
                            </TouchableOpacity>
                        }
                    />

                    <View style={{ padding: 20, flex: 1 }}>
                        <GlowInput
                            placeholder="Buscar item..."
                            value={searchText}
                            onChangeText={t => setSearchText(t.toUpperCase())}
                        />
                        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> :
                            <FlatList
                                data={getFilteredItems()}
                                keyExtractor={i => i.uuid || i.id.toString()}
                                renderItem={({ item: mat }) => (
                                    <TouchableOpacity
                                        style={[styles.itemRow, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
                                        onPress={() => { setItem(mat.nome); setModalVisible(false); }}
                                    >
                                        <View>
                                            <Text style={[styles.itemText, { color: colors.textPrimary }]}>{mat.nome}</Text>
                                            <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{mat.tipo} • {mat.unidade}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                                    </TouchableOpacity>
                                )}
                            />
                        }
                    </View>
                </View>
            </Modal>

            {/* QUICK ADD MODAL */}
            <Modal visible={quickAddModal} animationType="fade" transparent={true}>
                <View style={styles.overlayCenter}>
                    <View style={[styles.miniModal, { backgroundColor: colors.card }]}>
                        <Text style={[styles.miniTitle, { color: colors.textPrimary }]}>NOVO INSUMO RÁPIDO</Text>
                        <GlowInput
                            label="NOME DO ITEM"
                            value={newItemName}
                            onChangeText={t => setNewItemName(t.toUpperCase())}
                            placeholder="EX: ADUBO XI"
                        />
                        <View style={styles.miniActions}>
                            <TouchableOpacity style={styles.btnLite} onPress={() => setQuickAddModal(false)}>
                                <Text style={[styles.btnLiteText, { color: colors.textPrimary }]}>CANCELAR</Text>
                            </TouchableOpacity>
                            <PrimaryButton label="SALVAR" onPress={quickSave} style={{ flex: 1 }} />
                        </View>
                    </View>
                </View>
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scrollContent: { padding: 20, paddingBottom: 100 },
    mainCard: { padding: 22, borderRadius: 28, borderWidth: 1 },
    cardTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 20 },

    scanBtn: { height: 120, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
    previewImage: { width: '100%', height: '100%' },
    scanPlaceholder: { alignItems: 'center', gap: 8 },
    scanText: { fontSize: 11, fontWeight: 'bold' },
    scanOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', gap: 4 },
    scanOverlayText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

    fieldLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8, marginTop: 5 },
    selectorBtn: { height: 56, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 15 },
    selectorText: { fontSize: 15, fontWeight: '600' },

    row: { flexDirection: 'row', gap: 15 },
    textArea: { height: 80, borderRadius: 16, borderWidth: 1, padding: 15, fontSize: 14, textAlignVertical: 'top', marginBottom: 15 },

    buttonRow: { flexDirection: 'row', gap: 10, marginTop: 10 },

    sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 30, marginBottom: 15, marginLeft: 5 },
    historyCard: { padding: 18, borderRadius: 24, marginBottom: 12, borderWidth: 1 },
    historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    hProd: { fontSize: 16, fontWeight: 'bold' },
    hSub: { fontSize: 12, marginTop: 2 },
    hValBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    hValText: { fontSize: 14, fontWeight: 'bold' },

    hDetails: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
    hQty: { fontSize: 13, fontWeight: 'bold' },
    hObsContainer: { marginTop: 12, padding: 10, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 12, gap: 4 },
    hObs: { fontSize: 11, fontStyle: 'italic' },

    hActions: { flexDirection: 'row', gap: 10, marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    actionBtn: { flex: 1, height: 40, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    actionText: { fontSize: 11, fontWeight: 'bold' },

    emptyBox: { alignItems: 'center', marginTop: 40 },
    emptyText: { marginTop: 10, fontSize: 14, fontWeight: 'bold' },

    modalContent: { flex: 1 },
    modalHeader: { height: 100, paddingTop: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    modalTitle: { fontSize: 16, fontWeight: 'bold' },
    itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 16, marginBottom: 10, borderWidth: 1 },
    itemText: { fontSize: 16, fontWeight: 'bold' },
    itemSub: { fontSize: 12, marginTop: 2 },

    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 25 },
    miniModal: { borderRadius: 24, padding: 25 },
    miniTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    miniActions: { flexDirection: 'row', gap: 12, marginTop: 15 },
    btnLite: { flex: 1, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    btnLiteText: { fontWeight: 'bold', fontSize: 14 }
});

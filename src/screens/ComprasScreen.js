import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCompra, getCadastro, getComprasRecentes, updateCompra, deleteCompra, insertCadastro as insertCadastros } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

const { width } = Dimensions.get('window');

export default function ComprasScreen({ navigation }) {
    const { theme } = useTheme();
    const [item, setItem] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valor, setValor] = useState('');
    const [cultura, setCultura] = useState('');
    const [observacao, setObservacao] = useState('');
    const [detalhes, setDetalhes] = useState('');
    const [fornecedor, setFornecedor] = useState({ uuid: '', nome: '' });
    const [editingUuid, setEditingUuid] = useState(null);
    const [history, setHistory] = useState([]);

    // Selection Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [items, setItems] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [modalType, setModalType] = useState('MATERIAL'); // 'MATERIAL' or 'FORNECEDOR'
    const [searchText, setSearchText] = useState('');
    const [loadingModal, setLoadingModal] = useState(false);

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
        setLoadingModal(true);
        try {
            const all = await getCadastro();
            const inputs = all.filter(i => ['INSUMO', 'EMBALAGEM'].includes(i.tipo));
            setItems(inputs);

            const resF = await executeQuery('SELECT * FROM fornecedores WHERE is_deleted = 0 ORDER BY nome ASC');
            const rowsF = [];
            for (let i = 0; i < resF.rows.length; i++) rowsF.push(resF.rows.item(i));
            setFornecedores(rowsF);
        } catch (e) { } finally { setLoadingModal(false); }
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
            if (!result.canceled) setAnexoUri(result.assets[0].uri);
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
        try {
            await insertCadastros({
                uuid: uuidv4(),
                nome: newItemName.toUpperCase(),
                tipo: 'INSUMO',
                unidade: 'UN',
                observacao: 'CADASTRO RÁPIDO VIA COMPRAS',
                estocavel: 1,
                vendavel: 0
            });
            await loadItems();
            setItem(newItemName.toUpperCase());
            setModalVisible(false);
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
            detalhes: detalhes.toUpperCase(),
            fornecedor_uuid: fornecedor.uuid,
            observacao: (fornecedor.nome ? `FORNECEDOR: ${fornecedor.nome} | ` : '') + observacao.toUpperCase(),
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
                
                // Automação: Gerar Conta a Pagar
                await executeQuery(
                    'INSERT INTO financeiro_transacoes (uuid, tipo, descricao, valor, vencimento, entidade_nome, categoria, origem_uuid, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [uuidv4(), 'PAGAR', `COMPRA: ${dados.item}`, dados.valor, dados.data, (fornecedor.nome || 'DIVERSOS').toUpperCase(), 'COMPRAS', dados.uuid, new Date().toISOString()]
                );
                
                Alert.alert('Sucesso', 'Entrada registrada e gerada no Contas a Pagar.');
            }
            setItem(''); setQuantidade(''); setValor(''); setObservacao(''); setDetalhes(''); setCultura(''); setAnexoUri(null); setFornecedor({ uuid: '', nome: '' });
            loadHistory();
        } catch (error) { 
            console.error(error);
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
        Alert.alert('Excluir', 'Confirmar exclusão desta compra?', [
            { text: 'Não', style: 'cancel' },
            { text: 'Sim, Excluir', style: 'destructive', onPress: async () => { await deleteCompra(rec.uuid); loadHistory(); } }
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{editingUuid ? 'EDITAR COMPRA' : 'ENTRADA DE INSUMOS'}</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.headerSub}>Gerenciamento de suprimentos e estoques</Text>
            </LinearGradient>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                <View style={styles.content}>
                    <Card style={styles.formCard}>
                        <TouchableOpacity 
                            style={[styles.cameraBtn, anexoUri ? { borderColor: '#10B981', backgroundColor: '#ECFDF5' } : null]} 
                            onPress={() => hasPermission ? anexarNota() : Alert.alert('Permissão', 'Acesso à câmera necessário.')}
                        >
                            <Ionicons name={anexoUri ? "checkmark-circle" : "camera"} size={20} color={anexoUri ? "#10B981" : theme?.colors?.primary} />
                            <Text style={[styles.cameraBtnText, anexoUri ? { color: '#10B981' } : null]}>
                                {anexoUri ? 'NOTA ANEXADA' : 'ANEXAR FOTO DA NOTA (OPCIONAL)'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.field}>
                            <Text style={styles.label}>PRODUTO / INSUMO COMPRADO *</Text>
                            <TouchableOpacity style={styles.selectBtn} onPress={() => { setModalType('MATERIAL'); setModalVisible(true); }}>
                                <Text style={[styles.selectText, !item && { color: '#9CA3AF' }]}>
                                     {item || "SELECIONAR MATERIAL..."}
                                 </Text>
                                 <Ionicons name="chevron-down" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>FORNECEDOR (DE QUEM?)</Text>
                            <TouchableOpacity style={styles.selectBtn} onPress={() => { setModalType('FORNECEDOR'); setModalVisible(true); }}>
                                <Text style={[styles.selectText, !fornecedor.nome && { color: '#9CA3AF' }]}>
                                    {fornecedor.nome || "SELECIONAR FORNECEDOR..."}
                                </Text>
                                <Ionicons name="business-outline" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <AgroInput label="QUANTIDADE *" value={quantidade} onChangeText={setQuantidade} keyboardType="decimal-pad" placeholder="0" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AgroInput label="VALOR TOTAL R$ *" value={valor} onChangeText={setValor} keyboardType="decimal-pad" placeholder="0.00" />
                            </View>
                        </View>

                        <AgroInput label="VINCULAR À CULTURA" value={cultura} onChangeText={setCultura} placeholder="EX: MORANGO ou GERAL" />
                        <AgroInput label="DETALHES TÉCNICOS / BULA" value={detalhes} onChangeText={setDetalhes} placeholder="EX: NPK 04-14-08" />
                        <AgroInput label="OBSERVAÇÕES / FORNECEDOR" value={observacao} onChangeText={setObservacao} multiline style={{ height: 80 }} />

                        <View style={styles.actionRow}>
                            <AgroButton 
                                title={editingUuid ? "SALVAR ALTERAÇÕES" : "REGISTRAR ENTRADA"} 
                                onPress={salvar} 
                                style={{ flex: 2 }}
                            />
                            {editingUuid && (
                                <AgroButton 
                                    title="X" 
                                    variant="secondary" 
                                    onPress={() => { setEditingUuid(null); setItem(''); setQuantidade(''); setValor(''); setObservacao(''); setDetalhes(''); setCultura(''); setAnexoUri(null); }}
                                    style={{ flex: 0.5, marginLeft: 10 }}
                                />
                            )}
                        </View>
                    </Card>

                    <Text style={styles.histTitle}>ENTRADAS RECENTES</Text>
                    {history.map(rec => (
                        <Card key={rec.uuid} style={styles.histCard} noPadding onPress={() => handleEdit(rec)}>
                            <View style={styles.histInner}>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.histHeader}>
                                        <Text style={styles.hProd}>{rec.item}</Text>
                                        <Text style={styles.hDate}>{new Date(rec.data).toLocaleDateString('pt-BR').slice(0, 5)}</Text>
                                    </View>
                                    <Text style={styles.hCultura}>{rec.cultura || 'GERAL'}</Text>
                                    <View style={styles.valBadge}>
                                        <Text style={styles.hVal}>{rec.quantidade} UN • R$ {rec.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                                    </View>
                                </View>
                                <View style={styles.histActions}>
                                    <TouchableOpacity onPress={() => handleDelete(rec)} style={styles.delBtn}>
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Card>
                    ))}
                </View>
            </ScrollView>

            {/* SELECTION MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR {modalType}</Text>
                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                {modalType === 'MATERIAL' && (
                                    <TouchableOpacity onPress={() => { setModalVisible(false); setQuickAddModal(true); }}>
                                        <Ionicons name="add-circle" size={28} color={theme?.colors?.primary} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TextInput
                            style={styles.searchBar}
                            placeholder="Buscar material..."
                            value={searchText}
                            onChangeText={setSearchText}
                            autoCapitalize="characters"
                        />

                        {loadingModal ? (
                            <ActivityIndicator color={theme?.colors?.primary} style={{ marginTop: 50 }} />
                        ) : (
                            <FlatList
                                data={modalType === 'MATERIAL' ? getFilteredItems() : fornecedores.filter(f => f.nome.includes(searchText.toUpperCase()))}
                                keyExtractor={i => i.uuid || i.id.toString()}
                                contentContainerStyle={{ paddingBottom: 50 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={styles.itemRow} 
                                        onPress={() => { 
                                            if (modalType === 'MATERIAL') setItem(item.nome);
                                            else setFornecedor({ uuid: item.uuid, nome: item.nome });
                                            setModalVisible(false); 
                                        }}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemText}>{item.nome}</Text>
                                            <Text style={styles.itemSub}>{modalType === 'MATERIAL' ? `${item.tipo} • ${item.unidade}` : item.contato}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={<Text style={styles.empty}>Nenhum item encontrado.</Text>}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* QUICK ADD MODAL */}
            <Modal visible={quickAddModal} animationType="slide" transparent>
                <View style={styles.overlayCenter}>
                    <Card style={styles.quickModal}>
                        <Text style={styles.modalTitleCenter}>NOVO INSUMO RÁPIDO</Text>
                        <AgroInput label="NOME DO ITEM" value={newItemName} onChangeText={setNewItemName} placeholder="EX: ADUBO ORGANICO" />
                        <View style={styles.actionRow}>
                            <AgroButton title="SALVAR" onPress={quickSave} style={{ flex: 1 }} />
                            <AgroButton title="CANCELAR" variant="secondary" onPress={() => setQuickAddModal(false)} style={{ flex: 1, marginLeft: 10 }} />
                        </View>
                    </Card>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
    scroll: { flex: 1 },
    content: { padding: 20 },
    formCard: { padding: 20, marginBottom: 25 },
    cameraBtn: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 12, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB' },
    cameraBtnText: { color: '#6B7280', fontWeight: '800', marginLeft: 8, fontSize: 11, letterSpacing: 0.5 },
    field: { marginBottom: 15 },
    label: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 8, letterSpacing: 1 },
    selectBtn: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    selectText: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
    row: { flexDirection: 'row' },
    actionRow: { flexDirection: 'row', marginTop: 15 },
    histTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 15, letterSpacing: 1.5 },
    histCard: { marginBottom: 12 },
    histInner: { padding: 15, flexDirection: 'row', alignItems: 'center' },
    histHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    hProd: { fontSize: 15, fontWeight: '800', color: '#1F2937', flex: 1 },
    hDate: { fontSize: 10, fontWeight: '900', color: '#9CA3AF' },
    hCultura: { fontSize: 11, color: '#6B7280', fontWeight: 'bold', marginTop: 2 },
    valBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
    hVal: { fontSize: 11, fontWeight: '900', color: '#10B981' },
    histActions: { marginLeft: 15 },
    delBtn: { backgroundColor: '#FEF2F2', padding: 10, borderRadius: 12 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '80%', padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937' },
    closeBtn: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 12 },
    searchBar: { backgroundColor: '#F9FAFB', padding: 14, borderRadius: 15, marginBottom: 15, fontSize: 14, fontWeight: '700', borderWidth: 1, borderColor: '#E5E7EB' },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    itemText: { fontSize: 14, fontWeight: '800', color: '#374151' },
    itemSub: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold', marginTop: 2 },
    empty: { textAlign: 'center', marginTop: 30, color: '#9CA3AF', fontWeight: 'bold' },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
    quickModal: { padding: 25 },
    modalTitleCenter: { fontSize: 16, fontWeight: '900', color: '#1F2937', textAlign: 'center', marginBottom: 20 }
});

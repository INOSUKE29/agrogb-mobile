import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, Dimensions, StatusBar, SafeAreaView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCompra, getCadastro, getComprasRecentes, updateCompra, deleteCompra, insertCadastro as insertCadastros, executeQuery } from '../database/database';
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
    const activeColors = theme?.colors || {};
    
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

    const isDark = theme?.theme_mode === 'dark';
    const textColor = activeColors.text || '#1E293B';
    const textMutedColor = activeColors.textMuted || '#64748B';
    const cardBg = activeColors.card || '#FFFFFF';
    const borderCol = activeColors.border || 'rgba(0,0,0,0.1)';

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={[activeColors.primary || '#10B981', activeColors.primaryDeep || '#059669']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{editingUuid ? 'EDITAR COMPRA' : 'ENTRADA DE INSUMOS'}</Text>
                        <View style={{ width: 38 }} />
                    </View>
                    <Text style={styles.headerSub}>Gerenciamento de suprimentos e estoques</Text>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                <View style={styles.content}>
                    <Card style={styles.formCard}>
                        <TouchableOpacity 
                            style={[
                                styles.cameraBtn, 
                                { borderColor: borderCol, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' },
                                anexoUri ? { borderColor: activeColors.primary || '#10B981', backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5' } : null
                            ]} 
                            onPress={() => hasPermission ? anexarNota() : Alert.alert('Permissão', 'Acesso à câmera necessário.')}
                        >
                            <Ionicons name={anexoUri ? "checkmark-circle" : "camera"} size={20} color={anexoUri ? (activeColors.primary || "#10B981") : (activeColors.textMuted || '#6B7280')} />
                            <Text style={[styles.cameraBtnText, { color: textMutedColor }, anexoUri ? { color: activeColors.primary || '#10B981' } : null]}>
                                {anexoUri ? 'NOTA ANEXADA' : 'ANEXAR FOTO DA NOTA (OPCIONAL)'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.field}>
                            <Text style={[styles.label, { color: textMutedColor }]}>PRODUTO / INSUMO COMPRADO *</Text>
                            <TouchableOpacity 
                                style={[styles.selectBtn, { backgroundColor: cardBg, borderColor: borderCol }]} 
                                onPress={() => { setModalType('MATERIAL'); setModalVisible(true); }}
                            >
                                <Text style={[styles.selectText, { color: item ? textColor : textMutedColor }]}>
                                     {item || "SELECIONAR MATERIAL..."}
                                 </Text>
                                 <Ionicons name="chevron-down" size={20} color={textMutedColor} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.field}>
                            <Text style={[styles.label, { color: textMutedColor }]}>FORNECEDOR (DE QUEM?)</Text>
                            <TouchableOpacity 
                                style={[styles.selectBtn, { backgroundColor: cardBg, borderColor: borderCol }]} 
                                onPress={() => { setModalType('FORNECEDOR'); setModalVisible(true); }}
                            >
                                <Text style={[styles.selectText, { color: fornecedor.nome ? textColor : textMutedColor }]}>
                                    {fornecedor.nome || "SELECIONAR FORNECEDOR..."}
                                </Text>
                                <Ionicons name="business-outline" size={20} color={textMutedColor} />
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

                    <Text style={[styles.histTitle, { color: textColor }]}>ENTRADAS RECENTES</Text>
                    {history.map(rec => (
                        <Card key={rec.uuid} style={styles.histCard} noPadding onPress={() => handleEdit(rec)}>
                            <View style={styles.histInner}>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.histHeader}>
                                        <Text style={[styles.hProd, { color: textColor }]}>{rec.item}</Text>
                                        <Text style={[styles.hDate, { color: textMutedColor }]}>{new Date(rec.data).toLocaleDateString('pt-BR').slice(0, 5)}</Text>
                                    </View>
                                    <Text style={[styles.hCultura, { color: textMutedColor }]}>{rec.cultura || 'GERAL'}</Text>
                                    <View style={[styles.valBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#F0FDF4' }]}>
                                        <Text style={[styles.hVal, { color: activeColors.primary || '#10B981' }]}>{rec.quantidade} UN • R$ {rec.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                                    </View>
                                </View>
                                <View style={styles.histActions}>
                                    <TouchableOpacity 
                                        onPress={() => handleDelete(rec)} 
                                        style={[styles.delBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2' }]}
                                    >
                                        <Ionicons name="trash-outline" size={18} color={activeColors.error || '#EF4444'} />
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
                    <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>SELECIONAR {modalType}</Text>
                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                {modalType === 'MATERIAL' && (
                                    <TouchableOpacity onPress={() => { setModalVisible(false); setQuickAddModal(true); }}>
                                        <Ionicons name="add-circle" size={28} color={activeColors.primary} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
                                    <Ionicons name="close" size={24} color={textMutedColor} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TextInput
                            style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB', borderColor: borderCol, color: textColor }]}
                            placeholder="Buscar material..."
                            placeholderTextColor={textMutedColor}
                            value={searchText}
                            onChangeText={setSearchText}
                            autoCapitalize="characters"
                        />

                        {loadingModal ? (
                            <ActivityIndicator color={activeColors.primary} style={{ marginTop: 50 }} />
                        ) : (
                            <FlatList
                                data={modalType === 'MATERIAL' ? getFilteredItems() : fornecedores.filter(f => f.nome.includes(searchText.toUpperCase()))}
                                keyExtractor={i => i.uuid || i.id.toString()}
                                contentContainerStyle={{ paddingBottom: 50 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={[styles.itemRow, { borderBottomColor: borderCol }]} 
                                        onPress={() => { 
                                            if (modalType === 'MATERIAL') setItem(item.nome);
                                            else setFornecedor({ uuid: item.uuid, nome: item.nome });
                                            setModalVisible(false); 
                                        }}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.itemText, { color: textColor }]}>{item.nome}</Text>
                                            <Text style={[styles.itemSub, { color: textMutedColor }]}>{modalType === 'MATERIAL' ? `${item.tipo} • ${item.unidade}` : item.contato}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={textMutedColor} />
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={<Text style={[styles.empty, { color: textMutedColor }]}>Nenhum item encontrado.</Text>}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* QUICK ADD MODAL */}
            <Modal visible={quickAddModal} animationType="slide" transparent>
                <View style={styles.overlayCenter}>
                    <Card style={styles.quickModal}>
                        <Text style={[styles.modalTitleCenter, { color: textColor }]}>NOVO INSUMO RÁPIDO</Text>
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
    header: { paddingTop: 40, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 'bold' },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scroll: { flex: 1 },
    content: { padding: 20 },
    formCard: { padding: 20, marginBottom: 25 },
    cameraBtn: { flexDirection: 'row', padding: 12, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderStyle: 'dashed', borderWidth: 1 },
    cameraBtnText: { fontWeight: '800', marginLeft: 8, fontSize: 11, letterSpacing: 0.5 },
    field: { marginBottom: 15 },
    label: { fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
    selectBtn: { borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
    selectText: { fontSize: 14, fontWeight: '700' },
    row: { flexDirection: 'row' },
    actionRow: { flexDirection: 'row', marginTop: 15 },
    histTitle: { fontSize: 10, fontWeight: '900', marginBottom: 15, letterSpacing: 1.5 },
    histCard: { marginBottom: 12 },
    histInner: { padding: 15, flexDirection: 'row', alignItems: 'center' },
    histHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    hProd: { fontSize: 15, fontWeight: '800', flex: 1 },
    hDate: { fontSize: 10, fontWeight: '900' },
    hCultura: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
    valBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
    hVal: { fontSize: 11, fontWeight: '900' },
    histActions: { marginLeft: 15 },
    delBtn: { padding: 10, borderRadius: 12 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '80%', padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900' },
    closeBtn: { padding: 8, borderRadius: 12 },
    searchBar: { padding: 14, borderRadius: 15, marginBottom: 15, fontSize: 14, fontWeight: '700', borderWidth: 1 },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
    itemText: { fontSize: 14, fontWeight: '800' },
    itemSub: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
    empty: { textAlign: 'center', marginTop: 30, fontWeight: 'bold' },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 25 },
    quickModal: { padding: 25 },
    modalTitleCenter: { fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 20 }
});

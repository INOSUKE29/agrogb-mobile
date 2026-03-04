import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, Animated } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertColheita, getCadastro, getConfig, setConfig, insertDescarte, getColheitasRecentes, updateColheita, deleteColheita, getCulturas, insertCadastro as insertCadastros } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { DARK } from '../styles/darkTheme';

const up = (t, setter) => setter(t.toUpperCase());

const ABAS = ['COMERCIAL', 'CONGELADO', 'DESCARTE'];

export default function ColheitaScreen({ navigation }) {
    const [talhao, setTalhao] = useState('');
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [observacao, setObservacao] = useState('');

    const [congelado, setCongelado] = useState('');
    const [descarte, setDescarte] = useState('');
    const [qtdCaixas, setQtdCaixas] = useState('');
    const [fatorAtual, setFatorAtual] = useState(1);
    const [abaSelecionada, setAbaSelecionada] = useState('COMERCIAL');

    const [history, setHistory] = useState([]);
    const [editingUuid, setEditingUuid] = useState(null);

    const [productModalVisible, setProductModalVisible] = useState(false);
    const [areaModalVisible, setAreaModalVisible] = useState(false);
    const [configModal, setConfigModal] = useState(false);
    const [quickAddModal, setQuickAddModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemFator, setNewItemFator] = useState('1');

    const [productsDB, setProductsDB] = useState([]);
    const [areasDB, setAreasDB] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    const scaleAnim = new Animated.Value(1);

    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    const loadData = async () => {
        setLoading(true);
        try {
            const allItems = await getCadastro();
            const prods = allItems.filter(i => i.tipo === 'PRODUTO');
            setProductsDB(Array.isArray(prods) ? prods : []);
            const areas = await getCulturas();
            setAreasDB(Array.isArray(areas) ? areas : []);
            const hist = await getColheitasRecentes();
            setHistory(Array.isArray(hist) ? hist : []);
        } catch (e) {
            console.error("Colheita Load Error:", e);
            Alert.alert('Erro ao carregar', 'Falha ao buscar dados. Tente reiniciar o app.');
        } finally {
            setLoading(false);
        }
    };

    const handleCaixasChange = (txt) => {
        setQtdCaixas(txt);
        const boxes = parseFloat(txt) || 0;
        const weight = fatorAtual || 1;
        if (boxes > 0) {
            setQuantidade((boxes * weight).toFixed(2));
        } else {
            setQuantidade('');
        }
    };

    const handleProdutoSelect = (item) => {
        setProduto(item.nome);
        setFatorAtual(item.fator_conversao || 1);
        setProductModalVisible(false);
        if (qtdCaixas) {
            const boxes = parseFloat(qtdCaixas) || 0;
            setQuantidade((boxes * (item.fator_conversao || 1)).toFixed(2));
        }
    };

    const saveConfig = async () => {
        setConfigModal(false);
        Alert.alert('Info', 'Agora configure o peso/fator diretamente no Cadastro do Produto.');
    };

    const getFilteredProducts = () => {
        if (!searchText) return productsDB;
        return (productsDB || []).filter(i => i && i.nome && i.nome.toUpperCase().includes(searchText.toUpperCase()));
    };

    const quickSave = async () => {
        if (!newItemName.trim()) { Alert.alert('Ops', 'Nome é obrigatório'); return; }
        const newUuid = uuidv4();
        try {
            await insertCadastros({ uuid: newUuid, nome: newItemName, tipo: 'PRODUTO', fator_conversao: parseFloat(newItemFator) || 1, unidade: 'CX', observacao: 'Cadastrado no Quick Add', estocavel: 1, vendavel: 1 });
            const allItems = await getCadastro();
            const prods = allItems.filter(i => i.tipo === 'PRODUTO');
            setProductsDB(Array.isArray(prods) ? prods : []);
            const newItem = prods.find(p => p.uuid === newUuid) || { nome: newItemName, fator_conversao: parseFloat(newItemFator) || 1 };
            handleProdutoSelect(newItem);
            setQuickAddModal(false);
            setNewItemName('');
            setNewItemFator('1');
        } catch (e) {
            Alert.alert('Erro', 'Falha ao criar produto.');
        }
    };

    const pressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
    const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    const salvar = async () => {
        if (!talhao || !produto || !quantidade) {
            Alert.alert('Atenção', 'Preencha Local, Produto e Quantidade (*)');
            return;
        }
        const dados = {
            uuid: editingUuid || uuidv4(),
            cultura: talhao.toUpperCase(),
            produto: produto.toUpperCase(),
            quantidade: parseFloat(quantidade),
            congelado: parseFloat(congelado) || 0,
            observacao: observacao.toUpperCase(),
            data: new Date().toISOString().split('T')[0]
        };
        try {
            if (editingUuid) {
                await updateColheita(editingUuid, dados);
                Alert.alert('Sucesso', 'Registro atualizado!');
                setEditingUuid(null);
            } else {
                await insertColheita(dados);
                const qtdDescarte = parseFloat(descarte);
                if (qtdDescarte > 0) {
                    await insertDescarte({ uuid: uuidv4(), produto: produto.toUpperCase(), quantidade_kg: qtdDescarte, motivo: 'APONTAMENTO DE CAMPO', data: new Date().toISOString().split('T')[0] });
                    Alert.alert('Sucesso', `Colheita e ${qtdDescarte}kg de descarte registrados.`);
                } else {
                    Alert.alert('Sucesso', 'Colheita registrada!');
                }
            }
            setQtdCaixas(''); setQuantidade(''); setCongelado(''); setDescarte(''); setObservacao('');
            const hist = await getColheitasRecentes();
            setHistory(hist);
        } catch (error) {
            Alert.alert('Erro', 'Falha ao salvar registro.');
        }
    };

    const handleEdit = (item) => {
        setEditingUuid(item.uuid);
        setTalhao(item.cultura);
        setProduto(item.produto);
        setQuantidade(item.quantidade.toString());
        setCongelado(item.congelado ? item.congelado.toString() : '');
        setObservacao(item.observacao || '');
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir', 'Confirmar exclusão?', [
            { text: 'Não', style: 'cancel' },
            { text: 'Sim', style: 'destructive', onPress: async () => { await deleteColheita(item.uuid); loadData(); } }
        ]);
    };

    const getAbaColor = (aba) => {
        if (aba === 'COMERCIAL') return '#10B981';
        if (aba === 'CONGELADO') return '#0EA5E9';
        return '#EF4444';
    };

    return (
        <LinearGradient colors={['#0F3D2E', '#145C43']} style={{ flex: 1 }}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{editingUuid ? 'EDITAR APONTAMENTO' : 'REGISTRO DE CAMPO'}</Text>
                <TouchableOpacity style={styles.configBtn} onPress={() => setConfigModal(true)}>
                    <Ionicons name="settings-sharp" size={18} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {/* CARD PRINCIPAL */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>COLHEITA, DESCARTE E CONGELADOS</Text>

                    {/* AREA */}
                    <Text style={styles.label}>LOCAL / ÁREA (ONDE?)</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setAreaModalVisible(true)}>
                        <Text style={[styles.selectText, !talhao && { color: '#6B7280' }]}>{talhao || 'SELECIONAR ÁREA...'}</Text>
                        <Ionicons name="map-outline" size={18} color="#34D399" />
                    </TouchableOpacity>

                    {/* PRODUTO */}
                    <Text style={styles.label}>VARIEDADE / PRODUTO (O QUÊ?)</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setProductModalVisible(true)}>
                        <Text style={[styles.selectText, !produto && { color: '#6B7280' }]}>{produto || 'SELECIONAR PRODUTO...'}</Text>
                        <Ionicons name="leaf-outline" size={18} color="#34D399" />
                    </TouchableOpacity>

                    {/* ABAS SEGMENTADAS */}
                    <Text style={styles.label}>TIPO DO REGISTRO</Text>
                    <View style={styles.segmentRow}>
                        {ABAS.map(aba => (
                            <TouchableOpacity
                                key={aba}
                                style={[styles.segmentBtn, abaSelecionada === aba && { backgroundColor: getAbaColor(aba) }]}
                                onPress={() => setAbaSelecionada(aba)}
                            >
                                <Text style={[styles.segmentTxt, abaSelecionada === aba && { color: '#FFF' }]}>{aba}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* QUANTIDADES */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>VOLUMES / CAIXAS</Text>
                            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#6B7280" value={qtdCaixas} onChangeText={handleCaixasChange} keyboardType="decimal-pad" />
                            <Text style={styles.helper}>Fator: {fatorAtual} Kg/Un</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>TOTAL KG *</Text>
                            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#6B7280" value={quantidade} onChangeText={setQuantidade} keyboardType="decimal-pad" />
                        </View>
                    </View>

                    {/* DESCARTE/CONGELADO FIELD */}
                    {abaSelecionada === 'DESCARTE' && (
                        <View>
                            <Text style={styles.label}>DESCARTE (KG)</Text>
                            <TextInput style={[styles.input, { borderColor: '#EF4444' }]} placeholder="0.00" placeholderTextColor="#6B7280" value={descarte} onChangeText={setDescarte} keyboardType="decimal-pad" />
                        </View>
                    )}
                    {abaSelecionada === 'CONGELADO' && (
                        <View>
                            <Text style={styles.label}>CONGELADO (KG)</Text>
                            <TextInput style={[styles.input, { borderColor: '#0EA5E9' }]} placeholder="0.00" placeholderTextColor="#6B7280" value={congelado} onChangeText={setCongelado} keyboardType="decimal-pad" />
                        </View>
                    )}

                    {/* OBSERVAÇÕES */}
                    <Text style={styles.label}>OBSERVAÇÕES</Text>
                    <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="DETALHES DO APONTAMENTO..." placeholderTextColor="#6B7280" value={observacao} onChangeText={(t) => up(t, setObservacao)} multiline />

                    {/* BOTÃO SALVAR */}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        {editingUuid && (
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444', flex: 1 }]} onPress={() => { setEditingUuid(null); setTalhao(''); setProduto(''); setQuantidade(''); setCongelado(''); setDescarte(''); setObservacao(''); setQtdCaixas(''); }}>
                                <Text style={styles.btnText}>CANCELAR</Text>
                            </TouchableOpacity>
                        )}
                        <Animated.View style={[{ flex: 2 }, { transform: [{ scale: scaleAnim }] }]}>
                            <TouchableOpacity style={styles.btn} onPress={salvar} onPressIn={pressIn} onPressOut={pressOut}>
                                <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.btnText}>{editingUuid ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR REGISTRO'}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View>

                {/* HISTÓRICO */}
                <Text style={styles.historyTitle}>REGISTROS DE CAMPO</Text>
                {history.map(item => (
                    <View key={item.uuid} style={styles.historyItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.hProd}>{item?.produto || 'Produto?'}</Text>
                            <Text style={styles.hSub}>{item?.cultura || '?'} • {item?.data ? new Date(item.data).toLocaleDateString() : '-'}</Text>
                            <Text style={styles.hVal}>{item?.quantidade || 0} Kg {item?.congelado > 0 ? `(+${item.congelado}kg Cong)` : ''}</Text>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                                <Ionicons name="create-outline" size={18} color="#34D399" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* PRODUCT MODAL */}
            <Modal visible={productModalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR PRODUTO</Text>
                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                <TouchableOpacity onPress={() => { setProductModalVisible(false); setQuickAddModal(true); }}>
                                    <Ionicons name="add-circle" size={28} color="#10B981" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TextInput style={styles.searchBar} placeholder="Buscar produto..." placeholderTextColor="#9CA3AF" value={searchText} onChangeText={t => up(t, setSearchText)} />
                        <FlatList data={getFilteredProducts()} keyExtractor={i => i.uuid || i.id.toString()} renderItem={({ item }) => (
                            <TouchableOpacity style={styles.itemRow} onPress={() => handleProdutoSelect(item || {})}>
                                <Text style={styles.itemText}>{item?.nome || 'Sem Nome'}</Text>
                                <Text style={styles.itemSub}>{item?.tipo || 'OUTROS'} • Fator: {item?.fator_conversao || 1}</Text>
                            </TouchableOpacity>
                        )} ListEmptyComponent={<Text style={styles.empty}>Nenhum produto cadastrado.</Text>} />
                    </View>
                </View>
            </Modal>

            {/* AREA MODAL */}
            <Modal visible={areaModalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR LOCAL</Text>
                            <TouchableOpacity onPress={() => setAreaModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        <FlatList data={areasDB} keyExtractor={i => i.uuid || i.id.toString()} renderItem={({ item }) => (
                            <TouchableOpacity style={styles.itemRow} onPress={() => { setTalhao(item.nome); setAreaModalVisible(false); }}>
                                <Text style={styles.itemText}>{item?.nome || 'Sem Nome'}</Text>
                                <Text style={styles.itemSub}>{item?.observacao || 'Sem obs'}</Text>
                            </TouchableOpacity>
                        )} ListEmptyComponent={
                            <TouchableOpacity style={styles.empty} onPress={() => { setAreaModalVisible(false); navigation.navigate('Culturas'); }}>
                                <Text style={{ color: '#10B981' }}>Nenhuma área cadastrada. Clique para adicionar.</Text>
                            </TouchableOpacity>
                        } />
                    </View>
                </View>
            </Modal>

            {/* CONFIG MODAL */}
            <Modal visible={configModal} animationType="fade" transparent>
                <View style={styles.overlayCenter}>
                    <View style={styles.miniModal}>
                        <Text style={styles.modalTitle}>Configuração</Text>
                        <Text style={[styles.label, { marginTop: 20 }]}>NOTA:</Text>
                        <Text style={{ textAlign: 'center', color: '#9CA3AF', marginVertical: 10 }}>A configuração de peso agora é feita individualmente no CADASTRO DE CADA PRODUTO.</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#6B7280', flex: 1 }]} onPress={() => setConfigModal(false)}>
                                <Text style={styles.btnText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={saveConfig}>
                                <Text style={styles.btnText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* QUICK ADD MODAL */}
            <Modal visible={quickAddModal} animationType="slide" transparent>
                <View style={styles.overlayCenter}>
                    <View style={styles.miniModal}>
                        <Text style={styles.modalTitle}>NOVO PRODUTO RÁPIDO</Text>
                        <Text style={styles.label}>NOME DO PRODUTO</Text>
                        <TextInput style={styles.input} value={newItemName} onChangeText={t => up(t, setNewItemName)} placeholder="EX: MORANGO ESPEC" placeholderTextColor="#6B7280" />
                        <Text style={styles.label}>FATOR (KG POR UNIDADE)</Text>
                        <TextInput style={styles.input} value={newItemFator} onChangeText={setNewItemFator} keyboardType="decimal-pad" placeholder="1.0" placeholderTextColor="#6B7280" />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
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
    configBtn: { padding: 8, backgroundColor: 'rgba(0,255,156,0.1)', borderRadius: 10, borderWidth: 1, borderColor: DARK.glowBorder },

    card: { backgroundColor: DARK.card, borderRadius: 22, padding: 22, borderWidth: 1, borderColor: DARK.glowBorder, marginBottom: 28, elevation: 5, shadowColor: '#00FF9C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
    cardLabel: { fontSize: 11, fontWeight: '900', color: DARK.glow, letterSpacing: 1.5, marginBottom: 18 },

    label: { fontSize: 10, fontWeight: '900', color: DARK.textMuted, letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
    input: { backgroundColor: DARK.card, borderWidth: 1, borderColor: DARK.glowBorderStrong, borderRadius: 14, padding: 15, fontSize: 15, color: DARK.textPrimary, marginBottom: 16 },
    helper: { fontSize: 10, color: DARK.glow, marginTop: -12, marginBottom: 14, fontWeight: 'bold', marginLeft: 4 },
    selectBtn: { backgroundColor: DARK.card, borderWidth: 1, borderColor: DARK.glowBorderStrong, borderRadius: 14, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    selectText: { fontSize: 14, fontWeight: '600', color: DARK.textPrimary },

    segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 30, alignItems: 'center', backgroundColor: 'rgba(0,255,156,0.05)', borderWidth: 1, borderColor: DARK.glowBorder },
    segmentTxt: { fontSize: 11, fontWeight: '800', color: DARK.textMuted, letterSpacing: 0.5 },

    btn: { backgroundColor: DARK.glow, paddingVertical: 17, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', elevation: 4, shadowColor: '#00FF9C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.45, shadowRadius: 8 },
    btnText: { color: '#061E1A', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

    historyTitle: { fontSize: 11, fontWeight: '900', color: DARK.textMuted, letterSpacing: 1.2, marginBottom: 14, paddingLeft: 4 },
    historyItem: { backgroundColor: DARK.card, padding: 16, borderRadius: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: DARK.glowBorder },
    hProd: { fontSize: 14, fontWeight: 'bold', color: DARK.textPrimary },
    hSub: { fontSize: 11, color: DARK.textSecondary, marginTop: 2 },
    hVal: { fontSize: 12, fontWeight: '900', color: DARK.glow, marginTop: 4 },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 8, backgroundColor: 'rgba(0,255,156,0.08)', borderRadius: 10, borderWidth: 1, borderColor: DARK.glowBorder },

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
    empty: { textAlign: 'center', marginTop: 20, color: DARK.textMuted },
});

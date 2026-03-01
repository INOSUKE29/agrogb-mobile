import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertColheita, getCadastro, getConfig, setConfig, insertDescarte, getColheitasRecentes, updateColheita, deleteColheita, getCulturas, insertCadastro as insertCadastros, getAppSettings } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

const up = (t, setter) => setter(t.toUpperCase());


export default function ColheitaScreen({ navigation }) {
    const [talhao, setTalhao] = useState('');
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [observacao, setObservacao] = useState('');
    // Novas Variáveis
    const [abaAtiva, setAbaAtiva] = useState('COMERCIAL');

    const [cxsComercial, setCxsComercial] = useState('');
    const [kgComercial, setKgComercial] = useState('');
    const [kgDescarte, setKgDescarte] = useState('');

    const [fatorAtual, setFatorAtual] = useState(20);
    const [pesoPadraoGlobal, setPesoPadraoGlobal] = useState(20);

    const [history, setHistory] = useState([]);
    const [editingUuid, setEditingUuid] = useState(null);

    // Modal States
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [areaModalVisible, setAreaModalVisible] = useState(false);
    const [configModal, setConfigModal] = useState(false);
    const [quickAddModal, setQuickAddModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemFator, setNewItemFator] = useState('1');

    // Lists
    const [productsDB, setProductsDB] = useState([]); // Do cadastro
    const [areasDB, setAreasDB] = useState([]); // Da tabela de culturas

    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    const loadData = async () => {
        setLoading(true);
        try {
            // Load Products (Cadastro)
            const allItems = await getCadastro();
            // Strict Filter: Only PRODUTO for Colheita
            const prods = allItems.filter(i => i.tipo === 'PRODUTO');
            setProductsDB(Array.isArray(prods) ? prods : []);

            // Load Areas (Culturas Table)
            const areas = await getCulturas();
            setAreasDB(Array.isArray(areas) ? areas : []);

            // Load Settings
            const configObj = await getAppSettings();
            const pesoGlobal = configObj && configObj.peso_padrao_caixa ? parseFloat(configObj.peso_padrao_caixa) : 20;
            setPesoPadraoGlobal(pesoGlobal);
            setFatorAtual(pesoGlobal);

            // Load History
            const hist = await getColheitasRecentes();
            setHistory(Array.isArray(hist) ? hist : []);
        } catch (e) {
            console.error("Colheita Load Error:", e);
            Alert.alert('Erro ao carregar', 'Falha ao buscar dados. Tente reiniciar o app.');
        } finally {
            setLoading(false);
        }
    };

    const calcKg = (cxText) => {
        const boxes = parseFloat(cxText) || 0;
        const weight = fatorAtual || 1;
        return boxes > 0 ? (boxes * weight).toFixed(2) : '';
    };

    const handleCxComercial = (t) => { setCxsComercial(t); setKgComercial(calcKg(t)); };

    const handleProdutoSelect = (item) => {
        setProduto(item.nome);
        const fat = item.fator_conversao || pesoPadraoGlobal;
        setFatorAtual(fat);
        setProductModalVisible(false);

        if (cxsComercial) setKgComercial(((parseFloat(cxsComercial) || 0) * fat).toFixed(2));
    };

    const saveConfig = async () => {
        // Deprecated - Config is now in Cadastro
        setConfigModal(false);
        Alert.alert('Info', 'Agora configure o peso/fator diretamente no Cadastro do Produto.');
    };

    const getFilteredProducts = () => {
        if (!searchText) return productsDB;
        if (!searchText) return productsDB || [];
        return (productsDB || []).filter(i => i && i.nome && i.nome.toUpperCase().includes(searchText.toUpperCase()));
    };




    const quickSave = async () => {
        if (!newItemName.trim()) { Alert.alert('Ops', 'Nome é obrigatório'); return; }
        const newUuid = uuidv4();
        try {
            await insertCadastros({
                uuid: newUuid,
                nome: newItemName,
                tipo: 'PRODUTO',
                fator_conversao: parseFloat(newItemFator) || pesoPadraoGlobal,
                unidade: 'CX',
                observacao: 'Cadastrado no Quick Add',
                estocavel: 1,
                vendavel: 1
            });
            // Reload and Select
            // Reload Strict
            const allItems = await getCadastro();
            const prods = allItems.filter(i => i.tipo === 'PRODUTO');
            setProductsDB(Array.isArray(prods) ? prods : []);

            // Find and click
            const newItem = prods.find(p => p.uuid === newUuid) || { nome: newItemName, fator_conversao: parseFloat(newItemFator) || pesoPadraoGlobal };
            handleProdutoSelect(newItem);

            setQuickAddModal(false);
            setNewItemName('');
            setNewItemFator('1');
        } catch (e) {
            Alert.alert('Erro', 'Falha ao criar produto.');
        }
    };

    const salvar = async () => {
        if (!talhao || !produto) {
            Alert.alert('Atenção', 'Preencha Local e Produto (*)');
            return;
        }

        const qCom = parseFloat(cxsComercial) || 0;
        const qDesc = parseFloat(kgDescarte) || 0;

        if (qCom === 0 && qDesc === 0) {
            Alert.alert('Atenção', 'Preencha a quantidade Comercial ou de Descarte.');
            return;
        }

        try {
            if (editingUuid) {
                const dados = {
                    uuid: editingUuid,
                    cultura: talhao.toUpperCase(),
                    produto: produto.toUpperCase(),
                    quantidade: qCom,
                    congelado: 0,
                    observacao: observacao.toUpperCase(),
                    data: new Date().toISOString().split('T')[0],
                    area_id: talhao,
                    total_caixas: qCom,
                    peso_por_caixa: fatorAtual,
                    total_kg: parseFloat(kgComercial)
                };
                await updateColheita(editingUuid, dados);
                Alert.alert('Sucesso', 'Registro atualizado!');
                setEditingUuid(null);
            } else {
                let saved = 0;
                if (qCom > 0) {
                    await insertColheita({
                        uuid: uuidv4(), cultura: talhao.toUpperCase(), produto: produto.toUpperCase(),
                        quantidade: qCom, congelado: 0, observacao: 'COMERCIAL - ' + observacao.toUpperCase(),
                        data: new Date().toISOString().split('T')[0], area_id: talhao,
                        total_caixas: qCom, peso_por_caixa: fatorAtual, total_kg: parseFloat(kgComercial)
                    });
                    saved++;
                }
                if (qDesc > 0) {
                    await insertDescarte({
                        uuid: uuidv4(), produto: produto.toUpperCase(), quantidade_kg: qDesc,
                        motivo: 'APONTAMENTO CAMPO - ' + observacao.toUpperCase(), data: new Date().toISOString().split('T')[0]
                    });
                    saved++;
                }
                Alert.alert('Sucesso', `${saved} fluxo(s) registrado(s).`);
            }

            setCxsComercial(''); setKgComercial('');
            setKgDescarte('');
            setObservacao('');

            // Reload History
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
        setCxsComercial(item.total_caixas ? item.total_caixas.toString() : '');
        setKgComercial(item.total_kg ? item.total_kg.toString() : (item.congelado ? '' : item.quantidade.toString()));
        setAbaAtiva('COMERCIAL');
        setObservacao(item.observacao || '');
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir', 'Confirmar exclusão?', [
            { text: 'Não', style: 'cancel' },
            {
                text: 'Sim',
                style: 'destructive',
                onPress: async () => {
                    await deleteColheita(item.uuid);
                    loadData();
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.card}>
                    <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={styles.headerTitle}>{editingUuid ? 'EDITAR APONTAMENTO' : 'REGISTRO DE CAMPO'}</Text>
                                <Text style={styles.headerSub}>Colheita Comercial</Text>
                            </View>
                            <TouchableOpacity style={styles.configBtn} onPress={() => setConfigModal(true)}>
                                <Ionicons name="settings-sharp" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    <View style={styles.form}>
                        {/* AREA SELECTOR */}
                        <View style={styles.field}>
                            <Text style={styles.label}>LOCAL / ÁREA (ONDE?)</Text>
                            <TouchableOpacity style={styles.selectBtn} onPress={() => setAreaModalVisible(true)}>
                                <Text style={[styles.selectText, !talhao && { color: '#9CA3AF' }]}>
                                    {talhao || "SELECIONAR ÁREA..."}
                                </Text>
                                <Ionicons name="map" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* PRODUCT SELECTOR */}
                        <View style={styles.field}>
                            <Text style={styles.label}>VARIEDADE / PRODUTO (O QUE?)</Text>
                            <TouchableOpacity style={styles.selectBtn} onPress={() => setProductModalVisible(true)}>
                                <Text style={[styles.selectText, !produto && { color: '#9CA3AF' }]}>
                                    {produto || "SELECIONAR PRODUTO..."}
                                </Text>
                                <Ionicons name="leaf" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* TABS DESTINO REGISTRO */}
                        <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 }}>
                            <TouchableOpacity style={[styles.tabBtn, abaAtiva === 'COMERCIAL' && styles.tabActive]} onPress={() => setAbaAtiva('COMERCIAL')}>
                                <Text style={[styles.tabText, abaAtiva === 'COMERCIAL' && { color: '#FFF' }]}>COMERCIAL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tabBtn, abaAtiva === 'DESCARTE' && styles.tabActiveD]} onPress={() => setAbaAtiva('DESCARTE')}>
                                <Text style={[styles.tabText, abaAtiva === 'DESCARTE' && { color: '#FFF' }]}>DESCARTE</Text>
                            </TouchableOpacity>
                        </View>

                        {/* BLOCO COMERCIAL */}
                        {abaAtiva === 'COMERCIAL' && (
                            <View style={styles.row}>
                                <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>CAIXAS COMERCIAIS</Text>
                                    <TextInput style={styles.input} placeholder="0" value={cxsComercial} onChangeText={handleCxComercial} keyboardType="decimal-pad" />
                                    <Text style={styles.helper}>Fator: {fatorAtual} Kg/Un</Text>
                                </View>
                                <View style={[styles.field, { flex: 1 }]}>
                                    <Text style={styles.label}>TOTAL (KG)</Text>
                                    <TextInput style={styles.input} placeholder="0.00" value={kgComercial} onChangeText={setKgComercial} keyboardType="decimal-pad" />
                                </View>
                            </View>
                        )}



                        {/* BLOCO DESCARTE */}
                        {abaAtiva === 'DESCARTE' && (
                            <View style={styles.row}>
                                <View style={[styles.field, { flex: 1 }]}>
                                    <Text style={styles.label}>TOTAL DESCARTE (KG)</Text>
                                    <TextInput style={[styles.input, { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]} placeholder="0.00" value={kgDescarte} onChangeText={setKgDescarte} keyboardType="decimal-pad" />
                                </View>
                            </View>
                        )}

                        <View style={styles.field}>
                            <Text style={styles.label}>OBSERVAÇÕES TÉCNICAS</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="DETALHES DA COLHEITA..."
                                value={observacao}
                                onChangeText={(t) => up(t, setObservacao)}
                                multiline
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.row}>
                            {editingUuid && (
                                <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444', flex: 1, marginRight: 10 }]} onPress={() => { setEditingUuid(null); setTalhao(''); setProduto(''); setCxsComercial(''); setKgComercial(''); setKgDescarte(''); setObservacao(''); }}>
                                    <Text style={styles.btnText}>CANCELAR</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={[styles.btn, { flex: 2 }]} onPress={salvar}>
                                <Text style={styles.btnText}>{editingUuid ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR REGISTRO'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* HISTÓRICO */}
                <Text style={styles.historyTitle}>REGISTROS DE CAMPO</Text>
                {history.map(item => (
                    <View key={item.uuid} style={styles.historyItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.hProd}>{item?.produto || 'Produto?'}</Text>
                            <Text style={styles.hSub}>{item?.cultura || '?'} • {item?.data ? new Date(item.data).toLocaleDateString() : '-'}</Text>
                            <Text style={styles.hVal}>
                                {item?.total_caixas ? `${item.total_caixas} Cx ` : ''}
                                ({item?.total_kg ? item.total_kg : (item?.quantidade || 0)} Kg)
                                {item?.congelado > 0 ? ` [CONG]` : ''}
                            </Text>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                                <Ionicons name="create-outline" size={20} color="#10B981" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
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
                                    <Ionicons name="close" size={24} color="#374151" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TextInput style={styles.searchBar} placeholder="Buscar produto..." value={searchText} onChangeText={t => up(t, setSearchText)} autoCapitalize="characters" />
                        <FlatList
                            data={getFilteredProducts()}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemRow} onPress={() => handleProdutoSelect(item || {})}>
                                    <Text style={styles.itemText}>{item?.nome || 'Sem Nome'}</Text>
                                    <Text style={styles.itemSub}>{item?.tipo || 'OUTROS'} • Fator: {item?.fator_conversao || 1}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={styles.empty}>Nenhum produto cadastrado.</Text>}
                        />
                    </View>
                </View>
            </Modal>

            {/* AREA MODAL (CULTURAS) */}
            <Modal visible={areaModalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR LOCAL</Text>
                            <TouchableOpacity onPress={() => setAreaModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={areasDB}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemRow} onPress={() => { setTalhao(item.nome); setAreaModalVisible(false); }}>
                                    <Text style={styles.itemText}>{item?.nome || 'Sem Nome'}</Text>
                                    <Text style={styles.itemSub}>{item?.observacao || 'Sem obs'}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <TouchableOpacity style={styles.empty} onPress={() => { setAreaModalVisible(false); navigation.navigate('Culturas'); }}>
                                    <Text style={{ color: '#10B981' }}>Nenhuma área cadastrada. Clique para adicionar.</Text>
                                </TouchableOpacity>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* CONFIG MODAL */}
            <Modal visible={configModal} animationType="fade" transparent>
                <View style={styles.overlayCenter}>
                    <View style={styles.miniModal}>
                        <Text style={styles.modalTitle}>Configuração</Text>
                        <Text style={[styles.label, { marginTop: 20 }]}>NOTA:</Text>
                        <Text style={{ textAlign: 'center', color: '#6B7280', marginVertical: 10 }}>
                            A configuração de peso agora é feita individualmente no CADASTRO DE CADA PRODUTO.
                        </Text>
                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#9CA3AF', flex: 1, marginRight: 10, marginTop: 20 }]} onPress={() => setConfigModal(false)}>
                                <Text style={styles.btnText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, { marginTop: 20, flex: 1 }]} onPress={saveConfig}>
                                <Text style={styles.btnText}>SALVAR</Text>
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
                        <View style={styles.field}>
                            <Text style={styles.label}>NOME DO PRODUTO</Text>
                            <TextInput style={styles.input} value={newItemName} onChangeText={t => up(t, setNewItemName)} autoCapitalize="characters" placeholder="EX: MORANGO ESPEC" />
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>FATOR (KG POR UNIDADE)</Text>
                            <TextInput style={styles.input} value={newItemFator} onChangeText={setNewItemFator} keyboardType="decimal-pad" placeholder="1.0" />
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
    configBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10 },
    form: { padding: 20 },
    field: { marginBottom: 18 },
    row: { flexDirection: 'row' },
    label: { fontSize: 11, fontWeight: '700', color: '#6E6E6E', letterSpacing: 0.5, marginBottom: 7, textTransform: 'uppercase' },
    input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 14, paddingHorizontal: 16, height: 54, fontSize: 15, color: '#1E1E1E' },
    textArea: { height: 100, textAlignVertical: 'top', paddingTop: 14 },
    btn: { backgroundColor: '#1F8A5B', paddingVertical: 17, borderRadius: 14, alignItems: 'center', marginTop: 10, shadowColor: '#1F8A5B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 },
    btnText: { color: '#FFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    selectBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 14, paddingHorizontal: 16, height: 54, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selectText: { fontSize: 15, fontWeight: '600', color: '#1E1E1E' },
    helper: { fontSize: 11, color: '#22C55E', marginTop: 4, fontWeight: '600', marginLeft: 2 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 28 },
    modalBg: { backgroundColor: '#FFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, height: '80%', padding: 20, borderWidth: 1, borderColor: '#D9D9D9', borderBottomWidth: 0 },
    miniModal: { backgroundColor: '#FFF', borderRadius: 22, padding: 28, borderWidth: 1, borderColor: '#D9D9D9' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    hSub: { fontSize: 11, color: '#9CA3AF' },
    hVal: { fontSize: 12, fontWeight: '800', color: '#22C55E', marginTop: 4 },
    actions: { flexDirection: 'row', gap: 10 },
    actionBtn: { padding: 8, backgroundColor: '#111827', borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: '#22C55E', shadowColor: '#22C55E', shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
    tabActiveC: { backgroundColor: '#3B82F6', shadowColor: '#3B82F6', shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
    tabActiveD: { backgroundColor: '#EF4444', shadowColor: '#EF4444', shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
    tabText: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 }
});




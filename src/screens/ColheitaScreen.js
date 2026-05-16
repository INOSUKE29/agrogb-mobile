import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertColheita, getCadastro, getConfig, setConfig, insertDescarte, getColheitasRecentes, updateColheita, deleteColheita, getCulturas, insertCadastro as insertCadastros } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import MetricCard from '../components/common/MetricCard';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

export default function ColheitaScreen({ navigation }) {
    const { theme } = useTheme();
    const [talhao, setTalhao] = useState('');
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [observacao, setObservacao] = useState('');
    const [congelado, setCongelado] = useState('');
    const [descarte, setDescarte] = useState('');
    const [qtdCaixas, setQtdCaixas] = useState('');
    const [fatorAtual, setFatorAtual] = useState(1);
    const [history, setHistory] = useState([]);
    const [summary, setSummary] = useState({ total: 0, discard: 0 });
    const [loading, setLoading] = useState(true);
    const [editingUuid, setEditingUuid] = useState(null);

    // Modal States
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [areaModalVisible, setAreaModalVisible] = useState(false);
    const [quickAddModal, setQuickAddModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemFator, setNewItemFator] = useState('1');

    // Lists
    const [productsDB, setProductsDB] = useState([]);
    const [areasDB, setAreasDB] = useState([]);
    const [searchText, setSearchText] = useState('');

    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    const loadData = async () => {
        setLoading(true);
        try {
            const allItems = await getCadastro();
            setProductsDB(allItems.filter(i => i.tipo === 'PRODUTO'));
            const resTalhoes = await executeQuery('SELECT * FROM talhoes WHERE is_deleted = 0 ORDER BY nome ASC');
            const areas = [];
            for (let i = 0; i < resTalhoes.rows.length; i++) areas.push(resTalhoes.rows.item(i));
            setAreasDB(areas);
            const hist = await getColheitasRecentes();
            setHistory(hist);

            const today = new Date().toISOString().split('T')[0];
            const todayCol = hist.filter(h => h.data === today);
            const total = todayCol.reduce((acc, curr) => acc + (curr.quantidade || 0), 0);
            setSummary({ total, discard: 0 }); // Descarte seria somado de outra tabela ou campo futuro
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const up = (t, setter) => setter(t.toUpperCase());

    const handleCaixasChange = (txt) => {
        setQtdCaixas(txt);
        const boxes = parseFloat(txt) || 0;
        if (boxes > 0) {
            setQuantidade((boxes * fatorAtual).toFixed(2));
        } else {
            setQuantidade('');
        }
    };

    const handleProdutoSelect = (item) => {
        setProduto(item.nome);
        setFatorAtual(item.fator_conversao || 1);
        setProductModalVisible(false);
        if (qtdCaixas) {
            setQuantidade((parseFloat(qtdCaixas) * (item.fator_conversao || 1)).toFixed(2));
        }
    };

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
                setEditingUuid(null);
            } else {
                await insertColheita(dados);
                const qtdDescarte = parseFloat(descarte);
                if (qtdDescarte > 0) {
                    await insertDescarte({
                        uuid: uuidv4(),
                        produto: produto.toUpperCase(),
                        quantidade_kg: qtdDescarte,
                        motivo: 'APONTAMENTO DE CAMPO',
                        data: new Date().toISOString().split('T')[0]
                    });
                }
            }

            Alert.alert('Sucesso', 'Registro salvo com sucesso!');
            setQtdCaixas(''); setQuantidade(''); setCongelado(''); setDescarte(''); setObservacao('');
            loadData();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao salvar registro.');
        }
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

    const quickSave = async () => {
        if (!newItemName.trim()) return Alert.alert('Ops', 'Nome é obrigatório');
        try {
            const uuid = uuidv4();
            await insertCadastros({
                uuid, nome: newItemName, tipo: 'PRODUTO', fator_conversao: parseFloat(newItemFator) || 1,
                unidade: 'CX', estocavel: 1, vendavel: 1, observacao: 'QUICK ADD'
            });
            setQuickAddModal(false);
            loadData();
            handleProdutoSelect({ nome: newItemName, fator_conversao: parseFloat(newItemFator) || 1 });
        } catch (e) { Alert.alert('Erro', 'Falha ao criar produto.'); }
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={theme?.colors?.primary || '#10B981'} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>REGISTRO DE CAMPO</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Culturas')}>
                        <Ionicons name="settings-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.summaryRow}>
                    <MetricCard 
                        title="Colheita Hoje" 
                        value={`${summary.total.toLocaleString()} kg`} 
                        icon="leaf" 
                        color="#FFF"
                        style={styles.summaryCard}
                    />
                    <MetricCard 
                        title="Status" 
                        value="Operacional" 
                        icon="checkmark-circle" 
                        color="#FFF"
                        style={styles.summaryCard}
                    />
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <Card style={styles.formCard}>
                    <Text style={styles.sectionTitle}>{editingUuid ? 'EDITAR APONTAMENTO' : 'NOVO APONTAMENTO'}</Text>
                    
                    <AgroInput 
                        label="Local / Área *"
                        value={talhao}
                        placeholder="SELECIONAR TALHÃO..."
                        icon="map"
                        style={{ marginBottom: 10 }}
                        editable={false}
                        onPressIn={() => setAreaModalVisible(true)}
                    />

                    <AgroInput 
                        label="Variedade / Produto *"
                        value={produto}
                        placeholder="SELECIONAR PRODUTO..."
                        icon="leaf"
                        style={{ marginBottom: 10 }}
                        editable={false}
                        onPressIn={() => setProductModalVisible(true)}
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <AgroInput 
                                label=" volumes (CX) "
                                value={qtdCaixas}
                                onChangeText={handleCaixasChange}
                                placeholder="0"
                                keyboardType="decimal-pad"
                            />
                            <Text style={styles.fatorText}>Fator: {fatorAtual} Kg</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <AgroInput 
                                label="Total Kg *"
                                value={quantidade}
                                onChangeText={setQuantidade}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <AgroInput 
                                label="Descarte (kg)"
                                value={descarte}
                                onChangeText={setDescarte}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                                style={{ backgroundColor: '#FEF2F2' }}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AgroInput 
                                label="Congelado (kg)"
                                value={congelado}
                                onChangeText={setCongelado}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                                style={{ backgroundColor: '#EFF6FF' }}
                            />
                        </View>
                    </View>

                    <AgroInput 
                        label="Observações"
                        value={observacao}
                        onChangeText={(t) => up(t, setObservacao)}
                        placeholder="DETALHES TÉCNICOS..."
                        icon="document-text"
                        style={{ marginBottom: 20 }}
                    />

                    <AgroButton 
                        title={editingUuid ? "SALVAR ALTERAÇÕES" : "CONFIRMAR REGISTRO"}
                        onPress={salvar}
                    />
                </Card>

                <Text style={styles.historyTitle}>ÚLTIMOS APONTAMENTOS</Text>
                {history.map(item => (
                    <Card key={item.uuid} style={styles.historyCard} noPadding>
                        <View style={styles.historyContent}>
                            <View style={styles.historyIcon}>
                                <Ionicons name="leaf" size={20} color="#10B981" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.hProd}>{item.produto}</Text>
                                <Text style={styles.hSub}>{item.cultura} • {new Date(item.data).toLocaleDateString('pt-BR')}</Text>
                                <Text style={styles.hVal}>{item.quantidade} kg {item.congelado > 0 ? `(+${item.congelado}kg Cong)` : ''}</Text>
                            </View>
                            <View style={styles.historyActions}>
                                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Card>
                ))}
            </ScrollView>

            {/* MODALS */}
            <Modal visible={productModalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR PRODUTO</Text>
                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                <TouchableOpacity onPress={() => { setProductModalVisible(false); setQuickAddModal(true); }}>
                                    <Ionicons name="add-circle" size={24} color="#10B981" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#374151" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TextInput style={styles.searchBar} placeholder="Buscar..." value={searchText} onChangeText={t => up(t, setSearchText)} />
                        <FlatList
                            data={productsDB.filter(p => p.nome.includes(searchText.toUpperCase()))}
                            keyExtractor={i => i.uuid || i.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemRow} onPress={() => handleProdutoSelect(item)}>
                                    <Text style={styles.itemText}>{item.nome}</Text>
                                    <Text style={styles.itemSub}>Fator: {item.fator_conversao || 1} Kg</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

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
                                    <Text style={styles.itemText}>{item.nome}</Text>
                                    <Text style={styles.itemSub}>{item.observacao}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={quickAddModal} animationType="fade" transparent>
                <View style={styles.overlayCenter}>
                    <Card style={styles.miniModal}>
                        <Text style={styles.modalTitle}>NOVO PRODUTO RÁPIDO</Text>
                        <AgroInput label="Nome" value={newItemName} onChangeText={t => up(t, setNewItemName)} placeholder="EX: MORANGO" />
                        <AgroInput label="Kg por Caixa" value={newItemFator} onChangeText={setNewItemFator} keyboardType="decimal-pad" placeholder="1.0" />
                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.miniBtn, { backgroundColor: '#9CA3AF' }]} onPress={() => setQuickAddModal(false)}>
                                <Text style={styles.btnText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.miniBtn} onPress={quickSave}>
                                <Text style={styles.btnText}>SALVAR</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    summaryRow: { flexDirection: 'row', gap: 10 },
    summaryCard: { flex: 1, height: 90, marginHorizontal: 0 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, marginBottom: 15 },
    formCard: { padding: 20 },
    row: { flexDirection: 'row' },
    fatorText: { fontSize: 9, color: '#10B981', fontWeight: 'bold', marginLeft: 10, marginBottom: 10 },
    historyTitle: { fontSize: 12, fontWeight: '900', color: '#6B7280', letterSpacing: 1, marginTop: 25, marginBottom: 15, marginLeft: 5 },
    historyCard: { marginBottom: 12 },
    historyContent: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    historyIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    hProd: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
    hSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    hVal: { fontSize: 12, fontWeight: '900', color: '#059669', marginTop: 4 },
    historyActions: { marginLeft: 10 },
    actionBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalBg: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 20 },
    miniModal: { padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937' },
    searchBar: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12, marginBottom: 10, fontSize: 14 },
    itemRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    itemText: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
    itemSub: { fontSize: 10, color: '#9CA3AF' },
    miniBtn: { flex: 1, backgroundColor: '#10B981', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 15, marginHorizontal: 5 },
    btnText: { color: '#FFF', fontWeight: 'bold' }
});

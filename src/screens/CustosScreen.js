import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCost, getCostCategories, insertCostCategory, executeQuery } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function CustosScreen({ navigation }) {
    const [categoria, setCategoria] = useState(null); // Objeto da categoria
    const [quantidade, setQuantidade] = useState('1');
    const [valorUnitario, setValorUnitario] = useState('');
    const [observacao, setObservacao] = useState('');

    // Selection Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [items, setItems] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    // New Category Modal State
    const [newCatModalVisible, setNewCatModalVisible] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState('VARIÁVEL');

    useEffect(() => { loadItems(); }, []);

    const loadItems = async () => {
        setLoading(true);
        try {
            const categories = await getCostCategories();
            setItems(categories);
        } catch (e) {
            console.error("Erro interno ao acessar categorias de custo:", e);
            // Fallback manual 
            Alert.alert(
                'Aviso do Sistema',
                'Erro interno ao acessar categorias de custo.\nO sistema irá tentar recriar a estrutura automaticamente.',
                [{ text: 'Tentar Novamente', onPress: tentarRecuperarBanco }]
            );
        } finally {
            setLoading(false);
        }
    };

    const tentarRecuperarBanco = async () => {
        try {
            setLoading(true);
            await executeQuery(`CREATE TABLE IF NOT EXISTS cost_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT, is_default INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0, created_at TEXT)`);
            Alert.alert('Sucesso', 'Estrutura recriada. Tente agora!');
            loadItems();
        } catch (e) {
            console.error('Falha na recuperação manual', e);
        } finally { setLoading(false); }
    }

    const getFilteredItems = () => {
        if (!searchText) return items;
        return items.filter(i => i.name.toUpperCase().includes(searchText.toUpperCase()));
    };

    const up = (t, setter) => setter(t.toUpperCase());

    const salvarNovaCategoria = async () => {
        if (!newCatName) {
            Alert.alert('Atenção', 'Informe o nome da Categoria.');
            return;
        }
        try {
            await insertCostCategory(newCatName, newCatType);
            setNewCatModalVisible(false);
            setNewCatName('');
            loadItems();
            Alert.alert('Sucesso', 'Categoria criada com sucesso!');
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível salvar a categoria.');
        }
    }

    const calcularTotal = () => {
        const q = parseFloat(quantidade) || 0;
        const v = parseFloat(valorUnitario) || 0;
        return (q * v).toFixed(2);
    }

    const salvar = async () => {
        if (!categoria || !quantidade || !valorUnitario) {
            Alert.alert('Atenção', 'Preencha os campos obrigatórios (*)');
            return;
        }

        const dados = {
            category_id: categoria.id,
            quantity: parseFloat(quantidade) || 0,
            unit_value: parseFloat(valorUnitario) || 0,
            notes: observacao.toUpperCase(),
        };

        try {
            await insertCost(dados);
            Alert.alert('Sucesso', 'Despesa registrada com sucesso!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível registrar o custo.');
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
                <LinearGradient colors={['#DC2626', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardHeader}>
                    <Text style={styles.headerTitle}>REGISTRAR CUSTO</Text>
                    <Text style={styles.headerSub}>Despesas, Mão de Obra e Insumos</Text>
                </LinearGradient>

                <View style={styles.form}>
                    <View style={styles.field}>
                        <Text style={styles.label}>CATEGORIA DA DESPESA *</Text>
                        <TouchableOpacity style={styles.selectBtn} onPress={() => setModalVisible(true)}>
                            <Text style={[styles.selectText, !categoria && { color: '#9CA3AF' }]}>
                                {categoria ? categoria.name : "SELECIONAR CATEGORIA..."}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.field, { flex: 0.8, marginRight: 10 }]}>
                            <Text style={styles.label}>QTD *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="1"
                                value={quantidade}
                                onChangeText={setQuantidade}
                                keyboardType="decimal-pad"
                            />
                        </View>
                        <View style={[styles.field, { flex: 1.2 }]}>
                            <Text style={styles.label}>VALOR UNIT. R$ *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                value={valorUnitario}
                                onChangeText={setValorUnitario}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>VALOR TOTAL R$ (AUTOMÁTICO)</Text>
                        <View style={[styles.input, { backgroundColor: '#F3F4F6', borderColor: 'transparent' }]}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>{calcularTotal()}</Text>
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>OBSERVAÇÕES (OPCIONAL)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="NOTAS DE VÍNCULO..."
                            value={observacao}
                            onChangeText={(t) => up(t, setObservacao)}
                            multiline
                            autoCapitalize="characters"
                        />
                    </View>

                    <TouchableOpacity style={styles.btn} onPress={salvar}>
                        <Text style={styles.btnText}>SALVAR E INTEGRAR</Text>
                    </TouchableOpacity>
                </View>
            </View>


            {/* SELECTION MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>ESCOLHA A CATEGORIA</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchBar}
                            placeholder="Buscar categoria..."
                            value={searchText}
                            onChangeText={t => up(t, setSearchText)}
                            autoCapitalize="characters"
                        />

                        {loading ? <ActivityIndicator color="#DC2626" /> :
                            <>
                                <FlatList
                                    data={getFilteredItems()}
                                    keyExtractor={i => i.id.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={styles.itemRow} onPress={() => { setCategoria(item); setModalVisible(false); }}>
                                            <Text style={styles.itemText}>{item.name}</Text>
                                            <Text style={styles.itemSub}>{item.type ? item.type.toUpperCase() : 'GERAL'}</Text>
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <View style={{ alignItems: 'center', marginTop: 20 }}>
                                            <Text style={styles.empty}>Nenhuma categoria encontrada.</Text>
                                            <TouchableOpacity style={[styles.btn, { marginTop: 15, width: '100%', paddingVertical: 15 }]} onPress={() => { setModalVisible(false); setNewCatModalVisible(true) }}>
                                                <Text style={styles.btnText}>+ NOVA CATEGORIA</Text>
                                            </TouchableOpacity>
                                        </View>
                                    }
                                />
                                {getFilteredItems().length > 0 && (
                                    <TouchableOpacity style={[styles.btn, { marginTop: 15, paddingVertical: 12, backgroundColor: '#4B5563' }]} onPress={() => { setModalVisible(false); setNewCatModalVisible(true) }}>
                                        <Text style={styles.btnText}>+ CRIAR CATEGORIA</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        }
                    </View>
                </View>
            </Modal>

            {/* NEW CATEGORY MODAL */}
            <Modal visible={newCatModalVisible} animationType="fade" transparent>
                <View style={[styles.overlay, { justifyContent: 'center', padding: 20 }]}>
                    <View style={[styles.modalBg, { height: 'auto', borderRadius: 24 }]}>
                        <Text style={styles.modalTitle}>NOVA CATEGORIA</Text>

                        <View style={{ marginTop: 20 }}>
                            <Text style={styles.label}>NOME DA CATEGORIA</Text>
                            <TextInput style={styles.input} placeholder="EX: FERTILIZANTE" value={newCatName} onChangeText={t => up(t, setNewCatName)} />
                        </View>

                        <View style={{ marginTop: 15, flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity style={[styles.btn, { flex: 1, backgroundColor: '#9CA3AF' }]} onPress={() => setNewCatModalVisible(false)}>
                                <Text style={styles.btnText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={salvarNovaCategoria}>
                                <Text style={styles.btnText}>SALVAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView >
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
    textArea: { height: 80, textAlignVertical: 'top', paddingTop: 14 },
    btn: { backgroundColor: '#1F8A5B', paddingVertical: 17, borderRadius: 14, alignItems: 'center', marginTop: 10, shadowColor: '#1F8A5B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    btnText: { color: '#FFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    selectBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selectText: { fontSize: 15, fontWeight: '600', color: '#1E1E1E' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBg: { backgroundColor: '#FFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, height: '80%', padding: 20, borderWidth: 1, borderColor: '#334155', borderBottomWidth: 0 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 16, fontWeight: '800', color: '#1E1E1E' },
    itemRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F4F6F5' },
    itemText: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
    itemSub: { fontSize: 10, color: '#6E6E6E' },
    historyTitle: { fontSize: 12, fontWeight: '800', color: '#6E6E6E', letterSpacing: 0.5, marginBottom: 14, marginLeft: 4 },
    historyItem: { backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
    hTipo: { fontSize: 12, fontWeight: '700', color: '#1E1E1E' },
    hSub: { fontSize: 11, color: '#6E6E6E' },
    hVal: { fontSize: 12, fontWeight: '900', color: '#E74C3C' },
    actions: { flexDirection: 'row', gap: 10 },
    actionBtn: { padding: 8, backgroundColor: '#F0F4F1', borderRadius: 10 },
    searchBar: { backgroundColor: '#F4F6F5', padding: 12, borderRadius: 12, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#D9D9D9', color: '#1E1E1E' },
    empty: { textAlign: 'center', marginTop: 20, color: '#6E6E6E' }
});

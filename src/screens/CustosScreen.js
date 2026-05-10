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
    container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
    card: { backgroundColor: '#FFF', borderRadius: 32, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
    cardHeader: { padding: 30 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 5, fontWeight: 'bold' },
    form: { padding: 25 },
    field: { marginBottom: 20 },
    row: { flexDirection: 'row' },
    label: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 8 },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, fontSize: 15, color: '#111827' },
    textArea: { height: 80, textAlignVertical: 'top' },
    btn: { backgroundColor: '#DC2626', paddingVertical: 20, borderRadius: 18, alignItems: 'center', marginTop: 10 },
    btnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    selectBtn: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selectText: { fontSize: 15, fontWeight: '600', color: '#111827' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBg: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937' },
    searchBar: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12, marginBottom: 10, fontSize: 14 },
    itemRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    itemText: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
    itemSub: { fontSize: 10, color: '#9CA3AF' },
    empty: { textAlign: 'center', marginTop: 20, color: '#9CA3AF' }
});

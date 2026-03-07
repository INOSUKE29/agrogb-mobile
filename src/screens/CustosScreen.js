import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCost, getCostCategories, insertCostCategory, executeQuery } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { showToast } from '../ui/Toast';
import { useTheme } from '../context/ThemeContext';

export default function CustosScreen({ navigation }) {
    const { colors } = useTheme();
    const [categoria, setCategoria] = useState(null);
    const [quantidade, setQuantidade] = useState('1');
    const [valorUnitario, setValorUnitario] = useState('');
    const [observacao, setObservacao] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [items, setItems] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

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
            Alert.alert(
                'Aviso do Sistema',
                'Erro interno ao acessar categorias de custo.\nO sistema irá tentar recriar a estrutura automaticamente.',
                [{ text: 'Tentar Novamente', onPress: tentarRecuperarBanco }]
            );
        } finally { setLoading(false); }
    };

    const tentarRecuperarBanco = async () => {
        try {
            setLoading(true);
            await executeQuery(`CREATE TABLE IF NOT EXISTS cost_categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT, is_default INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0, created_at TEXT)`);
            showToast('Estrutura recriada. Tente agora!');
            loadItems();
        } catch (e) { console.error('Falha na recuperação manual', e); } finally { setLoading(false); }
    };

    const getFilteredItems = () => {
        if (!searchText) return items;
        return items.filter(i => i.name.toUpperCase().includes(searchText.toUpperCase()));
    };

    const up = (t, setter) => setter(t.toUpperCase());

    const salvarNovaCategoria = async () => {
        if (!newCatName) { Alert.alert('Atenção', 'Informe o nome da Categoria.'); return; }
        try {
            await insertCostCategory(newCatName, newCatType);
            setNewCatModalVisible(false); setNewCatName(''); loadItems();
            showToast('Categoria criada com sucesso!');
        } catch (e) { Alert.alert('Erro', 'Não foi possível salvar a categoria.'); }
    };

    const calcularTotal = () => {
        const q = parseFloat(quantidade) || 0;
        const v = parseFloat(valorUnitario) || 0;
        return (q * v).toFixed(2);
    };

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
            showToast('Despesa registrada com sucesso!');
            navigation.goBack();
        } catch (error) { Alert.alert('Erro', 'Não foi possível registrar o custo.'); }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
                    <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]}>REGISTRAR CUSTO</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {/* RED GLOW HEADER CARD */}
                <View style={[styles.costHeader, { backgroundColor: colors.danger + '20', borderColor: colors.danger + '40' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={[styles.costIcon, { backgroundColor: colors.danger + '30' }]}>
                            <Ionicons name="receipt-outline" size={24} color={colors.danger} />
                        </View>
                        <View>
                            <Text style={[styles.costTitle, { color: colors.danger }]}>REGISTRAR CUSTO</Text>
                            <Text style={[styles.costSub, { color: colors.textSecondary }]}>Despesas, Mão de Obra e Insumos</Text>
                        </View>
                    </View>
                </View>

                {/* FORM */}
                <Text style={[styles.label, { color: colors.textSecondary }]}>CATEGORIA DA DESPESA *</Text>
                <TouchableOpacity style={[styles.selectBtn, { backgroundColor: colors.card, borderColor: colors.glassBorder }]} onPress={() => setModalVisible(true)}>
                    <Text style={[styles.selectText, !categoria ? { color: colors.textMuted } : { color: colors.textPrimary }]}>
                        {categoria ? categoria.name : 'SELECIONAR CATEGORIA...'}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 0.8 }}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>QTD *</Text>
                        <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.glassBorder, color: colors.textPrimary }]} value={quantidade} onChangeText={setQuantidade} placeholder="1" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
                    </View>
                    <View style={{ flex: 1.2 }}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>VALOR UNIT. R$ *</Text>
                        <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.glassBorder, color: colors.textPrimary }]} value={valorUnitario} onChangeText={setValorUnitario} placeholder="0.00" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
                    </View>
                </View>

                <Text style={[styles.label, { color: colors.textSecondary }]}>VALOR TOTAL R$ (AUTOMÁTICO)</Text>
                <View style={[styles.totalBox, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' }]}>
                    <Text style={[styles.totalValue, { color: colors.primaryDark }]}>R$ {calcularTotal()}</Text>
                </View>

                <Text style={[styles.label, { color: colors.textSecondary }]}>OBSERVAÇÕES (OPCIONAL)</Text>
                <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top', backgroundColor: colors.card, borderColor: colors.glassBorder, color: colors.textPrimary }]} value={observacao} onChangeText={t => up(t, setObservacao)} placeholder="NOTAS DE VÍNCULO..." placeholderTextColor={colors.textMuted} multiline />

                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={salvar}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.textOnPrimary} style={{ marginRight: 8 }} />
                    <Text style={[styles.btnText, { color: colors.textOnPrimary }]}>SALVAR E INTEGRAR</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* SELECTION MODAL - FULL SCREEN */}
            <Modal visible={modalVisible} animationType="slide" transparent={false}>
                <View style={[styles.modalFullScreen, { backgroundColor: colors.bg }]}>
                    <View style={[styles.modalHeaderFullScreen, { backgroundColor: colors.primary }]}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} /></TouchableOpacity>
                        <Text style={[styles.modalTitleFullScreen, { color: colors.textOnPrimary }]}>SELECIONAR CATEGORIA</Text>
                        <TouchableOpacity onPress={() => { setModalVisible(false); setNewCatModalVisible(true); }}>
                            <Ionicons name="add" size={28} color={colors.textOnPrimary} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ padding: 20, flex: 1 }}>
                        <TextInput style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.glassBorder, color: colors.textPrimary }]} placeholder="Buscar categoria..." placeholderTextColor={colors.textMuted} value={searchText} onChangeText={t => up(t, setSearchText)} />
                        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> :
                            <>
                                <FlatList
                                    data={getFilteredItems()}
                                    keyExtractor={i => i.id.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={[styles.itemRow, { backgroundColor: colors.card, borderColor: colors.glassBorder }]} onPress={() => { setCategoria(item); setModalVisible(false); }}>
                                            <Text style={[styles.itemText, { color: colors.textPrimary }]}>{item.name}</Text>
                                            <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{item.type ? item.type.toUpperCase() : 'GERAL'}</Text>
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <Text style={[styles.empty, { color: colors.textMuted }]}>Nenhuma categoria encontrada.</Text>
                                    }
                                />
                            </>
                        }
                    </View>
                </View>
            </Modal>

            {/* NEW CATEGORY MODAL - MINI */}
            <Modal visible={newCatModalVisible} animationType="fade" transparent={true}>
                <View style={styles.overlayCenter}>
                    <View style={[styles.miniModal, { backgroundColor: colors.modal }]}>
                        <Text style={[styles.miniModalTitle, { color: colors.textPrimary }]}>NOVA CATEGORIA</Text>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>NOME DA CATEGORIA</Text>
                        <TextInput style={[styles.input, { marginBottom: 20, backgroundColor: colors.bg, borderColor: colors.glassBorder, color: colors.textPrimary }]} value={newCatName} onChangeText={t => up(t, setNewCatName)} placeholder="EX: FERTILIZANTE" placeholderTextColor={colors.textMuted} />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity style={[styles.btnOutlined, { borderColor: colors.glassBorder }]} onPress={() => setNewCatModalVisible(false)}>
                                <Text style={[styles.btnOutlinedText, { color: colors.textSecondary }]}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btnSolidSmall, { backgroundColor: colors.primary }]} onPress={salvarNovaCategoria}>
                                <Text style={[styles.btnSolidText, { color: colors.textOnPrimary }]}>SALVAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#10B981' },
    headerTitle: { fontSize: 18, fontWeight: '700' },

    costHeader: { borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    costIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    costTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    costSub: { fontSize: 11, marginTop: 3 },

    label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 16, elevation: 1 },
    selectBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, elevation: 1 },
    selectText: { fontSize: 15, fontWeight: '600' },

    totalBox: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 14, alignItems: 'center' },
    totalValue: { fontSize: 24, fontWeight: '900' },

    btn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    btnText: { fontSize: 14, fontWeight: 'bold' },

    modalFullScreen: { flex: 1 },
    modalHeaderFullScreen: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2 },
    modalTitleFullScreen: { fontSize: 16, fontWeight: '700' },
    searchBar: { padding: 14, borderRadius: 12, marginBottom: 12, fontSize: 15, borderWidth: 1 },
    itemRow: { paddingVertical: 16, borderBottomWidth: 1, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1 },
    itemText: { fontSize: 15, fontWeight: 'bold' },
    itemSub: { fontSize: 12, marginTop: 4 },
    empty: { textAlign: 'center', marginTop: 40, fontSize: 15 },

    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    miniModal: { borderRadius: 16, padding: 24, elevation: 5 },
    miniModalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 20 },

    btnSolidSmall: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
    btnSolidText: { fontSize: 14, fontWeight: 'bold' },
    btnOutlined: { flex: 1, backgroundColor: 'transparent', paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
    btnOutlinedText: { fontSize: 14, fontWeight: 'bold' }
});

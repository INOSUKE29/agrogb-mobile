import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCost, getCostCategories, insertCostCategory, executeQuery } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';
import { DARK, MODAL_OVERLAY } from '../styles/darkTheme';

export default function CustosScreen({ navigation }) {
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
            Alert.alert('Sucesso', 'Estrutura recriada. Tente agora!');
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
            Alert.alert('Sucesso', 'Categoria criada com sucesso!');
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
            Alert.alert('Sucesso', 'Despesa registrada com sucesso!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (error) { Alert.alert('Erro', 'Não foi possível registrar o custo.'); }
    };

    return (
        <AppContainer>
            <ScreenHeader title="Registrar Custo" onBack={() => navigation.goBack()} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>

                {/* RED GLOW HEADER CARD */}
                <LinearGradient
                    colors={['rgba(255,59,59,0.2)', 'rgba(184,0,0,0.1)']}
                    style={styles.costHeader}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={styles.costIcon}>
                            <Ionicons name="receipt-outline" size={24} color={DARK.danger} />
                        </View>
                        <View>
                            <Text style={styles.costTitle}>REGISTRAR CUSTO</Text>
                            <Text style={styles.costSub}>Despesas, Mão de Obra e Insumos</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* FORM */}
                <Text style={styles.label}>CATEGORIA DA DESPESA *</Text>
                <TouchableOpacity style={styles.selectBtn} onPress={() => setModalVisible(true)}>
                    <Text style={[styles.selectText, !categoria && { color: DARK.placeholder }]}>
                        {categoria ? categoria.name : 'SELECIONAR CATEGORIA...'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={DARK.textMuted} />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 0.8 }}>
                        <Text style={styles.label}>QTD *</Text>
                        <GlowInput value={quantidade} onChangeText={setQuantidade} placeholder="1" keyboardType="decimal-pad" />
                    </View>
                    <View style={{ flex: 1.2 }}>
                        <Text style={styles.label}>VALOR UNIT. R$ *</Text>
                        <GlowInput value={valorUnitario} onChangeText={setValorUnitario} placeholder="0.00" keyboardType="decimal-pad" />
                    </View>
                </View>

                <Text style={styles.label}>VALOR TOTAL R$ (AUTOMÁTICO)</Text>
                <View style={styles.totalBox}>
                    <Text style={styles.totalValue}>R$ {calcularTotal()}</Text>
                </View>

                <Text style={styles.label}>OBSERVAÇÕES (OPCIONAL)</Text>
                <GlowInput value={observacao} onChangeText={t => up(t, setObservacao)} placeholder="NOTAS DE VÍNCULO..." multiline style={{ height: 80, textAlignVertical: 'top' }} />

                <PrimaryButton
                    label="SALVAR E INTEGRAR"
                    onPress={salvar}
                    style={{ marginTop: 8 }}
                    icon={<Ionicons name="checkmark-circle" size={18} color="#061E1A" />}
                />
            </ScrollView>

            {/* SELECTION MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>ESCOLHA A CATEGORIA</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={DARK.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.searchBar}
                            placeholder="Buscar categoria..."
                            placeholderTextColor={DARK.placeholder}
                            value={searchText}
                            onChangeText={t => up(t, setSearchText)}
                        />
                        {loading ? <ActivityIndicator color={DARK.danger} /> :
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
                                            <Text style={{ color: DARK.textMuted, marginBottom: 15 }}>Nenhuma categoria encontrada.</Text>
                                            <TouchableOpacity style={styles.addCatBtn} onPress={() => { setModalVisible(false); setNewCatModalVisible(true); }}>
                                                <Text style={styles.addCatText}>+ NOVA CATEGORIA</Text>
                                            </TouchableOpacity>
                                        </View>
                                    }
                                />
                                {getFilteredItems().length > 0 && (
                                    <TouchableOpacity style={[styles.addCatBtn, { marginTop: 12 }]} onPress={() => { setModalVisible(false); setNewCatModalVisible(true); }}>
                                        <Text style={styles.addCatText}>+ CRIAR CATEGORIA</Text>
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
                            <GlowInput placeholder="EX: FERTILIZANTE" value={newCatName} onChangeText={t => up(t, setNewCatName)} />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setNewCatModalVisible(false)}>
                                <Text style={{ color: DARK.textMuted, fontWeight: 'bold' }}>CANCELAR</Text>
                            </TouchableOpacity>
                            <PrimaryButton label="SALVAR" onPress={salvarNovaCategoria} style={{ flex: 1 }} />
                        </View>
                    </View>
                </View>
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    costHeader: { borderRadius: 18, padding: 20, borderWidth: 1, borderColor: 'rgba(255,59,59,0.3)', marginBottom: 24 },
    costIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,59,59,0.15)', justifyContent: 'center', alignItems: 'center' },
    costTitle: { fontSize: 16, fontWeight: '900', color: DARK.danger, letterSpacing: 0.5 },
    costSub: { fontSize: 11, color: DARK.textMuted, marginTop: 3 },

    label: { fontSize: 10, fontWeight: '900', color: DARK.textMuted, letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
    selectBtn: { backgroundColor: DARK.card, borderWidth: 1, borderColor: 'rgba(255,59,59,0.4)', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    selectText: { fontSize: 14, fontWeight: '600', color: DARK.textPrimary },

    totalBox: { backgroundColor: 'rgba(0,255,156,0.08)', borderWidth: 1, borderColor: DARK.glowBorder, borderRadius: 14, padding: 16, marginBottom: 14, alignItems: 'center' },
    totalValue: { fontSize: 22, fontWeight: '900', color: DARK.glow },

    overlay: { flex: 1, backgroundColor: MODAL_OVERLAY, justifyContent: 'flex-end' },
    modalBg: { backgroundColor: DARK.modal, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 20, borderWidth: 1, borderColor: DARK.glowBorder },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: DARK.textPrimary },
    searchBar: { backgroundColor: DARK.card, padding: 12, borderRadius: 12, marginBottom: 10, fontSize: 14, color: DARK.textPrimary, borderWidth: 1, borderColor: DARK.glowBorder },
    itemRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    itemText: { fontSize: 14, fontWeight: 'bold', color: DARK.textPrimary },
    itemSub: { fontSize: 10, color: DARK.textMuted, marginTop: 2 },
    addCatBtn: { backgroundColor: 'rgba(0,255,156,0.1)', borderWidth: 1, borderColor: DARK.glowBorder, padding: 14, borderRadius: 14, alignItems: 'center' },
    addCatText: { color: DARK.glow, fontWeight: '900', fontSize: 13 },
    cancelBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: DARK.glowBorder, alignItems: 'center', justifyContent: 'center' },
});

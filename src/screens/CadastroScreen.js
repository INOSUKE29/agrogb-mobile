import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCadastro, getCadastro, deleteCadastro, updateCadastro, insertReceita, getReceita, deleteItemReceita } from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';
import GlowFAB from '../ui/GlowFAB';
import { DARK, MODAL_OVERLAY, GLOW_CARD_SHADOW } from '../styles/darkTheme';

const CATEGORIES = {
    DEFENSIVO: { label: 'Defensivo Agrícola', icon: 'flask-outline', color: '#FF3B3B', bg: 'rgba(255,59,59,0.15)', fields: ['principio', 'classe'] },
    FERTILIZANTE: { label: 'Fertilizante / Adubo', icon: 'leaf-outline', color: '#00FF9C', bg: 'rgba(0,255,156,0.12)', fields: ['composicao'] },
    NUTRIENTE: { label: 'Nutriente / Corretivo', icon: 'water-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', fields: ['composicao'] },
    EMBALAGEM: { label: 'Embalagem / Caixa', icon: 'cube-outline', color: '#A8C5BE', bg: 'rgba(168,197,190,0.12)' },
    INSUMO: { label: 'Insumo Geral', icon: 'construct-outline', color: '#818CF8', bg: 'rgba(129,140,248,0.15)' },
    CULTURA: { label: 'Cultura (Plantio)', icon: 'nutrition-outline', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
    PRODUTO: { label: 'Produto (Venda)', icon: 'cart-outline', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)', preCheck: ['vendavel'] },
    AREA: { label: 'Área / Talhão', icon: 'map-outline', color: '#00FF9C', bg: 'rgba(0,255,156,0.12)' }
};

const MARKET_STANDARDS = [
    { label: '🏞️ Área / Talhão', unit: 'HA', weight: '1' },
    { label: '🍓 Cx Morango Padrão', unit: 'CX', weight: '1.2' },
    { label: '🍅 Cx Tomate (K)', unit: 'CX', weight: '20' },
    { label: '🥦 Cx Legumes (Madeira)', unit: 'CX', weight: '12' },
    { label: '📦 Cx Papelão G', unit: 'CX', weight: '5' },
    { label: '🧪 Saco Adubo', unit: 'SC', weight: '50' },
    { label: '🌽 Saco Grãos/Milho', unit: 'SC', weight: '60' },
    { label: '🛢️ Galão Pequeno', unit: 'LT', weight: '5' },
    { label: '🛢️ Galão Grande', unit: 'LT', weight: '20' },
    { label: '❓ Unitário', unit: 'UNI', weight: '1' }
];

export default function CadastroScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [obsModalVisible, setObsModalVisible] = useState(false);
    const [assistantVisible, setAssistantVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [nome, setNome] = useState('');
    const [unidade, setUnidade] = useState('KG');
    const [tipo, setTipo] = useState('INSUMO');
    const [observacao, setObservacao] = useState('');
    const [fator, setFator] = useState('1');
    const [estocavel, setEstocavel] = useState(true);
    const [vendavel, setVendavel] = useState(true);
    const [principioAtivo, setPrincipioAtivo] = useState('');
    const [classeToxicologica, setClasseToxicologica] = useState('');
    const [composicao, setComposicao] = useState('');
    const [precoVenda, setPrecoVenda] = useState('');
    const [recipeModalVisible, setRecipeModalVisible] = useState(false);
    const [currentRecipe, setCurrentRecipe] = useState([]);
    const [addIngModal, setAddIngModal] = useState(false);
    const [selectedIng, setSelectedIng] = useState(null);
    const [qtdIng, setQtdIng] = useState('');

    useEffect(() => { loadData(); }, []);

    const up = (t, setter) => setter(t ? t.toUpperCase() : '');
    const loadData = async () => {
        setLoading(true);
        try { const data = await getCadastro(); setItems(data); } catch (e) { } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!nome.trim()) return Alert.alert('Ops!', 'Dê um nome ao item.');
        try {
            const data = { uuid: editingItem ? editingItem.uuid : uuidv4(), nome, unidade, tipo, observacao, fator_conversao: parseFloat(fator) || 1, estocavel: estocavel ? 1 : 0, vendavel: vendavel ? 1 : 0, principio_ativo: principioAtivo, classe_toxicologica: classeToxicologica, composicao, preco_venda: parseFloat(precoVenda) || 0 };
            if (editingItem) { await updateCadastro(data); Alert.alert('Sucesso', 'Item atualizado!'); }
            else { await insertCadastro(data); }
            setModalVisible(false); resetForm(); loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar.'); }
    };

    const resetForm = () => { setEditingItem(null); setNome(''); setObservacao(''); setFator('1'); setEstocavel(true); setVendavel(false); setUnidade('KG'); setTipo('INSUMO'); setPrincipioAtivo(''); setClasseToxicologica(''); setComposicao(''); setPrecoVenda(''); };

    const handleEdit = (item) => {
        setEditingItem(item); setNome(item.nome); setUnidade(item.unidade); setTipo(item.tipo); setObservacao(item.observacao || ''); setFator((item.fator_conversao || 1).toString()); setEstocavel(item.estocavel === 1); setVendavel(item.vendavel === 1); setPrincipioAtivo(item.principio_ativo || ''); setClasseToxicologica(item.classe_toxicologica || ''); setComposicao(item.composicao || ''); setPrecoVenda(item.preco_venda ? item.preco_venda.toString() : ''); setModalVisible(true);
    };

    const handleDelete = (id) => {
        Alert.alert('Excluir', 'Remover item permanentemente?', [
            { text: 'Não' }, { text: 'Sim', onPress: async () => { await deleteCadastro(id); loadData(); } }
        ]);
    };

    const getCategoryConfig = (t) => CATEGORIES[t] || CATEGORIES['INSUMO'];
    const selectCategory = (key) => { setTipo(key); setCategoryModalVisible(false); const cfg = CATEGORIES[key]; if (cfg.preCheck?.includes('vendavel')) setVendavel(true); };

    return (
        <AppContainer>
            <ScreenHeader
                title="Catálogo Geral"
                onBack={navigation?.goBack ? () => navigation.goBack() : null}
                rightElement={
                    <TouchableOpacity style={styles.scanBtn} onPress={() => navigation?.navigate('Scanner', { onScanComplete: (data) => { setNome(data.nome); setTipo(data.tipo); setObservacao(data.observacao); setModalVisible(true); } })}>
                        <Ionicons name="scan-outline" size={22} color={DARK.glow} />
                    </TouchableOpacity>
                }
            />

            {loading ? <ActivityIndicator size="large" color={DARK.glow} style={{ marginTop: 50 }} /> :
                <SectionList
                    sections={Object.values(items.reduce((acc, item) => {
                        if (!acc[item.tipo]) acc[item.tipo] = { title: item.tipo, data: [] };
                        acc[item.tipo].data.push(item); return acc;
                    }, {})).sort((a, b) => a.title.localeCompare(b.title))}
                    keyExtractor={item => item.id.toString()}
                    renderSectionHeader={({ section: { title } }) => {
                        const cfg = getCategoryConfig(title);
                        return (
                            <View style={[styles.sectionHeader, { backgroundColor: cfg.bg }]}>
                                <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                                <Text style={[styles.sectionTitle, { color: cfg.color }]}>{cfg.label}</Text>
                            </View>
                        );
                    }}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <TouchableOpacity style={styles.cardBody} onPress={() => handleEdit(item)}>
                                <Text style={styles.cardTitle}>{item.nome}</Text>
                                <View style={{ flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                                    <View style={styles.miniTag}><Text style={styles.miniTagText}>{item.unidade}</Text></View>
                                    {item.estocavel === 1 && <View style={[styles.miniTag, { backgroundColor: 'rgba(0,255,156,0.12)', borderColor: 'rgba(0,255,156,0.3)' }]}><Text style={[styles.miniTagText, { color: DARK.glow }]}>Estoque</Text></View>}
                                    {item.vendavel === 1 && <View style={[styles.miniTag, { backgroundColor: 'rgba(96,165,250,0.12)', borderColor: 'rgba(96,165,250,0.3)' }]}><Text style={[styles.miniTagText, { color: '#60A5FA' }]}>$ Venda</Text></View>}
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 10 }}>
                                <Ionicons name="trash-outline" size={18} color={DARK.danger} />
                            </TouchableOpacity>
                        </View>
                    )}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListEmptyComponent={<Text style={styles.empty}>Nenhum item cadastrado.</Text>}
                />
            }

            <GlowFAB onPress={() => { resetForm(); setModalVisible(true); }} />

            {/* MODAL EDITOR */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={styles.modalTitle}>{editingItem ? 'EDITAR ITEM' : 'NOVO ITEM'}</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={DARK.textMuted} /></TouchableOpacity>
                            </View>

                            <Text style={styles.label}>CATEGORIA / TIPO</Text>
                            <TouchableOpacity style={[styles.selectorBtn, { borderColor: getCategoryConfig(tipo).color + '60' }]} onPress={() => setCategoryModalVisible(true)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[styles.iconBox, { backgroundColor: getCategoryConfig(tipo).bg }]}>
                                        <Ionicons name={getCategoryConfig(tipo).icon} size={20} color={getCategoryConfig(tipo).color} />
                                    </View>
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={[styles.selectorLabel, { color: getCategoryConfig(tipo).color }]}>{getCategoryConfig(tipo).label}</Text>
                                        <Text style={{ fontSize: 10, color: DARK.textMuted }}>Toque para alterar</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-down" size={20} color={DARK.textMuted} />
                            </TouchableOpacity>

                            <Text style={styles.label}>IDENTIFICAÇÃO</Text>
                            <GlowInput placeholder="Nome do Item (Ex: Adubo 20-00-20)" value={nome} onChangeText={t => up(t, setNome)} />

                            <Text style={styles.label}>UNIDADE</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {['KG', 'LT', 'CX', 'SC', 'UNI'].map(u => (
                                        <TouchableOpacity key={u} onPress={() => setUnidade(u)} style={[styles.unitChip, unidade === u && styles.unitChipActive]}>
                                            <Text style={[styles.unitText, unidade === u && { color: '#061E1A' }]}>{u}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>

                            {getCategoryConfig(tipo).fields?.includes('principio') && (
                                <View style={styles.extraSection}>
                                    <Text style={[styles.label, { color: DARK.danger }]}>DADOS DO DEFENSIVO</Text>
                                    <GlowInput placeholder="Princípio Ativo (Ex: Glifosato)" value={principioAtivo} onChangeText={t => up(t, setPrincipioAtivo)} />
                                    <GlowInput placeholder="Classe Toxicológica (Ex: Classe I)" value={classeToxicologica} onChangeText={t => up(t, setClasseToxicologica)} />
                                </View>
                            )}

                            {getCategoryConfig(tipo).fields?.includes('composicao') && (
                                <View style={styles.extraSection}>
                                    <Text style={[styles.label, { color: DARK.glow }]}>COMPOSIÇÃO QUÍMICA</Text>
                                    <GlowInput placeholder="Ex: NPK 04-14-08 + Micronutrientes" value={composicao} onChangeText={t => up(t, setComposicao)} />
                                </View>
                            )}

                            {(tipo === 'PRODUTO' || vendavel) && (
                                <View style={styles.extraSection}>
                                    <Text style={[styles.label, { color: '#60A5FA' }]}>PREÇO DE VENDA (R$)</Text>
                                    <GlowInput placeholder="0.00" keyboardType="numeric" value={precoVenda} onChangeText={setPrecoVenda} />
                                </View>
                            )}

                            <Text style={styles.label}>CONTEÚDO DA EMBALAGEM</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                                <GlowInput style={{ flex: 1, marginBottom: 0 }} value={fator} onChangeText={setFator} keyboardType="numeric" />
                                <TouchableOpacity style={styles.assistantBtn} onPress={() => setAssistantVisible(true)}>
                                    <Ionicons name="bulb-outline" size={16} color="#061E1A" />
                                    <Text style={styles.assistantText}>Padrões</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                                <TouchableOpacity style={[styles.toggleBtn, estocavel && styles.toggleActive]} onPress={() => setEstocavel(!estocavel)}>
                                    <Text style={[styles.toggleLabel, estocavel && { color: '#061E1A' }]}>📦 ESTOCÁVEL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.toggleBtn, vendavel && { backgroundColor: '#60A5FA', borderColor: '#60A5FA' }]} onPress={() => setVendavel(!vendavel)}>
                                    <Text style={[styles.toggleLabel, vendavel && { color: '#061E1A' }]}>💲 VENDÁVEL</Text>
                                </TouchableOpacity>
                            </View>

                            {editingItem && tipo === 'PRODUTO' && (
                                <TouchableOpacity style={styles.recipeBtn} onPress={() => openRecipeModal(editingItem)}>
                                    <Ionicons name="construct-outline" size={18} color="#061E1A" />
                                    <Text style={styles.recipeBtnText}>ENGENHARIA / RECEITA</Text>
                                </TouchableOpacity>
                            )}

                            <Text style={styles.label}>OBSERVAÇÕES</Text>
                            <GlowInput style={{ height: 70, textAlignVertical: 'top' }} value={observacao} onChangeText={t => up(t, setObservacao)} multiline placeholder="Detalhes adicionais..." />

                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: 40 }}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                    <Text style={{ color: DARK.textMuted, fontWeight: 'bold' }}>CANCELAR</Text>
                                </TouchableOpacity>
                                <PrimaryButton label="SALVAR" onPress={handleSave} style={{ flex: 1 }} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL CATEGORIAS */}
            <Modal visible={categoryModalVisible} transparent animationType="fade">
                <View style={[styles.overlay, { justifyContent: 'center', padding: 20 }]}>
                    <View style={[styles.modal, { padding: 20 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                            <Text style={styles.modalTitle}>SELECIONE A CATEGORIA</Text>
                            <TouchableOpacity onPress={() => setCategoryModalVisible(false)}><Ionicons name="close" size={24} color={DARK.textMuted} /></TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                            {Object.keys(CATEGORIES).map(key => {
                                const cat = CATEGORIES[key];
                                return (
                                    <TouchableOpacity key={key} style={styles.catGridItem} onPress={() => selectCategory(key)}>
                                        <View style={[styles.catIconBig, { backgroundColor: cat.bg }]}><Ionicons name={cat.icon} size={26} color={cat.color} /></View>
                                        <Text style={[styles.catLabelSmall, { color: cat.color }]}>{cat.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL PADRÕES */}
            <Modal visible={assistantVisible} transparent animationType="fade">
                <View style={[styles.overlay, { justifyContent: 'center', padding: 20 }]}>
                    <View style={[styles.modal, { padding: 20 }]}>
                        <Text style={styles.modalTitle}>PADRÕES IDEAIS</Text>
                        <FlatList data={MARKET_STANDARDS} keyExtractor={i => i.label} renderItem={({ item }) => (
                            <TouchableOpacity style={styles.stdItem} onPress={() => { setUnidade(item.unit); setFator(item.weight); setAssistantVisible(false); }}>
                                <Text style={{ color: DARK.textPrimary }}>{item.label}</Text>
                                <Text style={{ fontWeight: 'bold', color: DARK.glow }}>{item.weight} {item.unit}</Text>
                            </TouchableOpacity>
                        )} />
                        <TouchableOpacity onPress={() => setAssistantVisible(false)} style={{ alignSelf: 'center', padding: 12 }}>
                            <Text style={{ color: DARK.textMuted }}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MODAL RECEITA */}
            <Modal visible={recipeModalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={[styles.modal, { height: '85%' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={styles.modalTitle}>FICHA TÉCNICA 🏗️</Text>
                            <TouchableOpacity onPress={() => setRecipeModalVisible(false)}><Ionicons name="close" size={28} color={DARK.textMuted} /></TouchableOpacity>
                        </View>
                        <FlatList data={currentRecipe} keyExtractor={i => i.id.toString()}
                            ListEmptyComponent={<Text style={styles.empty}>Sem ingredientes.</Text>}
                            renderItem={({ item }) => (
                                <View style={styles.stdItem}>
                                    <Text style={{ color: DARK.textPrimary }}>{item.nome_filho} ({item.quantidade} {item.unidade_filho})</Text>
                                    <TouchableOpacity onPress={() => removeIngredient(item.id)}><Ionicons name="trash" size={18} color={DARK.danger} /></TouchableOpacity>
                                </View>
                            )} />
                        <TouchableOpacity style={styles.recipeBtn} onPress={() => setAddIngModal(true)}>
                            <Text style={styles.recipeBtnText}>+ INGREDIENTE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={addIngModal} transparent animationType="fade">
                <View style={[styles.overlay, { justifyContent: 'center', padding: 20 }]}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>ADICIONAR</Text>
                        {!selectedIng ? (
                            <FlatList data={items.filter(i => i.uuid !== editingItem?.uuid)} keyExtractor={i => i.uuid} renderItem={({ item }) => (
                                <TouchableOpacity style={styles.stdItem} onPress={() => setSelectedIng(item)}>
                                    <Text style={{ color: DARK.textPrimary }}>{item.nome}</Text>
                                </TouchableOpacity>
                            )} style={{ height: 200 }} />
                        ) : (
                            <View>
                                <Text style={{ color: DARK.textSecondary }}>Qtd de {selectedIng.nome}?</Text>
                                <GlowInput value={qtdIng} onChangeText={setQtdIng} keyboardType="numeric" autoFocus />
                                <PrimaryButton label="CONFIRMAR" onPress={confirmAddIngredient} />
                            </View>
                        )}
                        <TouchableOpacity onPress={() => { setAddIngModal(false); setSelectedIng(null); }} style={{ padding: 10, alignSelf: 'center' }}>
                            <Text style={{ color: DARK.textMuted }}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </AppContainer>
    );

    async function openRecipeModal(item) { setRecipeModalVisible(true); loadRecipeData(item.uuid); }
    async function loadRecipeData(paiUuid) { try { const data = await getReceita(paiUuid); setCurrentRecipe(data); } catch (e) { } }
    async function confirmAddIngredient() { if (!qtdIng) return; await insertReceita(editingItem.uuid, selectedIng.uuid, parseFloat(qtdIng)); setAddIngModal(false); setSelectedIng(null); setQtdIng(''); loadRecipeData(editingItem.uuid); }
    async function removeIngredient(id) { await deleteItemReceita(id); loadRecipeData(editingItem.uuid); }
}

const styles = StyleSheet.create({
    scanBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,255,156,0.1)', borderWidth: 1, borderColor: DARK.glowBorder, alignItems: 'center', justifyContent: 'center' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginTop: 12, marginBottom: 6 },
    sectionTitle: { fontWeight: 'bold', fontSize: 11, letterSpacing: 1 },
    card: { backgroundColor: DARK.card, borderRadius: 14, padding: 14, marginBottom: 6, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: DARK.glowBorder, ...GLOW_CARD_SHADOW },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 14, fontWeight: '700', color: DARK.textPrimary },
    miniTag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(168,197,190,0.12)', borderWidth: 1, borderColor: 'rgba(168,197,190,0.2)' },
    miniTagText: { fontSize: 10, fontWeight: 'bold', color: DARK.textSecondary },
    empty: { textAlign: 'center', marginTop: 50, color: DARK.textMuted },

    overlay: { flex: 1, backgroundColor: MODAL_OVERLAY, justifyContent: 'flex-end' },
    modal: { backgroundColor: DARK.modal, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%', borderWidth: 1, borderColor: DARK.glowBorder },
    modalTitle: { fontSize: 16, fontWeight: '900', color: DARK.textPrimary },
    label: { fontSize: 10, fontWeight: '800', color: DARK.textMuted, marginBottom: 8, marginTop: 10, letterSpacing: 0.5 },

    selectorBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderWidth: 1, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 14 },
    iconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    selectorLabel: { fontWeight: 'bold', fontSize: 14 },

    catGridItem: { width: '45%', padding: 14, borderRadius: 14, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: DARK.glowBorder, backgroundColor: 'rgba(255,255,255,0.03)' },
    catIconBig: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    catLabelSmall: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },

    extraSection: { backgroundColor: 'rgba(0,255,156,0.04)', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: DARK.glowBorder },

    unitChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(0,255,156,0.06)', borderWidth: 1, borderColor: DARK.glowBorder },
    unitChipActive: { backgroundColor: DARK.glow, borderColor: DARK.glow },
    unitText: { fontSize: 12, fontWeight: 'bold', color: DARK.textSecondary },

    assistantBtn: { backgroundColor: DARK.glow, paddingHorizontal: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 5 },
    assistantText: { color: '#061E1A', fontWeight: 'bold', fontSize: 12 },

    toggleBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', borderWidth: 1, borderColor: DARK.glowBorder },
    toggleActive: { backgroundColor: DARK.glow, borderColor: DARK.glow },
    toggleLabel: { fontSize: 11, fontWeight: '900', color: DARK.textMuted },

    stdItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', justifyContent: 'space-between' },
    recipeBtn: { backgroundColor: DARK.glow, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, marginTop: 10, gap: 10 },
    recipeBtnText: { color: '#061E1A', fontWeight: 'bold' },

    cancelBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: DARK.glowBorder, alignItems: 'center', justifyContent: 'center' },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, ScrollView, Platform, Dimensions } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCadastro, getCadastro, deleteCadastro, updateCadastro, insertReceita, getReceita, deleteItemReceita } from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

const { width } = Dimensions.get('window');

// --- CONFIGURAÇÃO DE CATEGORIAS (UX) ---
const CATEGORIES = {
    DEFENSIVO: { label: 'Defensivo Agrícola', icon: 'flask-outline', color: '#DC2626', bg: '#FEE2E2', fields: ['principio', 'classe'] },
    FERTILIZANTE: { label: 'Fertilizante / Adubo', icon: 'leaf-outline', color: '#16A34A', bg: '#DCFCE7', fields: ['composicao'] },
    NUTRIENTE: { label: 'Nutriente / Corretivo', icon: 'water-outline', color: '#CA8A04', bg: '#FEF9C3', fields: ['composicao'] },
    EMBALAGEM: { label: 'Embalagem / Caixa', icon: 'cube-outline', color: '#4B5563', bg: '#F3F4F6' },
    INSUMO: { label: 'Insumo Geral', icon: 'construct-outline', color: '#6366F1', bg: '#E0E7FF' },
    CULTURA: { label: 'Cultura (Plantio)', icon: 'nutrition-outline', color: '#15803D', bg: '#DCFCE7' },
    PRODUTO: { label: 'Produto (Venda)', icon: 'cart-outline', color: '#2563EB', bg: '#DBEAFE', preCheck: ['vendavel'] },
    AREA: { label: 'Área / Talhão', icon: 'map-outline', color: '#059669', bg: '#D1FAE5' }
};

const MARKET_STANDARDS = [
    { label: 'Area / Talhão', unit: 'HA', weight: '1' },
    { label: 'Cx Morango Padrão', unit: 'CX', weight: '1.2' },
    { label: 'Cx Tomate (K)', unit: 'CX', weight: '20' },
    { label: 'Cx Legumes', unit: 'CX', weight: '12' },
    { label: 'Saco Adubo', unit: 'SC', weight: '50' },
    { label: 'Galão Pequeno', unit: 'LT', weight: '5' },
    { label: 'Unitário', unit: 'UNI', weight: '1' }
];

export default function CadastroScreen({ navigation }) {
    const { theme } = useTheme();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modais
    const [modalVisible, setModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [obsModalVisible, setObsModalVisible] = useState(false);
    const [assistantVisible, setAssistantVisible] = useState(false);

    // Form Item
    const [editingItem, setEditingItem] = useState(null);
    const [nome, setNome] = useState('');
    const [unidade, setUnidade] = useState('KG');
    const [tipo, setTipo] = useState('INSUMO');
    const [observacao, setObservacao] = useState('');
    const [fator, setFator] = useState('1');
    const [estocavel, setEstocavel] = useState(true);
    const [vendavel, setVendavel] = useState(false);

    // Form Extended
    const [principioAtivo, setPrincipioAtivo] = useState('');
    const [classeToxicologica, setClasseToxicologica] = useState('');
    const [composicao, setComposicao] = useState('');
    const [precoVenda, setPrecoVenda] = useState('');

    // Form Receita
    const [recipeModalVisible, setRecipeModalVisible] = useState(false);
    const [currentRecipe, setCurrentRecipe] = useState([]);
    const [addIngModal, setAddIngModal] = useState(false);
    const [selectedIng, setSelectedIng] = useState(null);
    const [qtdIng, setQtdIng] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try { const data = await getCadastro(); setItems(data); } catch (e) { } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!nome.trim()) return Alert.alert('Ops!', 'Dê um nome ao item.');
        try {
            const data = {
                uuid: editingItem ? editingItem.uuid : uuidv4(),
                nome: nome.toUpperCase(), unidade, tipo, observacao: observacao.toUpperCase(),
                fator_conversao: parseFloat(fator) || 1,
                estocavel: estocavel ? 1 : 0,
                vendavel: vendavel ? 1 : 0,
                principio_ativo: principioAtivo.toUpperCase(),
                classe_toxicologica: classeToxicologica.toUpperCase(),
                composicao: composicao.toUpperCase(),
                preco_venda: parseFloat(precoVenda) || 0
            };

            if (editingItem) {
                await updateCadastro(data);
                Alert.alert('Sucesso', 'Item atualizado!');
            } else {
                await insertCadastro(data);
            }

            setModalVisible(false);
            resetForm();
            loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar.'); }
    };

    const resetForm = () => {
        setEditingItem(null); setNome(''); setObservacao(''); setFator('1');
        setEstocavel(true); setVendavel(false); setUnidade('KG'); setTipo('INSUMO');
        setPrincipioAtivo(''); setClasseToxicologica(''); setComposicao(''); setPrecoVenda('');
    };

    const handleEdit = (item) => {
        setEditingItem(item); setNome(item.nome); setUnidade(item.unidade); setTipo(item.tipo);
        setObservacao(item.observacao || ''); setFator((item.fator_conversao || 1).toString());
        setEstocavel(item.estocavel === 1); setVendavel(item.vendavel === 1);
        setPrincipioAtivo(item.principio_ativo || ''); setClasseToxicologica(item.classe_toxicologica || '');
        setComposicao(item.composicao || ''); setPrecoVenda(item.preco_venda ? item.preco_venda.toString() : '');
        setModalVisible(true);
    };

    const handleDelete = (id) => {
        Alert.alert('Excluir', 'Remover item permanentemente do catálogo?', [
            { text: 'Não', style: 'cancel' }, 
            { text: 'Sim, Excluir', style: 'destructive', onPress: async () => { await deleteCadastro(id); loadData(); } }
        ]);
    };

    const selectCategory = (key) => {
        setTipo(key); setCategoryModalVisible(false);
        const cfg = CATEGORIES[key];
        if (cfg.preCheck?.includes('vendavel')) setVendavel(true);
    };

    const sections = Object.values(items.reduce((acc, item) => {
        if (!acc[item.tipo]) acc[item.tipo] = { title: item.tipo, data: [] };
        acc[item.tipo].data.push(item);
        return acc;
    }, {})).sort((a, b) => a.title.localeCompare(b.title));

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>CATÁLOGO RURAL</Text>
                    <TouchableOpacity 
                        style={styles.scanBtn}
                        onPress={() => navigation.navigate('Scanner', {
                            onScanComplete: (data) => {
                                setNome(data.nome); setTipo(data.tipo); setObservacao(data.observacao);
                                setModalVisible(true);
                            }
                        })}
                    >
                        <Ionicons name="scan-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSub}>Gerencie insumos, áreas e produtos finais</Text>
            </LinearGradient>

            {loading ? <ActivityIndicator size="large" color={theme?.colors?.primary} style={{ marginTop: 50 }} /> :
                <SectionList
                    sections={sections}
                    keyExtractor={item => item.id.toString()}
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={styles.listContent}
                    renderSectionHeader={({ section: { title } }) => {
                        const cfg = CATEGORIES[title] || CATEGORIES.INSUMO;
                        return (
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIcon, { backgroundColor: cfg.color }]}>
                                    <Ionicons name={cfg.icon} size={14} color="#FFF" />
                                </View>
                                <Text style={[styles.sectionTitle, { color: cfg.color }]}>{cfg.label.toUpperCase()}</Text>
                            </View>
                        );
                    }}
                    renderItem={({ item }) => (
                        <Card style={styles.itemCard} noPadding onPress={() => handleEdit(item)}>
                            <View style={styles.cardInner}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardName}>{item.nome}</Text>
                                    <View style={styles.tagRow}>
                                        <View style={styles.unitBadge}><Text style={styles.unitText}>{item.unidade}</Text></View>
                                        {item.estocavel === 1 && <View style={[styles.tag, { backgroundColor: '#F0FDF4' }]}><Text style={[styles.tagText, { color: '#10B981' }]}>ESTOQUE</Text></View>}
                                        {item.vendavel === 1 && <View style={[styles.tag, { backgroundColor: '#EFF6FF' }]}><Text style={[styles.tagText, { color: '#3B82F6' }]}>VENDÁVEL</Text></View>}
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>Nenhum item cadastrado no catálogo.</Text>}
                />}

            <TouchableOpacity style={[styles.fab, { backgroundColor: theme?.colors?.primary || '#10B981' }]} onPress={() => { resetForm(); setModalVisible(true); }}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* MODAL EDITOR PRINCIPAL */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingItem ? 'EDITAR ITEM' : 'NOVO ITEM'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                            <Text style={styles.inputLabel}>CATEGORIA / TIPO</Text>
                            <TouchableOpacity 
                                style={[styles.categorySelector, { borderColor: CATEGORIES[tipo]?.color || '#E5E7EB' }]} 
                                onPress={() => setCategoryModalVisible(true)}
                            >
                                <View style={styles.catInfo}>
                                    <View style={[styles.catIconBox, { backgroundColor: (CATEGORIES[tipo] || CATEGORIES.INSUMO).color + '20' }]}>
                                        <Ionicons name={(CATEGORIES[tipo] || CATEGORIES.INSUMO).icon} size={20} color={(CATEGORIES[tipo] || CATEGORIES.INSUMO).color} />
                                    </View>
                                    <Text style={[styles.catName, { color: (CATEGORIES[tipo] || CATEGORIES.INSUMO).color }]}>
                                        {(CATEGORIES[tipo] || CATEGORIES.INSUMO).label}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                            </TouchableOpacity>

                            <AgroInput label="NOME DO ITEM" value={nome} onChangeText={setNome} placeholder="EX: FERTILIZANTE NPK 04-14-08" />

                            <View style={styles.unitSection}>
                                <Text style={styles.inputLabel}>UNIDADE DE MEDIDA</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                                    {['KG', 'LT', 'CX', 'SC', 'UNI', 'HA'].map(u => (
                                        <TouchableOpacity 
                                            key={u} 
                                            onPress={() => setUnidade(u)} 
                                            style={[styles.unitChip, unidade === u && { backgroundColor: theme?.colors?.primary, borderColor: theme?.colors?.primary }]}
                                        >
                                            <Text style={[styles.unitChipText, unidade === u && { color: '#FFF' }]}>{u}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {CATEGORIES[tipo]?.fields?.includes('principio') && (
                                <Card style={styles.extraCard}>
                                    <Text style={styles.extraTitle}>DADOS TÉCNICOS</Text>
                                    <AgroInput label="PRINCÍPIO ATIVO" value={principioAtivo} onChangeText={setPrincipioAtivo} />
                                    <AgroInput label="CLASSE TOXICOLÓGICA" value={classeToxicologica} onChangeText={setClasseToxicologica} />
                                </Card>
                            )}

                            {CATEGORIES[tipo]?.fields?.includes('composicao') && (
                                <Card style={styles.extraCard}>
                                    <Text style={styles.extraTitle}>COMPOSIÇÃO QUÍMICA</Text>
                                    <AgroInput label="DETALHES" value={composicao} onChangeText={setComposicao} multiline />
                                </Card>
                            )}

                            {(tipo === 'PRODUTO' || vendavel) && (
                                <Card style={styles.extraCard}>
                                    <Text style={styles.extraTitle}>FINANCEIRO</Text>
                                    <AgroInput label="PREÇO DE VENDA (R$)" value={precoVenda} onChangeText={setPrecoVenda} keyboardType="numeric" />
                                </Card>
                            )}

                            <View style={styles.factorSection}>
                                <Text style={styles.inputLabel}>PESO DA EMBALAGEM / FATOR</Text>
                                <View style={styles.factorRow}>
                                    <TextInput 
                                        style={styles.factorInput} 
                                        value={fator} 
                                        onChangeText={setFator} 
                                        keyboardType="numeric" 
                                    />
                                    <TouchableOpacity style={[styles.stdBtn, { backgroundColor: theme?.colors?.primary }]} onPress={() => setAssistantVisible(true)}>
                                        <Ionicons name="bulb-outline" size={18} color="#FFF" />
                                        <Text style={styles.stdBtnText}>PADRÕES</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.toggleRow}>
                                <TouchableOpacity style={[styles.toggleBox, estocavel && styles.toggleActive]} onPress={() => setEstocavel(!estocavel)}>
                                    <Ionicons name="cube-outline" size={18} color={estocavel ? '#FFF' : '#6B7280'} />
                                    <Text style={[styles.toggleText, estocavel && { color: '#FFF' }]}>ESTOCÁVEL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.toggleBox, vendavel && styles.toggleActive]} onPress={() => setVendavel(!vendavel)}>
                                    <Ionicons name="cash-outline" size={18} color={vendavel ? '#FFF' : '#6B7280'} />
                                    <Text style={[styles.toggleText, vendavel && { color: '#FFF' }]}>VENDÁVEL</Text>
                                </TouchableOpacity>
                            </View>

                            {editingItem && tipo === 'PRODUTO' && (
                                <AgroButton 
                                    title="FICHA TÉCNICA / RECEITA" 
                                    onPress={() => { setRecipeModalVisible(true); loadRecipeData(editingItem.uuid); }}
                                    icon="construct-outline"
                                    variant="secondary"
                                    style={{ marginVertical: 15 }}
                                />
                            )}

                            <AgroInput label="OBSERVAÇÕES" value={observacao} onChangeText={setObservacao} multiline style={{ height: 100 }} />

                            <View style={styles.actionRow}>
                                <AgroButton title="SALVAR ITEM" onPress={handleSave} style={{ flex: 1 }} />
                                <AgroButton title="FECHAR" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1, marginLeft: 10 }} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL CATEGORIAS GRID */}
            <Modal visible={categoryModalVisible} transparent animationType="fade">
                <View style={styles.overlayCenter}>
                    <Card style={styles.gridModal}>
                        <Text style={styles.modalTitleCenter}>CATEGORIAS</Text>
                        <View style={styles.catGrid}>
                            {Object.keys(CATEGORIES).map(key => {
                                const cat = CATEGORIES[key];
                                return (
                                    <TouchableOpacity key={key} style={styles.gridItem} onPress={() => selectCategory(key)}>
                                        <View style={[styles.gridIcon, { backgroundColor: cat.bg }]}>
                                            <Ionicons name={cat.icon} size={24} color={cat.color} />
                                        </View>
                                        <Text style={styles.gridLabel}>{cat.label}</Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                        <AgroButton title="CANCELAR" variant="secondary" onPress={() => setCategoryModalVisible(false)} />
                    </Card>
                </View>
            </Modal>

            {/* MODAL PADRÕES */}
            <Modal visible={assistantVisible} transparent animationType="fade">
                <View style={styles.overlayCenter}>
                    <Card style={styles.stdModal}>
                        <Text style={styles.modalTitleCenter}>PADRÕES DE MERCADO</Text>
                        <FlatList 
                            data={MARKET_STANDARDS} 
                            keyExtractor={i => i.label} 
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.stdRow} onPress={() => { setUnidade(item.unit); setFator(item.weight); setAssistantVisible(false); }}>
                                    <Text style={styles.stdName}>{item.label}</Text>
                                    <View style={styles.stdBadge}><Text style={styles.stdValue}>{item.weight} {item.unit}</Text></View>
                                </TouchableOpacity>
                            )} 
                        />
                        <AgroButton title="FECHAR" variant="secondary" onPress={() => setAssistantVisible(false)} style={{ marginTop: 15 }} />
                    </Card>
                </View>
            </Modal>
        </View>
    );

    async function loadRecipeData(paiUuid) {
        try { const data = await getReceita(paiUuid); setCurrentRecipe(data); } catch (e) { }
    }
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
    scanBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 },
    listContent: { padding: 20, paddingBottom: 100 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 20 },
    sectionIcon: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    itemCard: { marginBottom: 10 },
    cardInner: { padding: 15, flexDirection: 'row', alignItems: 'center' },
    cardName: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
    tagRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
    unitBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    unitText: { fontSize: 9, fontWeight: '900', color: '#6B7280' },
    tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    tagText: { fontSize: 9, fontWeight: '900' },
    deleteBtn: { padding: 10 },
    empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF', fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 10 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '90%', padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937', letterSpacing: 1 },
    closeBtn: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 12 },
    inputLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 10, marginTop: 15, letterSpacing: 1 },
    categorySelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 15, backgroundColor: '#F9FAFB' },
    catInfo: { flexDirection: 'row', alignItems: 'center' },
    catIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    catName: { fontSize: 14, fontWeight: '800' },
    unitSection: { marginTop: 5 },
    unitScroll: { flexDirection: 'row' },
    unitChip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F3F4F6', marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' },
    unitChipText: { fontSize: 11, fontWeight: '900', color: '#6B7280' },
    extraCard: { marginTop: 15, padding: 15, backgroundColor: '#F9FAFB', borderStyle: 'dashed' },
    extraTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 15 },
    factorSection: { marginTop: 5 },
    factorRow: { flexDirection: 'row', gap: 10 },
    factorInput: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 15, padding: 12, fontSize: 15, fontWeight: '800', color: '#1F2937' },
    stdBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderRadius: 15, gap: 8 },
    stdBtnText: { color: '#FFF', fontWeight: '900', fontSize: 10 },
    toggleRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
    toggleBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 15, backgroundColor: '#F3F4F6', gap: 8 },
    toggleActive: { backgroundColor: '#10B981' },
    toggleText: { fontSize: 11, fontWeight: '900', color: '#6B7280' },
    actionRow: { flexDirection: 'row', marginTop: 30 },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
    gridModal: { padding: 25 },
    modalTitleCenter: { fontSize: 16, fontWeight: '900', color: '#1F2937', textAlign: 'center', marginBottom: 25, letterSpacing: 1 },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 25 },
    gridItem: { width: (width - 100) / 2, backgroundColor: '#F9FAFB', padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
    gridIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    gridLabel: { fontSize: 11, fontWeight: '800', color: '#4B5563', textAlign: 'center' },
    stdModal: { padding: 25, maxHeight: '80%' },
    stdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    stdName: { fontSize: 14, fontWeight: '700', color: '#374151' },
    stdBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    stdValue: { fontSize: 11, fontWeight: '900', color: '#10B981' }
});

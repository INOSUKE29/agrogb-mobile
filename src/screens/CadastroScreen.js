import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCadastro, getCadastro, deleteCadastro, updateCadastro, getReceita, insertReceita, deleteItemReceita } from '../database/database';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { showToast } from '../ui/Toast';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowFAB from '../ui/GlowFAB';
import ConfirmModal from '../ui/ConfirmModal';
import PrimaryButton from '../ui/PrimaryButton';

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
    const { colors } = useTheme();
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
    const [termoBusca, setTermoBusca] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('TODAS');

    // Estados da Receita
    const [recipeModalVisible, setRecipeModalVisible] = useState(false);
    const [recipeItems, setRecipeItems] = useState([]);
    const [selectedParent, setSelectedParent] = useState(null);
    const [searchItemFilho, setSearchItemFilho] = useState('');
    const [qtdUso, setQtdUso] = useState('');
    const [showAddItemFilho, setShowAddItemFilho] = useState(false);

    useEffect(() => {
        loadData();
        // Verificar se veio do CadastroForm para abrir receita auto
        if (navigation.getState().routes.find(r => r.name === 'Cadastro')?.params?.openRecipeFor) {
            const { openRecipeFor, itemName } = navigation.getState().routes.find(r => r.name === 'Cadastro').params;
            handleOpenRecipe(openRecipeFor, itemName);
            // Limpar params para não abrir de novo
            navigation.setParams({ openRecipeFor: null, itemName: null });
        }
    }, [navigation.getState()]);

    const up = (t, setter) => setter(t ? t.toUpperCase() : '');
    const loadData = async () => {
        setLoading(true);
        try { const data = await getCadastro(); setItems(data); } catch (e) { } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!nome.trim()) return Alert.alert('Ops!', 'Dê um nome ao item.');
        try {
            const data = { uuid: editingItem ? editingItem.uuid : uuidv4(), nome, unidade, tipo, observacao, fator_conversao: parseFloat(fator) || 1, estocavel: estocavel ? 1 : 0, vendavel: vendavel ? 1 : 0, principio_ativo: principioAtivo, classe_toxicologica: classeToxicologica, composicao, preco_venda: parseFloat(precoVenda) || 0 };
            if (editingItem) { await updateCadastro(data); showToast('Item atualizado com sucesso!'); }
            else { await insertCadastro(data); showToast('Novo item cadastrado!'); }
            setModalVisible(false); resetForm(); loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar.'); }
    };

    const resetForm = () => { setEditingItem(null); setNome(''); setObservacao(''); setFator('1'); setEstocavel(true); setVendavel(false); setUnidade('KG'); setTipo('INSUMO'); setPrincipioAtivo(''); setClasseToxicologica(''); setComposicao(''); setPrecoVenda(''); };

    const handleEdit = (item) => {
        setEditingItem(item); setNome(item.nome); setUnidade(item.unidade); setTipo(item.tipo); setObservacao(item.observacao || ''); setFator((item.fator_conversao || 1).toString()); setEstocavel(item.estocavel === 1); setVendavel(item.vendavel === 1); setPrincipioAtivo(item.principio_ativo || ''); setClasseToxicologica(item.classe_toxicologica || ''); setComposicao(item.composicao || ''); setPrecoVenda(item.preco_venda ? item.preco_venda.toString() : ''); setModalVisible(true);
    };

    const [confirmVisible, setConfirmVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleDelete = (id) => {
        setItemToDelete(id);
        setConfirmVisible(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            await deleteCadastro(itemToDelete);
            setConfirmVisible(false);
            setItemToDelete(null);
            loadData();
        }
    };

    const getCategoryConfig = (t) => CATEGORIES[t] || CATEGORIES['INSUMO'];
    const selectCategory = (key) => { setTipo(key); setCategoryModalVisible(false); const cfg = CATEGORIES[key]; if (cfg.preCheck?.includes('vendavel')) setVendavel(true); };

    // FUNÇÕES DE RECEITA
    const handleOpenRecipe = async (paiUuid, nomePai) => {
        setSelectedParent({ uuid: paiUuid, nome: nomePai });
        const rec = await getReceita(paiUuid);
        setRecipeItems(rec);
        setRecipeModalVisible(true);
    };

    const handleAddRecipeItem = async (filho) => {
        if (!qtdUso || parseFloat(qtdUso) <= 0) return Alert.alert('Aviso', 'Informe a quantidade de uso.');
        await insertReceita(selectedParent.uuid, filho.uuid, parseFloat(qtdUso));
        setSearchItemFilho('');
        setQtdUso('');
        setShowAddItemFilho(false);
        const rec = await getReceita(selectedParent.uuid);
        setRecipeItems(rec);
        showToast('Item adicionado à composição');
    };

    const handleRemoveRecipeItem = async (id) => {
        await deleteItemReceita(id);
        const rec = await getReceita(selectedParent.uuid);
        setRecipeItems(rec);
    };

    return (
        <AppContainer>
            <ScreenHeader
                title="CATÁLOGO GERAL"
                onBack={() => navigation?.goBack?.()}
                rightElement={
                    <TouchableOpacity
                        onPress={() => navigation?.navigate('Scanner', { onScanComplete: (data) => { setNome(data.nome); setTipo(data.tipo); setObservacao(data.observacao); setModalVisible(true); } })}
                    >
                        <Ionicons name="scan-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                }
            />

            {/* BUSCA E FILTROS */}
            <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
                    <Ionicons name="search" size={18} color={colors.textMuted} />
                    <TextInput
                        placeholder="Buscar item ou código..."
                        placeholderTextColor={colors.textMuted}
                        style={[styles.searchInput, { color: colors.textPrimary }]}
                        value={termoBusca}
                        onChangeText={setTermoBusca}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 5 }}>
                        {['TODAS', 'ÁREA', 'EMBALAGEM', 'INSUMO', 'PRODUTO', 'EQUIPAMENTO'].map(cat => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setFiltroCategoria(cat)}
                                style={[
                                    styles.filterChip,
                                    { backgroundColor: colors.card, borderColor: colors.glassBorder },
                                    filtroCategoria === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
                                ]}
                            >
                                <Text style={[styles.filterChipText, { color: colors.textSecondary }, filtroCategoria === cat && { color: '#FFF' }]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} /> :
                <SectionList
                    sections={Object.values(items
                        .filter(it => {
                            const matchTermo = it.nome.toUpperCase().includes(termoBusca.toUpperCase()) || (it.codigo && it.codigo.toUpperCase().includes(termoBusca.toUpperCase()));
                            const matchCat = filtroCategoria === 'TODAS' || it.tipo.toUpperCase().includes(filtroCategoria);
                            return matchTermo && matchCat;
                        })
                        .reduce((acc, item) => {
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
                        <GlowCard
                            style={styles.card}
                            onPress={() => handleEdit(item)}
                        >
                            <View style={styles.cardBody}>
                                {item.codigo && <Text style={[styles.itemCode, { color: colors.primary }]}>{item.codigo}</Text>}
                                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.nome}</Text>
                                <View style={{ flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                                    <View style={[styles.miniTag, { backgroundColor: colors.cardAlt, borderColor: colors.glassBorder }]}><Text style={[styles.miniTagText, { color: colors.textSecondary }]}>{item.unidade}</Text></View>
                                    {item.estocavel === 1 && <View style={[styles.miniTag, { backgroundColor: colors.success + '20', borderColor: colors.success + '50' }]}><Text style={[styles.miniTagText, { color: colors.success }]}>Estoque</Text></View>}
                                    {item.vendavel === 1 && <View style={[styles.miniTag, { backgroundColor: colors.info + '20', borderColor: colors.info + '50' }]}><Text style={[styles.miniTagText, { color: colors.info }]}>$ Venda</Text></View>}
                                    {item.vendavel === 1 && (
                                        <TouchableOpacity
                                            style={[styles.miniTag, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
                                            onPress={() => handleOpenRecipe(item.uuid, item.nome)}
                                        >
                                            <Text style={[styles.miniTagText, { color: colors.primary }]}>🔧 Engenharia</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 10 }}>
                                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                            </TouchableOpacity>
                        </GlowCard>
                    )}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>Nenhum item cadastrado no sistema.</Text>}
                />
            }

            <GlowFAB
                icon="add"
                onPress={() => { resetForm(); setModalVisible(true); }}
            />

            {/* MODAL EDITOR - FULL SCREEN */}
            <Modal visible={modalVisible} transparent={false} animationType="slide">
                <AppContainer>
                    <ScreenHeader
                        title={editingItem ? 'EDITAR ITEM' : 'NOVO ITEM'}
                        onBack={() => setModalVisible(false)}
                    />

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                        <View style={[styles.editorCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>

                            <Text style={[styles.label, { color: colors.textSecondary }]}>CATEGORIA / TIPO</Text>
                            <TouchableOpacity style={[styles.selectorBtn, { backgroundColor: colors.background, borderColor: getCategoryConfig(tipo).color + '60' }]} onPress={() => setCategoryModalVisible(true)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[styles.iconBox, { backgroundColor: getCategoryConfig(tipo).bg }]}>
                                        <Ionicons name={getCategoryConfig(tipo).icon} size={20} color={getCategoryConfig(tipo).color} />
                                    </View>
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={[styles.selectorLabel, { color: getCategoryConfig(tipo).color }]}>{getCategoryConfig(tipo).label}</Text>
                                        <Text style={{ fontSize: 11, color: colors.textMuted }}>Toque para alterar a classificação</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
                            </TouchableOpacity>

                            <Text style={[styles.label, { color: colors.textSecondary }]}>IDENTIFICAÇÃO *</Text>
                            <GlowInput
                                placeholder="Nome do Item (Ex: Adubo 20-00-20)"
                                value={nome}
                                onChangeText={t => up(t, setNome)}
                            />

                            <Text style={[styles.label, { color: colors.textSecondary }]}>UNIDADE DE MEDIDA</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {['KG', 'LT', 'CX', 'SC', 'UNI', 'HA'].map(u => (
                                        <TouchableOpacity key={u} onPress={() => setUnidade(u)} style={[styles.unitChip, { backgroundColor: colors.background, borderColor: colors.glassBorder }, unidade === u && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                                            <Text style={[styles.unitText, { color: colors.textSecondary }, unidade === u && { color: colors.textOnPrimary }]}>{u}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>

                            {getCategoryConfig(tipo).fields?.includes('principio') && (
                                <View style={[styles.extraSection, { backgroundColor: colors.cardAlt, borderColor: colors.glassBorder }]}>
                                    <Text style={[styles.label, { color: colors.danger }]}>DADOS DO DEFENSIVO</Text>
                                    <GlowInput
                                        placeholder="Princípio Ativo (Ex: Glifosato)"
                                        value={principioAtivo}
                                        onChangeText={t => up(t, setPrincipioAtivo)}
                                    />
                                    <GlowInput
                                        placeholder="Classe Toxicológica (Ex: Classe I)"
                                        value={classeToxicologica}
                                        onChangeText={t => up(t, setClasseToxicologica)}
                                        style={{ marginBottom: 0 }}
                                    />
                                </View>
                            )}

                            {getCategoryConfig(tipo).fields?.includes('composicao') && (
                                <View style={[styles.extraSection, { backgroundColor: colors.cardAlt, borderColor: colors.glassBorder }]}>
                                    <Text style={[styles.label, { color: colors.primary }]}>COMPOSIÇÃO QUÍMICA</Text>
                                    <GlowInput
                                        placeholder="Ex: NPK 04-14-08 + Micronutrientes"
                                        value={composicao}
                                        onChangeText={t => up(t, setComposicao)}
                                        style={{ marginBottom: 0 }}
                                    />
                                </View>
                            )}

                            {(tipo === 'PRODUTO' || vendavel) && (
                                <View style={[styles.extraSection, { backgroundColor: colors.cardAlt, borderColor: colors.glassBorder }]}>
                                    <Text style={[styles.label, { color: colors.info }]}>PREÇO DE VENDA PADRÃO (R$)</Text>
                                    <GlowInput
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        value={precoVenda}
                                        onChangeText={setPrecoVenda}
                                        style={{ marginBottom: 0 }}
                                    />
                                </View>
                            )}

                            <Text style={[styles.label, { color: colors.textSecondary }]}>CONVERSÃO / CONTEÚDO DA EMBALAGEM</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                                <GlowInput
                                    placeholder="Fator"
                                    value={fator}
                                    onChangeText={setFator}
                                    keyboardType="numeric"
                                    style={{ flex: 1, marginBottom: 0 }}
                                />
                                <TouchableOpacity style={[styles.assistantBtn, { backgroundColor: colors.primary }]} onPress={() => setAssistantVisible(true)}>
                                    <Ionicons name="bulb-outline" size={18} color="#FFF" />
                                    <Text style={styles.assistantText}>Ver Padrões</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.label, { color: colors.textSecondary }]}>CONFIGURAÇÃO DE SISTEMA</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                                <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: colors.background, borderColor: colors.glassBorder }, estocavel && { backgroundColor: colors.success + '20', borderColor: colors.success + '50' }]} onPress={() => setEstocavel(!estocavel)}>
                                    <Ionicons name="cube-outline" size={16} color={estocavel ? colors.success : colors.placeholder} />
                                    <Text style={[styles.toggleLabel, { color: colors.textMuted }, estocavel && { color: colors.success }]}>ESTOCÁVEL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: colors.background, borderColor: colors.glassBorder }, vendavel && { backgroundColor: colors.info + '20', borderColor: colors.info + '50' }]} onPress={() => setVendavel(!vendavel)}>
                                    <Ionicons name="cash-outline" size={16} color={vendavel ? colors.info : colors.placeholder} />
                                    <Text style={[styles.toggleLabel, { color: colors.textMuted }, vendavel && { color: colors.info }]}>VENDÁVEL</Text>
                                </TouchableOpacity>
                            </View>


                            <Text style={[styles.label, { color: colors.textSecondary }]}>OBSERVAÇÕES (OPCIONAL)</Text>
                            <GlowInput
                                style={{ height: 80, textAlignVertical: 'top' }}
                                value={observacao}
                                onChangeText={t => up(t, setObservacao)}
                                multiline
                                placeholder="Detalhes adicionais do produto..."
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 40 }}>
                            <TouchableOpacity style={[styles.btnOutlined, { borderColor: colors.glassBorder }]} onPress={() => setModalVisible(false)}>
                                <Text style={[styles.btnOutlinedText, { color: colors.textSecondary }]}>VOLTAR</Text>
                            </TouchableOpacity>
                            <PrimaryButton
                                title="SALVAR ITEM"
                                icon="checkmark"
                                onPress={handleSave}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </ScrollView>
                </AppContainer>
            </Modal>

            {/* MODAL CATEGORIAS - FULL SCREEN */}
            <Modal visible={categoryModalVisible} transparent={false} animationType="fade">
                <AppContainer>
                    <ScreenHeader
                        title="CLASSIFICAÇÃO"
                        onBack={() => setCategoryModalVisible(false)}
                    />
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
                            {Object.keys(CATEGORIES).map(key => {
                                const cat = CATEGORIES[key];
                                return (
                                    <TouchableOpacity key={key} style={[styles.catGridItem, { backgroundColor: colors.card, borderColor: colors.glassBorder }]} onPress={() => selectCategory(key)}>
                                        <View style={[styles.catIconBig, { backgroundColor: cat.bg }]}><Ionicons name={cat.icon} size={28} color={cat.color} /></View>
                                        <Text style={[styles.catLabelSmall, { color: colors.textSecondary }]}>{cat.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </AppContainer>
            </Modal>

            {/* MODAL PADRÕES */}
            <Modal visible={assistantVisible} transparent animationType="fade">
                <View style={styles.overlayCenter}>
                    <View style={[styles.miniModal, { backgroundColor: colors.card }]}>
                        <Text style={[styles.miniModalTitle, { color: colors.textPrimary }]}>PADRÕES IDEAIS DE MERCADO</Text>
                        <FlatList data={MARKET_STANDARDS} keyExtractor={i => i.label} renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.stdItem, { borderBottomColor: colors.glassBorder }]} onPress={() => { setUnidade(item.unit); setFator(item.weight); setAssistantVisible(false); }}>
                                <Text style={[styles.stdItemTitle, { color: colors.textPrimary }]}>{item.label}</Text>
                                <Text style={[styles.stdItemVal, { color: colors.primary }]}>{item.weight} {item.unit}</Text>
                            </TouchableOpacity>
                        )} style={{ maxHeight: 350 }} />
                        <TouchableOpacity onPress={() => setAssistantVisible(false)} style={styles.closeMiniModal}>
                            <Text style={[styles.closeMiniModalText, { color: colors.textMuted }]}>FECHAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ConfirmModal
                visible={confirmVisible}
                title="Excluir Item"
                message={`Deseja prosseguir com a exclusão deste item do catálogo principal?`}
                confirmText="Excluir"
                isDestructive={true}
                onCancel={() => { setConfirmVisible(false); setItemToDelete(null); }}
                onConfirm={confirmDelete}
            />

            {/* MODAL ENGENHARIA DE PRODUTO (RECEITAS) */}
            <Modal visible={recipeModalVisible} animationType="slide">
                <AppContainer>
                    <ScreenHeader
                        title="ENGENHARIA DO PRODUTO"
                        onBack={() => setRecipeModalVisible(false)}
                    />
                    <View style={{ padding: 20, flex: 1 }}>
                        <GlowCard style={{ marginBottom: 20, padding: 15 }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textMuted }}>CONFIGURANDO COMPOSIÇÃO PARA:</Text>
                            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.primary, marginTop: 4 }}>{selectedParent?.nome}</Text>
                        </GlowCard>

                        <Text style={[styles.label, { color: colors.textSecondary }]}>ÍTENS DA COMPOSIÇÃO</Text>
                        <FlatList
                            data={recipeItems}
                            keyExtractor={i => i.id.toString()}
                            renderItem={({ item }) => (
                                <View style={[styles.recipeRow, { borderBottomColor: colors.glassBorder }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>{item.nome_filho}</Text>
                                        <Text style={{ fontSize: 11, color: colors.textMuted }}>Consumo: {item.quantidade} {item.unidade_filho} por venda</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleRemoveRecipeItem(item.id)}>
                                        <Ionicons name="close-circle" size={24} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            )}
                            ListEmptyComponent={
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <Ionicons name="construct-outline" size={48} color={colors.glassBorder} />
                                    <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 10 }}>Nenhum insumo configurado para este produto.</Text>
                                </View>
                            }
                        />

                        <PrimaryButton
                            title="ADICIONAR ITEM"
                            icon="add-circle"
                            style={{ marginTop: 20 }}
                            onPress={() => setShowAddItemFilho(true)}
                        />
                    </View>
                </AppContainer>

                {/* SUB-MODAL BUSCA ITEM FILHO */}
                <Modal visible={showAddItemFilho} transparent animationType="fade">
                    <View style={styles.overlayCenter}>
                        <View style={[styles.miniModal, { backgroundColor: colors.card, height: '80%' }]}>
                            <Text style={[styles.miniModalTitle, { color: colors.textPrimary }]}>SELECIONAR INSUMO</Text>
                            <TextInput
                                placeholder="Buscar insumo..."
                                placeholderTextColor={colors.textMuted}
                                style={[styles.searchInput, { backgroundColor: colors.background, padding: 12, borderRadius: 10, color: colors.textPrimary }]}
                                value={searchItemFilho}
                                onChangeText={setSearchItemFilho}
                            />
                            <FlatList
                                data={items.filter(i => i.nome.includes(searchItemFilho.toUpperCase()) && i.uuid !== selectedParent?.uuid)}
                                keyExtractor={i => i.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={[styles.stdItem, { borderBottomColor: colors.glassBorder }]} onPress={() => Alert.prompt('Quantidade', `Quantos ${item.unidade} de ${item.nome} são usados para cada 1 unidade do produto pai?`, (q) => { setQtdUso(q); handleAddRecipeItem(item); })}>
                                        <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{item.nome}</Text>
                                        <Text style={{ fontSize: 11, color: colors.primary }}>{item.unidade}</Text>
                                    </TouchableOpacity>
                                )}
                                style={{ marginVertical: 15 }}
                            />
                            <TouchableOpacity onPress={() => setShowAddItemFilho(false)} style={styles.closeMiniModal}>
                                <Text style={[styles.closeMiniModalText, { color: colors.textMuted }]}>CANCELAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </Modal>

        </AppContainer >
    );

}

const styles = StyleSheet.create({
    scanBtn: { padding: 4, borderRadius: 8 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 16, marginBottom: 8 },
    sectionTitle: { fontWeight: '800', fontSize: 12, letterSpacing: 1 },
    card: { marginBottom: 16 },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '700' },
    miniTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    miniTagText: { fontSize: 11, fontWeight: 'bold' },
    empty: { textAlign: 'center', marginTop: 50, fontSize: 15 },
    editorCard: { borderRadius: 16, padding: 22, marginTop: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1 },
    label: { fontSize: 11, fontWeight: '800', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 },
    selectorBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderWidth: 1, borderRadius: 12, marginBottom: 6 },
    iconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    selectorLabel: { fontWeight: '700', fontSize: 15 },
    catGridItem: { width: '47%', padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, elevation: 1 },
    catIconBig: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    catLabelSmall: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
    extraSection: { padding: 16, borderRadius: 12, marginTop: 8, marginBottom: 8, borderWidth: 1 },
    unitChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
    unitText: { fontSize: 13, fontWeight: '700' },
    assistantBtn: { paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, elevation: 2 },
    assistantText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
    toggleBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1 },
    toggleLabel: { fontSize: 12, fontWeight: '800' },
    btnOutlined: { flex: 1, backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
    btnOutlinedText: { fontSize: 14, fontWeight: 'bold' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalBottom: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%', elevation: 10 },
    miniModal: { borderRadius: 16, padding: 24, elevation: 5 },
    miniModalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 20 },
    stdItem: { paddingVertical: 16, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stdItemTitle: { fontSize: 15, fontWeight: '600' },
    stdItemVal: { fontSize: 14, fontWeight: '800' },
    closeMiniModal: { marginTop: 20, paddingVertical: 12, alignItems: 'center' },
    closeMiniModalText: { fontWeight: '700', fontSize: 13 },

    // NOVOS ESTILOS v8 FINAL
    searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 48, borderRadius: 14, borderWidth: 1, gap: 10 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
    filterChipText: { fontSize: 11, fontWeight: '800' },
    itemCode: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
    recipeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
});

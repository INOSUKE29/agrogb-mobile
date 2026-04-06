/**
 * CadastroScreen.js — AgroGB OS: Catálogo Geral de Produtos & Insumos
 * UI: Dark Farm Glassmorphism Premium
 * Lógica: 100% preservada (banco, receitas, filtros, padrões de mercado)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, SectionList, FlatList, TouchableOpacity,
    Modal, TextInput, Alert, ActivityIndicator, ScrollView,
    SafeAreaView, StatusBar, Platform
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    insertCadastro, getCadastro, deleteCadastro, updateCadastro,
    getReceita, insertReceita, deleteItemReceita
} from '../database/database';
import { showToast } from '../ui/Toast';
import ConfirmModal from '../ui/ConfirmModal';

// ── CATEGORIAS (mantidas do original) ────────────────────────────────────────
const CATEGORIES = {
    DEFENSIVO:    { label: 'Defensivo Agrícola',    icon: 'flask',       color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   fields: ['principio', 'classe'] },
    FERTILIZANTE: { label: 'Fertilizante / Adubo',  icon: 'leaf',        color: '#10B981', bg: 'rgba(16,185,129,0.12)', fields: ['composicao'] },
    NUTRIENTE:    { label: 'Nutriente / Corretivo',  icon: 'water',       color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', fields: ['composicao'] },
    EMBALAGEM:    { label: 'Embalagem / Caixa',      icon: 'cube-outline',color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
    INSUMO:       { label: 'Insumo Geral',           icon: 'construct',   color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
    CULTURA:      { label: 'Cultura (Plantio)',       icon: 'nutrition',   color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
    PRODUTO:      { label: 'Produto (Venda)',         icon: 'cart',        color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', preCheck: ['vendavel'] },
    AREA:         { label: 'Área / Talhão',           icon: 'map',         color: '#6EE7B7', bg: 'rgba(110,231,183,0.12)' }
};

const MARKET_STANDARDS = [
    { label: '🏞️ Área / Talhão',        unit: 'HA',  weight: '1' },
    { label: '🍓 Cx Morango Padrão',     unit: 'CX',  weight: '1.2' },
    { label: '🍅 Cx Tomate (K)',          unit: 'CX',  weight: '20' },
    { label: '🥦 Cx Legumes (Madeira)',   unit: 'CX',  weight: '12' },
    { label: '📦 Cx Papelão G',           unit: 'CX',  weight: '5' },
    { label: '🧪 Saco Adubo',             unit: 'SC',  weight: '50' },
    { label: '🌽 Saco Grãos/Milho',       unit: 'SC',  weight: '60' },
    { label: '🛢️ Galão Pequeno',          unit: 'LT',  weight: '5' },
    { label: '🛢️ Galão Grande',           unit: 'LT',  weight: '20' },
    { label: '❓ Unitário',               unit: 'UNI', weight: '1' }
];

const UNIDADES = ['KG', 'LT', 'CX', 'SC', 'UN', 'HA', 'M', 'CBC'];
const FILTROS = ['TODAS', 'DEFENSIVO', 'FERTILIZANTE', 'INSUMO', 'PRODUTO', 'CULTURA', 'EMBALAGEM'];

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function CadastroScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [modalVisible, setModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [assistantVisible, setAssistantVisible] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [recipeModalVisible, setRecipeModalVisible] = useState(false);
    const [showAddItemFilho, setShowAddItemFilho] = useState(false);

    // Form state (100% original)
    const [editingItem, setEditingItem] = useState(null);
    const [nome, setNome] = useState('');
    const [unidade, setUnidade] = useState('KG');
    const [tipo, setTipo] = useState('INSUMO');
    const [observacao, setObservacao] = useState('');
    const [fator, setFator] = useState('1');
    const [estocavel, setEstocavel] = useState(true);
    const [vendavel, setVendavel] = useState(false);
    const [principioAtivo, setPrincipioAtivo] = useState('');
    const [classeToxicologica, setClasseToxicologica] = useState('');
    const [composicao, setComposicao] = useState('');
    const [precoVenda, setPrecoVenda] = useState('');

    // Receita state (100% original)
    const [recipeItems, setRecipeItems] = useState([]);
    const [selectedParent, setSelectedParent] = useState(null);
    const [searchItemFilho, setSearchItemFilho] = useState('');
    const [qtdUso, setQtdUso] = useState('');

    // Qtd input for recipe (modal inline)
    const [pendingFilho, setPendingFilho] = useState(null);

    // Filters
    const [termoBusca, setTermoBusca] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
    const [itemToDelete, setItemToDelete] = useState(null);

    // ── LOGIC (100% ORIGINAL) ──────────────────────────────────────────────────
    const up = (t, setter) => setter(t ? t.toUpperCase() : '');

    const loadData = useCallback(async (retries = 3) => {
        setLoading(true);
        try {
            const data = await getCadastro();
            setItems(data);
        } catch (error) {
            if (retries > 0) setTimeout(() => loadData(retries - 1), 1000);
            else Alert.alert('Erro de Conexão', 'Banco de dados ocupado. Tente novamente.');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        const route = navigation.getState().routes.find(r => r.name === 'Cadastro');
        if (route?.params?.openRecipeFor) {
            handleOpenRecipe(route.params.openRecipeFor, route.params.itemName);
            navigation.setParams({ openRecipeFor: null, itemName: null });
        }
    }, [navigation.getState()]);

    const resetForm = useCallback(() => {
        setEditingItem(null); setNome(''); setObservacao(''); setFator('1');
        setEstocavel(true); setVendavel(false); setUnidade('KG'); setTipo('INSUMO');
        setPrincipioAtivo(''); setClasseToxicologica(''); setComposicao(''); setPrecoVenda('');
    }, []);

    const handleSave = useCallback(async () => {
        if (!nome.trim()) return Alert.alert('Ops!', 'Dê um nome ao item.');
        try {
            const data = {
                uuid: editingItem ? editingItem.uuid : uuidv4(),
                nome, unidade, tipo, observacao,
                fator_conversao: parseFloat(fator) || 1,
                estocavel: estocavel ? 1 : 0,
                vendavel: vendavel ? 1 : 0,
                principio_ativo: principioAtivo,
                classe_toxicologica: classeToxicologica,
                composicao,
                preco_venda: parseFloat(precoVenda) || 0
            };
            if (editingItem) { await updateCadastro(data); showToast('✅ Item atualizado!'); }
            else { await insertCadastro(data); showToast('✅ Item cadastrado!'); }
            setModalVisible(false); resetForm(); loadData();
        } catch (e) { Alert.alert('Erro', e.message); }
    }, [nome, unidade, tipo, observacao, fator, estocavel, vendavel, principioAtivo, classeToxicologica, composicao, precoVenda, editingItem, loadData]);

    const handleEdit = useCallback((item) => {
        setEditingItem(item); setNome(item.nome); setUnidade(item.unidade); setTipo(item.tipo);
        setObservacao(item.observacao || ''); setFator((item.fator_conversao || 1).toString());
        setEstocavel(item.estocavel === 1); setVendavel(item.vendavel === 1);
        setPrincipioAtivo(item.principio_ativo || ''); setClasseToxicologica(item.classe_toxicologica || '');
        setComposicao(item.composicao || ''); setPrecoVenda(item.preco_venda ? item.preco_venda.toString() : '');
        setModalVisible(true);
    }, []);

    const handleDelete = useCallback((id) => { setItemToDelete(id); setConfirmVisible(true); }, []);

    const confirmDelete = useCallback(async () => {
        if (itemToDelete) {
            await deleteCadastro(itemToDelete);
            setConfirmVisible(false); setItemToDelete(null); loadData();
        }
    }, [itemToDelete, loadData]);

    const getCategoryConfig = (t) => CATEGORIES[t] || CATEGORIES['INSUMO'];

    const selectCategory = useCallback((key) => {
        setTipo(key); setCategoryModalVisible(false);
        if (CATEGORIES[key]?.preCheck?.includes('vendavel')) setVendavel(true);
    }, []);

    const handleOpenRecipe = useCallback(async (paiUuid, nomePai) => {
        setSelectedParent({ uuid: paiUuid, nome: nomePai });
        const rec = await getReceita(paiUuid);
        setRecipeItems(rec);
        setRecipeModalVisible(true);
    }, []);

    const handleAddRecipeItem = useCallback(async (filho) => {
        if (!qtdUso || parseFloat(qtdUso) <= 0) return Alert.alert('Aviso', 'Informe a quantidade.');
        await insertReceita(selectedParent.uuid, filho.uuid, parseFloat(qtdUso));
        setSearchItemFilho(''); setQtdUso(''); setPendingFilho(null); setShowAddItemFilho(false);
        const rec = await getReceita(selectedParent.uuid);
        setRecipeItems(rec);
        showToast('Insumo adicionado à composição!');
    }, [qtdUso, selectedParent]);

    const handleRemoveRecipeItem = useCallback(async (id) => {
        await deleteItemReceita(id);
        const rec = await getReceita(selectedParent.uuid);
        setRecipeItems(rec);
    }, [selectedParent]);

    const memoSections = useMemo(() => {
        const filtered = items.filter(it => {
            if (!it?.nome) return false;
            const matchTermo = it.nome.toUpperCase().includes(termoBusca.toUpperCase()) || (it.codigo?.toUpperCase().includes(termoBusca.toUpperCase()));
            const matchCat = filtroCategoria === 'TODAS' || it.tipo?.toUpperCase().includes(filtroCategoria);
            return matchTermo && matchCat;
        });
        const grouped = filtered.reduce((acc, item) => {
            const t = item.tipo || 'OUTROS';
            if (!acc[t]) acc[t] = { title: t, data: [] };
            acc[t].data.push(item);
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => a.title.localeCompare(b.title));
    }, [items, termoBusca, filtroCategoria]);

    const catCfg = getCategoryConfig(tipo);

    // ── RENDER SECTION HEADER ─────────────────────────────────────────────────
    const renderSectionHeader = useCallback(({ section: { title, data } }) => {
        const cfg = getCategoryConfig(title);
        return (
            <View style={[styles.sectionHeader, { backgroundColor: cfg.bg, borderLeftColor: cfg.color }]}>
                <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                <Text style={[styles.sectionTitle, { color: cfg.color }]}>{cfg.label}</Text>
                <View style={[styles.sectionCount, { backgroundColor: cfg.color + '20' }]}>
                    <Text style={[styles.sectionCountText, { color: cfg.color }]}>{data.length}</Text>
                </View>
            </View>
        );
    }, []);

    // ── RENDER ITEM ───────────────────────────────────────────────────────────
    const renderItem = useCallback(({ item }) => {
        const cfg = getCategoryConfig(item.tipo);
        return (
            <TouchableOpacity style={styles.itemCard} onPress={() => handleEdit(item)} activeOpacity={0.8}>
                <View style={[styles.itemIconBox, { backgroundColor: cfg.bg, borderColor: cfg.color + '30' }]}>
                    <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                    {item.codigo && <Text style={[styles.itemCode, { color: cfg.color }]}>{item.codigo}</Text>}
                    <Text style={styles.itemName}>{item.nome}</Text>
                    <View style={styles.tagsRow}>
                        <View style={styles.unitTag}><Text style={styles.unitTagText}>{item.unidade}</Text></View>
                        {item.estocavel === 1 && (
                            <View style={[styles.miniTag, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                                <Ionicons name="cube" size={10} color="#10B981" />
                                <Text style={[styles.miniTagText, { color: '#10B981' }]}>Estoque</Text>
                            </View>
                        )}
                        {item.vendavel === 1 && (
                            <View style={[styles.miniTag, { backgroundColor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.3)' }]}>
                                <Ionicons name="cash" size={10} color="#60A5FA" />
                                <Text style={[styles.miniTagText, { color: '#60A5FA' }]}>Venda</Text>
                            </View>
                        )}
                        {item.vendavel === 1 && (
                            <TouchableOpacity
                                style={[styles.miniTag, { backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)' }]}
                                onPress={() => handleOpenRecipe(item.uuid, item.nome)}
                            >
                                <Ionicons name="git-branch" size={10} color="#8B5CF6" />
                                <Text style={[styles.miniTagText, { color: '#8B5CF6' }]}>Receita</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
                        <Ionicons name="pencil" size={15} color="#34D399" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={15} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    }, [handleEdit, handleOpenRecipe, handleDelete]);

    // ── RENDER ─────────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <LinearGradient colors={['#050B08', '#0A120E', '#030504']} style={StyleSheet.absoluteFill} />
            <View style={[styles.orb, { backgroundColor: '#8B5CF6', top: -80, right: -80 }]} />

            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <SafeAreaView style={{ flex: 1 }}>

                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
                        <Ionicons name="arrow-back" size={22} color="#D1FAE5" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Catálogo <Text style={{ color: '#8B5CF6' }}>Geral</Text></Text>
                        <Text style={styles.headerSub}>Produtos, Insumos & Composições</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, marginLeft: 'auto' }}>
                        <TouchableOpacity
                            style={styles.scanBtn}
                            onPress={() => navigation?.navigate('Scanner', {
                                onScanComplete: (data) => { setNome(data.nome); setTipo(data.tipo); setObservacao(data.observacao); setModalVisible(true); }
                            })}
                        >
                            <Ionicons name="scan" size={20} color="#8B5CF6" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addBtnHeader} onPress={() => { resetForm(); setModalVisible(true); }}>
                            <Ionicons name="add" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* SEARCH */}
                <View style={styles.searchWrap}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={16} color="#6B7280" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar item ou código..."
                            placeholderTextColor="#4B5563"
                            value={termoBusca}
                            onChangeText={setTermoBusca}
                        />
                        {termoBusca.length > 0 && (
                            <TouchableOpacity onPress={() => setTermoBusca('')}>
                                <Ionicons name="close-circle" size={16} color="#6B7280" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* FILTER CHIPS */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {FILTROS.map(f => {
                        const cfg = f === 'TODAS' ? { color: '#9CA3AF', icon: 'apps' } : (CATEGORIES[f] || { color: '#9CA3AF', icon: 'apps' });
                        const active = filtroCategoria === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                style={[styles.filterChip, active && { backgroundColor: cfg.color + '20', borderColor: cfg.color + '50' }]}
                                onPress={() => setFiltroCategoria(f)}
                            >
                                <Ionicons name={cfg.icon} size={12} color={active ? cfg.color : '#6B7280'} />
                                <Text style={[styles.filterChipText, active && { color: cfg.color }]}>
                                    {f === 'TODAS' ? 'TODOS' : f}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* LIST */}
                {loading ? (
                    <ActivityIndicator color="#8B5CF6" size="large" style={{ marginTop: 60 }} />
                ) : (
                    <SectionList
                        sections={memoSections}
                        keyExtractor={item => item.id?.toString() || item.uuid}
                        stickySectionHeadersEnabled={false}
                        initialNumToRender={10}
                        maxToRenderPerBatch={8}
                        windowSize={5}
                        renderSectionHeader={renderSectionHeader}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyBox}>
                                <View style={styles.emptyRing}>
                                    <Ionicons name="file-tray-full-outline" size={40} color="rgba(139,92,246,0.4)" />
                                </View>
                                <Text style={styles.emptyTitle}>Catálogo vazio</Text>
                                <Text style={styles.emptyDesc}>Adicione seus produtos, insumos e materiais para controlar o sistema.</Text>
                                <TouchableOpacity style={styles.emptyBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
                                    <Text style={styles.emptyBtnText}>+ Cadastrar Primeiro Item</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>

            {/* ── MODAL: EDITOR ─────────────────────────────────────────────── */}
            <Modal visible={modalVisible} transparent={false} animationType="slide">
                <View style={styles.container}>
                    <LinearGradient colors={['#050B08', '#0A120E', '#030504']} style={StyleSheet.absoluteFill} />
                    <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.header}>
                            <TouchableOpacity style={styles.backBtn} onPress={() => setModalVisible(false)}>
                                <Ionicons name="arrow-back" size={22} color="#D1FAE5" />
                            </TouchableOpacity>
                            <View>
                                <Text style={styles.headerTitle}>{editingItem ? 'Editar' : 'Novo'} <Text style={{ color: catCfg.color }}>Item</Text></Text>
                                <Text style={styles.headerSub}>Preenchimento do Catálogo</Text>
                            </View>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editorScroll}>

                            {/* CATEGORIA */}
                            <Text style={styles.fieldLabel}>CATEGORIA / TIPO</Text>
                            <TouchableOpacity
                                style={[styles.catSelector, { borderColor: catCfg.color + '50' }]}
                                onPress={() => setCategoryModalVisible(true)}
                            >
                                <View style={[styles.catSelectorIcon, { backgroundColor: catCfg.bg }]}>
                                    <Ionicons name={catCfg.icon} size={22} color={catCfg.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.catSelectorLabel, { color: catCfg.color }]}>{catCfg.label}</Text>
                                    <Text style={styles.catSelectorSub}>Toque para alterar</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
                            </TouchableOpacity>

                            {/* NOME */}
                            <Text style={styles.fieldLabel}>NOME DO ITEM *</Text>
                            <TextInput
                                style={styles.input}
                                value={nome}
                                onChangeText={t => up(t, setNome)}
                                placeholder="Ex: Adubo 20-00-20, Bocashi..."
                                placeholderTextColor="#374151"
                            />

                            {/* UNIDADE */}
                            <Text style={styles.fieldLabel}>UNIDADE DE MEDIDA</Text>
                            <View style={styles.unidadeGrid}>
                                {UNIDADES.map(u => (
                                    <TouchableOpacity
                                        key={u}
                                        style={[styles.unidadeChip, unidade === u && { backgroundColor: catCfg.color + '20', borderColor: catCfg.color + '60' }]}
                                        onPress={() => setUnidade(u)}
                                    >
                                        <Text style={[styles.unidadeText, unidade === u && { color: catCfg.color }]}>{u}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* DEFENSIVO FIELDS */}
                            {catCfg.fields?.includes('principio') && (
                                <View style={[styles.extraCard, { borderColor: '#EF4444' + '30' }]}>
                                    <Text style={[styles.extraCardTitle, { color: '#EF4444' }]}>
                                        <Ionicons name="warning" size={11} /> DADOS DO DEFENSIVO
                                    </Text>
                                    <Text style={styles.fieldLabel}>PRINCÍPIO ATIVO</Text>
                                    <TextInput style={styles.input} value={principioAtivo} onChangeText={t => up(t, setPrincipioAtivo)} placeholder="Ex: Glifosato" placeholderTextColor="#374151" />
                                    <Text style={styles.fieldLabel}>CLASSE TOXICOLÓGICA</Text>
                                    <TextInput style={styles.input} value={classeToxicologica} onChangeText={t => up(t, setClasseToxicologica)} placeholder="Ex: Classe I" placeholderTextColor="#374151" />
                                </View>
                            )}

                            {/* COMPOSIÇÃO */}
                            {catCfg.fields?.includes('composicao') && (
                                <View style={[styles.extraCard, { borderColor: '#10B981' + '30' }]}>
                                    <Text style={[styles.extraCardTitle, { color: '#10B981' }]}>
                                        <Ionicons name="flask" size={11} /> COMPOSIÇÃO QUÍMICA
                                    </Text>
                                    <TextInput style={styles.input} value={composicao} onChangeText={t => up(t, setComposicao)} placeholder="Ex: NPK 04-14-08 + Micro" placeholderTextColor="#374151" />
                                </View>
                            )}

                            {/* PREÇO VENDA */}
                            {(tipo === 'PRODUTO' || vendavel) && (
                                <View style={[styles.extraCard, { borderColor: '#F59E0B' + '30' }]}>
                                    <Text style={[styles.extraCardTitle, { color: '#F59E0B' }]}>
                                        <Ionicons name="cash" size={11} /> PREÇO DE VENDA (R$)
                                    </Text>
                                    <TextInput style={styles.input} value={precoVenda} onChangeText={setPrecoVenda} keyboardType="numeric" placeholder="0,00" placeholderTextColor="#374151" />
                                </View>
                            )}

                            {/* FATOR CONVERSÃO */}
                            <Text style={styles.fieldLabel}>CONVERSÃO / FATOR DE EMBALAGEM</Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={fator}
                                    onChangeText={setFator}
                                    keyboardType="numeric"
                                    placeholder="1"
                                    placeholderTextColor="#374151"
                                />
                                <TouchableOpacity style={styles.standardsBtn} onPress={() => setAssistantVisible(true)}>
                                    <Ionicons name="bulb" size={16} color="#FFF" />
                                    <Text style={styles.standardsBtnText}>Padrões</Text>
                                </TouchableOpacity>
                            </View>

                            {/* TOGGLES */}
                            <Text style={styles.fieldLabel}>CONFIGURAÇÃO DO ITEM</Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity
                                    style={[styles.toggleChip, estocavel && { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.4)' }]}
                                    onPress={() => setEstocavel(!estocavel)}
                                >
                                    <Ionicons name="cube" size={16} color={estocavel ? '#10B981' : '#6B7280'} />
                                    <Text style={[styles.toggleChipText, estocavel && { color: '#10B981' }]}>ESTOCÁVEL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.toggleChip, vendavel && { backgroundColor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.4)' }]}
                                    onPress={() => setVendavel(!vendavel)}
                                >
                                    <Ionicons name="cash" size={16} color={vendavel ? '#60A5FA' : '#6B7280'} />
                                    <Text style={[styles.toggleChipText, vendavel && { color: '#60A5FA' }]}>VENDÁVEL</Text>
                                </TouchableOpacity>
                            </View>

                            {/* OBSERVAÇÕES */}
                            <Text style={styles.fieldLabel}>OBSERVAÇÕES (OPCIONAL)</Text>
                            <TextInput
                                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 14 }]}
                                value={observacao}
                                onChangeText={t => up(t, setObservacao)}
                                multiline
                                placeholder="Detalhes, fabricante, validade..."
                                placeholderTextColor="#374151"
                            />

                            {/* BUTTONS */}
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.cancelBtnText}>CANCELAR</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.saveBtn, { flex: 2, shadowColor: catCfg.color }]} onPress={handleSave}>
                                    <LinearGradient colors={[catCfg.color, catCfg.color + '80']} style={styles.saveGradient}>
                                        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                        <Text style={styles.saveBtnText}>SALVAR ITEM</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                            <View style={{ height: 60 }} />
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </Modal>

            {/* ── MODAL: CATEGORIAS ─────────────────────────────────────────── */}
            <Modal visible={categoryModalVisible} transparent={false} animationType="fade">
                <View style={styles.container}>
                    <LinearGradient colors={['#050B08', '#0A120E']} style={StyleSheet.absoluteFill} />
                    <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.header}>
                            <TouchableOpacity style={styles.backBtn} onPress={() => setCategoryModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#D1FAE5" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Classificação do Item</Text>
                        </View>
                        <ScrollView contentContainerStyle={styles.catGrid}>
                            {Object.entries(CATEGORIES).map(([key, cat]) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[styles.catGridItem, { borderColor: cat.color + '40', backgroundColor: cat.bg }]}
                                    onPress={() => selectCategory(key)}
                                >
                                    <View style={[styles.catGridIcon, { backgroundColor: cat.color + '20' }]}>
                                        <Ionicons name={cat.icon} size={28} color={cat.color} />
                                    </View>
                                    <Text style={[styles.catGridLabel, { color: cat.color }]}>{cat.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </Modal>

            {/* ── MODAL: PADRÕES DE MERCADO ─────────────────────────────────── */}
            <Modal visible={assistantVisible} transparent animationType="fade">
                <View style={styles.overlayCenter}>
                    <View style={styles.miniModalCard}>
                        <Text style={styles.miniModalTitle}>⚡ Padrões de Mercado</Text>
                        <FlatList
                            data={MARKET_STANDARDS}
                            keyExtractor={i => i.label}
                            style={{ maxHeight: 350 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.stdItem}
                                    onPress={() => { setUnidade(item.unit); setFator(item.weight); setAssistantVisible(false); }}
                                >
                                    <Text style={styles.stdItemTitle}>{item.label}</Text>
                                    <Text style={styles.stdItemVal}>{item.weight} {item.unit}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setAssistantVisible(false)} style={styles.closeLink}>
                            <Text style={styles.closeLinkText}>FECHAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── MODAL: RECEITA / ENGENHARIA ─────────────────────────────── */}
            <Modal visible={recipeModalVisible} animationType="slide">
                <View style={styles.container}>
                    <LinearGradient colors={['#050B08', '#0A120E']} style={StyleSheet.absoluteFill} />
                    <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.header}>
                            <TouchableOpacity style={styles.backBtn} onPress={() => setRecipeModalVisible(false)}>
                                <Ionicons name="arrow-back" size={22} color="#D1FAE5" />
                            </TouchableOpacity>
                            <View>
                                <Text style={styles.headerTitle}>🔧 Engenharia</Text>
                                <Text style={styles.headerSub} numberOfLines={1}>{selectedParent?.nome}</Text>
                            </View>
                        </View>

                        {/* Parent info */}
                        <View style={styles.recipeParentBox}>
                            <Ionicons name="cube" size={18} color="#8B5CF6" />
                            <Text style={styles.recipeParentText}>Composição de: <Text style={{ color: '#8B5CF6' }}>{selectedParent?.nome}</Text></Text>
                        </View>

                        <FlatList
                            data={recipeItems}
                            keyExtractor={i => i.id.toString()}
                            contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
                            renderItem={({ item }) => (
                                <View style={styles.recipeRow}>
                                    <View style={styles.recipeRowIcon}>
                                        <Ionicons name="flask" size={18} color="#8B5CF6" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.recipeRowName}>{item.nome_filho}</Text>
                                        <Text style={styles.recipeRowQty}>{item.quantidade} {item.unidade_filho} por unidade</Text>
                                    </View>
                                    <TouchableOpacity style={styles.recipeDelBtn} onPress={() => handleRemoveRecipeItem(item.id)}>
                                        <Ionicons name="close-circle" size={22} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyBox}>
                                    <View style={styles.emptyRing}>
                                        <Ionicons name="construct-outline" size={36} color="rgba(139,92,246,0.4)" />
                                    </View>
                                    <Text style={styles.emptyTitle}>Sem composição</Text>
                                    <Text style={styles.emptyDesc}>Adicione os insumos que compõem este produto.</Text>
                                </View>
                            }
                        />

                        <View style={styles.recipeFooter}>
                            <TouchableOpacity style={styles.saveBtn} onPress={() => setShowAddItemFilho(true)}>
                                <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.saveGradient}>
                                    <Ionicons name="add-circle" size={20} color="#FFF" />
                                    <Text style={styles.saveBtnText}>ADICIONAR INSUMO</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>

                {/* Sub-modal busca filho */}
                <Modal visible={showAddItemFilho} transparent animationType="slide">
                    <View style={styles.modalBg}>
                        <View style={styles.bottomSheet}>
                            <View style={styles.sheetHandle} />
                            <Text style={styles.sheetTitle}>Selecionar Insumo</Text>

                            <View style={styles.searchBox}>
                                <Ionicons name="search" size={16} color="#6B7280" />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Buscar insumo..."
                                    placeholderTextColor="#4B5563"
                                    value={searchItemFilho}
                                    onChangeText={setSearchItemFilho}
                                    autoFocus
                                />
                            </View>

                            {/* QTD input when item selected */}
                            {pendingFilho && (
                                <View style={styles.qtdBox}>
                                    <Text style={styles.qtdLabel}>Quantidade de <Text style={{ color: '#8B5CF6' }}>{pendingFilho.nome}</Text> por unidade:</Text>
                                    <TextInput
                                        style={[styles.input, { marginTop: 8 }]}
                                        value={qtdUso}
                                        onChangeText={setQtdUso}
                                        keyboardType="decimal-pad"
                                        placeholder={`Em ${pendingFilho.unidade}`}
                                        placeholderTextColor="#374151"
                                        autoFocus
                                    />
                                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPendingFilho(null); setQtdUso(''); }}>
                                            <Text style={styles.cancelBtnText}>VOLTAR</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.saveBtn, { flex: 2 }]} onPress={() => handleAddRecipeItem(pendingFilho)}>
                                            <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.saveGradient}>
                                                <Ionicons name="checkmark" size={18} color="#FFF" />
                                                <Text style={styles.saveBtnText}>CONFIRMAR</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {!pendingFilho && (
                                <FlatList
                                    data={items.filter(i => i.nome?.includes(searchItemFilho.toUpperCase()) && i.uuid !== selectedParent?.uuid)}
                                    keyExtractor={i => i.id.toString()}
                                    style={{ maxHeight: 300 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.insumoRow}
                                            onPress={() => setPendingFilho(item)}
                                        >
                                            <Ionicons name="flask" size={16} color="#8B5CF6" />
                                            <Text style={styles.insumoRowText}>{item.nome}</Text>
                                            <Text style={styles.insumoRowUnit}>{item.unidade}</Text>
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={<Text style={styles.emptyDesc}>Nenhum insumo encontrado.</Text>}
                                />
                            )}

                            <TouchableOpacity onPress={() => { setShowAddItemFilho(false); setPendingFilho(null); setQtdUso(''); }} style={styles.closeLink}>
                                <Text style={styles.closeLinkText}>CANCELAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </Modal>

            <ConfirmModal
                visible={confirmVisible}
                title="Excluir Item"
                message="Deseja prosseguir com a exclusão deste item do catálogo?"
                confirmText="Excluir"
                isDestructive={true}
                onCancel={() => { setConfirmVisible(false); setItemToDelete(null); }}
                onConfirm={confirmDelete}
            />
        </View>
    );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.07 },

    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20, paddingBottom: 15 },
    backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 0.3 },
    headerSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    scanBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
    addBtnHeader: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },

    searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 10 },
    searchInput: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '600' },

    filterScroll: { maxHeight: 48, paddingLeft: 20 },
    filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginRight: 8 },
    filterChipText: { color: '#6B7280', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    listContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginTop: 18, marginBottom: 10, borderLeftWidth: 3 },
    sectionTitle: { fontWeight: '900', fontSize: 11, letterSpacing: 1.5, flex: 1 },
    sectionCount: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    sectionCountText: { fontSize: 10, fontWeight: '900' },

    itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderTopColor: 'rgba(255,255,255,0.1)', gap: 12 },
    itemIconBox: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    itemCode: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 2 },
    itemName: { color: '#FFF', fontSize: 14, fontWeight: '900' },
    tagsRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
    unitTag: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    unitTagText: { color: '#9CA3AF', fontSize: 10, fontWeight: '900' },
    miniTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
    miniTagText: { fontSize: 9, fontWeight: '900' },
    cardActions: { gap: 8 },
    editBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(52,211,153,0.1)', justifyContent: 'center', alignItems: 'center' },
    deleteBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center' },

    emptyBox: { alignItems: 'center', paddingVertical: 50 },
    emptyRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: 'rgba(139,92,246,0.2)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 8 },
    emptyDesc: { color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 20 },
    emptyBtn: { marginTop: 20, backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
    emptyBtnText: { color: '#8B5CF6', fontWeight: '900', fontSize: 13 },

    // EDITOR
    editorScroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },
    fieldLabel: { color: '#6B7280', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8, marginTop: 18 },
    input: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, color: '#FFF', fontSize: 15, fontWeight: '700' },
    catSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 14, borderWidth: 1, gap: 12 },
    catSelectorIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    catSelectorLabel: { fontSize: 15, fontWeight: '900' },
    catSelectorSub: { color: '#6B7280', fontSize: 11, marginTop: 2 },
    unidadeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    unidadeChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    unidadeText: { color: '#6B7280', fontSize: 13, fontWeight: '900' },
    extraCard: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 16, borderWidth: 1, marginTop: 8 },
    extraCardTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12 },
    standardsBtn: { backgroundColor: '#8B5CF6', paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, height: 56 },
    standardsBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
    toggleChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    toggleChipText: { color: '#6B7280', fontSize: 11, fontWeight: '900' },
    cancelBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    cancelBtnText: { color: '#9CA3AF', fontWeight: '900', fontSize: 13 },
    saveBtn: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
    saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 14, gap: 10 },
    saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },

    // CATEGORY GRID
    catGrid: { padding: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    catGridItem: { width: '47%', padding: 20, borderRadius: 18, alignItems: 'center', borderWidth: 1 },
    catGridIcon: { width: 58, height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    catGridLabel: { fontSize: 12, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 },

    // STANDARDS MODAL
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
    miniModalCard: { backgroundColor: '#111827', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    miniModalTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', marginBottom: 16 },
    stdItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    stdItemTitle: { color: '#D1FAE5', fontSize: 14, fontWeight: '600' },
    stdItemVal: { color: '#8B5CF6', fontSize: 14, fontWeight: '900' },
    closeLink: { alignItems: 'center', paddingVertical: 14 },
    closeLinkText: { color: '#6B7280', fontWeight: '900', fontSize: 12, letterSpacing: 1 },

    // RECIPE MODAL
    recipeParentBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, backgroundColor: 'rgba(139,92,246,0.08)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', marginBottom: 10 },
    recipeParentText: { color: '#9CA3AF', fontSize: 13, fontWeight: '700' },
    recipeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 12 },
    recipeRowIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.1)', justifyContent: 'center', alignItems: 'center' },
    recipeRowName: { color: '#FFF', fontSize: 14, fontWeight: '900' },
    recipeRowQty: { color: '#8B5CF6', fontSize: 11, marginTop: 3, fontWeight: '700' },
    recipeDelBtn: { padding: 6 },
    recipeFooter: { padding: 20 },

    // BOTTOM SHEET
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
    bottomSheet: { width: '90%', maxWidth: 500, alignSelf: 'center', backgroundColor: '#0D1711', borderRadius: 32, padding: 24, maxHeight: '85%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderTopColor: 'rgba(255,255,255,0.15)' },
    sheetHandle: { display: 'none' },
    sheetTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 16 },
    insumoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    insumoRowText: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '700' },
    insumoRowUnit: { color: '#8B5CF6', fontSize: 12, fontWeight: '900' },
    qtdBox: { backgroundColor: 'rgba(139,92,246,0.05)', borderRadius: 14, padding: 16, marginVertical: 12, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
    qtdLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '700' },
});

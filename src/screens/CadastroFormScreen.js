/**
 * CadastroFormScreen.js — AgroGB OS: Cadastro de Produtos & Insumos
 * UI: Dark Farm Glassmorphism Premium
 * Lógica: 100% preservada (banco, rascunho, validação)
 */

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Alert, Platform, UIManager, TextInput, Switch,
    SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DB from '../database/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const UNIDADES = [
    { key: 'KG', icon: 'scale' },
    { key: 'LT', icon: 'beaker' },
    { key: 'CX', icon: 'cube' },
    { key: 'SC', icon: 'bag' },
    { key: 'UN', icon: 'apps' },
    { key: 'M', icon: 'resize' },
    { key: 'HA', icon: 'map' },
    { key: 'CBC', icon: 'layers' },
];

const CATEGORIAS_TIPOS = [
    { key: 'PRODUTO',    label: 'Produto',     icon: 'basket',      color: '#F59E0B' },
    { key: 'INSUMO',     label: 'Insumo',      icon: 'flask',       color: '#8B5CF6' },
    { key: 'SEMENTE',    label: 'Semente',     icon: 'leaf',        color: '#10B981' },
    { key: 'EMBALAGEM',  label: 'Embalagem',   icon: 'cube-outline',color: '#60A5FA' },
    { key: 'FERRAMENTA', label: 'Ferramenta',  icon: 'construct',   color: '#F87171' },
    { key: 'CULTURA',    label: 'Cultura',     icon: 'nutrition',   color: '#34D399' },
];

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function CadastroFormScreen({ route, navigation }) {
    const { tipo = 'PRODUTO', title = 'Novo Cadastro' } = route?.params || {};
    const [loading, setLoading] = useState(false);

    // Form State (100% original mantido)
    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState(tipo);
    const [unidade, setUnidade] = useState('UN');
    const [codigo, setCodigo] = useState('');
    const [qtdInicial, setQtdInicial] = useState('0');
    const [valor, setValor] = useState('0');
    const [estoqueMinimo, setEstoqueMinimo] = useState('10');
    const [vendavel, setVendavel] = useState(tipo === 'PRODUTO');
    const [estocavel, setEstocavel] = useState(true);
    const [obs, setObs] = useState('');

    const DRAFT_KEY = `@draft_CadastroFormScreen_${tipo}`;

    // Rascunho - Recuperação (original)
    useEffect(() => {
        const checkDraft = async () => {
            try {
                const saved = await AsyncStorage.getItem(DRAFT_KEY);
                if (saved) {
                    Alert.alert(
                        'Rascunho Encontrado',
                        'Existe um formulário não finalizado. Deseja continuá-lo?',
                        [
                            { text: 'Descartar', style: 'destructive', onPress: () => AsyncStorage.removeItem(DRAFT_KEY) },
                            {
                                text: 'Continuar', onPress: () => {
                                    const draft = JSON.parse(saved);
                                    setNome(draft.nome || '');
                                    setUnidade(draft.unidade || 'UN');
                                    setQtdInicial(draft.qtdInicial || '0');
                                    setValor(draft.valor || '0');
                                    setObs(draft.obs || '');
                                }
                            }
                        ]
                    );
                }
            } catch { }
        };
        setTimeout(checkDraft, 600);
    }, [tipo]);

    // Rascunho - Auto-Save (original)
    useEffect(() => {
        const saveDraft = async () => {
            if (nome) {
                await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ nome, unidade, qtdInicial, valor, obs }));
            } else {
                await AsyncStorage.removeItem(DRAFT_KEY);
            }
        };
        const timer = setTimeout(saveDraft, 1000);
        return () => clearTimeout(timer);
    }, [nome, unidade, qtdInicial, valor, obs]);

    const [fotoPrincipal] = useState(null);
    const [fotoRotulo] = useState(null);

    const safeNum = (val, fallback = 0) => {
        const p = parseFloat(val);
        return isNaN(p) ? fallback : p;
    };

    // handleSave (100% original mantido)
    const handleSave = async () => {
        if (!nome || !nome.trim()) {
            return Alert.alert('Atenção', 'Informe o nome do item.');
        }
        if (!unidade || !unidade.trim()) {
            return Alert.alert('Atenção', 'Selecione a unidade de medida.');
        }

        setLoading(true);
        try {
            const sanitizedNome = nome.trim() || 'SEM NOME';
            const baseObj = {
                uuid: uuidv4(),
                nome: sanitizedNome,
                tipo: categoria || 'INDIFERENTE',
                unidade: unidade || 'UN',
                fator_conversao: 1,
                observacao: obs ? obs.trim() : '',
                vendavel: vendavel ? 1 : 0,
                estocavel: estocavel ? 1 : 0,
                principio_ativo: '',
                classe_toxicologica: '',
                composicao: '',
                codigo: codigo ? codigo.trim().toUpperCase() : '',
                preco_venda: safeNum(valor, 0),
                estoque_minimo: safeNum(estoqueMinimo, 10),
            };

            if (tipo === 'CULTURA') {
                if (typeof DB.insertCultura === 'function') {
                    await DB.insertCultura({ uuid: baseObj.uuid, nome: baseObj.nome, observacao: baseObj.observacao });
                } else {
                    const { executeQuery } = require('../database/core');
                    const now = new Date().toISOString();
                    await executeQuery(
                        `INSERT INTO culturas (uuid, nome, observacao, last_updated) VALUES (?, ?, ?, ?)`,
                        [baseObj.uuid, baseObj.nome, baseObj.observacao, now]
                    );
                }
            } else {
                if (typeof DB.insertCadastro === 'function') {
                    await DB.insertCadastro(baseObj);
                } else {
                    throw new Error('Função de banco não importada.');
                }
            }

            if (fotoPrincipal || fotoRotulo) {
                try {
                    if (typeof DB.insertCadastroMidia === 'function') {
                        if (fotoPrincipal) await DB.insertCadastroMidia(baseObj.uuid, fotoPrincipal, 'PRINCIPAL');
                        if (fotoRotulo) await DB.insertCadastroMidia(baseObj.uuid, fotoRotulo, 'ROTULO');
                    }
                } catch (imgError) { }
            }

            await AsyncStorage.removeItem(DRAFT_KEY);

            if (vendavel) {
                Alert.alert(
                    '✅ Cadastrado!',
                    'Deseja configurar a composição (receita) deste produto agora?',
                    [
                        { text: 'Não', onPress: () => navigation.goBack() },
                        { text: 'Sim', onPress: () => navigation.navigate('Cadastro', { openRecipeFor: baseObj.uuid, itemName: baseObj.nome }) }
                    ]
                );
            } else {
                Alert.alert('✅ Pronto!', 'Salvo com sucesso.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            }
        } catch (error) {
            Alert.alert('Erro', error.message || 'Falha ao salvar dados.');
        } finally {
            setLoading(false);
        }
    };

    const catInfo = CATEGORIAS_TIPOS.find(c => c.key === categoria) || CATEGORIAS_TIPOS[0];

    // ── RENDER ─────────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <LinearGradient colors={['#050B08', '#0A120E', '#030504']} style={StyleSheet.absoluteFill} />
            <View style={[styles.orb, { backgroundColor: catInfo.color, top: -80, right: -80 }]} />

            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <SafeAreaView style={{ flex: 1 }}>
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={22} color="#D1FAE5" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>{title}</Text>
                        <Text style={styles.headerSub}>AgroGB OS — Cadastro de Item</Text>
                    </View>
                    <View style={{ width: 42 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* ── SEÇÃO 1: IDENTIFICAÇÃO ──────────────────────────── */}
                    <View style={styles.sectionStrip}>
                        <View style={[styles.sectionDot, { backgroundColor: catInfo.color }]} />
                        <Text style={[styles.sectionLabel, { color: catInfo.color }]}>IDENTIFICAÇÃO</Text>
                    </View>

                    <View style={styles.card}>
                        {/* Nome */}
                        <Text style={styles.fieldLabel}>
                            <Ionicons name="create-outline" size={12} color="#6B7280" /> NOME DO ITEM *
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={nome}
                            onChangeText={t => setNome(t.toUpperCase())}
                            placeholder="Ex: Milho Premium, NPK 10-10-10..."
                            placeholderTextColor="#374151"
                        />

                        {/* Código */}
                        <Text style={styles.fieldLabel}>
                            <Ionicons name="barcode-outline" size={12} color="#6B7280" /> CÓDIGO (OPCIONAL)
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={codigo}
                            onChangeText={t => setCodigo(t.toUpperCase())}
                            placeholder="EMB-001, PRD-002..."
                            placeholderTextColor="#374151"
                        />

                        {/* Categoria */}
                        <Text style={styles.fieldLabel}>
                            <Ionicons name="apps-outline" size={12} color="#6B7280" /> CATEGORIA / TIPO *
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                            {CATEGORIAS_TIPOS.map(cat => (
                                <TouchableOpacity
                                    key={cat.key}
                                    style={[
                                        styles.catChip,
                                        categoria === cat.key && { backgroundColor: cat.color + '20', borderColor: cat.color + '60' }
                                    ]}
                                    onPress={() => setCategoria(cat.key)}
                                >
                                    <Ionicons name={cat.icon} size={14} color={categoria === cat.key ? cat.color : '#6B7280'} />
                                    <Text style={[styles.catChipText, categoria === cat.key && { color: cat.color }]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Unidade de medida */}
                        <Text style={styles.fieldLabel}>
                            <Ionicons name="scale-outline" size={12} color="#6B7280" /> UNIDADE DE MEDIDA *
                        </Text>
                        <View style={styles.unidadeGrid}>
                            {UNIDADES.map(u => (
                                <TouchableOpacity
                                    key={u.key}
                                    style={[
                                        styles.unidadeBtn,
                                        unidade === u.key && { backgroundColor: catInfo.color + '20', borderColor: catInfo.color + '60' }
                                    ]}
                                    onPress={() => setUnidade(u.key)}
                                >
                                    <Text style={[styles.unidadeBtnText, unidade === u.key && { color: catInfo.color }]}>
                                        {u.key}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* ── SEÇÃO 2: VALORES & ESTOQUE ──────────────────────── */}
                    {tipo !== 'CULTURA' && (
                        <>
                            <View style={styles.sectionStrip}>
                                <View style={[styles.sectionDot, { backgroundColor: '#F59E0B' }]} />
                                <Text style={[styles.sectionLabel, { color: '#F59E0B' }]}>CUSTO E ESTOQUE</Text>
                            </View>

                            <View style={styles.card}>
                                <View style={styles.rowGrid}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.fieldLabel}>PREÇO CUSTO (R$)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={valor}
                                            onChangeText={setValor}
                                            keyboardType="decimal-pad"
                                            placeholder="0,00"
                                            placeholderTextColor="#374151"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.fieldLabel}>ESTOQUE INICIAL</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={qtdInicial}
                                            onChangeText={setQtdInicial}
                                            keyboardType="decimal-pad"
                                            placeholder="0"
                                            placeholderTextColor="#374151"
                                        />
                                    </View>
                                </View>

                                <Text style={styles.fieldLabel}>ESTOQUE MÍNIMO (alerta)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={estoqueMinimo}
                                    onChangeText={setEstoqueMinimo}
                                    keyboardType="decimal-pad"
                                    placeholder="10"
                                    placeholderTextColor="#374151"
                                />
                                <Text style={styles.fieldHint}>
                                    <Ionicons name="information-circle-outline" size={11} color="#6B7280" /> 
                                    {' '}Abaixo deste valor, o item aparecerá no alerta de estoque crítico.
                                </Text>
                            </View>
                        </>
                    )}

                    {/* ── SEÇÃO 3: COMPORTAMENTO ──────────────────────────── */}
                    <View style={styles.sectionStrip}>
                        <View style={[styles.sectionDot, { backgroundColor: '#60A5FA' }]} />
                        <Text style={[styles.sectionLabel, { color: '#60A5FA' }]}>COMPORTAMENTO DO ITEM</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.toggleRow}>
                            <View style={[styles.toggleIconBox, { backgroundColor: '#10B981' + '15' }]}>
                                <Ionicons name="cube" size={18} color="#10B981" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.toggleLabel}>CONTROLA ESTOQUE</Text>
                                <Text style={styles.toggleSub}>Pode ser comprado e armazenado no armazém</Text>
                            </View>
                            <Switch
                                value={estocavel}
                                onValueChange={setEstocavel}
                                trackColor={{ true: '#10B981', false: '#374151' }}
                                thumbColor={estocavel ? '#34D399' : '#9CA3AF'}
                            />
                        </View>

                        <View style={[styles.separator]} />

                        <View style={styles.toggleRow}>
                            <View style={[styles.toggleIconBox, { backgroundColor: '#F59E0B' + '15' }]}>
                                <Ionicons name="cash" size={18} color="#F59E0B" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.toggleLabel}>PERMITIR VENDAS</Text>
                                <Text style={styles.toggleSub}>Aparecerá na tela "Registrar Venda"</Text>
                            </View>
                            <Switch
                                value={vendavel}
                                onValueChange={setVendavel}
                                trackColor={{ true: '#F59E0B', false: '#374151' }}
                                thumbColor={vendavel ? '#FCD34D' : '#9CA3AF'}
                            />
                        </View>
                    </View>

                    {/* ── SEÇÃO 4: OBSERVAÇÕES ────────────────────────────── */}
                    <View style={styles.sectionStrip}>
                        <View style={[styles.sectionDot, { backgroundColor: '#9CA3AF' }]} />
                        <Text style={[styles.sectionLabel, { color: '#9CA3AF' }]}>NOTAS (OPCIONAL)</Text>
                    </View>
                    <View style={styles.card}>
                        <TextInput
                            style={[styles.input, { height: 90, textAlignVertical: 'top', paddingTop: 14 }]}
                            value={obs}
                            onChangeText={setObs}
                            placeholder="Fabricante, composição, instruções, prazo de validade..."
                            placeholderTextColor="#374151"
                            multiline
                        />
                    </View>

                    {/* ── BOTÃO SALVAR ──────────────────────────────────────── */}
                    <TouchableOpacity style={[styles.saveBtn, { shadowColor: catInfo.color }]} onPress={handleSave}>
                        <LinearGradient
                            colors={[catInfo.color, catInfo.color + '80']}
                            style={styles.saveGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                                    <Text style={styles.saveBtnText}>SALVAR CADASTRO</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 60 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

// ── STYLES ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.08 },

    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20, paddingBottom: 15 },
    backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 0.3 },
    headerSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },

    scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 80 },

    // SECTION STRIP
    sectionStrip: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 8 },
    sectionDot: { width: 4, height: 18, borderRadius: 2 },
    sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },

    // CARD
    card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderTopColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },

    // FIELDS
    fieldLabel: { color: '#6B7280', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8, marginTop: 14 },
    fieldHint: { color: '#4B5563', fontSize: 11, marginTop: 6, lineHeight: 16 },
    input: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, color: '#FFF', fontSize: 15, fontWeight: '700' },

    // CATEGORIA CHIPS
    catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginRight: 8 },
    catChipText: { color: '#6B7280', fontSize: 12, fontWeight: '800' },

    // UNIDADE GRID
    unidadeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    unidadeBtn: { minWidth: '22%', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center' },
    unidadeBtnText: { color: '#6B7280', fontSize: 13, fontWeight: '900' },

    // ROW
    rowGrid: { flexDirection: 'row', gap: 12 },

    // TOGGLE
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    toggleIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    toggleLabel: { color: '#FFF', fontSize: 13, fontWeight: '900' },
    toggleSub: { color: '#6B7280', fontSize: 11, marginTop: 2 },
    separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },

    // SAVE
    saveBtn: { shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12, marginTop: 10 },
    saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 18, gap: 12, borderWidth: 1, borderTopColor: 'rgba(255,255,255,0.3)' },
    saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
});

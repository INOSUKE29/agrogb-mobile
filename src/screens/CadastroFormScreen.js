import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Modal, FlatList, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as DB from '../database/database';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CadastroFormScreen({ route, navigation }) {
    const { tipo, title } = route.params || { tipo: 'PRODUTO', title: 'Novo Cadastro' };
    const [loading, setLoading] = useState(false);

    // VISIBILIDADE CAMPO
    const [mostrarAvancado, setMostrarAvancado] = useState(false);

    // SEÇÃO 1 - DADOS OBRIGATÓRIOS
    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState(tipo);
    const [unidade, setUnidade] = useState('UN');
    const [qtdInicial, setQtdInicial] = useState('0');
    const [valor, setValor] = useState('0');

    // CONFIGURAÇÕES MODERN TOGGLES
    const [vendavel, setVendavel] = useState(tipo === 'PRODUTO');
    const [estocavel, setEstocavel] = useState(true);

    // SEÇÃO 2 - DADOS TÉCNICOS (OPCIONAL)
    const [principioA, setPrincipioA] = useState('');
    const [classeT, setClasseT] = useState('');
    const [conteudoE, setConteudoE] = useState('1');
    const [composicao, setComposicao] = useState('');
    const [obs, setObs] = useState('');

    // SISTEMA DE COMPOSIÇÃO (RECEITAS)
    const [composicaoAberta, setComposicaoAberta] = useState(false);
    const [itemComponents, setItemComponents] = useState([]);

    // Modal Seleção Cadastro
    const [modalVisible, setModalVisible] = useState(false);
    const [catalogo, setCatalogo] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [qtdComponente, setQtdComponente] = useState('1');
    const [itemSelecionado, setItemSelecionado] = useState(null);

    useEffect(() => { loadCatalogo(); }, []);

    const loadCatalogo = async () => {
        try {
            if (typeof DB.getCadastro === 'function') {
                const data = await DB.getCadastro();
                setCatalogo(data);
            }
        } catch (e) { console.log(e); }
    };

    // SEÇÃO 3 - IMAGENS (100% OPCIONAL)
    const [fotoPrincipal, setFotoPrincipal] = useState(null);
    const [fotoRotulo, setFotoRotulo] = useState(null);

    const safeNum = (val, fallback = 0) => {
        const p = parseFloat(val);
        return isNaN(p) ? fallback : p;
    };

    const getImg = async (setter) => {
        try {
            const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
            if (!res.canceled) setter(res.assets[0].uri);
        } catch (e) {
            console.warn('[AgroGB] Falha na imagem:', e);
        }
    };

    const handleSave = async () => {
        // Validação Estrita 1: Campos Obrigatórios
        if (!nome || !nome.trim()) {
            return Alert.alert('Atenção Produtor', 'Você precisa informar um Nome para o item.');
        }
        if (!unidade || !unidade.trim()) {
            return Alert.alert('Atenção Produtor', 'Como você mede isso? Informe se é KG, LT, Caixa, Seco, etc.');
        }

        setLoading(true);

        try {
            const sanitizedNome = nome.trim() || 'SEM NOME';
            const baseObj = {
                uuid: uuidv4(),
                nome: sanitizedNome,
                tipo: categoria || 'INDIFERENTE',
                unidade: unidade || 'UN',
                fator_conversao: safeNum(conteudoE, 1),
                observacao: obs ? obs.trim() : '',
                vendavel: vendavel ? 1 : 0,
                estocavel: estocavel ? 1 : 0,
                principio_ativo: principioA || '',
                classe_toxicologica: classeT || '',
                composicao: composicao || '',
                preco_venda: safeNum(valor, 0)
            };

            // Roteamento seguro de banco
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

            // SEÇÃO COMPOSIÇÃO: INSERIR RECEITAS NA BASE
            if (composicaoAberta && itemComponents.length > 0) {
                if (typeof DB.insertReceita === 'function') {
                    for (const comp of itemComponents) {
                        try {
                            await DB.insertReceita(baseObj.uuid, comp.uuid, comp.qtd);
                        } catch (e) { console.warn('Falha na receita:', e); }
                    }
                }
            }

            // SEÇÃO 3: IMAGENS APÓS SALVAR (Tudo Seguro)
            if (fotoPrincipal || fotoRotulo) {
                try {
                    if (typeof DB.insertCadastroMidia === 'function') {
                        if (fotoPrincipal) await DB.insertCadastroMidia(baseObj.uuid, fotoPrincipal, 'PRINCIPAL');
                        if (fotoRotulo) await DB.insertCadastroMidia(baseObj.uuid, fotoRotulo, 'ROTULO');
                    }
                } catch (imgError) {
                    console.log('[AgroGB] Falha silenciosa imagem:', imgError);
                }
            }

            Alert.alert('Pronto!', 'Salvo com sucesso.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

        } catch (error) {
            console.error('[AgroGB] Detalhe Crítico:', error);
            Alert.alert('Erro', error.message || 'Falha ao salvar dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComposicao = () => {
        Alert.alert(
            'Atenção',
            'TEM CERTEZA QUE DESEJA INCLUIR UMA COMPOSIÇÃO PARA ESTE ITEM?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sim, configurar',
                    onPress: () => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setComposicaoAberta(true);
                    }
                }
            ]
        );
    };

    const confirmComponent = () => {
        if (!itemSelecionado) return Alert.alert('Aviso', 'Selecione um item do catálogo.');
        const q = parseFloat(qtdComponente);
        if (isNaN(q) || q <= 0) return Alert.alert('Aviso', 'Quantidade inválida.');

        const novo = {
            id: uuidv4(),
            uuid: itemSelecionado.uuid,
            nome: itemSelecionado.nome,
            unidade: itemSelecionado.unidade,
            qtd: q
        };

        setItemComponents([...itemComponents, novo]);
        setModalVisible(false);
        setItemSelecionado(null);
        setQtdComponente('1');
    };

    const removeComponent = (id) => {
        setItemComponents(itemComponents.filter(c => c.id !== id));
    };

    const getFilteredCatalogo = () => {
        if (!searchText) return catalogo;
        return catalogo.filter(c => c.nome.toUpperCase().includes(searchText.toUpperCase()));
    };

    <View style={styles.container}>
        <LinearGradient colors={['#1E8E5A', '#34A853']} style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
                <Ionicons name="arrow-back" size={26} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title.toUpperCase()}</Text>
            <View style={{ width: 36 }} />
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
            {/* BLOCO 1 - IDENTIFICAÇÃO */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>IDENTIFICAÇÃO PRINCIPAL</Text>
                <View style={styles.divider} />

                <Text style={styles.label}>NOME DO ITEM *</Text>
                <TextInput style={styles.inputGrande} value={nome} onChangeText={t => setNome(t.toUpperCase())} placeholder="Ex: Milho Premium" />

                <Text style={styles.label}>CATEGORIA / TIPO *</Text>
                <TextInput style={styles.input} value={categoria} onChangeText={t => setCategoria(t.toUpperCase())} placeholder="Ex: INSUMO" />

                <Text style={styles.label}>UNIDADE DE MEDIDA *</Text>
                <View style={styles.segmentContainer}>
                    {['KG', 'LT', 'CX', 'SC', 'UN'].map((u) => (
                        <TouchableOpacity
                            key={u}
                            style={[styles.segmentBtn, unidade === u && styles.segmentBtnActive]}
                            onPress={() => setUnidade(u)}
                        >
                            <Text style={[styles.segmentTxt, unidade === u && styles.segmentTxtActive]}>{u}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* BLOCO 2 - DADOS DE EMBALAGEM E VALORES */}
            {tipo !== 'CULTURA' && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>CUSTO E EMBALAGEM</Text>
                    <View style={styles.divider} />

                    <View style={{ flexDirection: 'row', gap: 15 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>PREÇO (R$)</Text>
                            <TextInput style={styles.input} value={valor} onChangeText={setValor} keyboardType="numeric" placeholder="0.00" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>ESTOQUE INICIAL</Text>
                            <TextInput style={styles.input} value={qtdInicial} onChangeText={setQtdInicial} keyboardType="numeric" placeholder="0" />
                        </View>
                    </View>
                </View>
            )}

            {/* BLOCO 3 - CONFIGURAÇÕES OBRIGATÓRIAS */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>COMPORTAMENTO DO ITEM</Text>
                <View style={styles.divider} />

                <View style={styles.toggleRow}>
                    <View>
                        <Text style={styles.toggleLabel}>CONTROLA ESTOQUE</Text>
                        <Text style={styles.toggleSub}>Pode ser comprado e armazenado</Text>
                    </View>
                    <TouchableOpacity style={[styles.toggleBtn, estocavel && styles.toggleBtnActive]} onPress={() => setEstocavel(!estocavel)}>
                        <View style={[styles.toggleCircle, estocavel && styles.toggleCircleActive]} />
                    </TouchableOpacity>
                </View>

                <View style={styles.toggleRow}>
                    <View>
                        <Text style={styles.toggleLabel}>PERMITIR VENDAS</Text>
                        <Text style={styles.toggleSub}>Aparecerá na tela Registrar Venda</Text>
                    </View>
                    <TouchableOpacity style={[styles.toggleBtn, vendavel && styles.toggleBtnActive]} onPress={() => setVendavel(!vendavel)}>
                        <View style={[styles.toggleCircle, vendavel && styles.toggleCircleActive]} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* BLOCO 4 - SISTEMA DE COMPOSIÇÃO */}
            {!composicaoAberta ? (
                <TouchableOpacity style={styles.addComposicaoBtn} onPress={handleAddComposicao}>
                    <Ionicons name="git-merge-outline" size={20} color="#1E8E5A" style={{ marginRight: 8 }} />
                    <Text style={styles.addComposicaoTxt}>+ ADICIONAR COMPOSIÇÃO</Text>
                </TouchableOpacity>
            ) : (
                <View style={[styles.card, { borderColor: '#1E8E5A', borderWidth: 2 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.sectionTitle, { color: '#1E8E5A' }]}>SISTEMA DE COMPOSIÇÃO</Text>
                        <TouchableOpacity onPress={() => {
                            setComposicaoAberta(false);
                            setItemComponents([]);
                        }}>
                            <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.divider} />

                    <Text style={[styles.label, { marginBottom: 15 }]}>Itens exigidos ao vender 1 unidade deste produto:</Text>

                    {itemComponents.map((c) => (
                        <View key={c.id} style={styles.compItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.compNome}>{c.nome}</Text>
                                <Text style={styles.compDetalhe}>Baixa: {c.qtd} {c.unidade} por venda</Text>
                            </View>
                            <TouchableOpacity onPress={() => removeComponent(c.id)} style={{ padding: 5 }}>
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.addCptBtn} onPress={() => setModalVisible(true)}>
                        <Text style={styles.addCptTxt}>+ Adicionar Componente</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* BOTÃO SALVAR */}
            <TouchableOpacity
                style={[styles.saveBtnGigante, loading && { backgroundColor: '#9CA3AF' }]}
                onPress={handleSave}
                disabled={loading}
            >
                {loading ? <ActivityIndicator size="large" color="#FFF" /> : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="checkmark-circle" size={26} color="#FFF" style={{ marginRight: 10 }} />
                        <Text style={styles.saveBtnTxtGigante}>SALVAR CADASTRO</Text>
                    </View>
                )}
            </TouchableOpacity>
            <View style={{ height: 50 }} />
        </ScrollView>

        {/* MODAL CATÁLOGO */}
        <Modal visible={modalVisible} transparent={true} animationType="slide">
            <View style={styles.modalBg}>
                <View style={styles.modalCard}>
                    {itemSelecionado ? (
                        <View>
                            <Text style={styles.modalTitle}>Quantidade Exigida</Text>
                            <Text style={styles.modalSub}>Quantos <Text style={{ fontWeight: 'bold' }}>{itemSelecionado.unidade}</Text> de {itemSelecionado.nome} usa?</Text>
                            <TextInput
                                style={styles.inputGrande}
                                keyboardType="numeric"
                                value={qtdComponente}
                                onChangeText={setQtdComponente}
                                autoFocus
                            />
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#9CA3AF' }]} onPress={() => setItemSelecionado(null)}>
                                    <Text style={styles.modalBtnTxt}>Voltar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1E8E5A' }]} onPress={confirmComponent}>
                                    <Text style={styles.modalBtnTxt}>Confirmar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modalTitle}>Vincular Insumo / Item</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Buscar item..."
                                value={searchText}
                                onChangeText={setSearchText}
                            />
                            <FlatList
                                data={getFilteredCatalogo().filter(c => !itemComponents.some(ic => ic.uuid === c.uuid))}
                                keyExtractor={i => i.uuid}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.catItem} onPress={() => setItemSelecionado(item)}>
                                        <Text style={styles.catNome}>{item.nome}</Text>
                                        <Text style={styles.catUnidade}>{item.unidade}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                            <TouchableOpacity style={styles.modalClsBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalClsTxt}>Fechar</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    </View>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7F9' },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', letterSpacing: 0.5 },

    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
    sectionTitle: { fontSize: 13, fontWeight: '900', color: '#6B7280', letterSpacing: 0.5 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

    label: { fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 6 },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, fontSize: 16, color: '#1F2937', marginBottom: 15 },
    inputGrande: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 15 },

    segmentContainer: { flexDirection: 'row', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, overflow: 'hidden', marginBottom: 5 },
    segmentBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#FFF', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
    segmentBtnActive: { backgroundColor: '#1E8E5A' },
    segmentTxt: { fontSize: 13, fontWeight: 'bold', color: '#6B7280' },
    segmentTxtActive: { color: '#FFF' },

    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
    toggleLabel: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
    toggleSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    toggleBtn: { width: 50, height: 28, borderRadius: 15, backgroundColor: '#E5E7EB', padding: 2, justifyContent: 'center' },
    toggleBtnActive: { backgroundColor: '#34A853' },
    toggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
    toggleCircleActive: { transform: [{ translateX: 22 }] },

    addComposicaoBtn: { flexDirection: 'row', backgroundColor: '#ECFDF5', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#A7F3D0', marginBottom: 20 },
    addComposicaoTxt: { color: '#1E8E5A', fontWeight: 'bold', fontSize: 14 },

    compItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
    compNome: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
    compDetalhe: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    addCptBtn: { alignItems: 'center', padding: 12, marginTop: 5 },
    addCptTxt: { color: '#1A73E8', fontWeight: 'bold', fontSize: 14 },

    saveBtnGigante: { backgroundColor: '#1E8E5A', padding: 20, borderRadius: 16, alignItems: 'center', elevation: 4, shadowColor: '#1E8E5A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    saveBtnTxtGigante: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 5 },
    modalSub: { fontSize: 14, color: '#6B7280', marginBottom: 15 },
    modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
    modalBtnTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
    catItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    catNome: { fontSize: 15, fontWeight: 'bold', color: '#374151' },
    catUnidade: { fontSize: 13, color: '#9CA3AF' },
    modalClsBtn: { marginTop: 15, padding: 12, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10 },
    modalClsTxt: { color: '#4B5563', fontWeight: 'bold' }
});

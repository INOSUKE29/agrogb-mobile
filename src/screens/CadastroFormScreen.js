import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Modal, FlatList, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as DB from '../database/database';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CadastroFormScreen({ route, navigation }) {
    const { colors } = useTheme();
    const { tipo, title } = route.params || { tipo: 'PRODUTO', title: 'Novo Cadastro' };
    const [loading, setLoading] = useState(false);

    // VISIBILIDADE CAMPO
    const [mostrarAvancado, setMostrarAvancado] = useState(false);

    // SEÇÃO 1 - DADOS OBRIGATÓRIOS
    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState(tipo);
    const [unidade, setUnidade] = useState('UN');
    const [codigo, setCodigo] = useState('');
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


    const DRAFT_KEY = `@draft_CadastroFormScreen_${tipo}`;

    // Rascunho - Recuperação
    useEffect(() => {
        const checkDraft = async () => {
            try {
                const saved = await AsyncStorage.getItem(DRAFT_KEY);
                if (saved) {
                    Alert.alert(
                        'Rascunho de Cadastro',
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
            } catch (e) { console.log('Draft error:', e); }
        };
        setTimeout(checkDraft, 600);
    }, [tipo]);

    // Rascunho - Auto-Save
    useEffect(() => {
        const saveDraft = async () => {
            if (nome) {
                await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ nome, unidade, qtdInicial, valor, obs }));
            } else if (!nome) {
                await AsyncStorage.removeItem(DRAFT_KEY);
            }
        };
        const timer = setTimeout(saveDraft, 1000);
        return () => clearTimeout(timer);
    }, [nome, unidade, qtdInicial, valor, obs, tipo]);


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
                codigo: codigo ? codigo.trim().toUpperCase() : '',
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

            await AsyncStorage.removeItem(DRAFT_KEY);

            if (vendavel) {
                Alert.alert(
                    'Sucesso!',
                    'Item cadastrado com sucesso. Deseja configurar a composição (receita) deste produto agora?',
                    [
                        { text: 'Não', onPress: () => navigation.goBack() },
                        {
                            text: 'Sim',
                            onPress: () => {
                                navigation.navigate('Cadastro', { openRecipeFor: baseObj.uuid, itemName: baseObj.nome });
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Pronto!', 'Salvo com sucesso.', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }

        } catch (error) {
            console.error('[AgroGB] Detalhe Crítico:', error);
            Alert.alert('Erro', error.message || 'Falha ao salvar dados.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <AppContainer>
            <ScreenHeader
                title={title.toUpperCase()}
                onBack={() => navigation.goBack()}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                {/* BLOCO 1 - IDENTIFICAÇÃO */}
                <GlowCard style={styles.card}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>IDENTIFICAÇÃO PRINCIPAL</Text>
                    <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />

                    <Text style={[styles.label, { color: colors.textMuted }]}>NOME DO ITEM *</Text>
                    <GlowInput
                        value={nome}
                        onChangeText={t => setNome(t.toUpperCase())}
                        placeholder="Ex: Milho Premium"
                    />

                    <Text style={[styles.label, { color: colors.textMuted }]}>CATEGORIA / TIPO *</Text>
                    <GlowInput
                        value={categoria}
                        onChangeText={t => setCategoria(t.toUpperCase())}
                        placeholder="Ex: INSUMO"
                    />

                    <Text style={[styles.label, { color: colors.textMuted }]}>CÓDIGO DE IDENTIFICAÇÃO (OPCIONAL)</Text>
                    <GlowInput
                        placeholder="Ex: EMB-001, PRD-002..."
                        value={codigo}
                        onChangeText={t => setCodigo(t.toUpperCase())}
                    />

                    <Text style={[styles.label, { color: colors.textMuted }]}>UNIDADE DE MEDIDA *</Text>
                    <View style={[styles.segmentContainer, { borderColor: colors.glassBorder }]}>
                        {['KG', 'LT', 'CX', 'SC', 'UNI', 'M', 'HA', 'CBC'].map((u) => (
                            <TouchableOpacity
                                key={u}
                                style={[styles.segmentBtn, { backgroundColor: colors.card, borderRightColor: colors.glassBorder }, unidade === u && { backgroundColor: colors.primary }]}
                                onPress={() => setUnidade(u)}
                            >
                                <Text style={[styles.segmentTxt, { color: colors.textSecondary, fontSize: u.length > 2 ? 10 : 12 }, unidade === u && { color: colors.textOnPrimary }]}>{u}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </GlowCard>

                {/* BLOCO 2 - DADOS DE EMBALAGEM E VALORES */}
                {tipo !== 'CULTURA' && (
                    <GlowCard style={styles.card}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CUSTO E EMBALAGEM</Text>
                        <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />

                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: colors.textMuted }]}>PREÇO (R$)</Text>
                                <GlowInput
                                    value={valor}
                                    onChangeText={setValor}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: colors.textMuted }]}>ESTOQUE INICIAL</Text>
                                <GlowInput
                                    value={qtdInicial}
                                    onChangeText={setQtdInicial}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>
                        </View>
                    </GlowCard>
                )}

                {/* BLOCO 3 - CONFIGURAÇÕES OBRIGATÓRIAS */}
                <GlowCard style={styles.card}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>COMPORTAMENTO DO ITEM</Text>
                    <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />

                    <View style={styles.toggleRow}>
                        <View>
                            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>CONTROLA ESTOQUE</Text>
                            <Text style={[styles.toggleSub, { color: colors.textMuted }]}>Pode ser comprado e armazenado</Text>
                        </View>
                        <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: colors.glassBorder }, estocavel && { backgroundColor: colors.primary }]} onPress={() => setEstocavel(!estocavel)}>
                            <View style={[styles.toggleCircle, estocavel && styles.toggleCircleActive]} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.toggleRow}>
                        <View>
                            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>PERMITIR VENDAS</Text>
                            <Text style={[styles.toggleSub, { color: colors.textMuted }]}>Aparecerá na tela Registrar Venda</Text>
                        </View>
                        <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: colors.glassBorder }, vendavel && { backgroundColor: colors.primary }]} onPress={() => setVendavel(!vendavel)}>
                            <View style={[styles.toggleCircle, vendavel && styles.toggleCircleActive]} />
                        </TouchableOpacity>
                    </View>
                </GlowCard>


                {/* BOTÃO SALVAR */}
                <PrimaryButton
                    title="SALVAR CADASTRO"
                    icon="checkmark-circle"
                    onPress={handleSave}
                    loading={loading}
                    style={{ marginTop: 10, height: 60 }}
                />
                <View style={{ height: 50 }} />
            </ScrollView>

        </AppContainer>
    );
}

const styles = StyleSheet.create({
    card: { marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    divider: { height: 1, marginVertical: 12 },
    label: { fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
    segmentContainer: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginBottom: 5 },
    segmentBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1 },
    segmentTxt: { fontSize: 13, fontWeight: 'bold' },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
    toggleLabel: { fontSize: 14, fontWeight: 'bold' },
    toggleSub: { fontSize: 12, marginTop: 2 },
    toggleBtn: { width: 50, height: 28, borderRadius: 15, padding: 2, justifyContent: 'center' },
    toggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
    toggleCircleActive: { transform: [{ translateX: 22 }] },
});

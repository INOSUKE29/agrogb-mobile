import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import * as ImagePicker from 'expo-image-picker';
import * as DB from '../database/database';

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

    // SEÇÃO 2 - DADOS TÉCNICOS (OPCIONAL)
    const [principioA, setPrincipioA] = useState('');
    const [classeT, setClasseT] = useState('');
    const [conteudoE, setConteudoE] = useState('1');
    const [composicao, setComposicao] = useState('');
    const [obs, setObs] = useState('');

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
                vendavel: tipo === 'PRODUTO' ? 1 : 0,
                estocavel: 1,
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

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 25 }}>
            <Text style={styles.topInfo}>PREENCHIMENTO RÁPIDO</Text>

            <Text style={styles.labelCampo}>NOME DO NOVO ITEM *</Text>
            <TextInput style={styles.inputGrande} value={nome} onChangeText={t => setNome(t.toUpperCase())} placeholder="Ex: Milho, Adubo, Trator" />

            <View style={{ flexDirection: 'row', gap: 15, marginBottom: 15 }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.labelCampo}>TIPO *</Text>
                    <TextInput style={styles.inputMedio} value={categoria} onChangeText={t => setCategoria(t.toUpperCase())} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.labelCampo}>UNIDADE *</Text>
                    <TextInput style={styles.inputMedio} value={unidade} onChangeText={t => setUnidade(t.toUpperCase())} placeholder="KG, LT, UN" />
                </View>
            </View>

            {tipo !== 'CULTURA' && (
                <View style={{ flexDirection: 'row', gap: 15, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.labelCampo}>PREÇO/CUSTO (R$)</Text>
                        <TextInput style={styles.inputGrande} value={valor} onChangeText={setValor} keyboardType="numeric" placeholder="R$ 0.00" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.labelCampo}>TEM EM ESTOQUE?</Text>
                        <TextInput style={styles.inputGrande} value={qtdInicial} onChangeText={setQtdInicial} keyboardType="numeric" placeholder="0" />
                    </View>
                </View>
            )}

            {/* BOTÃO PRINCIPAL GIGANTE PRA FACILITAR CLIQUE NO CAMPO */}
            <TouchableOpacity
                style={[styles.saveBtnGigante, loading && { backgroundColor: '#9CA3AF' }]}
                onPress={handleSave}
                disabled={loading}
            >
                {loading ? <ActivityIndicator size="large" color="#FFF" /> : <Text style={styles.saveBtnTxtGigante}>✔ SALVAR</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.avancadoBtn} onPress={() => setMostrarAvancado(!mostrarAvancado)}>
                <Text style={styles.avancadoTxt}>{mostrarAvancado ? 'Ocultar Detalhes Técnicos ▲' : 'Mostrar Mais Opções (Técnico / Fotos) ▼'}</Text>
            </TouchableOpacity>

            {mostrarAvancado && (
                <View style={styles.avancadoBox}>
                    <Text style={styles.sectionTitle}>DADOS TÉCNICOS ADICIONAIS</Text>

                    <Text style={styles.label}>PRINCÍPIO ATIVO</Text>
                    <TextInput style={styles.input} value={principioA} onChangeText={t => setPrincipioA(t.toUpperCase())} />

                    <Text style={styles.label}>CLASSE TOXICOLÓGICA</Text>
                    <TextInput style={styles.input} value={classeT} onChangeText={t => setClasseT(t.toUpperCase())} />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>CONTEÚDO (EMB)</Text>
                            <TextInput style={styles.input} value={conteudoE} onChangeText={setConteudoE} keyboardType="numeric" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>COMPOSIÇÃO NPK</Text>
                            <TextInput style={styles.input} value={composicao} onChangeText={t => setComposicao(t.toUpperCase())} />
                        </View>
                    </View>

                    <Text style={styles.label}>OBSERVAÇÕES ADICIONAIS</Text>
                    <TextInput style={[styles.input, { height: 80 }]} value={obs} onChangeText={t => setObs(t.toUpperCase())} multiline />

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>IMAGENS PÓS-CADASTRO (OPCIONAL)</Text>
                    <Text style={styles.infoText}>Não obrigatório. A inserção não cancela o salvamento em caso de falta de sinal local.</Text>

                    <View style={{ flexDirection: 'row', gap: 15, marginTop: 15 }}>
                        <TouchableOpacity style={styles.imgBox} onPress={() => getImg(setFotoPrincipal)}>
                            {fotoPrincipal ? <Image source={{ uri: fotoPrincipal }} style={styles.img} /> : <Ionicons name="camera-outline" size={30} color="#9CA3AF" />}
                            <Text style={styles.imgLbl}>FOTO PRINCIPAL</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.imgBox} onPress={() => getImg(setFotoRotulo)}>
                            {fotoRotulo ? <Image source={{ uri: fotoRotulo }} style={styles.img} /> : <Ionicons name="barcode-outline" size={30} color="#9CA3AF" />}
                            <Text style={styles.imgLbl}>BATER FOTO RÓTULO</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={{ height: 60 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    topInfo: { fontSize: 13, fontWeight: 'bold', color: '#10B981', marginBottom: 20 },
    labelCampo: { fontSize: 13, fontWeight: '900', color: '#374151', marginBottom: 8 },
    inputGrande: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#D1D5DB', borderRadius: 14, padding: 18, fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 },
    inputMedio: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, fontSize: 16, color: '#1F2937', marginBottom: 5 },

    saveBtnGigante: { backgroundColor: '#10B981', padding: 22, borderRadius: 16, alignItems: 'center', marginTop: 10, elevation: 3 },
    saveBtnTxtGigante: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 1 },

    avancadoBtn: { marginTop: 30, alignItems: 'center', padding: 15, backgroundColor: '#E5E7EB', borderRadius: 12 },
    avancadoTxt: { fontWeight: 'bold', color: '#4B5563', fontSize: 14 },
    avancadoBox: { marginTop: 20, backgroundColor: '#FFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },

    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#6B7280', marginBottom: 15 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 15 },
    label: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 6 },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginBottom: 15, color: '#374151', fontSize: 14 },
    infoText: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginBottom: 10 },

    imgBox: { flex: 1, backgroundColor: '#F9FAFB', height: 110, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    img: { width: '100%', height: '100%' },
    imgLbl: { fontSize: 9, color: '#1F2937', fontWeight: 'bold', marginTop: 8 }
});

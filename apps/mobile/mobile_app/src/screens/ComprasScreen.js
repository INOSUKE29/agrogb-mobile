import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions, StatusBar, SafeAreaView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCompra, getComprasRecentes, updateCompra, deleteCompra, executeQuery } from '../database/database';
import SmartAutocomplete from '../components/common/SmartAutocomplete';
import { ProductLibraryService, FornecedorLibraryService } from '../services/LibraryServices';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

// Design System
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

const { width } = Dimensions.get('window');

export default function ComprasScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    
    const [item, setItem] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valor, setValor] = useState('');
    const [cultura, setCultura] = useState('');
    const [observacao, setObservacao] = useState('');
    const [detalhes, setDetalhes] = useState('');
    const [fornecedor, setFornecedor] = useState({ uuid: '', nome: '' });
    const [editingUuid, setEditingUuid] = useState(null);
    const [history, setHistory] = useState([]);



    // Camera State
    const [hasPermission, setHasPermission] = useState(null);
    const [anexoUri, setAnexoUri] = useState(null);

    useFocusEffect(useCallback(() => {
        loadHistory();
    }, []));

    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);


    const loadHistory = async () => {
        const data = await getComprasRecentes();
        setHistory(data);
    };

    const anexarNota = async () => {
        try {
            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.5,
                allowsEditing: true,
                aspect: [3, 4],
            });
            if (!result.canceled) setAnexoUri(result.assets[0].uri);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível capturar a nota.');
        }
    };



    const salvar = async () => {
        if (!item || !quantidade || !valor) {
            Alert.alert('Alerta', 'Preencha os campos obrigatórios (*)');
            return;
        }

        const dados = {
            uuid: editingUuid || uuidv4(),
            item: item.toUpperCase(),
            quantidade: parseFloat(quantidade) || 0,
            valor: parseFloat(valor) || 0,
            cultura: (cultura || 'GERAL').toUpperCase(),
            detalhes: detalhes.toUpperCase(),
            fornecedor_uuid: fornecedor.uuid,
            observacao: (fornecedor.nome ? `FORNECEDOR: ${fornecedor.nome} | ` : '') + observacao.toUpperCase(),
            data: new Date().toISOString().split('T')[0],
            anexo: anexoUri
        };

        try {
            if (editingUuid) {
                await updateCompra(editingUuid, dados);
                Alert.alert('Sucesso', 'Registro atualizado.');
                setEditingUuid(null);
            } else {
                await insertCompra(dados);
                
                // Automação: Gerar Conta a Pagar
                await executeQuery(
                    'INSERT INTO financeiro_transacoes (uuid, tipo, descricao, valor, vencimento, entidade_nome, categoria, origem_uuid, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [uuidv4(), 'PAGAR', `COMPRA: ${dados.item}`, dados.valor, dados.data, (fornecedor.nome || 'DIVERSOS').toUpperCase(), 'COMPRAS', dados.uuid, new Date().toISOString()]
                );
                
                Alert.alert('Sucesso', 'Entrada registrada e gerada no Contas a Pagar.');
            }
            setItem(''); setQuantidade(''); setValor(''); setObservacao(''); setDetalhes(''); setCultura(''); setAnexoUri(null); setFornecedor({ uuid: '', nome: '' });
            loadHistory();
        } catch (error) { 
            console.error(error);
            Alert.alert('Erro', 'Falha ao salvar compra.'); 
        }
    };

    const handleEdit = (rec) => {
        setEditingUuid(rec.uuid);
        setItem(rec.item);
        setQuantidade(rec.quantidade.toString());
        setValor(rec.valor.toString());
        setCultura(rec.cultura);
        setObservacao(rec.observacao || '');
        setDetalhes(rec.detalhes || '');
        setAnexoUri(rec.anexo || null);
    };

    const handleDelete = (rec) => {
        Alert.alert('Excluir', 'Confirmar exclusão desta compra?', [
            { text: 'Não', style: 'cancel' },
            { text: 'Sim, Excluir', style: 'destructive', onPress: async () => { await deleteCompra(rec.uuid); loadHistory(); } }
        ]);
    };

    const isDark = true;
    const textColor = '#FFF';
    const textMutedColor = '#9CA3AF';
    const cardBg = '#1F2937';
    const borderCol = 'rgba(255,255,255,0.05)';

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#0B121E' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#111827', '#0F172A']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{editingUuid ? 'EDITAR COMPRA' : 'ENTRADA DE INSUMOS'}</Text>
                        <View style={{ width: 38 }} />
                    </View>
                    <Text style={styles.headerSub}>Gerenciamento de suprimentos e estoques</Text>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                <View style={styles.content}>
                    <LinearGradient colors={['#1F2937', '#111827']} style={styles.formCard}>
                        <TouchableOpacity 
                            style={[
                                styles.cameraBtn, 
                                { borderColor: borderCol, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' },
                                anexoUri ? { borderColor: activeColors.primary || '#10B981', backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5' } : null
                            ]} 
                            onPress={() => hasPermission ? anexarNota() : Alert.alert('Permissão', 'Acesso à câmera necessário.')}
                        >
                            <Ionicons name={anexoUri ? "checkmark-circle" : "camera"} size={20} color={anexoUri ? (activeColors.primary || "#10B981") : (activeColors.textMuted || '#6B7280')} />
                            <Text style={[styles.cameraBtnText, { color: textMutedColor }, anexoUri ? { color: activeColors.primary || '#10B981' } : null]}>
                                {anexoUri ? 'NOTA ANEXADA' : 'ANEXAR FOTO DA NOTA (OPCIONAL)'}
                            </Text>
                        </TouchableOpacity>

                                                <SmartAutocomplete
                            label="PRODUTO / INSUMO COMPRADO *"
                            value={item}
                            onSelect={val => setItem(val ? val.nome : '')}
                            service={ProductLibraryService}
                            filterType="INSUMO"
                            title="SELECIONAR MATERIAL"
                            placeholder="SELECIONAR MATERIAL..."
                            icon="cube-outline"
                            quickAddFields={[
                                { key: 'nome', label: 'NOME DO INSUMO', placeholder: 'Ex: Adubo Especial' },
                                { key: 'tipo', label: 'TIPO', placeholder: 'Ex: INSUMO', defaultValue: 'INSUMO' },
                                { key: 'unidade', label: 'UNIDADE', placeholder: 'Ex: KG', defaultValue: 'KG' }
                            ]}
                        />

                        <SmartAutocomplete
                            label="FORNECEDOR (DE QUEM?)"
                            value={fornecedor.nome ? fornecedor : null}
                            onSelect={val => setFornecedor(val ? { uuid: val.uuid, nome: val.nome } : { uuid: '', nome: '' })}
                            service={FornecedorLibraryService}
                            title="SELECIONAR FORNECEDOR"
                            placeholder="SELECIONAR FORNECEDOR..."
                            icon="business-outline"
                            quickAddFields={[
                                { key: 'nome', label: 'NOME DO FORNECEDOR', placeholder: 'Ex: AgroComercial' },
                                { key: 'contato', label: 'CONTATO', placeholder: 'Ex: Geraldo Silva' },
                                { key: 'telefone', label: 'TELEFONE', placeholder: 'Ex: (11) 99999-9999' }
                            ]}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <AgroInput label="QUANTIDADE *" value={quantidade} onChangeText={setQuantidade} keyboardType="decimal-pad" placeholder="0" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AgroInput label="VALOR TOTAL R$ *" value={valor} onChangeText={setValor} keyboardType="decimal-pad" placeholder="0.00" />
                            </View>
                        </View>

                        <AgroInput label="VINCULAR À CULTURA" value={cultura} onChangeText={setCultura} placeholder="EX: MORANGO ou GERAL" />
                        <AgroInput label="DETALHES TÉCNICOS / BULA" value={detalhes} onChangeText={setDetalhes} placeholder="EX: NPK 04-14-08" />
                        <AgroInput label="OBSERVAÇÕES / FORNECEDOR" value={observacao} onChangeText={setObservacao} multiline style={{ height: 80 }} />

                        <View style={styles.actionRow}>
                            <AgroButton 
                                title={editingUuid ? "SALVAR ALTERAÇÕES" : "REGISTRAR ENTRADA"} 
                                onPress={salvar} 
                                style={{ flex: 2 }}
                            />
                            {editingUuid && (
                                <AgroButton 
                                    title="X" 
                                    variant="secondary" 
                                    onPress={() => { setEditingUuid(null); setItem(''); setQuantidade(''); setValor(''); setObservacao(''); setDetalhes(''); setCultura(''); setAnexoUri(null); }}
                                    style={{ flex: 0.5, marginLeft: 10 }}
                                />
                            )}
                        </View>
                    </LinearGradient>

                    <Text style={[styles.histTitle, { color: textColor }]}>ENTRADAS RECENTES</Text>
                    {history.map(rec => (
                        <TouchableOpacity key={rec.uuid} activeOpacity={0.8} onPress={() => handleEdit(rec)}>
                            <LinearGradient colors={['#1F2937', '#111827']} style={styles.histCard}>
                                <View style={styles.histInner}>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.histHeader}>
                                            <Text style={[styles.hProd, { color: textColor }]}>{rec.item}</Text>
                                            <Text style={[styles.hDate, { color: textMutedColor }]}>{new Date(rec.data).toLocaleDateString('pt-BR').slice(0, 5)}</Text>
                                        </View>
                                        <Text style={[styles.hCultura, { color: textMutedColor }]}>{rec.cultura || 'GERAL'}</Text>
                                        <View style={[styles.valBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#F0FDF4' }]}>
                                            <Text style={[styles.hVal, { color: activeColors.primary || '#10B981' }]}>{rec.quantidade} UN • R$ {rec.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.histActions}>
                                        <TouchableOpacity 
                                            onPress={() => handleDelete(rec)} 
                                            style={[styles.delBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2' }]}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={activeColors.error || '#EF4444'} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 40, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 'bold' },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scroll: { flex: 1 },
    content: { padding: 20 },
    formCard: { padding: 20, marginBottom: 25, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cameraBtn: { flexDirection: 'row', padding: 12, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderStyle: 'dashed', borderWidth: 1 },
    cameraBtnText: { fontWeight: '800', marginLeft: 8, fontSize: 11, letterSpacing: 0.5 },
    field: { marginBottom: 15 },
    label: { fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
    selectBtn: { borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
    selectText: { fontSize: 14, fontWeight: '700' },
    row: { flexDirection: 'row' },
    actionRow: { flexDirection: 'row', marginTop: 15 },
    histTitle: { fontSize: 10, fontWeight: '900', marginBottom: 15, letterSpacing: 1.5 },
    histCard: { marginBottom: 12, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    histInner: { padding: 15, flexDirection: 'row', alignItems: 'center' },
    histHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    hProd: { fontSize: 15, fontWeight: '800', flex: 1 },
    hDate: { fontSize: 10, fontWeight: '900' },
    hCultura: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
    valBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
    hVal: { fontSize: 11, fontWeight: '900' },
    histActions: { marginLeft: 15 },
    delBtn: { padding: 10, borderRadius: 12 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '80%', padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900' },
    closeBtn: { padding: 8, borderRadius: 12 },
    searchBar: { padding: 14, borderRadius: 15, marginBottom: 15, fontSize: 14, fontWeight: '700', borderWidth: 1 },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
    itemText: { fontSize: 14, fontWeight: '800' },
    itemSub: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
    empty: { textAlign: 'center', marginTop: 30, fontWeight: 'bold' },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 25 },
    quickModal: { padding: 25 },
    modalTitleCenter: { fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 20 }
});

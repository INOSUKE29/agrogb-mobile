import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, FlatList, TouchableOpacity } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorService } from '../services/ErrorService';

// Database & Services
import { getCadastro, getCulturas } from '../database/database';
import { insertColheita } from '../services/ColheitaService';
import { insertDescarte, insertCongelamento } from '../services/EstoqueService';

// UI Components
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { Card } from '../ui/components/Card';
import AgroInput from '../ui/components/AgroInput';
import AgroButton from '../ui/components/AgroButton';
import { showToast } from '../ui/Toast';
import { useTheme } from '../theme/ThemeContext';

const DRAFT_KEY = '@draft_ColheitaScreen_v2';

export default function ColheitaScreen({ navigation }) {
    const { colors, isDark } = useTheme();

    // Bloc 1: Operação
    const [tipoRegistro, setTipoRegistro] = useState('COLHEITA'); // COLHEITA, CONGELADO, DESCARTE
    const [dataOperacao, setDataOperacao] = useState(new Date().toLocaleDateString('pt-BR'));
    const [talhao, setTalhao] = useState('');
    const [observacao, setObservacao] = useState('');

    // Bloc 2: Itens
    const [itensList, setItensList] = useState([]);

    // UI States
    const [loading, setLoading] = useState(false);
    const [areaModalVisible, setAreaModalVisible] = useState(false);
    const [producaoModalVisible, setProducaoModalVisible] = useState(false);
    const [destinoModalVisible, setDestinoModalVisible] = useState(false);
    const [perdaModalVisible, setPerdaModalVisible] = useState(false);

    // Modal Inputs
    const [modalProd, setModalProd] = useState(null);
    const [modalQty, setModalQty] = useState('');
    const [modalMotivo, setModalMotivo] = useState('');
    // Database Data
    const [productsDB, setProductsDB] = useState([]);
    const [areasDB, setAreasDB] = useState([]);

    // Initial Load & Focus
    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    const loadData = async () => {
        try {
            const allItems = await getCadastro();
            setProductsDB(allItems.filter(i => i.tipo === 'PRODUTO'));
            setAreasDB(await getCulturas());
        } catch (err) {
            console.error(err);
        }
    };

    // Rascunho
    useEffect(() => {
        const checkDraft = async () => {
            const saved = await AsyncStorage.getItem(DRAFT_KEY);
            if (saved) {
                Alert.alert('Rascunho Encontrado', 'Deseja continuar o preenchimento anterior?', [
                    { text: 'Descartar', onPress: () => AsyncStorage.removeItem(DRAFT_KEY), style: 'destructive' },
                    {
                        text: 'Continuar', onPress: () => {
                            const d = JSON.parse(saved);
                            setDataOperacao(d.dataOperacao || dataOperacao);
                            setTalhao(d.talhao || '');
                            setItensList(d.itensList || []);
                            setObservacao(d.observacao || '');
                        }
                    }
                ]);
            }
        };
        checkDraft();
    }, []);

    useEffect(() => {
        const saveDraft = async () => {
            const data = { tipoRegistro, dataOperacao, talhao, itensList, observacao };
            if (talhao || itensList.length) {
                await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(data));
            }
        };
        saveDraft();
    }, [tipoRegistro, dataOperacao, talhao, itensList, observacao]);

    // Helpers
    const formatData = (text) => {
        let clean = text.replace(/\D/g, '');
        if (clean.length > 2) clean = clean.substring(0, 2) + '/' + clean.substring(2);
        if (clean.length > 5) clean = clean.substring(0, 5) + '/' + clean.substring(5, 9);
        setDataOperacao(clean);
    };

    const parseDate = (dStr) => {
        const p = dStr.split('/');
        return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : new Date().toISOString().split('T')[0];
    };


    // Actions
    const handleAddItem = () => {
        if (tipoRegistro === 'COLHEITA') {
            if (!modalProd || !modalQty) return;
            setItensList([...itensList, { id: uuidv4(), produto: modalProd.nome, quantidade: modalQty, unidade: 'CX', fator: modalProd.fator_conversao || 1 }]);
        } else if (tipoRegistro === 'CONGELAMENTO') {
            if (!modalQty) return;
            setItensList([...itensList, { id: uuidv4(), quantidade: modalQty, produto: modalProd?.nome || 'FRUTA GERAL' }]);
        } else {
            if (!modalQty || !modalMotivo) return;
            setItensList([...itensList, { id: uuidv4(), quantidade: modalQty, motivo: modalMotivo, produto: modalProd?.nome || 'FRUTA GERAL' }]);
        }
        setProducaoModalVisible(false);
        setDestinoModalVisible(false);
        setPerdaModalVisible(false);
        setModalQty('');
    };


    const handleSave = async () => {
        if (tipoRegistro === 'COLHEITA' && !talhao) {
            return Alert.alert('Ops', 'Selecione o local/área.');
        }
        if (itensList.length === 0) {
            return Alert.alert('Ops', 'Adicione pelo menos um item ao registro.');
        }

        setLoading(true);
        try {
            const date = parseDate(dataOperacao);

            // Validação de Dados Anti-Erro (Garantia de Tipos)
            const validatedItens = itensList.map(p => {
                const qty = parseFloat(p.quantidade);
                if (isNaN(qty) || qty <= 0) {
                    throw new Error(`Quantidade inválida para o produto ${p.produto}`);
                }
                return { ...p, numericQty: qty };
            });

            if (tipoRegistro === 'COLHEITA') {
                for (const p of validatedItens) {
                    await insertColheita({
                        uuid: uuidv4(),
                        cultura: talhao,
                        produto: p.produto,
                        quantidade: p.numericQty * p.fator,
                        congelado: 0,
                        data: date,
                        observacao: observacao
                    });
                }
            } else if (tipoRegistro === 'CONGELAMENTO') {
                for (const d of validatedItens) {
                    await insertCongelamento({
                        uuid: uuidv4(),
                        produto: d.produto,
                        quantidade_kg: d.numericQty,
                        motivo: observacao || 'CONGELAMENTO MANUAL',
                        data: date
                    });
                }
            } else {
                for (const p of validatedItens) {
                    await insertDescarte({
                        uuid: uuidv4(),
                        produto: p.produto,
                        quantidade_kg: p.numericQty,
                        motivo: p.motivo + (observacao ? ` - ${observacao}` : ''),
                        data: date
                    });
                }
            }

            showToast('✅ Registro salvo com sucesso!');
            await AsyncStorage.removeItem(DRAFT_KEY);
            navigation.goBack();
        } catch (error) {
            ErrorService.logError('ColheitaScreen:handleSave', error);
            Alert.alert('Erro ao Salvar', error.message || 'Falha ao processar registro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppContainer>
            <ScreenHeader title="REGISTRO DE COLHEITA" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scroll}>

                {/* SELETOR DE MODO */}
                <View style={[styles.segmentContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}>
                    {['COLHEITA', 'CONGELAMENTO', 'DESCARTE'].map(mode => (
                        <TouchableOpacity
                            key={mode}
                            style={[
                                styles.segmentBtn,
                                tipoRegistro === mode && {
                                    backgroundColor: mode === 'COLHEITA' ? colors.primary : mode === 'CONGELAMENTO' ? colors.info : colors.danger
                                }
                            ]}
                            onPress={() => { setTipoRegistro(mode); setItensList([]); }}
                        >
                            <Text style={[
                                styles.segmentText,
                                { color: colors.textSecondary },
                                tipoRegistro === mode && { color: '#FFF' }
                            ]}>
                                {mode}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 1: Operação */}
                <Card style={styles.sectionCard}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>1. INFORMAÇÕES DO REGISTRO</Text>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <AgroInput
                                label="DATA DO EVENTO"
                                value={dataOperacao}
                                onChangeText={formatData}
                                placeholder="DD/MM/AAAA"
                                keyboardType="numeric"
                                maxLength={10}
                            />
                        </View>
                        {tipoRegistro === 'COLHEITA' && (
                            <View style={{ flex: 1.5 }}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>TALHÃO / ÁREA</Text>
                                <TouchableOpacity
                                    style={[styles.selector, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', borderColor: colors.border }]}
                                    onPress={() => setAreaModalVisible(true)}
                                >
                                    <Text style={[styles.selectorText, { color: colors.textPrimary }, !talhao && { color: colors.placeholder }]}>{talhao || 'Selecionar...'}</Text>
                                    <Ionicons name="location" size={18} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    <AgroInput
                        label="OBSERVAÇÃO GERAL (OPCIONAL)"
                        value={observacao}
                        onChangeText={setObservacao}
                        placeholder="Notas do dia..."
                        multiline
                        style={{ height: 80 }}
                    />
                </Card>

                {/* 2: LISTAGEM DE ITENS */}
                <Card style={styles.sectionCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons
                            name={tipoRegistro === 'COLHEITA' ? "basket" : tipoRegistro === 'CONGELAMENTO' ? "snow" : "trash"}
                            size={20}
                            color={tipoRegistro === 'COLHEITA' ? colors.primary : tipoRegistro === 'CONGELAMENTO' ? colors.info : colors.danger}
                        />
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}> ITENS PARA REGISTRO</Text>
                    </View>

                    {itensList.map(item => (
                        <View key={item.id} style={[styles.listItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.itemMain, { color: colors.textPrimary }]}>{item.produto}</Text>
                                <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{item.quantidade} {item.unidade || 'kg'} {item.motivo && ` - ${item.motivo}`}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setItensList(itensList.filter(i => i.id !== item.id))}>
                                <Ionicons name="close-circle" size={20} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.addBtn, { borderColor: colors.border }]}
                        onPress={() => {
                            if (tipoRegistro === 'COLHEITA') setProducaoModalVisible(true);
                            else if (tipoRegistro === 'CONGELAMENTO') setDestinoModalVisible(true);
                            else setPerdaModalVisible(true);
                        }}
                    >
                        <Ionicons
                            name="add-circle"
                            size={20}
                            color={tipoRegistro === 'COLHEITA' ? colors.primary : tipoRegistro === 'CONGELAMENTO' ? colors.info : colors.danger}
                        />
                        <Text style={[styles.addBtnText, { color: tipoRegistro === 'COLHEITA' ? colors.primary : tipoRegistro === 'CONGELAMENTO' ? colors.info : colors.danger }]}>
                            ADICIONAR {tipoRegistro}
                        </Text>
                    </TouchableOpacity>
                </Card>

                <AgroButton title="SALVAR REGISTRO" onPress={handleSave} loading={loading} style={{ marginTop: 10, marginBottom: 30 }} />

            </ScrollView>

            <Modal visible={producaoModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <Card style={[styles.modalContent, { backgroundColor: colors.card }]} noPadding>
                        <View style={{ padding: 20 }}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Adicionar Produção</Text>

                            <Text style={[styles.label, { color: colors.textSecondary }]}>PRODUTO</Text>
                            <TouchableOpacity
                                style={[styles.selector, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', borderColor: colors.border }]}
                                onPress={() => { }}
                            >
                                <Text style={[styles.selectorText, { color: colors.textPrimary }]}>{modalProd?.nome || 'Selecionar Produto...'}</Text>
                            </TouchableOpacity>

                            {/* Seletor simplificado de produtos p/ este modal */}
                            <ScrollView style={{ maxHeight: 150, marginVertical: 10 }}>
                                {productsDB.map(p => (
                                    <TouchableOpacity key={p.uuid} style={[styles.pickItem, { borderBottomColor: colors.border }]} onPress={() => setModalProd(p)}>
                                        <Text style={[styles.pickText, { color: colors.textPrimary }, modalProd?.uuid === p.uuid && { color: colors.primary, fontWeight: 'bold' }]}>{p.nome}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <AgroInput
                                label="QUANTIDADE (CX)"
                                value={modalQty}
                                onChangeText={setModalQty}
                                keyboardType="decimal-pad"
                                placeholder="0"
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity onPress={() => setProducaoModalVisible(false)}>
                                    <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>CANCELAR</Text>
                                </TouchableOpacity>
                                <AgroButton title="ADICIONAR" onPress={handleAddItem} style={{ width: 140 }} />
                            </View>
                        </View>
                    </Card>
                </View>
            </Modal>

            {/* Modal Destino */}
            <Modal visible={destinoModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <Card style={[styles.modalContent, { backgroundColor: colors.card }]} noPadding>
                        <View style={{ padding: 20 }}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Registro de Destino</Text>

                            <AgroInput
                                label="QUANTIDADE CONGELADA (KG)"
                                value={modalQty}
                                onChangeText={setModalQty}
                                keyboardType="decimal-pad"
                                placeholder="0.00"
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity onPress={() => setDestinoModalVisible(false)}>
                                    <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>CANCELAR</Text>
                                </TouchableOpacity>
                                <AgroButton title="ADICIONAR" onPress={handleAddItem} style={{ width: 140 }} />
                            </View>
                        </View>
                    </Card>
                </View>
            </Modal>

            {/* Modal Perda */}
            <Modal visible={perdaModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <Card style={[styles.modalContent, { backgroundColor: colors.card }]} noPadding>
                        <View style={{ padding: 20 }}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Registro de Descarte</Text>

                            <AgroInput
                                label="MOTIVO"
                                value={modalMotivo}
                                onChangeText={setModalMotivo}
                                placeholder="Ex: Pássaros, Podridão..."
                            />

                            <AgroInput
                                label="QUANTIDADE DESCARTADA (KG)"
                                value={modalQty}
                                onChangeText={setModalQty}
                                keyboardType="decimal-pad"
                                placeholder="0.00"
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity onPress={() => setPerdaModalVisible(false)}>
                                    <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>CANCELAR</Text>
                                </TouchableOpacity>
                                <AgroButton title="ADICIONAR" onPress={handleAddItem} style={{ width: 140 }} />
                            </View>
                        </View>
                    </Card>
                </View>
            </Modal>

            {/* Modal de Áreas */}
            <Modal visible={areaModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Card style={[styles.modalContent, { backgroundColor: colors.card, height: '60%' }]} noPadding>
                        <View style={{ padding: 20, flex: 1 }}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Selecione o Local</Text>
                            <FlatList
                                data={areasDB}
                                keyExtractor={i => i.uuid}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.pickItem, { borderBottomColor: colors.border }]}
                                        onPress={() => { setTalhao(item.nome); setAreaModalVisible(false); }}
                                    >
                                        <Text style={[styles.pickText, { color: colors.textPrimary }]}>{item.nome}</Text>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            />
                            <AgroButton title="FECHAR" onPress={() => setAreaModalVisible(false)} style={{ marginTop: 10 }} />
                        </View>
                    </Card>
                </View>
            </Modal>

        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 16, paddingBottom: 100 },
    segmentContainer: { flexDirection: 'row', gap: 8, marginBottom: 16, padding: 4, borderRadius: 14, borderWidth: 1 },
    segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    segmentText: { fontSize: 10, fontWeight: '800' },
    sectionCard: { marginBottom: 16 },
    sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 14, letterSpacing: 0.5 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center' },
    label: { fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
    selector: {
        height: 54,
        borderWidth: 1.5,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 15
    },
    selectorText: { flex: 1, fontSize: 14, fontWeight: '700' },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 16,
        marginTop: 8
    },
    addBtnText: { marginLeft: 8, fontSize: 12, fontWeight: '900' },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        marginBottom: 10
    },
    itemMain: { flex: 1, fontSize: 13, fontWeight: '800' },
    itemSub: { fontSize: 12, fontWeight: '600', marginRight: 10 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
    modalContent: { width: '100%', elevation: 10 },
    modalTitle: { fontSize: 16, fontWeight: '900', marginBottom: 20, textAlign: 'center', letterSpacing: 1 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    pickItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
    pickText: { fontSize: 14, fontWeight: '700' }
});


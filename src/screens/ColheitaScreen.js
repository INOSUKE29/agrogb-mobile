import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, FlatList, TouchableOpacity, Animated } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Database & Services
import { getCadastro, getCulturas, insertCadastro } from '../database/database';
import { insertColheita, getColheitasRecentes, updateColheita, deleteColheita } from '../services/ColheitaService';
import { insertDescarte, insertCongelamento } from '../services/EstoqueService';

// UI Components
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';
import DangerButton from '../ui/DangerButton';
import { showToast } from '../ui/Toast';
import { useTheme } from '../theme/ThemeContext';
import ConfirmModal from '../ui/ConfirmModal';

const DRAFT_KEY = '@draft_ColheitaScreen_v2';

export default function ColheitaScreen({ navigation }) {
    const { colors } = useTheme();

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
    const [modalUnit, setModalUnit] = useState('CX');
    const [modalMotivo, setModalMotivo] = useState('');

    // Database Data
    const [productsDB, setProductsDB] = useState([]);
    const [areasDB, setAreasDB] = useState([]);
    const [history, setHistory] = useState([]);

    // Confirmation
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Initial Load & Focus
    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    const loadData = async () => {
        try {
            const allItems = await getCadastro();
            setProductsDB(allItems.filter(i => i.tipo === 'PRODUTO'));
            setAreasDB(await getCulturas());
            setHistory(await getColheitasRecentes());
        } catch (e) {
            console.error(e);
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
                            setProducaoList(d.producaoList || []);
                            setDestinoList(d.destinoList || []);
                            setPerdaList(d.perdaList || []);
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

    // Resumo
    const resumo = useMemo(() => {
        const totalCx = producaoList.reduce((acc, cur) => acc + (parseFloat(cur.quantidade) || 0), 0);
        const totalCong = destinoList.reduce((acc, cur) => acc + (parseFloat(cur.quantidade) || 0), 0);
        const totalDesc = perdaList.reduce((acc, cur) => acc + (parseFloat(cur.quantidade) || 0), 0);
        return { totalCx, totalCong, totalDesc };
    }, [producaoList, destinoList, perdaList]);

    // Actions
    const handleAddItem = () => {
        if (tipoRegistro === 'COLHEITA') {
            if (!modalProd || !modalQty) return;
            setItensList([...itensList, { id: uuidv4(), produto: modalProd.nome, quantidade: modalQty, unidade: modalUnit, fator: modalProd.fator_conversao || 1 }]);
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

    const handleAddDestino = () => {
        if (!modalQty) return;
        setDestinoList([...destinoList, { id: uuidv4(), quantidade: modalQty }]);
        setDestinoModalVisible(false);
        setModalQty('');
    };

    const handleAddPerda = () => {
        if (!modalQty || !modalMotivo) return;
        setPerdaList([...perdaList, { id: uuidv4(), quantidade: modalQty, motivo: modalMotivo }]);
        setPerdaModalVisible(false);
        setModalQty('');
        setModalMotivo('');
    };

    const handleSave = async () => {
        if (tipoRegistro === 'COLHEITA' && !talhao) return Alert.alert('Ops', 'Selecione o local/área.');
        if (itensList.length === 0) return Alert.alert('Ops', 'Adicione pelo menos um item ao registro.');

        setLoading(true);
        try {
            const date = parseDate(dataOperacao);

            if (tipoRegistro === 'COLHEITA') {
                for (const p of itensList) {
                    await insertColheita({
                        uuid: uuidv4(),
                        cultura: talhao,
                        produto: p.produto,
                        quantidade: parseFloat(p.quantidade) * p.fator,
                        congelado: 0,
                        data: date,
                        observacao: observacao
                    });
                }
            } else if (tipoRegistro === 'CONGELAMENTO') {
                for (const d of itensList) {
                    await insertCongelamento({
                        uuid: uuidv4(),
                        produto: d.produto,
                        quantidade_kg: parseFloat(d.quantidade),
                        motivo: observacao || 'CONGELAMENTO MANUAL',
                        data: date
                    });
                }
            } else {
                for (const p of itensList) {
                    await insertDescarte({
                        uuid: uuidv4(),
                        produto: p.produto,
                        quantidade_kg: parseFloat(p.quantidade),
                        motivo: p.motivo + (observacao ? ` - ${observacao}` : ''),
                        data: date
                    });
                }
            }

            showToast('✅ Registro salvo com sucesso!');
            await AsyncStorage.removeItem(DRAFT_KEY);
            navigation.goBack();
        } catch (e) {
            Alert.alert('Erro', 'Falha ao salvar registro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppContainer>
            <ScreenHeader title="REGISTRO DE COLHEITA" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scroll}>

                {/* SELETOR DE MODO */}
                <View style={[styles.segmentContainer, { borderColor: colors.glassBorder }]}>
                    {['COLHEITA', 'CONGELAMENTO', 'DESCARTE'].map(mode => (
                        <TouchableOpacity
                            key={mode}
                            style={[styles.segmentBtn, tipoRegistro === mode && { backgroundColor: mode === 'COLHEITA' ? colors.primary : mode === 'CONGELAMENTO' ? '#3B82F6' : colors.danger }]}
                            onPress={() => { setTipoRegistro(mode); setItensList([]); }}
                        >
                            <Text style={[styles.segmentText, { color: colors.textSecondary }, tipoRegistro === mode && { color: '#FFF' }]}>{mode}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 1: Operação */}
                <GlowCard style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>1. INFORMAÇÕES DO REGISTRO</Text>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.label}>DATA DO EVENTO</Text>
                            <GlowInput value={dataOperacao} onChangeText={formatData} placeholder="DD/MM/AAAA" keyboardType="numeric" maxLength={10} />
                        </View>
                        {tipoRegistro === 'COLHEITA' && (
                            <View style={{ flex: 1.5 }}>
                                <Text style={styles.label}>TALHÃO / ÁREA</Text>
                                <TouchableOpacity style={styles.selector} onPress={() => setAreaModalVisible(true)}>
                                    <Text style={[styles.selectorText, !talhao && { color: colors.placeholder }]}>{talhao || 'Selecionar...'}</Text>
                                    <Ionicons name="location" size={18} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    <Text style={styles.label}>OBSERVAÇÃO GERAL (OPCIONAL)</Text>
                    <GlowInput value={observacao} onChangeText={setObservacao} placeholder="Notas do dia..." multiline style={{ height: 60 }} />
                </GlowCard>

                {/* 2: LISTAGEM DE ITENS */}
                <GlowCard style={styles.sectionCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons
                            name={tipoRegistro === 'COLHEITA' ? "basket" : tipoRegistro === 'CONGELAMENTO' ? "snow" : "trash"}
                            size={20}
                            color={tipoRegistro === 'COLHEITA' ? colors.primary : tipoRegistro === 'CONGELAMENTO' ? '#3B82F6' : colors.danger}
                        />
                        <Text style={styles.sectionTitle}> ITENS PARA REGISTRO</Text>
                    </View>

                    {itensList.map(item => (
                        <View key={item.id} style={styles.listItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemMain}>{item.produto}</Text>
                                <Text style={styles.itemSub}>{item.quantidade} {item.unidade || 'kg'} {item.motivo && ` - ${item.motivo}`}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setItensList(itensList.filter(i => i.id !== item.id))}>
                                <Ionicons name="close-circle" size={20} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => {
                            if (tipoRegistro === 'COLHEITA') setProducaoModalVisible(true);
                            else if (tipoRegistro === 'CONGELAMENTO') setDestinoModalVisible(true);
                            else setPerdaModalVisible(true);
                        }}
                    >
                        <Ionicons
                            name="add-circle"
                            size={20}
                            color={tipoRegistro === 'COLHEITA' ? colors.primary : tipoRegistro === 'CONGELAMENTO' ? '#3B82F6' : colors.danger}
                        />
                        <Text style={[styles.addBtnText, { color: tipoRegistro === 'COLHEITA' ? colors.primary : tipoRegistro === 'CONGELAMENTO' ? '#3B82F6' : colors.danger }]}>
                            ADICIONAR {tipoRegistro}
                        </Text>
                    </TouchableOpacity>
                </GlowCard>

                <PrimaryButton title="SALVAR REGISTRO" onPress={handleSave} loading={loading} style={{ marginTop: 10, marginBottom: 30 }} />

            </ScrollView>

            {/* MODAIS DE ADIÇÃO */}
            <Modal visible={producaoModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.modal }]}>
                        <Text style={styles.modalTitle}>Adicionar Produção</Text>
                        <Text style={styles.label}>PRODUTO</Text>
                        <TouchableOpacity style={styles.selector} onPress={() => setProducaoModalVisible(true) /* Reutiliza modal de busca caso queira, mas aqui p/ simplificar vou usar lista fixa ou picker se fosse o caso. Para AgroGB usamos FlatList p/ produtos. */}>
                            <Text style={styles.selectorText}>{modalProd?.nome || 'Selecionar Produto...'}</Text>
                        </TouchableOpacity>

                        {/* Seletor simplificado de produtos p/ este modal */}
                        <ScrollView style={{ maxHeight: 150, marginVertical: 10 }}>
                            {productsDB.map(p => (
                                <TouchableOpacity key={p.uuid} style={styles.pickItem} onPress={() => setModalProd(p)}>
                                    <Text style={[styles.pickText, modalProd?.uuid === p.uuid && { color: colors.primary, fontWeight: 'bold' }]}>{p.nome}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.label}>QUANTIDADE (CX)</Text>
                        <GlowInput value={modalQty} onChangeText={setModalQty} keyboardType="decimal-pad" placeholder="0" />

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setProducaoModalVisible(false)}><Text style={{ color: colors.textSecondary }}>Cancelar</Text></TouchableOpacity>
                            <PrimaryButton title="ADICIONAR" onPress={handleAddItem} style={{ width: 120, height: 40 }} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Destino */}
            <Modal visible={destinoModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.modal }]}>
                        <Text style={styles.modalTitle}>Registro de Destino</Text>
                        <Text style={styles.label}>QUANTIDADE CONGELADA (KG)</Text>
                        <GlowInput value={modalQty} onChangeText={setModalQty} keyboardType="decimal-pad" placeholder="0.00" autoFocus />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setDestinoModalVisible(false)}><Text style={{ color: colors.textSecondary }}>Cancelar</Text></TouchableOpacity>
                            <PrimaryButton title="ADICIONAR" onPress={handleAddItem} style={{ width: 120 }} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Perda */}
            <Modal visible={perdaModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.modal }]}>
                        <Text style={styles.modalTitle}>Registro de Descarte</Text>
                        <Text style={styles.label}>MOTIVO</Text>
                        <GlowInput value={modalMotivo} onChangeText={setModalMotivo} placeholder="Ex: Pássaros, Podridão..." />
                        <Text style={styles.label}>QUANTIDADE DESCARTADA (KG)</Text>
                        <GlowInput value={modalQty} onChangeText={setModalQty} keyboardType="decimal-pad" placeholder="0.00" />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setPerdaModalVisible(false)}><Text style={{ color: colors.textSecondary }}>Cancelar</Text></TouchableOpacity>
                            <PrimaryButton title="ADICIONAR" onPress={handleAddItem} style={{ width: 120 }} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de Áreas */}
            <Modal visible={areaModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.modal, height: '60%' }]}>
                        <Text style={styles.modalTitle}>Selecione o Local</Text>
                        <FlatList
                            data={areasDB}
                            keyExtractor={i => i.uuid}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.pickItem} onPress={() => { setTalhao(item.nome); setAreaModalVisible(false); }}>
                                    <Text style={styles.pickText}>{item.nome}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        />
                        <PrimaryButton title="FECHAR" onPress={() => setAreaModalVisible(false)} />
                    </View>
                </View>
            </Modal>

        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 16, paddingBottom: 100 },
    segmentContainer: { flexDirection: 'row', gap: 8, marginBottom: 16, backgroundColor: 'rgba(0,0,0,0.05)', padding: 4, borderRadius: 14, borderWidth: 1 },
    segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    segmentText: { fontSize: 10, fontWeight: '800' },
    sectionCard: { marginBottom: 16 },
    sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 14, color: '#6B7280', letterSpacing: 0.5 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center' },
    label: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginBottom: 6 },
    selector: {
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        borderColor: 'rgba(0,0,0,0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        backgroundColor: '#F9FAFB',
        marginBottom: 12
    },
    selectorText: { flex: 1, fontSize: 15, fontWeight: '500' },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#D1D5DB',
        borderRadius: 12,
        marginTop: 8
    },
    addBtnText: { marginLeft: 8, fontSize: 12, fontWeight: '700', color: '#10B981' },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        padding: 12,
        borderRadius: 10,
        marginBottom: 8
    },
    itemMain: { flex: 1, fontSize: 13, fontWeight: '700' },
    itemSub: { fontSize: 13, fontWeight: '600', marginRight: 10 },
    resumoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    resumoItem: { alignItems: 'center', flex: 1 },
    resumoLabel: { fontSize: 9, fontWeight: '800', color: '#6B7280' },
    resumoValue: { fontSize: 16, fontWeight: '900', color: '#111827' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
    pickItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    pickText: { fontSize: 15, fontWeight: '500' }
});


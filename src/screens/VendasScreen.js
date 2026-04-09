/**
 * VendasScreen.js — AgroGB OS
 * Estilo Premium Forest Green & Gold (Mockup Real "Nova Venda")
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, 
    TextInput, Platform, SafeAreaView, StatusBar, 
    ActivityIndicator, Switch 
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { getCadastro, getClientes } from '../database/database';
import VendaService from '../services/VendaService';
import ProductModal from '../modules/inventory/components/ProductModal';
import ClientModal from '../modules/finance/components/ClientModal';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AutoSyncService from '../services/AutoSyncService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorService } from '../services/ErrorService';
import ConfirmModal from '../ui/ConfirmModal';
import { showToast } from '../ui/Toast';
import { LinearGradient } from 'expo-linear-gradient';
import SafeBlurView from '../ui/SafeBlurView';

export default function VendasScreen({ navigation }) {
    const [cliente, setCliente] = useState('');
    const [clienteId, setClienteId] = useState(null);
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [precoKg, setPrecoKg] = useState('');
    
    const [formaPagamento, setFormaPagamento] = useState('PIX');
    const [contasReceber, setContasReceber] = useState(true);
    const [dataVenda, setDataVenda] = useState(new Date().toLocaleDateString('pt-BR'));

    const [editingUuid, setEditingUuid] = useState(null);
    
    const [modalVisible, setModalVisible] = useState(false);
    const [clientModalVisible, setClientModalVisible] = useState(false);
    
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [saving, setSaving] = useState(false);

    // HISTORY FIRST NAVIGATION
    const [view, setView] = useState('LIST');
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const DRAFT_KEY = '@draft_VendasScreen_Diamond_v1';

    useEffect(() => {
        const checkDraft = async () => {
            try {
                const saved = await AsyncStorage.getItem(DRAFT_KEY);
                if (saved) {
                    const draft = JSON.parse(saved);
                    setCliente(draft.cliente || '');
                    setClienteId(draft.clienteId || null);
                    setProduto(draft.produto || '');
                    setQuantidade(draft.quantidade || '');
                    setPrecoKg(draft.precoKg || '');
                    setFormaPagamento(draft.formaPagamento || 'PIX');
                }
            } catch { }
        };
        checkDraft();
    }, []);

    useEffect(() => {
        const saveDraft = async () => {
            if (!editingUuid && (cliente || produto || quantidade || precoKg)) {
                await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ cliente, clienteId, produto, quantidade, precoKg, formaPagamento }));
            }
        };
        const timer = setTimeout(saveDraft, 1000);
        return () => clearTimeout(timer);
    }, [cliente, clienteId, produto, quantidade, precoKg, formaPagamento, editingUuid]);

    const loadInitialData = useCallback(async () => {
        try {
            await getCadastro();
            await getClientes();
        } catch { }
    }, []);

    const loadHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const data = await VendaService.getRecentSales ? await VendaService.getRecentSales() : [];
            if (!data || data.length === 0) {
               setHistory([]);
            } else {
               setHistory(data);
            }
        } catch { 
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadInitialData(); loadHistory(); }, [loadInitialData, loadHistory]));

    const parseDate = (dStr) => {
        const p = dStr.split('/');
        return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : new Date().toISOString().split('T')[0];
    };

    const valorTotalCalc = useMemo(() => {
        const q = parseFloat(quantidade) || 0;
        const p = parseFloat(precoKg) || 0;
        return q * p;
    }, [quantidade, precoKg]);

    const handleSalvar = useCallback(async (isSaveAndNew = false) => {
        if (!produto || !quantidade || !precoKg) return Alert.alert('Atenção', 'Informe Produto, Quantidade e Preço.');
        if (valorTotalCalc <= 0) return Alert.alert('Atenção', 'Valor total inválido.');

        setSaving(true);
        const stPgto = (formaPagamento === 'PRAZO' || contasReceber) ? 'PENDENTE' : 'PAGO';

        const dados = {
            uuid: editingUuid || null,
            cliente_id: clienteId,
            cliente_nome: cliente || 'BALCÃO',
            produto: produto,
            quantidade: parseFloat(quantidade),
            valor_total: valorTotalCalc,
            observacao: `FORMA: ${formaPagamento}`,
            data: parseDate(dataVenda),
            pagamento_status: stPgto
        };
        
        try {
            await VendaService.registrarVenda(dados);
            showToast(editingUuid ? '✨ Venda atualizada!' : '✅ Venda registrada!');
            
            if (isSaveAndNew) {
                setProduto(''); setQuantidade(''); setPrecoKg(''); 
            } else {
                setCliente(''); setClienteId(null); setProduto(''); setQuantidade(''); setPrecoKg(''); setFormaPagamento('PIX'); setEditingUuid(null);
                setView('LIST');
            }

            await AsyncStorage.removeItem(DRAFT_KEY);
            loadHistory();
            try { AutoSyncService.trigger(); } catch {}
        } catch (error) {
            ErrorService.logError('VendasScreen:salvar', error);
            Alert.alert('Erro', 'Não foi possível salvar a venda.');
        } finally {
            setSaving(false);
        }
    }, [produto, quantidade, precoKg, valorTotalCalc, cliente, clienteId, formaPagamento, contasReceber, dataVenda, editingUuid, loadHistory]);

    const confirmDelete = useCallback(async () => {
        if (!itemToDelete) return;
        try {
            await VendaService.excluirVenda(itemToDelete.uuid);
            setConfirmVisible(false);
            setItemToDelete(null);
            showToast('🗑️ Venda excluída!');
            loadHistory();
            try { AutoSyncService.trigger(); } catch {}
        } catch (error) {
            ErrorService.logError('VendasScreen:confirmDelete', error);
            Alert.alert('Erro', 'Não foi possível excluir a venda.');
        }
    }, [itemToDelete, loadHistory]);

    const handleEditVenda = (item) => {
        setEditingUuid(item.uuid);
        setCliente(item.cliente_nome || item.cliente || '');
        setProduto(item.produto || '');
        setQuantidade(String(item.quantidade || ''));
        if (item.valor_total && item.quantidade) {
            setPrecoKg(String((item.valor_total / item.quantidade).toFixed(2)));
        } else {
            setPrecoKg('');
        }
        setFormaPagamento(item.observacao && item.observacao.includes('PRAZO') ? 'PRAZO' : 'PIX');
        setView('FORM');
    };

    const renderList = () => (
        <View style={{ flex: 1, paddingHorizontal: 22 }}>
            <View style={[styles.header, { paddingHorizontal: 0 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
                    <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>HISTÓRICO DE VENDAS</Text>
                <View style={{ width: 40 }} />
            </View>

            {loadingHistory ? (
                <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} />
            ) : history.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={48} color="rgba(255,255,255,0.1)" />
                    <Text style={styles.emptyText}>Nenhuma venda registrada recentemente.</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {history.map(item => (
                        <SafeBlurView key={item.uuid} intensity={15} style={styles.historyCard} webFallbackColor="rgba(255,255,255,0.02)">
                            <View style={styles.historyHeader}>
                                <View style={styles.historyIconBg}>
                                    <Ionicons name="cart" size={18} color="#D4AF37" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.hProd}>{item.cliente_nome || item.cliente || 'BALCÃO'}</Text>
                                    <Text style={styles.hSub}>{item.produto} • {item.quantidade} KG</Text>
                                </View>
                                <Text style={styles.hVal}>R$ {((item.valor_total || item.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                            </View>
                            <View style={styles.historyFooter}>
                                <Text style={styles.hData}>{new Date(item.data).toLocaleDateString('pt-BR')}</Text>
                                <View style={styles.historyActions}>
                                    <TouchableOpacity onPress={() => handleEditVenda(item)} style={{ marginRight: 15 }}>
                                        <Ionicons name="create-outline" size={20} color="rgba(255,255,255,0.4)" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { setItemToDelete(item); setConfirmVisible(true); }}>
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </SafeBlurView>
                    ))}
                </ScrollView>
            )}

            {/* FAB DIAMOND PRO */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => { setEditingUuid(null); setView('FORM'); }}>
                <LinearGradient colors={['#D4AF37', '#9A7B2C']} style={styles.fabGradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
                    <Ionicons name="add" size={30} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    const renderForm = () => (
        <View style={{ flex: 1 }}>
            {/* ── HEADER ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setView('LIST')}>
                    <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{editingUuid ? 'EDITAR VENDA' : 'NOVA VENDA'}</Text>
                <TouchableOpacity style={styles.headerRightBtn} onPress={() => handleSalvar(false)}>
                    <Text style={styles.headerRightBtnText}>SALVAR</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* CLIENTE */}
                    <Text style={styles.sectionTitle}>CLIENTE</Text>
                    <SafeBlurView intensity={20} style={styles.glassCard} webFallbackColor="rgba(255,255,255,0.03)">
                        <TouchableOpacity style={styles.cardActionRow} onPress={() => setClientModalVisible(true)}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                                <Ionicons name="person" size={20} color="#D4AF37" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.mainValue}>{cliente || 'Selecionar cliente...'}</Text>
                                {cliente && <Text style={styles.subValue}>CLIENTE PARCEIRO</Text>}
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                    </SafeBlurView>

                    {/* CULTURA / PRODUTO */}
                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>PRODUTO / CULTURA</Text>
                    <SafeBlurView intensity={20} style={styles.glassCard} webFallbackColor="rgba(255,255,255,0.03)">
                        <TouchableOpacity style={styles.cardActionRow} onPress={() => setModalVisible(true)}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Ionicons name="leaf" size={20} color="#10B981" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.mainValue}>{produto || 'Selecionar produto...'}</Text>
                                {produto && <Text style={styles.subValue}>CATEGORIA: PRODUÇÃO PRÓPRIA</Text>}
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                    </SafeBlurView>

                    {/* ENCOMENDAS ATIVAS */}
                    {cliente && produto && (
                        <SafeBlurView intensity={40} style={styles.goldenGlassCard} webFallbackColor="rgba(251, 191, 36, 0.1)">
                            <LinearGradient colors={['rgba(253, 230, 138, 0.15)', 'rgba(251, 191, 36, 0.05)']} style={StyleSheet.absoluteFill} />
                            <View style={styles.goldenHeader}>
                                <Ionicons name="cart" size={14} color="#FBBF24" />
                                <Text style={styles.goldenTitle}>ENCOMENDAS EM ABERTO</Text>
                            </View>
                            <View style={styles.goldenBody}>
                                <View style={styles.goldenUserRow}>
                                    <View style={styles.goldenAvatar}>
                                        <Text style={{color: '#78350F', fontWeight: '900', fontSize: 12}}>
                                            {cliente.charAt(0)}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.goldenMainText}>{cliente}</Text>
                                        <Text style={styles.goldenSubText}>100 kg pendente</Text>
                                    </View>
                                </View>
                                <Switch value={true} onValueChange={() => {}} trackColor={{ true: '#10B981', false: '#334155' }} thumbColor="#FFF" />
                            </View>
                        </SafeBlurView>
                    )}

                    {/* QUANTIDADE E PREÇO */}
                    <View style={styles.formGrid}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>QUANTIDADE</Text>
                            <SafeBlurView intensity={20} style={styles.inputPill} webFallbackColor="rgba(255,255,255,0.02)">
                                <TextInput
                                    style={styles.inputText}
                                    placeholder="0"
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                    value={quantidade}
                                    onChangeText={setQuantidade}
                                    keyboardType="decimal-pad"
                                />
                                <Text style={styles.inputSuffix}>kg</Text>
                            </SafeBlurView>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.sectionTitle, { textAlign: 'right' }]}>PREÇO/KG (R$)</Text>
                            <SafeBlurView intensity={20} style={styles.inputPill} webFallbackColor="rgba(255,255,255,0.02)">
                                <TextInput
                                    style={[styles.inputText, { textAlign: 'right' }]}
                                    placeholder="0,00"
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                    value={precoKg}
                                    onChangeText={setPrecoKg}
                                    keyboardType="decimal-pad"
                                />
                            </SafeBlurView>
                        </View>
                    </View>

                    {/* TOTAL BOX DIAMOND */}
                    <SafeBlurView intensity={50} style={styles.totalGlassBox} webFallbackColor="rgba(212, 175, 55, 0.05)">
                        <LinearGradient colors={['rgba(212, 175, 55, 0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
                        <View style={styles.totalRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={styles.totalIconBg}>
                                    <Ionicons name="cash" size={18} color="#D4AF37" />
                                </View>
                                <Text style={styles.totalLabel}>VALOR TOTAL</Text>
                            </View>
                            <Text style={styles.totalValue}>R$ {valorTotalCalc.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        </View>
                    </SafeBlurView>

                    {/* PAGAMENTO */}
                    <Text style={[styles.sectionTitle, { marginTop: 25 }]}>FORMA DE PAGAMENTO</Text>
                    <View style={styles.segmentContainer}>
                        {[
                            { id: 'PIX', label: 'PIX', sub: 'Instantâneo', icon: 'flash' },
                            { id: 'DINHEIRO', label: 'Dinheiro', sub: 'À vista', icon: 'wallet' },
                            { id: 'PRAZO', label: 'Prazo', sub: '+30 dias', icon: 'calendar' }
                        ].map(opt => {
                            const active = formaPagamento === opt.id;
                            return (
                                <TouchableOpacity 
                                    key={opt.id}
                                    style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                                    onPress={() => setFormaPagamento(opt.id)}
                                >
                                    <Ionicons name={opt.icon} size={14} color={active ? '#10B981' : 'rgba(255,255,255,0.3)'} />
                                    <Text style={[styles.segmentLabel, active && { color: '#FFF' }]}>{opt.label.toUpperCase()}</Text>
                                    <Text style={[styles.segmentSub, active && { color: '#10B981' }]}>{opt.sub}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>

                    {/* DATA E OPÇÕES EXTRAS */}
                    <View style={{ marginTop: 10 }}>
                        <Text style={styles.sectionTitle}>DATA DA OPERAÇÃO</Text>
                        <SafeBlurView intensity={15} style={styles.glassCard} webFallbackColor="rgba(255,255,255,0.02)">
                            <View style={styles.cardActionRow}>
                                <TextInput
                                    style={[styles.mainValue, { flex: 1 }]}
                                    placeholder="DD/MM/AAAA"
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                    value={dataVenda}
                                    onChangeText={setDataVenda}
                                />
                                <Ionicons name="calendar-clear" size={18} color="rgba(255,255,255,0.4)" />
                            </View>
                        </SafeBlurView>
                    </View>

                    <View style={styles.switchRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.switchTitle}>GERAR CONTAS A RECEBER</Text>
                            <Text style={styles.switchSub}>Lançamento automático no fluxo de caixa.</Text>
                        </View>
                        <Switch 
                            value={contasReceber} 
                            onValueChange={setContasReceber} 
                            trackColor={{ true: '#10B981', false: '#334155' }} 
                            thumbColor="#FFF" 
                        />
                    </View>

                    {/* BOTÕES DIAMOND */}
                    <TouchableOpacity style={styles.btnPrimary} onPress={() => handleSalvar(false)} disabled={saving}>
                        <LinearGradient colors={['#10B981', '#059669']} style={styles.btnGradient}>
                            {saving ? <ActivityIndicator color="#FFF" /> : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                    <Text style={styles.btnPrimaryText}>EFETIVAR VENDA</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnSecondary} onPress={() => handleSalvar(true)} disabled={saving}>
                        <Text style={styles.btnSecondaryText}>SALVAR E NOVA</Text>
                    </TouchableOpacity>

                    {editingUuid && (
                        <TouchableOpacity style={styles.discardBtn} onPress={() => setEditingUuid(null)}>
                            <Text style={styles.discardText}>DESCARTAR EDIÇÃO</Text>
                        </TouchableOpacity>
                    )}

                </ScrollView>
        </View>
    );

    return (
        <View style={styles.webContainer}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#020617', '#0A0F1C', '#030712']} style={StyleSheet.absoluteFill} />

            {/* 🌀 AMBIENT ORBS */}
            <View style={[styles.ambientOrb, { top: -40, right: -60, backgroundColor: '#10B981', opacity: 0.12 }]} />
            <View style={[styles.ambientOrb, { bottom: 100, left: -80, backgroundColor: '#D4AF37', opacity: 0.08 }]} />

            <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
                {view === 'LIST' ? renderList() : renderForm()}

                {/* MODAIS */}
                <ProductModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreated={(p) => { setProduto(p.nome); setModalVisible(false); }} />
                <ClientModal visible={clientModalVisible} onClose={() => setClientModalVisible(false)} onCreated={(c) => { setCliente(c.nome); setClientModalVisible(false); }} />
                <ConfirmModal visible={confirmVisible} title="EXCLUIR VENDA" message="Isso não poderá ser desfeito. Continuar?" onConfirm={confirmDelete} onCancel={() => setConfirmVisible(false)} />

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    webContainer: { flex: 1, backgroundColor: '#020617' },
    ambientOrb: { position: 'absolute', width: 280, height: 280, borderRadius: 140, zIndex: -1 },
    
    header: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
        paddingHorizontal: 22, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20, 
        paddingBottom: 20 
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 13, fontWeight: '900', color: '#F8FAFC', letterSpacing: 2 },
    headerRightBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
    headerRightBtnText: { color: '#10B981', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

    scrollContent: { paddingHorizontal: 22, paddingBottom: 60 },

    sectionTitle: { color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
    
    glassCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 10 },
    cardActionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
    iconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    mainValue: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
    subValue: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, fontWeight: '600', letterSpacing: 0.5 },

    goldenGlassCard: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', marginBottom: 20, padding: 18 },
    goldenHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
    goldenTitle: { color: '#FBBF24', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    goldenBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    goldenUserRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    goldenAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FBBF24', justifyContent: 'center', alignItems: 'center' },
    goldenMainText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    goldenSubText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '500' },

    formGrid: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    inputPill: { 
        flexDirection: 'row', alignItems: 'center', borderRadius: 18, 
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', height: 62, paddingHorizontal: 20 
    },
    inputText: { flex: 1, color: '#FFF', fontSize: 20, fontWeight: '700' },
    inputSuffix: { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: '800', marginLeft: 10 },

    totalGlassBox: { borderRadius: 24, paddingVertical: 22, paddingHorizontal: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.25)', overflow: 'hidden' },
    totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    totalIconBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(212, 175, 55, 0.15)', justifyContent: 'center', alignItems: 'center' },
    totalLabel: { color: '#D4AF37', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
    totalValue: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },

    segmentContainer: { flexDirection: 'row', gap: 8, marginBottom: 25 },
    segmentBtn: { 
        flex: 1, alignItems: 'center', justifyContent: 'center', 
        paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' 
    },
    segmentBtnActive: { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: '#10B981' },
    segmentLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '900', marginTop: 8, letterSpacing: 1 },
    segmentSub: { color: 'rgba(255,255,255,0.2)', fontSize: 9, marginTop: 2, fontWeight: '600' },

    switchRow: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
        padding: 20, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.02)', 
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginTop: 20, marginBottom: 30 
    },
    switchTitle: { color: '#F8FAFC', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    switchSub: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 },

    btnPrimary: { borderRadius: 20, overflow: 'hidden', marginBottom: 15 },
    btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 68, gap: 12 },
    btnPrimaryText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
    
    btnSecondary: { 
        height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', 
        borderWidth: 1.5, borderColor: 'rgba(16, 185, 129, 0.3)', marginBottom: 20 
    },
    btnSecondaryText: { color: '#10B981', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

    discardBtn: { alignSelf: 'center', padding: 12 },
    discardText: { color: '#EF4444', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', marginTop: 16, fontWeight: '600' },
    
    historyCard: { borderRadius: 20, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    historyIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center' },
    hProd: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
    hSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },
    hVal: { color: '#10B981', fontSize: 16, fontWeight: '900' },
    
    historyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
    hData: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    historyActions: { flexDirection: 'row', alignItems: 'center' },

    fab: { position: 'absolute', right: 24, bottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
    fabGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' }
});

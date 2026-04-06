import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, 
    TextInput, Platform, SafeAreaView, StatusBar, ActivityIndicator 
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { getCadastro } from '../database/database';
import { FinanceService } from '../modules/finance/services/FinanceService';
import ProductModal from '../modules/inventory/components/ProductModal';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AutoSyncService from '../services/AutoSyncService';
import { showToast } from '../ui/Toast';
import { LinearGradient } from 'expo-linear-gradient';
import SafeBlurView from '../ui/SafeBlurView';

export default function ComprasScreen({ navigation }) {
    const [insumo, setInsumo] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valorTotal, setValorTotal] = useState('');
    const [cultura, setCultura] = useState('');
    const [detalhes, setDetalhes] = useState('');
    const [observacoes, setObservacoes] = useState('');
    
    const [editingUuid, setEditingUuid] = useState(null);
    const [history, setHistory] = useState([]);
    
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadInitialData = useCallback(async () => {
        try {
            await getCadastro();
        } catch (err) { }
    }, []);

    const loadHistory = useCallback(async () => {
        try {
            const data = await FinanceService.getRecentPurchases ? await FinanceService.getRecentPurchases() : [];
            setHistory(data);
        } catch (e) {
            setHistory([]);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadInitialData(); loadHistory(); }, [loadInitialData, loadHistory]));

    const unitPrice = useMemo(() => {
        const q = parseFloat(quantidade);
        const v = parseFloat(valorTotal);
        if (q > 0 && v > 0) return (v / q).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return '0,00';
    }, [quantidade, valorTotal]);

    const handleSalvar = useCallback(async () => {
        if (!insumo || !quantidade || !valorTotal) return Alert.alert('Atenção', 'Informe Insumo, Quantidade e Valor.');
        
        setSaving(true);
        const dados = {
            uuid: editingUuid || uuidv4(),
            produto: insumo.toUpperCase(),
            quantidade: parseFloat(quantidade),
            valor: parseFloat(valorTotal),
            observacao: observacoes.toUpperCase() + (detalhes ? ` | DETALHES: ${detalhes.toUpperCase()}` : ''),
            data: new Date().toISOString().split('T')[0],
            cultura: cultura.toUpperCase()
        };
        
        try {
            if (FinanceService.recordPurchase) {
                await FinanceService.recordPurchase(dados);
            }
            showToast(editingUuid ? '✨ Compra atualizada!' : '✅ Compra registrada!');
            setInsumo(''); setQuantidade(''); setValorTotal(''); setCultura(''); setDetalhes(''); setObservacoes(''); setEditingUuid(null);
            loadHistory();
            try { AutoSyncService.trigger(); } catch {}
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível salvar.');
        } finally {
            setSaving(false);
        }
    }, [insumo, quantidade, valorTotal, cultura, detalhes, observacoes, editingUuid, loadHistory]);

    const handleDelete = async (item) => {
        Alert.alert('Excluir Compra', `Deseja apagar a entrada de ${item.produto}?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: async () => {
                if (FinanceService.deletePurchase) await FinanceService.deletePurchase(item.uuid);
                showToast('✅ Excluído!');
                loadHistory();
            }}
        ]);
    };

    return (
        <View style={styles.webContainer}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#020617', '#0A0F1C', '#030712']} style={StyleSheet.absoluteFill} />

            {/* 🌀 AMBIENT ORBS */}
            <View style={[styles.ambientOrb, { top: -60, left: -40, backgroundColor: '#10B981', opacity: 0.12 }]} />
            <View style={[styles.ambientOrb, { bottom: 40, right: -60, backgroundColor: '#D4AF37', opacity: 0.08 }]} />

            <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
                
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
                        <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.headerTitle}>COMPRAS</Text>
                        <Text style={styles.headerSub}>ENTRADA DE INSUMOS</Text>
                    </View>
                    <TouchableOpacity style={styles.headerRightBtn} onPress={() => { setEditingUuid(null); setInsumo(''); }}>
                        <Ionicons name="add" size={18} color="#10B981" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    <SafeBlurView intensity={20} style={styles.glassCard} webFallbackColor="rgba(255,255,255,0.03)">
                        <Text style={styles.sectionTitle}>DETALHES DA ENTRADA</Text>

                        {/* BUSCA DE INSUMO */}
                        <TouchableOpacity style={styles.searchBox} onPress={() => setModalVisible(true)}>
                            <View style={styles.iconBox}>
                                <Ionicons name="flask" size={20} color="#10B981" />
                            </View>
                            <Text style={[styles.searchText, !insumo && { color: 'rgba(255,255,255,0.3)' }]}>
                                {insumo || 'SELECIONAR INSUMO'}
                            </Text>
                            <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>

                        <View style={styles.formGrid}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>QUANTIDADE</Text>
                                <View style={styles.inputPill}>
                                    <TextInput
                                        style={styles.inputText}
                                        placeholder="0,00"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        value={quantidade}
                                        onChangeText={setQuantidade}
                                        keyboardType="decimal-pad"
                                    />
                                    <Text style={styles.inputSuffix}>UN</Text>
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>VALOR TOTAL</Text>
                                <View style={styles.inputPill}>
                                    <Text style={styles.inputPrefix}>R$</Text>
                                    <TextInput
                                        style={styles.inputText}
                                        placeholder="0,00"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        value={valorTotal}
                                        onChangeText={setValorTotal}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>
                        </View>
                        <Text style={styles.unitPriceCalc}>VALOR UNITÁRIO ESTIMADO: R$ {unitPrice}</Text>

                        <View style={{ marginTop: 24, gap: 16 }}>
                            <View>
                                <Text style={styles.inputLabel}>DESTINO / CULTURA</Text>
                                <View style={styles.selectorInput}>
                                    <Ionicons name="leaf" size={18} color="rgba(255,255,255,0.4)" />
                                    <TextInput
                                        style={styles.textInnerInput}
                                        placeholder="EX: MORANGO / DIVERSOS"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        value={cultura}
                                        onChangeText={setCultura}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text style={styles.inputLabel}>OBSERVAÇÕES E FORNECEDOR</Text>
                                <View style={styles.obsBox}>
                                    <TextInput
                                        style={styles.obsInput}
                                        placeholder="NOTAS ADICIONAIS, LOTE OU FORNECEDOR..."
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        value={observacoes}
                                        onChangeText={setObservacoes}
                                        multiline
                                    />
                                </View>
                            </View>
                        </View>
                    </SafeBlurView>

                    <Text style={styles.historySectionTitle}>ENTRADAS RECENTES</Text>

                    {history.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={40} color="rgba(255,255,255,0.1)" />
                            <Text style={styles.emptyText}>Nenhuma compra registrada.</Text>
                        </View>
                    ) : (
                        history.map((item, index) => (
                            <SafeBlurView key={item.uuid || index} intensity={15} style={styles.historyCard} webFallbackColor="rgba(255,255,255,0.02)">
                                <View style={styles.historyHeader}>
                                    <View style={styles.historyIconBg}>
                                        <Ionicons name="cart" size={16} color="#D4AF37" />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.hProd}>{item.produto}</Text>
                                        <Text style={styles.hSub}>{item.cultura || 'GERAL'}</Text>
                                    </View>
                                    <Text style={styles.hVal}>R$ {item.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                                </View>
                                
                                <View style={styles.historyFooter}>
                                    <Text style={styles.hSubInfo}>{item.quantidade} UNIDADES</Text>
                                    <View style={styles.historyActions}>
                                        <TouchableOpacity onPress={() => { 
                                            setEditingUuid(item.uuid); 
                                            setInsumo(item.produto); 
                                            setQuantidade(String(item.quantidade)); 
                                            setValorTotal(String(item.valor));
                                            setCultura(item.cultura || '');
                                        }}>
                                            <Ionicons name="create-outline" size={20} color="rgba(255,255,255,0.4)" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(item)}>
                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </SafeBlurView>
                        ))
                    )}

                    <TouchableOpacity style={styles.btnPrimary} onPress={handleSalvar} disabled={saving}>
                        <LinearGradient colors={['#10B981', '#059669']} style={styles.btnGradient}>
                            {saving ? <ActivityIndicator color="#FFF" /> : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                    <Text style={styles.btnPrimaryText}>{editingUuid ? 'ATUALIZAR REGISTRO' : 'EFETIVAR COMPRA'}</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                </ScrollView>

                <ProductModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreated={(p) => { setInsumo(p.nome); setModalVisible(false); }} />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    webContainer: { flex: 1, backgroundColor: '#020617' },
    ambientOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, zIndex: -1 },
    
    header: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
        paddingHorizontal: 22, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20, 
        paddingBottom: 20 
    },
    backBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 13, fontWeight: '900', color: '#F8FAFC', letterSpacing: 2 },
    headerSub: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: 1, marginTop: 4 },
    headerRightBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },

    scrollContent: { paddingHorizontal: 22, paddingBottom: 60 },

    glassCard: { borderRadius: 24, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 25 },
    sectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },
    
    searchBox: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', 
        borderRadius: 18, height: 60, paddingHorizontal: 16, marginBottom: 24, gap: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)'
    },
    iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.12)', justifyContent: 'center', alignItems: 'center' },
    searchText: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', flex: 1, letterSpacing: 0.5 },

    formGrid: { flexDirection: 'row', gap: 15, marginBottom: 12 },
    inputLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 },
    inputPill: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', 
        borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', height: 60, paddingHorizontal: 18 
    },
    inputText: { flex: 1, color: '#FFF', fontSize: 18, fontWeight: '700' },
    inputPrefix: { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: '800', marginRight: 8 },
    inputSuffix: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '900', marginLeft: 8 },

    unitPriceCalc: { color: '#10B981', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    selectorInput: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', 
        borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', height: 60, paddingHorizontal: 18, gap: 12 
    },
    textInnerInput: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '700' },

    obsBox: { 
        backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, 
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' 
    },
    obsInput: { height: 100, textAlignVertical: 'top', padding: 18, color: '#FFF', fontSize: 14, fontWeight: '500' },

    historySectionTitle: { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 15 },
    emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 15 },
    emptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: '600' },

    historyCard: { borderRadius: 22, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    historyIconBg: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center' },
    hProd: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
    hVal: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },
    hSub: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', marginTop: 2, letterSpacing: 0.5 },
    
    historyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
    hSubInfo: { color: '#10B981', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    historyActions: { flexDirection: 'row', gap: 18 },

    btnPrimary: { marginTop: 20, borderRadius: 20, overflow: 'hidden' },
    btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 68, gap: 12 },
    btnPrimaryText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 }
});

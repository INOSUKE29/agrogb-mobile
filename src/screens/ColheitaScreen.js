/**
 * ColheitaScreen.js â€” AgroGB Diamond Pro
 * Ultra Premium Glassmorphism & Neon Glow Design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, FlatList, TouchableOpacity, TextInput, Platform, SafeAreaView, StatusBar, ActivityIndicator, LayoutAnimation, UIManager } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { getCulturas } from '../database/database';
import { useProduction } from '../modules/production/hooks/useProduction';
import ProductModal from '../modules/inventory/components/ProductModal';
import { showToast } from '../ui/Toast';

const DRAFT_KEY = '@draft_ColheitaScreen_v5';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ColheitaScreen({ navigation }) {
    const [tipoRegistro, setTipoRegistro] = useState('COLHEITA'); // COLHEITA, CONGELAMENTO, DESCARTE
    const [dataOperacao, setDataOperacao] = useState(new Date().toLocaleDateString('pt-BR'));
    const [talhao, setTalhao] = useState('');
    const [observacao, setObservacao] = useState('');

    const [itensList, setItensList] = useState([]);

    const [loading, setLoading] = useState(false);
    const [areaModalVisible, setAreaModalVisible] = useState(false);
    const [producaoModalVisible, setProducaoModalVisible] = useState(false);
    const [qtdModalVisible, setQtdModalVisible] = useState(false);
    const [destinoModalVisible, setDestinoModalVisible] = useState(false);
    const [perdaModalVisible, setPerdaModalVisible] = useState(false);

    const [modalProd, setModalProd] = useState(null);
    const [modalQty, setModalQty] = useState('');
    const [modalMotivo, setModalMotivo] = useState('');
    
    const [areasDB, setAreasDB] = useState([]);

    const loadData = useCallback(async () => {
        try {
            setAreasDB(await getCulturas());
        } catch { }
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    useEffect(() => {
        const checkDraft = async () => {
            const saved = await AsyncStorage.getItem(DRAFT_KEY);
            if (saved) {
                Alert.alert('Rascunho Encontrado', 'VocÃª tem um apontamento nÃ£o finalizado.', [
                    { text: 'Descartar', onPress: () => AsyncStorage.removeItem(DRAFT_KEY), style: 'destructive' },
                    { text: 'Continuar', onPress: () => {
                            const d = JSON.parse(saved);
                            setTipoRegistro(d.tipoRegistro || 'COLHEITA');
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

    const handleAddItem = useCallback(() => {
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
        setQtdModalVisible(false);
        setDestinoModalVisible(false);
        setPerdaModalVisible(false);
        setModalQty('');
        setModalMotivo('');
    }, [tipoRegistro, modalProd, modalQty, modalMotivo, itensList]);

    const { saveHarvest, saveFreezing, saveWaste } = useProduction();

    const handleSave = useCallback(async () => {
        if (tipoRegistro === 'COLHEITA' && !talhao) return Alert.alert('Ops', 'Selecione a Ã¡rea (talhÃ£o) de origem.');
        if (itensList.length === 0) return Alert.alert('Ops', 'Adicione pelo menos um item ao registro.');

        setLoading(true);
        try {
            const date = parseDate(dataOperacao);
            const validatedItens = itensList.map(p => {
                const qty = parseFloat(p.quantidade);
                if (isNaN(qty) || qty <= 0) throw new Error(`Quantidade invÃ¡lida para o produto ${p.produto}`);
                return { ...p, numericQty: qty };
            });

            if (tipoRegistro === 'COLHEITA') {
                for (const p of validatedItens) {
                    await saveHarvest({ uuid: uuidv4(), area_id: talhao, cultura_id: talhao, quantidade: p.numericQty * (p.fator || 1), data_colheita: date, observacao });
                }
            } else if (tipoRegistro === 'CONGELAMENTO') {
                for (const d of validatedItens) {
                    await saveFreezing({ produto: d.produto, quantidade_kg: d.numericQty, motivo: observacao || 'CONGELAMENTO MANUAL', data: date });
                }
            } else {
                for (const p of validatedItens) {
                    await saveWaste({ produto: p.produto, quantidade_kg: p.numericQty, motivo: p.motivo + (observacao ? ` - ${observacao}` : ''), data: date });
                }
            }

            showToast('âœ… Registro sincronizado com a base!');
            try { require('../services/AutoSyncService').default.trigger(); } catch {}
            await AsyncStorage.removeItem(DRAFT_KEY);
            navigation.goBack();
        } catch (error) {
            Alert.alert('Erro ao Salvar', error.message || 'Falha ao processar registro.');
        } finally {
            setLoading(false);
        }
    }, [tipoRegistro, talhao, itensList, dataOperacao, observacao, parseDate, saveHarvest, saveFreezing, saveWaste, navigation]);

    const switchMode = (mode) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTipoRegistro(mode);
        setItensList([]);
    };

    const getThemeColor = () => {
        if (tipoRegistro === 'COLHEITA') return '#10B981'; 
        if (tipoRegistro === 'CONGELAMENTO') return '#3B82F6'; 
        return '#F43F5E'; 
    };
    const mainColor = getThemeColor();

    return (
        <View style={styles.webContainer}>
            
            <View style={[styles.ambientOrb1, { backgroundColor: mainColor }]} />
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <View style={styles.mobileFrame}>
                <SafeAreaView style={{ flex: 1 }}>
                    {/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
                            <Ionicons name="chevron-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <View style={{alignItems: 'center', flex: 1, paddingRight: 48}}>
                            <Text style={styles.headerTitle}>Colheita <Text style={{color: mainColor}}>&</Text> SaÃ­das</Text>
                            <Text style={styles.headerSub}>Apontamentos e MovimentaÃ§Ãµes</Text>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        
                        {/* â”€â”€ SEGMENTED CONTROL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                        <View style={styles.segmentedControl}>
                            {[
                                { id: 'COLHEITA', icon: 'basket', label: 'Colheita' },
                                { id: 'CONGELAMENTO', icon: 'snow', label: 'CÃ¢mara Fria' },
                                { id: 'DESCARTE', icon: 'trash', label: 'Perdas' }
                            ].map((mode) => (
                                <TouchableOpacity 
                                    key={mode.id}
                                    style={[
                                        styles.segmentBtn, 
                                        tipoRegistro === mode.id 
                                            ? { backgroundColor: getThemeColor() + '20', borderColor: getThemeColor() + '40', shadowColor: getThemeColor(), shadowOpacity: 0.5, shadowRadius: 10 }
                                            : { backgroundColor: 'transparent', borderColor: 'transparent' }
                                    ]} 
                                    onPress={() => switchMode(mode.id)}
                                >
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <Ionicons name={mode.icon} size={16} color={tipoRegistro === mode.id ? getThemeColor() : "#64748B"} style={{marginRight: 6}} />
                                        <Text style={[styles.segmentText, tipoRegistro === mode.id ? { color: '#FFF' } : { color: '#64748B' }]}>{mode.label}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* â”€â”€ SECTION 1: DADOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                        <View style={styles.glassCard}>
                            <View style={[styles.cardGlowTopLeft, { backgroundColor: mainColor + '20' }]} />

                            <View style={[styles.cardHeaderStrip, { backgroundColor: mainColor + '10', borderColor: mainColor + '30' }]}>
                                <Ionicons name="document-text" size={16} color={mainColor} />
                                <Text style={[styles.cardHeaderTitle, { color: mainColor }]}>1. DADOS DA OPERAÃ‡ÃƒO</Text>
                            </View>

                            <View style={styles.rowGrid}>
                                <View style={{ flex: 0.8 }}>
                                    <View style={styles.labelRow}>
                                        <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                                        <Text style={styles.inputLabel}> DATA</Text>
                                    </View>
                                    <TextInput
                                        style={styles.textInput}
                                        value={dataOperacao}
                                        onChangeText={formatData}
                                        placeholder="DD/MM/AAAA"
                                        placeholderTextColor="#475569"
                                        keyboardType="numeric"
                                        maxLength={10}
                                    />
                                </View>
                                {tipoRegistro === 'COLHEITA' && (
                                    <View style={{ flex: 1.2 }}>
                                        <View style={styles.labelRow}>
                                            <Ionicons name="map-outline" size={14} color="#94A3B8" />
                                            <Text style={styles.inputLabel}> ÃREA (TALHÃƒO)</Text>
                                        </View>
                                        <TouchableOpacity style={styles.selectorInput} onPress={() => setAreaModalVisible(true)}>
                                            <Text style={[styles.selectorText, talhao ? {color: '#FFF'} : {color: '#64748B'} ]} numberOfLines={1}>
                                                {talhao || 'Selecionar...'}
                                            </Text>
                                            <Ionicons name="chevron-down" size={16} color="#64748B" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            <View style={styles.labelRow}>
                                <Ionicons name="chatbox-ellipses-outline" size={14} color="#94A3B8" />
                                <Text style={styles.inputLabel}> NOTAS (OPCIONAL)</Text>
                            </View>
                            <TextInput
                                style={[styles.textInput, { height: 100, textAlignVertical: 'top', paddingTop: 18 }]}
                                value={observacao}
                                onChangeText={setObservacao}
                                placeholder="Clima, equipe responsÃ¡vel, eventos do dia..."
                                placeholderTextColor="#475569"
                                multiline
                            />
                        </View>

                        {/* â”€â”€ SECTION 2: VOLUMES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                        <View style={[styles.glassCard, { marginTop: 18 }]}>
                            <View style={[styles.cardGlowTopLeft, { backgroundColor: mainColor + '20', bottom: -30, right: -30, left: 'auto', top: 'auto' }]} />

                            <View style={[styles.cardHeaderStrip, { backgroundColor: mainColor + '10', borderColor: mainColor + '30' }]}>
                                <Ionicons name="cart" size={16} color={mainColor} />
                                <Text style={[styles.cardHeaderTitle, { color: mainColor }]}>2. VOLUMES ({tipoRegistro})</Text>
                            </View>

                            {itensList.length === 0 ? (
                                <View style={styles.emptyItemsBox}>
                                    <View style={[styles.emptyIconRing, { borderColor: mainColor + '40', backgroundColor: mainColor + '05' }]}>
                                        <MaterialCommunityIcons name="basket-unfill" size={38} color={mainColor} />
                                    </View>
                                    <Text style={styles.emptyItemsText}>Nenhum produto anexado ainda.</Text>
                                    <Text style={styles.emptyItemsSub}>Clique no botÃ£o tracejado abaixo para adicionar.</Text>
                                </View>
                            ) : (
                                itensList.map(item => (
                                    <View key={item.id} style={styles.productItemRow}>
                                        <View style={[styles.productIconBox, { backgroundColor: mainColor + '10', borderColor: mainColor + '30' }]}>
                                            <Ionicons name={'leaf'} size={24} color={mainColor} />
                                        </View>
                                        <View style={{ flex: 1, paddingRight: 10 }}>
                                            <Text style={styles.productTitle} numberOfLines={1}>{item.produto}</Text>
                                            <Text style={styles.productSub}>{item.quantidade} <Text style={{color: '#94A3B8'}}>{item.unidade || 'KG'}</Text> {item.motivo ? `â€¢ ${item.motivo}` : ''}</Text>
                                        </View>
                                        <TouchableOpacity style={styles.removeBtn} onPress={() => setItensList(itensList.filter(i => i.id !== item.id))}>
                                            <Ionicons name="trash-outline" size={20} color="#F43F5E" />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}

                            <TouchableOpacity 
                                style={[styles.dashedAddBtn, { borderColor: mainColor + '50', backgroundColor: mainColor + '05' }]}
                                onPress={() => {
                                    if (tipoRegistro === 'COLHEITA') setProducaoModalVisible(true);
                                    else if (tipoRegistro === 'CONGELAMENTO') setDestinoModalVisible(true);
                                    else setPerdaModalVisible(true);
                                }}
                            >
                                <Ionicons name="add" size={20} color={mainColor} />
                                <Text style={[styles.dashedBtnText, { color: mainColor }]}>ANEXAR {tipoRegistro}</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                            <LinearGradient 
                                colors={[mainColor, tipoRegistro === 'COLHEITA' ? '#047857' : tipoRegistro === 'CONGELAMENTO' ? '#1D4ED8' : '#BE123C']} 
                                style={styles.submitGradient}
                            >
                                {loading ? <ActivityIndicator color="#FFF" /> : (
                                    <>
                                        <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
                                        <Text style={styles.submitText}>CONCLUIR APONTAMENTO</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                    </ScrollView>

                    {/* â”€â”€ MODALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <ProductModal 
                        visible={producaoModalVisible} 
                        onClose={() => setProducaoModalVisible(false)} 
                        onCreated={(p) => { 
                            setModalProd(p); setProducaoModalVisible(false); setQtdModalVisible(true);
                        }} 
                    />

                    <Modal visible={qtdModalVisible || destinoModalVisible || perdaModalVisible} transparent animationType="fade">
                        <View style={styles.modalBg}>
                            <View style={styles.modalSheet}>
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, {color: mainColor}]}>{qtdModalVisible ? 'INFORMAR PRODUÃ‡ÃƒO' : destinoModalVisible ? 'CÃ‚MARA DE CONGELAMENTO' : 'REGISTRO DE PERDAS'}</Text>
                                    <TouchableOpacity onPress={() => { setQtdModalVisible(false); setDestinoModalVisible(false); setPerdaModalVisible(false); }} style={styles.closeBtn}>
                                        <Ionicons name="close" size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>

                                {qtdModalVisible && <Text style={styles.subFocusText}>{modalProd?.nome}</Text>}

                                {perdaModalVisible && (
                                    <>
                                        <Text style={styles.inputLabel}>MOTIVO DO DESCARTE</Text>
                                        <TextInput
                                            style={[styles.textInput, { marginBottom: 20 }]}
                                            value={modalMotivo}
                                            onChangeText={setModalMotivo}
                                            placeholder="Ex: PÃ¡ssaros, Chuva, PodridÃ£o..."
                                            placeholderTextColor="#475569"
                                        />
                                    </>
                                )}

                                <Text style={styles.inputLabel}>QUANTIDADE {qtdModalVisible ? '(Caixas)' : '(KG)'}</Text>
                                <View style={[styles.qtyBox, { borderColor: mainColor + '40' }]}>
                                    <TextInput
                                        style={[styles.qtyInput, { color: mainColor }]}
                                        value={modalQty}
                                        onChangeText={setModalQty}
                                        keyboardType="decimal-pad"
                                        placeholder="0.0"
                                        placeholderTextColor="#334155"
                                        autoFocus
                                    />
                                </View>

                                <TouchableOpacity style={styles.confirmBtnFull} onPress={handleAddItem}>
                                    <LinearGradient colors={[mainColor, mainColor + '90']} style={styles.confirmBtnGradientFull}>
                                        <Ionicons name="checkmark-done" size={20} color="#FFF" />
                                        <Text style={styles.confirmTextFull}>ANEXAR VOLUME</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    <Modal visible={areaModalVisible} transparent animationType="slide">
                        <View style={styles.modalBg}>
                            <View style={[styles.modalSheet, { maxHeight: '80%', paddingBottom: 20 }]}>
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, {color: '#FFF', fontSize: 16}]}>SELECIONAR ÃREA</Text>
                                    <TouchableOpacity onPress={() => setAreaModalVisible(false)} style={styles.closeBtn}>
                                        <Ionicons name="close" size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={areasDB}
                                    keyExtractor={i => i.uuid}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={styles.modalListItem} onPress={() => { setTalhao(item.nome); setAreaModalVisible(false); }}>
                                            <View style={styles.modalListItemDot} />
                                            <Text style={styles.modalListText}>{item.nome}</Text>
                                            <Ionicons name="chevron-forward" size={18} color="#475569" />
                                        </TouchableOpacity>
                                    )}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                />
                            </View>
                        </View>
                    </Modal>
                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    webContainer: { flex: 1, backgroundColor: '#020617' }, 
    mobileFrame: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
    ambientOrb1: { position: 'absolute', top: -50, left: -50, width: 300, height: 300, borderRadius: 150, opacity: 0.08 },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 25, paddingBottom: 20 },
    backBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: '#94A3B8', marginTop: 2, fontWeight: '600' },

    scrollContent: { padding: 22, paddingBottom: 120 },

    segmentedControl: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, padding: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 28 },
    segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 14, borderWidth: 1 },
    segmentText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

    glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
    cardGlowTopLeft: { position: 'absolute', top: -30, left: -30, width: 90, height: 90, borderRadius: 45 },
    
    cardHeaderStrip: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, alignSelf: 'flex-start', borderWidth: 1 },
    cardHeaderTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginLeft: 10 },

    rowGrid: { flexDirection: 'row', gap: 14 },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 12 },
    inputLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginLeft: 8 },
    
    textInput: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingHorizontal: 20, height: 60, color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
    
    selectorInput: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingHorizontal: 20, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    selectorText: { fontSize: 15, fontWeight: '700', flex: 1 },

    emptyItemsBox: { alignItems: 'center', paddingVertical: 40 },
    emptyIconRing: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyItemsText: { color: '#FFF', fontSize: 16, fontWeight: '900', textAlign: 'center' },
    emptyItemsSub: { color: '#64748B', fontSize: 13, marginTop: 6, fontWeight: '600' },

    productItemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    productIconBox: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1 },
    productTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
    productSub: { color: '#FFF', fontSize: 14, marginTop: 4, fontWeight: '900' },
    removeBtn: { padding: 12, backgroundColor: 'rgba(244, 63, 94, 0.15)', borderRadius: 14 },

    dashedAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', marginTop: 10 },
    dashedBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 1, marginLeft: 12 },

    submitBtn: { shadowColor: '#10B981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15, marginTop: 35 },
    submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 22, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', gap: 12 },
    submitText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },

    // Modal
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center' },
    modalSheet: { width: '90%', maxWidth: 500, alignSelf: 'center', backgroundColor: '#0B1120', borderRadius: 30, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
    subFocusText: { color: '#F8FAFC', fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5, marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
    closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    
    modalListItem: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center' },
    modalListItemDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#38BDF8', marginRight: 15 },
    modalListText: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', flex: 1 },

    qtyBox: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderRadius: 20, marginBottom: 30 },
    qtyInput: { height: 80, textAlign: 'center', fontSize: 36, fontWeight: '900' },

    confirmBtnFull: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },
    confirmBtnGradientFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 18, gap: 10 },
    confirmTextFull: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
});


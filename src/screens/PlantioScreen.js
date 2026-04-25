import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, FlatList, ActivityIndicator, StyleSheet, TextInput, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCadastro } from '../database/database';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { showToast } from '../ui/Toast';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlantio } from '../modules/production/hooks/usePlantio';
import { useInventory } from '../modules/inventory/hooks/useInventory';
import { useTheme } from '../theme/ThemeContext';
import AppHeader from '../components/ui/AppHeader';

export default function PlantioScreen({ navigation }) {
    const { colors } = useTheme();
    const { history, loading: loadingPlantio, loadHistory, registerPlanting, removePlanting } = usePlantio();
    const { items: stockItems, fetchStock: loadStock } = useInventory();

    const [talhao, setTalhao] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [variedade, setVariedade] = useState('');
    const [previsao, setPrevisao] = useState('');
    const [observacao, setObservacao] = useState('');
    
    const [selectedSeed, setSelectedSeed] = useState(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState('PÉS');

    useFocusEffect(useCallback(() => { 
        loadHistory(); 
        loadStock();
    }, [loadHistory, loadStock]));

    const openSelector = useCallback(async (type) => {
        setModalType(type);
        setLoading(true);
        setModalVisible(true);
        try {
            if (type === 'SEMENTE') {
                setItems(stockItems.filter(i => i.quantidade > 0));
            } else {
                const all = await getCadastro();
                const filtered = all.filter(i => i.tipo === type);
                setItems(filtered);
            }
        } catch { } finally { setLoading(false); }
    }, [stockItems]);

    const handleSelect = useCallback((item) => {
        if (modalType === 'AREA') {
            setTalhao(item.nome);
        } else if (modalType === 'SEMENTE') {
            setSelectedSeed(item);
            setVariedade(item.produto);
            setSelectedUnit(item.unidade || 'KG');
            setPrevisao(calcularPrevisaoAutomata(item.produto));
        } else {
            setVariedade(item.nome);
            setSelectedUnit(item.unidade || 'PÉS');
            setSelectedSeed(null);
            setPrevisao(calcularPrevisaoAutomata(item.nome));
        }
        setModalVisible(false);
    }, [modalType]);

    const calcularPrevisaoAutomata = (cult) => {
        if (!cult) return '';
        const name = cult.toLowerCase();
        let addDays = 90;
        if (name.includes('morango')) addDays = 90;
        else if (name.includes('alface')) addDays = 45;
        else if (name.includes('milho')) addDays = 120;
        else if (name.includes('tomate')) addDays = 100;
        
        const date = new Date();
        date.setDate(date.getDate() + addDays);
        const mes = (date.getMonth() + 1).toString().padStart(2, '0');
        const ano = date.getFullYear();
        return `${mes}/${ano}`;
    };

    const salvar = useCallback(async () => {
        if (!talhao || !quantidade || !variedade) {
            Alert.alert('Atenção', 'Área, Cultura e Quantidade são obrigatórios.');
            return;
        }

        const dados = {
            cultura: variedade.toUpperCase(),
            tipo_plantio: talhao.toUpperCase(),
            quantidade_pes: parseInt(quantidade) || 0,
            observacao: `PREV: ${previsao} | ${observacao}`.toUpperCase()
        };

        try {
            await registerPlanting(dados, selectedSeed);
            setTalhao(''); setQuantidade(''); setVariedade(''); setPrevisao(''); setObservacao(''); setSelectedSeed(null);
            setSuccessModalVisible(true);
        } catch (err) {
            Alert.alert('Erro', 'Falha ao registrar plantio.');
        }
    }, [talhao, quantidade, variedade, previsao, observacao, selectedSeed, registerPlanting]);

    const handleLongPress = useCallback((item) => {
        Alert.alert('Gerenciar Plantio', `Ação para: ${item.cultura} em ${item.tipo_plantio}`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'EXCLUIR',
                style: 'destructive',
                onPress: async () => {
                    await removePlanting(item.uuid);
                    showToast('Registro removido.');
                }
            }
        ]);
    }, [removePlanting]);

    const memoHistory = useMemo(() => history, [history]);

    return (
        <View style={[styles.webContainer, { backgroundColor: colors.bg }]}>
            <LinearGradient colors={[colors.headerBg[0], colors.bg, '#030712']} style={StyleSheet.absoluteFill} />
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <View style={styles.mobileFrame}>
                <SafeAreaView style={{ flex: 1 }}>
                    <AppHeader title="Plantio" subtitle="Gestão de Culturas e Lotes" showBack={true} />

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        
                        {/* 🚜 HUB ACCESS: PLANO SAFRA */}
                        <TouchableOpacity 
                            style={styles.hubPill} 
                            onPress={() => navigation.navigate('PlanoAdubacao')}
                        >
                            <LinearGradient 
                                colors={['rgba(52, 211, 153, 0.15)', 'rgba(52, 211, 153, 0.05)']} 
                                style={styles.hubPillGradient}
                            >
                                <View style={styles.hubIconBox}>
                                    <Ionicons name="map" size={20} color="#34D399" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.hubTitle}>PLANO SAFRA E ADUBAÇÃO</Text>
                                    <Text style={styles.hubSub}>Planejamento técnico e metas da safra</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="rgba(52, 211, 153, 0.5)" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.glassCard}>
                            <View style={styles.cardHeaderStrip}>
                                <MaterialCommunityIcons name="sprout" size={18} color="#34D399" />
                                <Text style={styles.cardHeaderTitle}>NOVO CICLO DE PLANTIO</Text>
                            </View>

                            <View style={styles.labelRow}>
                                <Ionicons name="map-outline" size={14} color="#34D399" />
                                <Text style={styles.inputLabel}> ÁREA / LOTE / TALHÃO</Text>
                            </View>
                            <TouchableOpacity style={styles.selectorInput} onPress={() => openSelector('AREA')}>
                                <Text style={[styles.selectorText, talhao ? {color: '#FFF'} : {color: '#6B7280'}]}>
                                    {talhao || 'Selecionar área de plantio...'}
                                </Text>
                                <View style={styles.inputIconBox}>
                                    <Ionicons name="location-sharp" size={16} color="#34D399" />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.labelRow}>
                                <Ionicons name="leaf-outline" size={14} color="#34D399" />
                                <Text style={styles.inputLabel}> FONTE DA VARIEDADE</Text>
                            </View>
                            
                            {/* Segmented Control Moderno */}
                            <View style={styles.segmentedControl}>
                                <TouchableOpacity 
                                    style={[styles.segmentBtn, modalType !== 'SEMENTE' && styles.segmentBtnActive]} 
                                    onPress={() => openSelector('CULTURA')}
                                >
                                    <Ionicons name="library" size={14} color={modalType !== 'SEMENTE' ? "#FFF" : "#6B7280"} style={{marginRight: 6}}/>
                                    <Text style={[styles.segmentText, modalType !== 'SEMENTE' && styles.segmentTextActive]}>Catálogo Aberto</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.segmentBtn, modalType === 'SEMENTE' && styles.segmentBtnActive]} 
                                    onPress={() => openSelector('SEMENTE')}
                                >
                                    <Ionicons name="cube" size={14} color={modalType === 'SEMENTE' ? "#FFF" : "#6B7280"} style={{marginRight: 6}}/>
                                    <Text style={[styles.segmentText, modalType === 'SEMENTE' && styles.segmentTextActive]}>Meu Estoque</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={[styles.selectorInput, {marginTop: 15}]} onPress={() => openSelector(selectedSeed ? 'SEMENTE' : 'CULTURA')}>
                                <Text style={[styles.selectorText, variedade ? {color: '#FFF'} : {color: '#6B7280'}]}>
                                    {variedade || (modalType === 'SEMENTE' ? 'Escolher semente no estoque...' : 'Escolher variedade no arquivo...')}
                                </Text>
                                <View style={styles.inputIconBox}>
                                    <Ionicons name={selectedSeed ? "layers" : "leaf"} size={16} color="#34D399" />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.rowGrid}>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.labelRow}>
                                        <Ionicons name="apps-outline" size={14} color="#34D399" />
                                        <Text style={styles.inputLabel}> QUANTIDADE ({selectedUnit})</Text>
                                    </View>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Ex: 5000"
                                        placeholderTextColor="#6B7280"
                                        value={quantidade}
                                        onChangeText={setQuantidade}
                                        keyboardType="numeric"
                                    />
                                    <View style={styles.quickBtnGroup}>
                                        {[100, 500, 1000].map(val => (
                                            <TouchableOpacity 
                                                key={val} 
                                                style={styles.quickBtn}
                                                onPress={() => setQuantidade((parseInt(quantidade || 0) + val).toString())}
                                            >
                                                <Text style={styles.quickBtnText}>+{val}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.labelRow}>
                                        <Ionicons name="calendar-outline" size={14} color="#34D399" />
                                        <Text style={styles.inputLabel}> PREVISÃO</Text>
                                    </View>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="MM/AAAA"
                                        placeholderTextColor="#6B7280"
                                        value={previsao}
                                        onChangeText={t => setPrevisao(t.toUpperCase())}
                                    />
                                    <Text style={styles.helperText}>Preenchimento automático via algoritmo nativo.</Text>
                                </View>
                            </View>

                            <View style={styles.labelRow}>
                                <Ionicons name="document-text-outline" size={14} color="#34D399" />
                                <Text style={styles.inputLabel}> DIÁRIO BASE (Opcional)</Text>
                            </View>
                            <TextInput
                                style={[styles.textInput, { height: 90, textAlignVertical: 'top', paddingTop: 15 }]}
                                placeholder="Registre o clima do dia, solo, etc..."
                                placeholderTextColor="#6B7280"
                                value={observacao}
                                onChangeText={t => setObservacao(t.toUpperCase())}
                                multiline
                            />

                            <TouchableOpacity style={styles.submitBtn} onPress={salvar}>
                                <LinearGradient colors={['#10B981', '#047857']} style={styles.submitGradient}>
                                    {loadingPlantio ? (
                                        <ActivityIndicator color="#FFF" size="small" />
                                    ) : (
                                        <Text style={styles.submitText}>LANÇAR PLANTIO</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionTitle}>ÚLTIMOS CICLOS ABERTOS</Text>

                        {memoHistory.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="sprout-outline" size={40} color="rgba(255,255,255,0.1)" />
                                <Text style={styles.emptyText}>Nenhuma roça ativa registrada.</Text>
                            </View>
                        ) : (
                            memoHistory.map((item) => (
                                <TouchableOpacity
                                    key={item.uuid}
                                    activeOpacity={0.7}
                                    onLongPress={() => handleLongPress(item)}
                                >
                                    <View style={styles.historyCard}>
                                        <View style={styles.historyRow}>
                                            <View style={styles.historyIconBox}>
                                                <MaterialCommunityIcons name="sprout" size={24} color="#34D399" />
                                            </View>
                                            <View style={styles.historyCenter}>
                                                <Text style={styles.historyVar}>{item.cultura}</Text>
                                                <Text style={styles.historyArea}>{item.tipo_plantio}</Text>
                                            </View>
                                            <View style={styles.historyBadge}>
                                                <Text style={styles.historyDate}>{item.data.split('-').reverse().slice(0, 2).join('/')}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.historyFooter}>
                                            <View style={{flexDirection:'row', alignItems:'center'}}>
                                                <Ionicons name="apps-outline" size={14} color="#34D399" />
                                                <Text style={styles.historyUnits}> {item.quantidade_pes} {item.unidade || 'PÉS'}</Text>
                                            </View>
                                            {item.observacao ? (
                                                <Text style={styles.historyObs} numberOfLines={1}>{item.observacao}</Text>
                                            ) : null}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}

                    </ScrollView>

                    {/* SELECTOR MODAL */}
                    <Modal visible={modalVisible} animationType="slide" transparent>
                        <View style={styles.modalBg}>
                            <View style={styles.modalGlass}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>SELECIONAR {modalType}</Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                        <Ionicons name="close" size={24} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>

                                {loading ? <ActivityIndicator color="#34D399" size="large" style={{ marginTop: 40 }} /> :
                                    <FlatList
                                        data={items}
                                        keyExtractor={i => i.uuid || (i.id ? i.id.toString() : Math.random().toString())}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={styles.modalItem}
                                                onPress={() => handleSelect(item)}
                                            >
                                                <View>
                                                    <Text style={styles.modalItemTitle}>{item.nome || item.produto}</Text>
                                                    <Text style={styles.modalItemSub}>
                                                        {item.unidade || 'UN'} {item.quantidade !== undefined ? `(Disp: ${item.quantidade})` : ''}
                                                    </Text>
                                                </View>
                                                <Ionicons name="chevron-forward" size={18} color="#34D399" />
                                            </TouchableOpacity>
                                        )}
                                    />
                                }
                            </View>
                        </View>
                    </Modal>

                    {/* SUCCESS MODAL */}
                    <Modal visible={successModalVisible} animationType="fade" transparent>
                        <View style={styles.modalOverlayCpf}>
                            <View style={styles.successModalBody}>
                                <View style={styles.successIconBox}>
                                    <MaterialCommunityIcons name="check-decagram" size={50} color="#10B981" />
                                </View>
                                <Text style={styles.successTitle}>Plantio Lançado!</Text>
                                <Text style={styles.successDesc}>A cultura foi registrada e seus custos ou insumos atualizados paralelamente no silo virtual.</Text>
                                
                                <View style={{ width: '100%', gap: 10, marginTop: 15 }}>
                                    <TouchableOpacity style={styles.submitBtn} onPress={() => { setSuccessModalVisible(false); navigation.navigate('CadernoCampo'); }}>
                                        <LinearGradient colors={['#10B981', '#047857']} style={styles.submitGradient}>
                                            <Text style={styles.submitText}>IR PARA CADERNO</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => setSuccessModalVisible(false)}>
                                        <Text style={styles.secondaryBtnText}>VOLTAR A PLANTAR</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    webContainer: { flex: 1, alignItems: 'center', backgroundColor: '#000' },
    mobileFrame: { flex: 1, width: '100%', maxWidth: 480, position: 'relative' },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20, paddingBottom: 15 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
    headerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

    scrollContent: { padding: 20, paddingBottom: 100 },
    
    hubPill: { marginBottom: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.2)' },
    hubPillGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
    hubIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(52, 211, 153, 0.2)', justifyContent: 'center', alignItems: 'center' },
    hubTitle: { color: '#34D399', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    hubSub: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2, fontWeight: '600' },

    glassCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', shadowColor: '#000', shadowOffset:{width:0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    cardHeaderStrip: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, backgroundColor: 'rgba(52, 211, 153, 0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.3)' },
    cardHeaderTitle: { color: '#34D399', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginLeft: 8 },

    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 20 },
    inputLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    
    selectorInput: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingLeft: 18, paddingRight: 8, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    selectorText: { fontSize: 14, fontWeight: '600', flex: 1 },
    inputIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(52,211,153,0.1)', justifyContent: 'center', alignItems: 'center' },

    segmentedControl: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: 10, backgroundColor: 'transparent' },
    segmentBtnActive: { backgroundColor: 'rgba(52,211,153,0.15)' },
    segmentText: { color: '#6B7280', fontSize: 12, fontWeight: '800' },
    segmentTextActive: { color: '#FFF' },

    rowGrid: { flexDirection: 'row', gap: 16 },
    textInput: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 18, height: 56, color: '#FFF', fontSize: 15, fontWeight: '600' },

    quickBtnGroup: { flexDirection: 'row', gap: 8, marginTop: 10 },
    quickBtn: { backgroundColor: 'rgba(52,211,153,0.1)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)', flex: 1, alignItems: 'center' },
    quickBtnText: { color: '#34D399', fontSize: 11, fontWeight: '800' },
    helperText: { color: '#6B7280', fontSize: 9, marginTop: 8, fontStyle: 'italic', paddingLeft: 5 },

    submitBtn: { shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 8, marginTop: 35 },
    submitGradient: { padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#34D399' },
    submitText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1.5, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 },

    sectionTitle: { color: '#9CA3AF', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginTop: 30, marginBottom: 15, marginLeft: 5 },

    historyCard: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    historyIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(52, 211, 153, 0.1)', justifyContent: 'center', alignItems: 'center' },
    historyCenter: { flex: 1 },
    historyVar: { color: '#F3F4F6', fontSize: 14, fontWeight: 'bold' },
    historyArea: { color: '#6B7280', fontSize: 11, marginTop: 2 },
    historyBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    historyDate: { color: '#9CA3AF', fontSize: 10, fontWeight: '800' },

    historyFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    historyUnits: { color: '#FFF', fontSize: 12, fontWeight: '800' },
    historyObs: { color: '#6B7280', fontSize: 10, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 15 },

    emptyState: { alignItems: 'center', padding: 20 },
    emptyText: { color: '#6B7280', fontSize: 13, marginTop: 10 },

    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center' },
    modalGlass: { width: '90%', maxWidth: 500, alignSelf: 'center', backgroundColor: '#111827', borderRadius: 24, padding: 25, maxHeight: '80%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: '#D1FAE5', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    closeBtn: { padding: 5 },
    
    modalItem: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 18, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    modalItemTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
    modalItemSub: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },

    modalOverlayCpf: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    successModalBody: { width: '100%', maxWidth: 500, backgroundColor: '#111827', padding: 25, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)', alignItems: 'center' },
    successIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16,185,129,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
    successTitle: { color: '#10B981', fontSize: 20, fontWeight: '900', marginBottom: 10 },
    successDesc: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', lineHeight: 20 },
    
    secondaryBtn: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', marginTop: 5 },
    secondaryBtnText: { color: '#9CA3AF', fontWeight: 'bold', fontSize: 13 }
});

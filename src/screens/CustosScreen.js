import React, { useState, useEffect, useMemo } from 'react';
import { 
    View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, 
    Modal, TextInput, Platform, SafeAreaView, StatusBar, 
    ActivityIndicator, FlatList 
} from 'react-native';
import { getCostCategories, insertCostCategory, getCadastro } from '../database/database';
import { FinanceService } from '../modules/finance/services/FinanceService';
import { Ionicons } from '@expo/vector-icons';
import AutoSyncService from '../services/AutoSyncService';
import { showToast } from '../ui/Toast';
import { LinearGradient } from 'expo-linear-gradient';


export default function CustosScreen({ navigation }) {
    const [categoria, setCategoria] = useState(null);
    const [quantidade, setQuantidade] = useState('1');
    const [valorUnitario, setValorUnitario] = useState('');
    const [observacao, setObservacao] = useState('');
    const [culture, setCulture] = useState(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [items, setItems] = useState([]);
    const [culturasDB, setCulturasDB] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [cultureModalVisible, setCultureModalVisible] = useState(false);

    const [newCatModalVisible, setNewCatModalVisible] = useState(false);
    const [newCatName, setNewCatName] = useState('');

    useEffect(() => { loadItems(); }, []);

    const loadItems = async () => {
        setLoading(true);
        try {
            let categories = await getCostCategories();
            
            if (!categories || categories.length === 0) {
                const defaultCats = [
                    'SEMENTES E MUDAS', 'FERTILIZANTES E ADUBOS', 'DEFENSIVOS AGRÃCOLAS', 
                    'MANUTENÃ‡ÃƒO DE MÃQUINAS', 'COMBUSTÃVEL', 'MÃƒO DE OBRA', 
                    'SERVIÃ‡OS TERCEIRIZADOS', 'ENERGIA ELÃ‰TRICA', 'IMPOSTOS E TAXAS', 'OUTROS'
                ];
                for (const cat of defaultCats) {
                    await insertCostCategory(cat, 'VARIÃVEL');
                }
                categories = await getCostCategories();
            }
            
            setItems(categories);
            const allCadastros = await getCadastro();
            setCulturasDB(allCadastros.filter(i => i.tipo === 'CULTURA'));
        } catch (e) {
            console.error(e);
        } finally { setLoading(false); }
    };

    const getFilteredCategories = () => {
        if (!searchText) return items;
        return items.filter(i => i.name.toUpperCase().includes(searchText.toUpperCase()));
    };

    const calcularTotal = useMemo(() => {
        const q = parseFloat(quantidade) || 0;
        const v = parseFloat(valorUnitario) || 0;
        return (q * v).toFixed(2);
    }, [quantidade, valorUnitario]);

    const salvarNovaCategoria = async () => {
        if (!newCatName) return Alert.alert('AtenÃ§Ã£o', 'Informe o nome.');
        try {
            await insertCostCategory(newCatName, 'VARIÃVEL');
            setNewCatModalVisible(false); setNewCatName(''); loadItems();
            showToast('âœ… Categoria salva!');
        } catch { Alert.alert('Erro', 'NÃ£o foi possÃ­vel salvar.'); }
    };

    const salvar = async () => {
        if (!categoria || !quantidade || !valorUnitario) {
            return Alert.alert('AtenÃ§Ã£o', 'Informe Categoria, Quantidade e Valor.');
        }
        setIsSaving(true);
        const dados = {
            category_id: categoria.id,
            culture_id: culture ? culture.id : null,
            quantity: parseFloat(quantidade) || 0,
            unit_value: parseFloat(valorUnitario) || 0,
            notes: observacao.toUpperCase(),
            produto: categoria.name, 
            tipo: categoria.type || 'GERAL',
            data: new Date().toISOString().split('T')[0],
            pago: true
        };
        try {
            await FinanceService.recordCost(dados);
            showToast('âœ… Custo registrado!');
            try { AutoSyncService.trigger(); } catch (e) {}
            navigation.goBack();
        } catch { 
            Alert.alert('Erro', 'NÃ£o foi possÃ­vel salvar.'); 
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.webContainer}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            

            {/* ðŸŒ€ AMBIENT ORBS */}
            <View style={[styles.ambientOrb, { top: -40, right: -60, backgroundColor: '#10B981', opacity: 0.1 }]} />
            <View style={[styles.ambientOrb, { bottom: 80, left: -80, backgroundColor: '#D4AF37', opacity: 0.08 }]} />

            <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
                
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
                        <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.headerTitle}>CUSTOS & DESPESAS</Text>
                        <Text style={styles.headerSub}>SAÃDA DE CAPITAL OPERACIONAL</Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    <Text style={styles.sectionTitle}>ALOCAÃ‡ÃƒO DE CUSTO</Text>
                    <View intensity={20} style={styles.glassCard} webFallbackColor="rgba(255,255,255,0.03)">
                        <TouchableOpacity style={styles.cardActionRow} onPress={() => setCultureModalVisible(true)}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                                <Ionicons name="leaf" size={20} color="#D4AF37" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.mainValue}>{culture?.nome || 'GERAL / NÃƒO ALOCADO'}</Text>
                                <Text style={styles.subValue}>{culture ? 'CUSTO ATRIBUÃDO Ã€ CULTURA' : 'DESPESA ADMINISTRATIVA'}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.sectionTitle, { marginTop: 25 }]}>DETALHES DA DESPESA</Text>
                    <View intensity={20} style={styles.glassCard} webFallbackColor="rgba(255,255,255,0.03)">
                        
                        <View style={styles.quickCatRow}>
                            {['MÃ£o de Obra', 'CombustÃ­vel', 'Insumos'].map(quickCat => {
                                const isSelected = categoria?.name === quickCat.toUpperCase();
                                return (
                                    <TouchableOpacity 
                                        key={quickCat}
                                        style={[styles.quickCatBtn, isSelected && styles.quickCatBtnActive]}
                                        onPress={() => {
                                            const found = items.find(i => i.name.toUpperCase() === quickCat.toUpperCase());
                                            if (found) setCategoria(found);
                                            else setCategoria({ id: Math.random(), name: quickCat.toUpperCase(), type: 'GERAL' });
                                        }}
                                    >
                                        <Text style={[styles.quickCatText, isSelected && { color: '#FFF' }]}>{quickCat.toUpperCase()}</Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>

                        <TouchableOpacity style={styles.selectorInput} onPress={() => setModalVisible(true)}>
                            <Ionicons name="pricetag" size={18} color="rgba(255,255,255,0.4)" />
                            <Text style={[styles.selectorText, !categoria && { color: 'rgba(255,255,255,0.25)' }]} numberOfLines={1}>
                                {categoria ? categoria.name : 'OUTRAS CATEGORIAS...'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.3)" />
                        </TouchableOpacity>

                        <View style={styles.formGrid}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>QUANTIDADE</Text>
                                <View style={styles.inputPill}>
                                    <TextInput
                                        style={styles.inputText}
                                        placeholder="1"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        value={quantidade}
                                        onChangeText={setQuantidade}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>VALOR UNIT. (R$)</Text>
                                <View style={styles.inputPill}>
                                    <TextInput
                                        style={styles.inputText}
                                        placeholder="0,00"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        value={valorUnitario}
                                        onChangeText={setValorUnitario}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* TOTAL DIAMOND BOX */}
                        <View intensity={50} style={styles.totalGlassBox} webFallbackColor="rgba(212, 175, 55, 0.05)">
                            
                            <View style={styles.totalRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={styles.totalIconBg}>
                                        <Ionicons name="cash" size={18} color="#D4AF37" />
                                    </View>
                                    <Text style={styles.totalLabel}>VALOR TOTAL</Text>
                                </View>
                                <Text style={styles.totalValue}>R$ {calcularTotal}</Text>
                            </View>
                        </View>

                        <Text style={styles.inputLabel}>OBSERVAÃ‡Ã•ES GERAIS</Text>
                        <View style={styles.obsBox}>
                            <TextInput
                                style={styles.obsInput}
                                placeholder="NOTAS OU JUSTIFICATIVAS..."
                                placeholderTextColor="rgba(255,255,255,0.2)"
                                value={observacao}
                                onChangeText={setObservacao}
                                multiline
                            />
                            <TouchableOpacity style={styles.photoContainer}>
                                <Ionicons name="camera" size={18} color="#10B981" />
                                <Text style={styles.photoText}>ANEXAR COMPROVANTE</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.btnPrimary} onPress={salvar} disabled={isSaving}>
                        <LinearGradient colors={['#10B981', '#059669']} style={styles.btnGradient}>
                            {isSaving ? <ActivityIndicator color="#FFF" /> : (
                                <>
                                    <Ionicons name="server" size={20} color="#FFF" />
                                    <Text style={styles.btnPrimaryText}>EFETIVAR LANÃ‡AMENTO</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                </ScrollView>

                {/* MODAL CATEGORIA */}
                <Modal visible={modalVisible} animationType="slide" transparent>
                    <View style={styles.modalBg}>
                        <View intensity={60} style={styles.modalSheet} webFallbackColor="#020617">
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>SELECIONAR CATEGORIA</Text>
                                <TouchableOpacity onPress={() => setNewCatModalVisible(true)} style={styles.modalAddBtn}>
                                    <Ionicons name="add" size={24} color="#10B981" />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.searchBox}>
                                <Ionicons name="search" size={18} color="rgba(255,255,255,0.3)" />
                                <TextInput style={styles.searchText} placeholder="BUSCAR CATEGORIA..." placeholderTextColor="rgba(255,255,255,0.2)" value={searchText} onChangeText={setSearchText} />
                            </View>
                            
                            <FlatList
                                data={getFilteredCategories()}
                                keyExtractor={i => i.id.toString()}
                                style={{ maxHeight: 350, marginTop: 10 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.pickItem} onPress={() => { setCategoria(item); setModalVisible(false); }}>
                                        <View>
                                            <Text style={styles.pickText}>{item.name}</Text>
                                            <Text style={styles.itemSub}>{item.type?.toUpperCase() || 'GERAL'}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
                                    </TouchableOpacity>
                                )}
                            />
                            
                            <TouchableOpacity style={styles.btnModalClose} onPress={() => setModalVisible(false)}>
                                <Text style={styles.btnModalCloseText}>FECHAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* MODAL NOVA CATEGORIA */}
                <Modal visible={newCatModalVisible} animationType="fade" transparent>
                    <View style={styles.modalBg}>
                        <View style={styles.modalSheetSmall}>
                            <Text style={styles.modalTitle}>NOVA CATEGORIA</Text>
                            <View style={[styles.inputPill, { marginTop: 15, marginBottom: 25 }]}>
                                <TextInput style={styles.inputText} value={newCatName} onChangeText={t => setNewCatName(t.toUpperCase())} placeholder="NOME DA CATEGORIA" placeholderTextColor="rgba(255,255,255,0.2)" />
                            </View>
                            
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity style={styles.btnModalSecondary} onPress={() => setNewCatModalVisible(false)}>
                                    <Text style={styles.btnModalSecondaryText}>CANCELAR</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnModalPrimary} onPress={salvarNovaCategoria}>
                                    <Text style={styles.btnModalPrimaryText}>SALVAR</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* MODAL CULTURA */}
                <Modal visible={cultureModalVisible} animationType="slide" transparent>
                    <View style={styles.modalBg}>
                        <View intensity={60} style={styles.modalSheet} webFallbackColor="#020617">
                            <Text style={styles.modalTitle}>EXCLUIR / MUDAR CULTURA</Text>
                            <FlatList
                                data={[{ id: null, nome: 'GERAL / NÃƒO ALOCADO' }, ...culturasDB]}
                                keyExtractor={i => i.id ? i.id.toString() : 'geral'}
                                style={{ maxHeight: 400, marginTop: 15 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.pickItem} onPress={() => { setCulture(item.id ? item : null); setCultureModalVisible(false); }}>
                                        <Text style={[styles.pickText, (culture?.id === item.id || (!item.id && !culture)) && { color: '#D4AF37' }]}>{item.nome}</Text>
                                        <Ionicons 
                                            name={(culture?.id === item.id || (!item.id && !culture)) ? 'checkmark-circle' : 'ellipse-outline'} 
                                            size={22} 
                                            color={(culture?.id === item.id || (!item.id && !culture)) ? '#D4AF37' : 'rgba(255,255,255,0.1)'} 
                                        />
                                    </TouchableOpacity>
                                )}
                            />
                            <TouchableOpacity style={styles.btnModalClose} onPress={() => setCultureModalVisible(false)}>
                                <Text style={styles.btnModalCloseText}>VOLTAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

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

    scrollContent: { paddingHorizontal: 22, paddingBottom: 60 },

    sectionTitle: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 12, marginLeft: 2 },
    
    glassCard: { borderRadius: 24, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 20 },
    cardActionRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    mainValue: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
    subValue: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, fontWeight: '600', letterSpacing: 0.5 },

    quickCatRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    quickCatBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' },
    quickCatBtnActive: { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.08)' },
    quickCatText: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900' },

    selectorInput: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', 
        borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', height: 60, paddingHorizontal: 18, gap: 12, marginBottom: 20 
    },
    selectorText: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '700' },

    formGrid: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    inputLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 },
    inputPill: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', 
        borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', height: 60, paddingHorizontal: 18 
    },
    inputText: { flex: 1, color: '#FFF', fontSize: 18, fontWeight: '700' },

    totalGlassBox: { borderRadius: 24, paddingVertical: 22, paddingHorizontal: 24, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.25)', overflow: 'hidden' },
    totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    totalIconBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(212, 175, 55, 0.15)', justifyContent: 'center', alignItems: 'center' },
    totalLabel: { color: '#D4AF37', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
    totalValue: { color: '#FFF', fontSize: 24, fontWeight: '900' },

    obsBox: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
    obsInput: { height: 100, textAlignVertical: 'top', padding: 18, color: '#FFF', fontSize: 14, fontWeight: '500' },
    photoContainer: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, 
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', gap: 10 
    },
    photoText: { color: '#10B981', fontSize: 11, fontWeight: '900' },

    btnPrimary: { borderRadius: 20, overflow: 'hidden', marginTop: 10 },
    btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 68, gap: 12 },
    btnPrimaryText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },

    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#0A0F1C', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    modalSheetSmall: { backgroundColor: '#020617', borderRadius: 32, padding: 28, width: '90%', alignSelf: 'center', marginBottom: 'auto', marginTop: 'auto', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: '#F8FAFC', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
    modalAddBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center' },
    
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, height: 54, paddingHorizontal: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    searchText: { color: '#FFF', fontSize: 15, flex: 1, fontWeight: '600' },
    
    pickItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
    pickText: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
    itemSub: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 4, fontWeight: '800' },

    btnModalClose: { marginTop: 25, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    btnModalCloseText: { color: '#F8FAFC', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

    btnModalPrimary: { flex: 1, height: 56, borderRadius: 16, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
    btnModalPrimaryText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
    btnModalSecondary: { flex: 1, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    btnModalSecondaryText: { color: '#EF4444', fontSize: 13, fontWeight: '900' }
});



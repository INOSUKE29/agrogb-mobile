import React, { useState, useEffect } from 'react';
import { 
    View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, 
    Modal, TextInput, SafeAreaView, StatusBar, Platform, KeyboardAvoidingView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFertilization } from '../modules/production/hooks/useFertilization';
import { useInventory } from '../modules/inventory/hooks/useInventory';
import { showToast } from '../ui/Toast';

export default function AdubacaoFormScreen({ route, navigation }) {
    const editMode = !!route.params?.plano;
    const plano = route.params?.plano || {};

    const [nome, setNome] = useState(plano.nome_plano || '');
    const [cultura, setCultura] = useState(plano.cultura || '');
    const [tipo, setTipo] = useState(plano.tipo_aplicacao || 'GOTEJO');
    const [area, setArea] = useState(plano.area_local || '');
    const [descricao, setDescricao] = useState(plano.descricao_tecnica || '');
    
    // Focus states for Neon Glow on inputs
    const [focusedField, setFocusedField] = useState(null);

    // Hooks Diamond Pro
    const { itens, addInsumo, removeInsumo, savePlan, loading: saving } = useFertilization();
    const { items: stockItems, fetchStock } = useInventory();

    // UI States
    const [itemSelectorVisible, setItemSelectorVisible] = useState(false);
    const [selectedStockItem, setSelectedStockItem] = useState(null);
    const [itemQty, setItemQty] = useState('');

    useEffect(() => {
        fetchStock();
    }, [fetchStock]);

    const handleAddItem = () => {
        if (!selectedStockItem || !itemQty) {
            Alert.alert('Atenção', 'Selecione um insumo e digite a quantidade.');
            return;
        }
        addInsumo({
            produto_id: selectedStockItem.produto, 
            nome: selectedStockItem.produto,
            quantidade: parseFloat(itemQty),
            unidade: selectedStockItem.unidade || 'KG'
        });
        setItemSelectorVisible(false);
        setSelectedStockItem(null);
        setItemQty('');
    };

    const handleSave = async () => {
        if (!nome || !cultura) {
            Alert.alert('Obrigatório', 'Preencha o Nome do Plano e a Cultura.');
            return;
        }

        try {
            const data = {
                uuid: editMode ? plano.uuid : uuidv4(),
                id: editMode ? plano.id : null,
                nome_plano: nome,
                cultura,
                tipo_aplicacao: tipo,
                area_local: area,
                descricao_tecnica: descricao,
                anexos_uri: null
            };

            await savePlan(data);
            showToast('✅ Plano de adubação salvo com sucesso!');
            navigation.goBack();
        } catch {
            Alert.alert('Erro', 'Falha ao salvar plano.');
        }
    };

    // Helper para Input Premium
    const renderInput = (label, value, onChange, placeholder, fieldKey, multi = false, half = false) => {
        const isFocused = focusedField === fieldKey;
        return (
            <View style={[styles.field, half && { flex: 1 }]}>
                <Text style={styles.label}>{label}</Text>
                <View style={[
                    styles.inputContainer,
                    multi && { height: 100, alignItems: 'flex-start' },
                    isFocused && styles.inputContainerFocused
                ]}>
                    <TextInput
                        style={[styles.input, multi && { height: 90, textAlignVertical: 'top', paddingTop: 15 }]}
                        value={value}
                        onChangeText={onChange}
                        placeholder={placeholder}
                        placeholderTextColor="#475569"
                        onFocus={() => setFocusedField(fieldKey)}
                        onBlur={() => setFocusedField(null)}
                        multiline={multi}
                        autoCapitalize="characters"
                    />
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <LinearGradient colors={['#040914', '#0A1220']} style={StyleSheet.absoluteFill} />
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <SafeAreaView style={{ flex: 1 }}>
                {/* Header Premium */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>{editMode ? 'ED. RECEITA' : 'NOVO PLANO'}</Text>
                        <Text style={styles.headerSub}>Manejo Nutricional</Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    
                    {/* Formulário */}
                    {renderInput('NOME DO PLANO', nome, setNome, 'EX: ADUBAÇÃO DE COBERTURA', 'nome')}
                    
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                        {renderInput('CULTURA', cultura, setCultura, 'EX: MILHO', 'cultura', false, true)}
                        {renderInput('ÁREA / LOCAL', area, setArea, 'G01', 'area', false, true)}
                    </View>

                    {/* Selector de Tipo (Pills Neon) */}
                    <Text style={[styles.label, { marginTop: 10 }]}>MÉTODO DE APLICAÇÃO</Text>
                    <View style={styles.pillContainer}>
                        {[
                            { id: 'GOTEJO', label: 'GOTEJO', icon: 'water', color: '#3B82F6' },
                            { id: 'PULVERIZACAO', label: 'PULVERIZAÇÃO', icon: 'cloud-outline', color: '#10B981' },
                            { id: 'LANCO', label: 'A LANÇO', icon: 'tractor', color: '#F59E0B' }
                        ].map(m => {
                            const active = tipo === m.id;
                            return (
                                <TouchableOpacity
                                    key={m.id}
                                    style={[styles.pill, active && { borderColor: m.color, backgroundColor: m.color + '15' }]}
                                    onPress={() => setTipo(m.id)}
                                >
                                    <Ionicons name={m.icon} size={16} color={active ? m.color : '#64748B'} />
                                    <Text style={[styles.pillText, active && { color: m.color }]}>{m.label}</Text>
                                    {active && <View style={[styles.glowDot, { backgroundColor: m.color }]} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Caixa de Insumos (Glassmorphism) */}
                    <View style={styles.insumosBox}>
                        <View style={styles.insumosHeader}>
                            <Text style={styles.insumosTitle}>CARRINHO DE INSUMOS</Text>
                            <TouchableOpacity onPress={() => setItemSelectorVisible(true)} style={styles.btnAddInsumo}>
                                <Ionicons name="add" size={20} color="#040914" />
                            </TouchableOpacity>
                        </View>

                        {itens.length === 0 ? (
                            <View style={styles.emptyInsumos}>
                                <Ionicons name="flask-outline" size={32} color="rgba(255,255,255,0.1)" />
                                <Text style={styles.emptyInsumosText}>A receita está vazia.</Text>
                            </View>
                        ) : (
                            <View style={{ gap: 10 }}>
                                {itens.map(item => (
                                    <View key={item.tempId} style={styles.insumoCard}>
                                        <View style={styles.insumoIconBox}>
                                            <Ionicons name="leaf" size={16} color="#10B981" />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.insumoName}>{item.nome}</Text>
                                            <Text style={styles.insumoQty}>{item.quantidade} {item.unidade}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => removeInsumo(item.tempId)} style={styles.delBtn}>
                                            <Ionicons name="close" size={20} color="#F87171" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {renderInput('NOTAS TÉCNICAS (OPCIONAL)', descricao, setDescricao, 'Digite observações importantes...', 'desc', true)}

                    {/* Ações */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.cancelBtnText}>CANCELAR</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.saveBtnBox} onPress={handleSave} disabled={saving}>
                            <LinearGradient colors={['#10B981', '#059669']} style={styles.saveBtnGradient}>
                                <Text style={styles.saveBtnText}>{saving ? 'SALVANDO...' : 'SALVAR PLANO'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                    <View style={{ height: 40 }}/>
                </ScrollView>
            </SafeAreaView>

            {/* Modal Glassmorphism de Insumos */}
            <Modal visible={itemSelectorVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setItemSelectorVisible(false)} />
                    
                    <BlurView intensity={60} tint="dark" style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>CATÁLOGO DE ESTOQUE</Text>

                        <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                            {stockItems.length === 0 ? (
                                <Text style={styles.modalEmpty}>Seu estoque está vazio.</Text>
                            ) : stockItems.map(item => {
                                const active = selectedStockItem?.produto === item.produto;
                                return (
                                    <TouchableOpacity 
                                        key={item.produto} 
                                        style={[styles.stockCard, active && styles.stockCardActive]}
                                        onPress={() => setSelectedStockItem(item)}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.stockCardName, active && { color: '#FFF' }]}>{item.produto}</Text>
                                            <Text style={styles.stockCardQty}>Disp: {item.quantidade} {item.unidade}</Text>
                                        </View>
                                        {active && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {selectedStockItem && (
                            <View style={styles.qtyBox}>
                                <Text style={styles.qtyLabel}>DOSE ({selectedStockItem.unidade})</Text>
                                <View style={styles.qtyInputContainer}>
                                    <TextInput 
                                        style={styles.qtyInput}
                                        value={itemQty}
                                        onChangeText={setItemQty}
                                        keyboardType="numeric"
                                        placeholder="0.00"
                                        placeholderTextColor="#475569"
                                        autoFocus
                                        {...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {})}
                                    />
                                </View>
                                <TouchableOpacity style={{marginTop: 15}} onPress={handleAddItem}>
                                    <LinearGradient colors={['#10B981', '#059669']} style={styles.confirmBtnGradient}>
                                        <Text style={styles.confirmBtnText}>JOGAR NA RECEITA</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </BlurView>
                </View>
            </Modal>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 30, paddingBottom: 20 },
    backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 15 },
    headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
    headerSub: { color: '#10B981', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
    badgeDiamond: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', gap: 4 },
    badgeDiamondText: { color: '#10B981', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    
    field: { marginBottom: 20 },
    label: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
    inputContainer: { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, height: 56, justifyContent: 'center' },
    inputContainerFocused: { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.05)' },
    input: { flex: 1, color: '#F8FAFC', fontSize: 15, fontWeight: '600', paddingHorizontal: 16, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },

    pillContainer: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    pill: { flex: 1, height: 60, borderRadius: 16, backgroundColor: 'rgba(15, 23, 42, 0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
    pillText: { color: '#64748B', fontSize: 10, fontWeight: '800', marginTop: 4, letterSpacing: 1 },
    glowDot: { position: 'absolute', bottom: -1, width: 20, height: 3, borderRadius: 2, shadowOpacity: 1, shadowRadius: 5 },

    insumosBox: { backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 25 },
    insumosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    insumosTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
    btnAddInsumo: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
    
    emptyInsumos: { alignItems: 'center', paddingVertical: 20 },
    emptyInsumosText: { color: '#64748B', fontSize: 13, marginTop: 10, fontWeight: '600' },

    insumoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    insumoIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.15)', justifyContent: 'center', alignItems: 'center' },
    insumoName: { color: '#F8FAFC', fontSize: 14, fontWeight: '800' },
    insumoQty: { color: '#10B981', fontSize: 12, fontWeight: '700', marginTop: 2 },
    delBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(248, 113, 113, 0.1)', justifyContent: 'center', alignItems: 'center' },

    actionRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
    cancelBtn: { flex: 0.8, height: 60, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
    cancelBtnText: { color: '#94A3B8', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
    saveBtnBox: { flex: 1.2, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
    saveBtnGradient: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center' },
    modalSheet: { width: '90%', maxWidth: 500, alignSelf: 'center', borderRadius: 36, padding: 30, backgroundColor: 'rgba(11, 17, 32, 0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalHandle: { display: 'none' },
    modalTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 25 },
    modalEmpty: { color: '#64748B', textAlign: 'center', paddingVertical: 20 },
    
    stockCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 10 },
    stockCardActive: { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.05)' },
    stockCardName: { color: '#94A3B8', fontSize: 15, fontWeight: '800' },
    stockCardQty: { color: '#64748B', fontSize: 12, marginTop: 4, fontWeight: '600' },

    qtyBox: { marginTop: 25, paddingTop: 25, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    qtyLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
    qtyInputContainer: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, height: 60, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
    qtyInput: { flex: 1, color: '#FFF', fontSize: 20, fontWeight: '800', textAlign: 'center', ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },
    confirmBtnGradient: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    confirmBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1 }
});

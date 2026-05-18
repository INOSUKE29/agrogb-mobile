import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    TextInput, Alert, ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AgronomistService } from '../services/AgronomistService';
import { RecommendationService } from '../services/RecommendationService';
import { executeQuery } from '../database/database';
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';

const COMMON_PRODUCTS = [
    'NITRATO DE CÁLCIO', 'MAP (FOSFATO MONOAMÔNICO)', 'SULFATO DE MAGNÉSIO', 
    'CLORETO DE POTÁSSIO', 'URÉIA', 'ÁCIDO FOSFÓRICO', 'BORO (SULFATO DE BORO)', 
    'SULFATO DE ZINCO', 'NITRATO DE POTÁSSIO', 'QUELATO DE FERRO'
];

export default function CreateRecommendationScreen({ navigation }) {
    const { theme } = useTheme();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [plantings, setPlantings] = useState([]);
    
    // Form fields
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedPlanting, setSelectedPlanting] = useState(null);
    const [activeTab, setActiveTab] = useState('GOTEJO'); // GOTEJO ou FOLIAR
    const [recipeRows, setRecipeRows] = useState([
        { id: '1', product: '', dosage: '', unit: 'KG' }
    ]);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Modal selectors
    const [showClientModal, setShowClientModal] = useState(false);
    const [showPlantingModal, setShowPlantingModal] = useState(false);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        setLoading(true);
        try {
            const activeLinks = await AgronomistService.getActiveLinks(user.uuid, 'AGRONOMO');
            setClients(activeLinks);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectClient = async (client) => {
        setSelectedClient(client);
        setSelectedPlanting(null);
        setShowClientModal(false);

        // Carrega plantios desse cliente de forma remota/local
        try {
            // Em cenários offline-first, buscamos plantios do cliente
            const res = await executeQuery('SELECT * FROM plantio WHERE is_deleted = 0 ORDER BY data DESC');
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) {
                rows.push(res.rows.item(i));
            }
            setPlantings(rows);
        } catch (e) {
            console.log(e);
        }
    };

    const handleAddRow = () => {
        const newId = (recipeRows.length + 1).toString();
        setRecipeRows([...recipeRows, { id: newId, product: '', dosage: '', unit: 'KG' }]);
    };

    const handleRemoveRow = (id) => {
        if (recipeRows.length === 1) return;
        setRecipeRows(recipeRows.filter(r => r.id !== id));
    };

    const handleRowChange = (id, field, value) => {
        setRecipeRows(recipeRows.map(row => {
            if (row.id === id) {
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    const handlePublish = async () => {
        if (!selectedClient) {
            return Alert.alert('Atenção', 'Selecione o cliente produtor.');
        }

        // Validação das linhas
        const invalidRow = recipeRows.find(r => !r.product.trim() || !r.dosage.trim());
        if (invalidRow) {
            return Alert.alert('Atenção', 'Preencha o nome do produto e a dosagem em todas as linhas da receita.');
        }

        setSubmitting(true);
        try {
            const recipeData = recipeRows.map(r => ({
                product: r.product.toUpperCase().trim(),
                dosage: parseFloat(r.dosage) || 0,
                unit: r.unit
            }));

            const payload = {
                agronomist_id: user.uuid,
                client_id: selectedClient.client_id,
                planting_id: selectedPlanting ? selectedPlanting.uuid : null,
                recipe_type: activeTab,
                recipe_data: recipeData,
                notes: notes.trim(),
                status: 'PENDING'
            };

            const res = await RecommendationService.createRecommendation(payload);
            if (res.success) {
                Alert.alert('🎉 Emitido!', 'Prescrição técnica emitida com sucesso e sincronizada com a nuvem.', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert('Erro', res.error || 'Erro ao publicar recomendação.');
            }
        } catch (err) {
            Alert.alert('Erro', 'Ocorreu uma falha ao enviar.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#064E3B', '#10B981']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.title}>NOVA PRESCRIÇÃO</Text>
                <Text style={styles.subtitle}>Elabore receitas rígidas de adubação.</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                {/* 1. SELETOR DE CLIENTE */}
                <Text style={styles.sectionHeader}>PRODUTOR DESTINATÁRIO *</Text>
                <TouchableOpacity 
                    style={styles.selector} 
                    onPress={() => setShowClientModal(true)}
                    activeOpacity={0.8}
                >
                    <View style={styles.selectorInner}>
                        <Ionicons name="people" size={20} color="#10B981" />
                        <Text style={[styles.selectorText, selectedClient && styles.selectorTextSelected]}>
                            {selectedClient ? selectedClient.client_name : 'Selecione o Cliente'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                {/* 2. SELETOR DE PLANTIO / TALHÃO */}
                {selectedClient && (
                    <>
                        <Text style={styles.sectionHeader}>TALHÃO / CULTURA DO CLIENTE (OPCIONAL)</Text>
                        <TouchableOpacity 
                            style={styles.selector} 
                            onPress={() => setShowPlantingModal(true)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.selectorInner}>
                                <Ionicons name="leaf" size={20} color="#10B981" />
                                <Text style={[styles.selectorText, selectedPlanting && styles.selectorTextSelected]}>
                                    {selectedPlanting ? `${selectedPlanting.cultura.toUpperCase()} (${selectedPlanting.tipo_plantio})` : 'Selecione o Talhão / Cultura'}
                                </Text>
                            </View>
                            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </>
                )}

                {/* 3. TIPO DE ADUBAÇÃO (TABS) */}
                <Text style={styles.sectionHeader}>MÉTODO DE APLICAÇÃO *</Text>
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'GOTEJO' && styles.tabActive]}
                        onPress={() => setActiveTab('GOTEJO')}
                    >
                        <Ionicons name="water" size={18} color={activeTab === 'GOTEJO' ? '#FFF' : '#10B981'} />
                        <Text style={[styles.tabText, activeTab === 'GOTEJO' && styles.tabTextActive]}>ADUBAÇÃO GOTEJO</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'FOLIAR' && styles.tabActive]}
                        onPress={() => setActiveTab('FOLIAR')}
                    >
                        <Ionicons name="leaf" size={18} color={activeTab === 'FOLIAR' ? '#FFF' : '#10B981'} />
                        <Text style={[styles.tabText, activeTab === 'FOLIAR' && styles.tabTextActive]}>ADUBAÇÃO FOLIAR</Text>
                    </TouchableOpacity>
                </View>

                {/* 4. TABELA DE PRODUTOS DINÂMICA */}
                <View style={styles.recipeHeaderRow}>
                    <Text style={styles.sectionHeader}>PRODUTOS E DOSAGEM *</Text>
                    <TouchableOpacity style={styles.addRowBtn} onPress={handleAddRow}>
                        <Ionicons name="add-circle" size={18} color="#10B981" />
                        <Text style={styles.addRowText}>ADICIONAR</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ gap: 12 }}>
                    {recipeRows.map((row, idx) => (
                        <Card key={row.id} style={styles.rowCard}>
                            <View style={styles.rowTop}>
                                <Text style={styles.rowNumber}>Insumo #{idx + 1}</Text>
                                {recipeRows.length > 1 && (
                                    <TouchableOpacity onPress={() => handleRemoveRow(row.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TextInput 
                                style={styles.inputField}
                                placeholder="Nome do Produto (Ex: Nitrato de Cálcio)"
                                placeholderTextColor="#9CA3AF"
                                value={row.product}
                                onChangeText={v => handleRowChange(row.id, 'product', v)}
                            />

                            <View style={styles.rowFields}>
                                <TextInput 
                                    style={[styles.inputField, { flex: 2 }]}
                                    placeholder="Dose (Ex: 10)"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={row.dosage}
                                    onChangeText={v => handleRowChange(row.id, 'dosage', v)}
                                />
                                
                                <View style={styles.unitSelector}>
                                    {['KG', 'GR', 'LT', 'ML', 'MG'].map(u => (
                                        <TouchableOpacity 
                                            key={u}
                                            style={[styles.unitBtn, row.unit === u && styles.unitBtnActive]}
                                            onPress={() => handleRowChange(row.id, 'unit', u)}
                                        >
                                            <Text style={[styles.unitBtnText, row.unit === u && styles.unitBtnTextActive]}>{u}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </Card>
                    ))}
                </View>

                {/* 5. OBSERVAÇÕES TÉCNICAS */}
                <Text style={styles.sectionHeader}>RECOMENDAÇÕES ADICIONAIS & OBSERVAÇÕES</Text>
                <TextInput 
                    style={styles.notesInput}
                    placeholder="Escreva recomendações extras (Ex: pH da água, intervalo de aplicação, etc.)"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    value={notes}
                    onChangeText={setNotes}
                />

                <View style={{ marginTop: 20 }}>
                    <AgroButton 
                        title="EMITIR E ENVIAR PRESCRIÇÃO"
                        onPress={handlePublish}
                        loading={submitting}
                    />
                </View>

            </ScrollView>

            {/* CLIENT MODAL SELECTOR */}
            {showClientModal && (
                <View style={styles.modalOverlay}>
                    <Card style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecione o Cliente</Text>
                            <TouchableOpacity onPress={() => setShowClientModal(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                            {clients.length === 0 ? (
                                <Text style={styles.modalEmptyText}>Nenhum cliente produtor vinculado.</Text>
                            ) : (
                                clients.map(c => (
                                    <TouchableOpacity 
                                        key={c.uuid}
                                        style={styles.modalItem}
                                        onPress={() => handleSelectClient(c)}
                                    >
                                        <Ionicons name="person-outline" size={20} color="#10B981" />
                                        <Text style={styles.modalItemText}>{c.client_name}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </Card>
                </View>
            )}

            {/* PLANTING MODAL SELECTOR */}
            {showPlantingModal && (
                <View style={styles.modalOverlay}>
                    <Card style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecione o Talhão / Cultura</Text>
                            <TouchableOpacity onPress={() => setShowPlantingModal(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                            {plantings.length === 0 ? (
                                <Text style={styles.modalEmptyText}>Nenhum plantio ativo registrado para o cliente.</Text>
                            ) : (
                                plantings.map(p => (
                                    <TouchableOpacity 
                                        key={p.uuid}
                                        style={styles.modalItem}
                                        onPress={() => {
                                            setSelectedPlanting(p);
                                            setShowPlantingModal(false);
                                        }}
                                    >
                                        <Ionicons name="leaf-outline" size={20} color="#10B981" />
                                        <Text style={styles.modalItemText}>{p.cultura.toUpperCase()} ({p.tipo_plantio})</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </Card>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { paddingTop: 60, paddingBottom: 35, paddingHorizontal: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    backBtn: { marginBottom: 15 },
    title: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
    subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 5, fontWeight: '600' },
    scroll: { padding: 20, paddingBottom: 100 },
    
    sectionHeader: { fontSize: 11, fontWeight: '900', color: '#6B7280', letterSpacing: 1.5, marginBottom: 10, marginTop: 15 },
    
    /* Selector fields */
    selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 15, borderWidth: 1.5, borderColor: '#E5E7EB' },
    selectorInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    selectorText: { fontSize: 14, color: '#9CA3AF', fontWeight: 'bold' },
    selectorTextSelected: { color: '#111827' },

    /* Visual abas (tabs) */
    tabContainer: { flexDirection: 'row', gap: 10, marginVertical: 5 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 15, borderWidth: 1.5, borderColor: '#10B981', backgroundColor: '#FFF' },
    tabActive: { backgroundColor: '#10B981' },
    tabText: { fontSize: 10, fontWeight: '900', color: '#10B981', letterSpacing: 0.5 },
    tabTextActive: { color: '#FFF' },

    /* Dynamic recipe rows styling */
    recipeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 5 },
    addRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    addRowText: { fontSize: 11, fontWeight: '900', color: '#10B981' },
    rowCard: { padding: 18, borderRadius: 20, gap: 12 },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowNumber: { fontSize: 11, fontWeight: '900', color: '#10B981', letterSpacing: 0.5 },
    rowFields: { flexDirection: 'row', gap: 10 },
    inputField: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 15, fontSize: 14, fontWeight: '700', color: '#111827', borderWidth: 1.5, borderColor: '#E5E7EB' },
    unitSelector: { flex: 3, flexDirection: 'row', gap: 4, alignItems: 'center' },
    unitBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
    unitBtnActive: { backgroundColor: '#10B981' },
    unitBtnText: { fontSize: 9, fontWeight: '900', color: '#4B5563' },
    unitBtnTextActive: { color: '#FFF' },

    /* Notes field */
    notesInput: { backgroundColor: '#FFF', borderRadius: 15, padding: 18, fontSize: 14, fontWeight: '600', color: '#111827', borderWidth: 1.5, borderColor: '#E5E7EB', minHeight: 100, textAlignVertical: 'top' },

    /* Modal dialogs */
    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25, zIndex: 10 },
    modalCard: { maxHeight: '75%', padding: 20, borderRadius: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#E5E7EB', paddingBottom: 15, marginBottom: 15 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#111827' },
    modalList: { flex: 1 },
    modalEmptyText: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginVertical: 20, fontWeight: '600' },
    modalItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 15, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    modalItemText: { fontSize: 14, color: '#374151', fontWeight: 'bold' }
});

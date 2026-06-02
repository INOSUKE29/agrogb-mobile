import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { 
    getAllPlantings, insertPlanting, updatePlanting, deletePlanting, 
    getFields, insertField, getDashboardCropStats 
} from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';
import AgroOptionsModal from '../components/common/AgroOptionsModal';

const { width } = Dimensions.get('window');

const STATUS_OPCOES = ['SEMENTE', 'DESENVOLVIMENTO', 'PRODUÇÃO', 'FINALIZADO'];
const FILTROS = ['TODAS', ...STATUS_OPCOES];

export default function CulturasScreen({ navigation }) {
    const { theme } = useTheme();
    const [plantings, setPlantings] = useState([]);
    const [fields, setFields] = useState([]);
    const [stats, setStats] = useState({ totalCulturas: 0, areaTotal: 0, emProducao: 0 });
    
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('TODAS');
    const [searchText, setSearchText] = useState('');
    
    const [modalVisible, setModalVisible] = useState(false);
    const [talhaoModalVisible, setTalhaoModalVisible] = useState(false);
    
    const [editingItem, setEditingItem] = useState(null);
    const [selectedItemActions, setSelectedItemActions] = useState(null);

    // Formulário de Plantio (Cultura)
    const [fieldUuid, setFieldUuid] = useState('');
    const [cropName, setCropName] = useState('');
    const [varietyName, setVarietyName] = useState('');
    const [plantingDate, setPlantingDate] = useState('');
    const [expectedYield, setExpectedYield] = useState('');
    const [status, setStatus] = useState('SEMENTE');

    // Formulário de Talhão
    const [talhaoNome, setTalhaoNome] = useState('');
    const [talhaoArea, setTalhaoArea] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try { 
            const dataPlantings = await getAllPlantings(); 
            const dataFields = await getFields();
            const dataStats = await getDashboardCropStats();
            
            setPlantings(dataPlantings);
            setFields(dataFields);
            setStats(dataStats);
        } catch (e) { 
            console.error(e);
        } finally { 
            setLoading(false); 
        }
    };

    const resetForm = () => {
        setEditingItem(null);
        setFieldUuid(fields.length > 0 ? fields[0].uuid : '');
        setCropName('');
        setVarietyName('');
        // Format YYYY-MM-DD
        setPlantingDate(new Date().toISOString().split('T')[0]);
        setExpectedYield('');
        setStatus('SEMENTE');
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFieldUuid(item.field_uuid);
        setCropName(item.crop_name);
        setVarietyName(item.variety_name || '');
        setPlantingDate(item.planting_date);
        setExpectedYield(item.expected_yield ? item.expected_yield.toString() : '');
        setStatus(item.status || 'SEMENTE');
        setSelectedItemActions(null);
        setModalVisible(true);
    };

    const handleSavePlanting = async () => {
        if (!fieldUuid || !cropName.trim() || !plantingDate.trim()) {
            return Alert.alert('Atenção', 'Talhão, Cultura e Data são obrigatórios.');
        }

        try {
            const payload = {
                uuid: editingItem ? editingItem.uuid : uuidv4(),
                field_uuid: fieldUuid,
                crop_name: cropName.toUpperCase(),
                variety_name: varietyName.toUpperCase(),
                planting_date: plantingDate,
                expected_yield: parseFloat(expectedYield) || 0,
                status: status
            };

            if (editingItem) {
                await updatePlanting(payload);
                Alert.alert('Sucesso', 'Cultura atualizada com sucesso!');
            } else {
                await insertPlanting(payload);
                Alert.alert('Sucesso', 'Cultura cadastrada com sucesso!');
            }

            setModalVisible(false); 
            loadData();
        } catch (e) { 
            Alert.alert('Erro', 'Não foi possível salvar a cultura.'); 
        }
    };

    const handleSaveTalhao = async () => {
        if (!talhaoNome.trim()) return Alert.alert('Atenção', 'O nome do talhão é obrigatório.');
        try {
            await insertField({
                uuid: uuidv4(),
                nome: talhaoNome.toUpperCase(),
                area: parseFloat(talhaoArea) || 0
            });
            Alert.alert('Sucesso', 'Talhão criado!');
            setTalhaoModalVisible(false);
            setTalhaoNome('');
            setTalhaoArea('');
            loadData();
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível criar o talhão.');
        }
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir Cultura', `Deseja realmente remover ${item.crop_name} do sistema?`, [
            { text: 'Cancelar', style: 'cancel' }, 
            { 
                text: 'Sim, Excluir', 
                style: 'destructive', 
                onPress: async () => { 
                    await deletePlanting(item.uuid); 
                    setSelectedItemActions(null);
                    loadData(); 
                } 
            }
        ]);
    };

    const getStatusColor = (st) => {
        switch(st) {
            case 'SEMENTE': return '#F59E0B'; // Amarelo
            case 'DESENVOLVIMENTO': return '#3B82F6'; // Azul
            case 'PRODUÇÃO': return '#10B981'; // Verde
            case 'FINALIZADO': return '#6B7280'; // Cinza
            default: return '#14B8A6';
        }
    };

    const filteredPlantings = plantings.filter(p => {
        const matchStatus = filterStatus === 'TODAS' || p.status === filterStatus;
        const matchText = p.crop_name.includes(searchText.toUpperCase()) || (p.variety_name && p.variety_name.includes(searchText.toUpperCase()));
        return matchStatus && matchText;
    });

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#0B121E' }]}>
            
            {/* CABEÇALHO COM INDICADORES (GLASSMORPHISM) */}
            <LinearGradient colors={['#1F2937', '#111827']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>GESTÃO DE CULTURAS</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* KPIs */}
                <View style={styles.kpiContainer}>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiValue}>{stats.totalCulturas}</Text>
                        <Text style={styles.kpiLabel}>CULTURAS</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiValue}>{stats.areaTotal.toFixed(1)}</Text>
                        <Text style={styles.kpiLabel}>ÁREA (HA)</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={[styles.kpiValue, { color: '#10B981' }]}>{stats.emProducao}</Text>
                        <Text style={styles.kpiLabel}>PRODUÇÃO</Text>
                    </View>
                </View>

                {/* BUSCA */}
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#6B7280" style={{marginRight: 10}} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Buscar por Cultura ou Variedade..."
                        placeholderTextColor="#6B7280"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
            </LinearGradient>

            {/* FILTROS PILLS */}
            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    {FILTROS.map(f => (
                        <TouchableOpacity 
                            key={f} 
                            style={[styles.pill, filterStatus === f && { backgroundColor: getStatusColor(f), borderColor: getStatusColor(f) }]}
                            onPress={() => setFilterStatus(f)}
                        >
                            <Text style={[styles.pillText, filterStatus === f && { color: '#FFF' }]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>
            ) : (
                <FlatList
                    data={filteredPlantings}
                    keyExtractor={item => item.uuid}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            onPress={() => handleEdit(item)}
                            onLongPress={() => setSelectedItemActions(item)}
                            style={styles.cardContainer}
                        >
                            <LinearGradient colors={['#1F2937', '#111827']} style={styles.cardGradient}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardTitleRow}>
                                        <MaterialCommunityIcons name="leaf" size={20} color={getStatusColor(item.status)} />
                                        <Text style={styles.cardTitle}>{item.crop_name}</Text>
                                    </View>
                                    <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) + '20', borderColor: getStatusColor(item.status) }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.cardBody}>
                                    <View style={styles.infoCol}>
                                        <Text style={styles.infoLabel}>TALHÃO / ÁREA</Text>
                                        <Text style={styles.infoValue}>{item.field_nome} ({item.field_area || 0} ha)</Text>
                                    </View>
                                    <View style={styles.infoCol}>
                                        <Text style={styles.infoLabel}>VARIEDADE</Text>
                                        <Text style={styles.infoValue}>{item.variety_name || '--'}</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.cardFooter}>
                                    <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                                    <Text style={styles.footerText}>Plantio: {item.planting_date}</Text>
                                    <View style={{flex: 1}} />
                                    <Text style={styles.footerYield}>Yield Est: {item.expected_yield} kg</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="sprout-outline" size={60} color="#374151" />
                            <Text style={styles.emptyTxt}>Nenhuma cultura encontrada.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.fabGradient}>
                    <Ionicons name="add" size={32} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>

            {/* MODAL DE CADASTRO DE CULTURA */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingItem ? 'EDITAR CULTURA' : 'NOVO PLANTIO'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={30} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {fields.length === 0 ? (
                                <View style={styles.warningBox}>
                                    <Text style={styles.warningText}>Você precisa de um Talhão antes de plantar.</Text>
                                    <AgroButton title="CRIAR TALHÃO" onPress={() => setTalhaoModalVisible(true)} />
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.inputLabel}>TALHÃO (ÁREA DE PLANTIO)</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
                                        {fields.map(f => (
                                            <TouchableOpacity 
                                                key={f.uuid} 
                                                style={[styles.fieldSelectBtn, fieldUuid === f.uuid && styles.fieldSelectBtnActive]}
                                                onPress={() => setFieldUuid(f.uuid)}
                                            >
                                                <Text style={[styles.fieldSelectTxt, fieldUuid === f.uuid && {color:'#FFF'}]}>{f.nome} ({f.area}ha)</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                    <AgroInput 
                                        label="CULTURA *" 
                                        value={cropName} 
                                        onChangeText={t => setCropName(t.toUpperCase())} 
                                        placeholder="EX: MORANGO, MILHO"
                                        icon="leaf-outline"
                                    />
                                    <AgroInput 
                                        label="VARIEDADE / TIPO" 
                                        value={varietyName} 
                                        onChangeText={t => setVarietyName(t.toUpperCase())} 
                                        placeholder="EX: ALBION, PIONEER 30F53"
                                        icon="pricetag-outline"
                                    />
                                    <View style={styles.row}>
                                        <View style={{flex: 1, marginRight: 10}}>
                                            <AgroInput 
                                                label="DATA PLANTIO *" 
                                                value={plantingDate} 
                                                onChangeText={setPlantingDate} 
                                                placeholder="AAAA-MM-DD"
                                                icon="calendar-outline"
                                            />
                                        </View>
                                        <View style={{flex: 1}}>
                                            <AgroInput 
                                                label="ESTIMATIVA (KG)" 
                                                value={expectedYield} 
                                                onChangeText={setExpectedYield} 
                                                keyboardType="numeric"
                                                placeholder="EX: 5000"
                                                icon="stats-chart-outline"
                                            />
                                        </View>
                                    </View>

                                    <Text style={styles.inputLabel}>STATUS DA CULTURA</Text>
                                    <View style={styles.statusSelectRow}>
                                        {STATUS_OPCOES.map(st => (
                                            <TouchableOpacity 
                                                key={st}
                                                style={[styles.statusOptBtn, status === st && {backgroundColor: getStatusColor(st), borderColor: getStatusColor(st)}]}
                                                onPress={() => setStatus(st)}
                                            >
                                                <Text style={[styles.statusOptTxt, status === st && {color:'#FFF'}]}>{st}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={{marginTop: 20}}>
                                        <AgroButton title={editingItem ? "SALVAR ALTERAÇÕES" : "INICIAR PLANTIO"} onPress={handleSavePlanting} />
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL CRIAR TALHÃO */}
            <Modal visible={talhaoModalVisible} transparent animationType="fade">
                <View style={styles.overlayCenter}>
                    <View style={styles.smallModal}>
                        <Text style={styles.modalTitle}>NOVO TALHÃO / ÁREA</Text>
                        <AgroInput label="NOME DO TALHÃO" value={talhaoNome} onChangeText={t => setTalhaoNome(t.toUpperCase())} placeholder="Ex: ESTUFA 01" />
                        <AgroInput label="TAMANHO (HECTARES)" value={talhaoArea} onChangeText={setTalhaoArea} keyboardType="numeric" placeholder="Ex: 2.5" />
                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.flexBtn, {backgroundColor: '#374151'}]} onPress={() => setTalhaoModalVisible(false)}>
                                <Text style={styles.btnTxt}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.flexBtn, {backgroundColor: '#10B981'}]} onPress={handleSaveTalhao}>
                                <Text style={styles.btnTxt}>CRIAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* OPTIONS MODAL DE TOQUE LONGO */}
            <AgroOptionsModal
                visible={!!selectedItemActions}
                onClose={() => setSelectedItemActions(null)}
                title={selectedItemActions?.crop_name || ''}
                subtitle={`Plantado em: ${selectedItemActions?.planting_date}`}
                onEdit={() => handleEdit(selectedItemActions)}
                onDelete={() => handleDelete(selectedItemActions)}
                editLabel="Editar Cultura"
                deleteLabel="Excluir Registro"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    kpiContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    kpiCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 15, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    kpiValue: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
    kpiLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold', marginTop: 4, letterSpacing: 1 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#374151', borderRadius: 12, paddingHorizontal: 15, height: 45 },
    searchInput: { flex: 1, color: '#FFF', fontSize: 14 },
    filtersContainer: { height: 60, justifyContent: 'center' },
    pill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1F2937', marginRight: 10, borderWidth: 1, borderColor: '#374151' },
    pillText: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold' },
    list: { padding: 20, paddingBottom: 100 },
    cardContainer: { marginBottom: 15, borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
    cardGradient: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center' },
    cardTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', marginLeft: 10 },
    statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    statusText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 15, marginBottom: 15 },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 10, color: '#6B7280', fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 4 },
    infoValue: { fontSize: 14, color: '#E5E7EB', fontWeight: '600' },
    cardFooter: { flexDirection: 'row', alignItems: 'center' },
    footerText: { fontSize: 12, color: '#9CA3AF', marginLeft: 6 },
    footerYield: { fontSize: 12, color: '#10B981', fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 30, right: 25, elevation: 8 },
    fabGradient: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1F2937', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, height: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    inputLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
    fieldSelectBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, backgroundColor: '#374151', marginRight: 10, borderWidth: 1, borderColor: '#4B5563' },
    fieldSelectBtnActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    fieldSelectTxt: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold' },
    statusSelectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    statusOptBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#374151', borderWidth: 1, borderColor: '#4B5563' },
    statusOptTxt: { color: '#9CA3AF', fontSize: 11, fontWeight: 'bold' },
    row: { flexDirection: 'row' },
    warningBox: { backgroundColor: 'rgba(245,158,11,0.1)', padding: 20, borderRadius: 15, alignItems: 'center', borderColor: '#F59E0B', borderWidth: 1 },
    warningText: { color: '#FCD34D', fontSize: 14, textAlign: 'center', marginBottom: 15 },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    smallModal: { width: '100%', backgroundColor: '#1F2937', borderRadius: 20, padding: 25 },
    flexBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5, marginTop: 10 },
    btnTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 80, opacity: 0.5 },
    emptyTxt: { color: '#9CA3AF', marginTop: 15, fontWeight: '700', fontSize: 14 }
});

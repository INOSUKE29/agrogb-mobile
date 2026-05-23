import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Dimensions, StatusBar, Platform, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { getCulturas } from '../database/database';

const screenWidth = Dimensions.get('window').width;

export default function CulturasScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState('Todas');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Form Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({ nome: '', variedade: '', area: '', status: 'Plantado' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try { 
            const data = await getCulturas(); 
            setItems(data.length > 0 ? data : [
                { id: '1', nome: 'Morango', variedade: 'Albion', area: '1.2 ha', plantio: '10/01/2026', status: 'Produção', total: '3,200 kg' },
                { id: '2', nome: 'Milho', variedade: 'Híbrido', area: '8.5 ha', plantio: '05/03/2026', status: 'Desenvolvimento', total: '5,000 kg' },
                { id: '3', nome: 'Café', variedade: 'Arábica', area: '5.0 ha', plantio: '12/08/2025', status: 'Plantado', total: '1,800 kg' },
                { id: '4', nome: 'Alface', variedade: 'Crespa', area: '1.5 ha', plantio: '20/09/2024', status: 'Finalizado', total: '900 kg' },
            ]); 
        } catch {}
    };

    const handleSave = async () => {
        if (!formData.nome || !formData.area) {
            Alert.alert('Erro', 'Preencha os campos obrigatórios (Nome e Área).');
            return;
        }
        try {
            // Simulando persistência para o usuário agora
            const newItem = {
                id: Math.random().toString(),
                nome: formData.nome,
                variedade: formData.variedade || 'Padrão',
                area: formData.area + (formData.area.includes('ha') ? '' : ' ha'),
                plantio: new Date().toLocaleDateString('pt-BR'),
                status: formData.status,
                total: '0 kg'
            };
            
            // await insertCultura(newItem); // Habilitar quando o DB estiver 100% alinhado
            setItems([newItem, ...items]);
            setModalVisible(false);
            setFormData({ nome: '', variedade: '', area: '', status: 'Plantado' });
            Alert.alert('Sucesso', 'Nova cultura registrada no painel.');
        } catch (e) {
            Alert.alert('Erro', 'Falha ao salvar cultura.');
        }
    };

    const getEmoji = (nome) => {
        const n = nome.toLowerCase();
        if (n.includes('morang')) return '🍓';
        if (n.includes('milho')) return '🌽';
        if (n.includes('café') || n.includes('cafe')) return '☕';
        if (n.includes('alface')) return '🥬';
        return '🌱';
    };

    const getStatusColor = (status) => {
        if (status === 'Produção') return '#34D399'; // Emerald
        if (status === 'Desenvolvimento') return '#FBBF24'; // Amber
        if (status === 'Plantado') return '#3B82F6'; // Blue
        if (status === 'Finalizado') return '#F87171'; // Red
        return '#94A3B8';
    };

    const filters = ['Todas', 'Produção', 'Desenvolvimento', 'Plantado', 'Finalizado'];

    // Filter Logic
    const filteredItems = items.filter(item => {
        const matchFilter = filter === 'Todas' || item.status === filter;
        const matchSearch = item.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.variedade && item.variedade.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchFilter && matchSearch;
    });

    const renderCard = ({ item }) => (
        <BlurView intensity={30} tint="dark" style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardEmojiBg}>
                    <Text style={styles.cardEmoji}>{getEmoji(item.nome)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.nome}</Text>
                    <Text style={styles.cardSubTitle}>{item.variedade || 'Padrão'}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.cardBody}>
                <View style={styles.rowInfo}>
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>ÁREA ATIVA</Text>
                        <Text style={styles.infoValue}>{item.area || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>DATA PLANTIO</Text>
                        <Text style={styles.infoValue}>{item.plantio || 'N/D'}</Text>
                    </View>
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>ÚLTIMA SAFRA</Text>
                        <Text style={[styles.infoValue, { color: '#34D399' }]}>500 kg</Text>
                    </View>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="eye-outline" size={16} color="#64748B" />
                    <Text style={styles.actionText}>Ver</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="pencil-outline" size={16} color="#64748B" />
                    <Text style={styles.actionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={16} color="#F87171" />
                </TouchableOpacity>
            </View>
        </BlurView>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#040914', '#0A1220']} style={StyleSheet.absoluteFill} />
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' }}>
                {/* HEADER */}
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={26} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>Gestão de Culturas</Text>
                        <Text style={styles.headerSub}>Controle de Produção</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* METRICS ROW */}
                <View style={styles.metricsRow}>
                    <BlurView intensity={30} tint="dark" style={styles.metricCard}>
                        <Text style={styles.metricLabel}>CULTURAS</Text>
                        <Text style={styles.metricVal}>5</Text>
                    </BlurView>
                    <BlurView intensity={30} tint="dark" style={styles.metricCard}>
                        <Text style={styles.metricLabel}>ÁREA TOTAL</Text>
                        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                            <Text style={styles.metricVal}>25.4</Text>
                            <Text style={styles.metricUnit}> ha</Text>
                        </View>
                    </BlurView>
                    <BlurView intensity={30} tint="dark" style={styles.metricCard}>
                        <Text style={styles.metricLabel}>PRODUZINDO</Text>
                        <Text style={[styles.metricVal, { color: '#34D399' }]}>3</Text>
                    </BlurView>
                </View>

                {/* SEARCH & FILTER */}
                <View style={styles.toolsContainer}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#64748B" style={{ marginLeft: 15 }} />
                        <TextInput 
                            placeholder="Buscar cultura..." 
                            style={styles.searchInput}
                            placeholderTextColor="#64748B"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {filters.map(f => {
                            const isActive = filter === f;
                            return (
                                <TouchableOpacity 
                                    key={f} 
                                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                                    onPress={() => setFilter(f)}
                                >
                                    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* LIST */}
                <FlatList
                    data={filteredItems}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />

                {/* MODAL NOVA CULTURA ULTRA-PREMIUM */}
                <Modal visible={modalVisible} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <BlurView intensity={50} tint="dark" style={styles.modalContent}>
                            
                            {/* FLOATING ICON HEADER */}
                            <View style={styles.modalHeaderOrb}>
                                <LinearGradient colors={['#10B981', '#059669']} style={styles.modalHeaderOrbGradient}>
                                    <Ionicons name="leaf" size={28} color="#FFF" />
                                </LinearGradient>
                            </View>

                            <View style={styles.modalHeader}>
                                <View>
                                    <Text style={styles.modalTitle}>Nova Cultura</Text>
                                    <Text style={styles.modalSubTitle}>Registre uma nova safra ou planejamento</Text>
                                </View>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                    <Ionicons name="close" size={20} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
                                {/* NOME */}
                                <Text style={styles.inputLabel}>NOME DA CULTURA</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="pricetag-outline" size={18} color="#10B981" style={styles.inputIcon} />
                                    <TextInput 
                                        style={styles.modalInput} 
                                        placeholder="Ex: Soja, Milho, Manga..." 
                                        placeholderTextColor="#64748B"
                                        value={formData.nome}
                                        onChangeText={t => setFormData({...formData, nome: t})}
                                    />
                                </View>

                                {/* VARIEDADE */}
                                <Text style={styles.inputLabel}>VARIEDADE DE SEMENTE</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="flask-outline" size={18} color="#3B82F6" style={styles.inputIcon} />
                                    <TextInput 
                                        style={styles.modalInput} 
                                        placeholder="Ex: Híbrido XP, Palmer..." 
                                        placeholderTextColor="#64748B"
                                        value={formData.variedade}
                                        onChangeText={t => setFormData({...formData, variedade: t})}
                                    />
                                </View>

                                <View style={{ flexDirection: 'row', gap: 15 }}>
                                    {/* ÁREA */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>EXTENSÃO (ha)</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="map-outline" size={18} color="#FBBF24" style={styles.inputIcon} />
                                            <TextInput 
                                                style={styles.modalInput} 
                                                placeholder="Ex: 10" 
                                                placeholderTextColor="#64748B"
                                                keyboardType="numeric"
                                                value={formData.area}
                                                onChangeText={t => setFormData({...formData, area: t})}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* STATUS SELECTION */}
                                <Text style={styles.inputLabel}>STATUS INICIAL</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 5, paddingTop: 5 }}>
                                    {['Plantado', 'Desenvolvimento', 'Produção', 'Finalizado'].map(s => {
                                        const isActive = formData.status === s;
                                        const sColor = getStatusColor(s);
                                        return (
                                            <TouchableOpacity 
                                                key={s} 
                                                activeOpacity={0.8}
                                                onPress={() => setFormData({...formData, status: s})}
                                                style={[styles.statusChip, isActive && { backgroundColor: `${sColor}25`, borderColor: sColor }]}
                                            >
                                                <View style={[styles.statusDot, { backgroundColor: sColor }]} />
                                                <Text style={[styles.statusChipText, isActive && { color: sColor }]}>{s}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>

                                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                                    <LinearGradient colors={['#10B981', '#047857']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.saveBtnGradient}>
                                        <Ionicons name="flash" size={20} color="#D1FAE5" />
                                        <Text style={styles.saveBtnText}>REGISTRAR CULTURA</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </ScrollView>
                        </BlurView>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20, paddingBottom: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    titleContainer: { alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
    headerSub: { fontSize: 12, color: '#34D399', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },

    metricsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10, gap: 10 },
    metricCard: { flex: 1, borderRadius: 16, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(15, 23, 42, 0.4)' },
    metricLabel: { fontSize: 9, color: '#64748B', fontWeight: '800', letterSpacing: 0.5, marginBottom: 5 },
    metricVal: { fontSize: 20, fontWeight: '900', color: '#FFF' },
    metricUnit: { fontSize: 13, fontWeight: '800', color: '#94A3B8' },

    toolsContainer: { marginTop: 25, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 15 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, height: 50, marginBottom: 15 },
    searchInput: { flex: 1, fontSize: 15, color: '#FFF', paddingHorizontal: 15, height: '100%' },

    filterScroll: { paddingHorizontal: 20, gap: 10 },
    filterPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    filterPillActive: { backgroundColor: 'rgba(52, 211, 153, 0.1)', borderColor: '#10B981' },
    filterText: { fontSize: 13, fontWeight: '800', color: '#64748B' },
    filterTextActive: { color: '#34D399' },

    listContent: { padding: 20, paddingBottom: 100 },
    card: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(15, 23, 42, 0.4)', overflow: 'hidden' },
    
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    cardEmojiBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardEmoji: { fontSize: 22 },
    cardTitle: { fontSize: 18, fontWeight: '900', color: '#F8FAFC', marginBottom: 2 },
    cardSubTitle: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
    
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: '800' },

    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 15 },
    
    cardBody: { marginBottom: 10 },
    rowInfo: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 16 },
    infoBlock: { alignItems: 'flex-start' },
    infoLabel: { fontSize: 9, color: '#64748B', fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
    infoValue: { fontSize: 14, fontWeight: '800', color: '#E2E8F0' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flex: 1, gap: 6 },
    actionText: { fontSize: 12, fontWeight: '800', color: '#94A3B8' },

    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
    modalContent: { width: '90%', maxWidth: 450, backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: 32, padding: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#10B981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 10 },
    
    modalHeaderOrb: { alignSelf: 'center', marginTop: -50, marginBottom: 15, borderRadius: 30, padding: 4, backgroundColor: 'rgba(15, 23, 42, 0.9)' },
    modalHeaderOrbGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10 },
    
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
    modalTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
    modalSubTitle: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    
    formScroll: { flexGrow: 0 },
    inputLabel: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 1.5, marginBottom: 8, marginTop: 15 },
    
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', height: 55, overflow: 'hidden' },
    inputIcon: { marginLeft: 15, marginRight: 10 },
    modalInput: { flex: 1, color: '#F8FAFC', fontSize: 15, height: '100%' },
    
    statusChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
    statusChipText: { color: '#94A3B8', fontSize: 13, fontWeight: '800' },
    
    saveBtn: { marginTop: 40, borderRadius: 18, overflow: 'hidden', shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, marginBottom: 10 },
    saveBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 10 },
    saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1.5 }
});

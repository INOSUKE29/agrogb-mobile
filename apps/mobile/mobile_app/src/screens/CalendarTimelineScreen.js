import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ImageBackground, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AgroTimelineService } from '../services/timelineService';
import AgroTimelineCard from '../components/ui/AgroTimelineCard';
import SafeBlurView from '../components/ui/SafeBlurView';

const RURAL_BG = require('../../assets/farm_bg.png');

export default function CalendarTimelineScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [talhoes, setTalhoes] = useState([]);
    const [selectedTalhao, setSelectedTalhao] = useState(null);
    
    const [plantios, setPlantios] = useState([]);
    const [selectedPlantio, setSelectedPlantio] = useState(null);
    
    const [timelineData, setTimelineData] = useState([]);
    const [showSelectorModal, setShowSelectorModal] = useState(false);

    useEffect(() => {
        loadTalhoes();
    }, []);

    const loadTalhoes = async () => {
        setLoading(true);
        const t = await AgroTimelineService.getAllTalhoes();
        setTalhoes(t);
        if (t.length > 0) {
            handleSelectTalhao(t[0]);
        } else {
            setLoading(false);
        }
    };

    const handleSelectTalhao = async (talhao) => {
        setSelectedTalhao(talhao);
        const p = await AgroTimelineService.getPlantiosByTalhao(talhao.id);
        setPlantios(p);
        if (p.length > 0) {
            handleSelectPlantio(p[0]);
        } else {
            setTimelineData([]);
            setLoading(false);
        }
    };

    const handleSelectPlantio = async (plantio) => {
        setSelectedPlantio(plantio);
        setLoading(true);
        const data = await AgroTimelineService.getTimelineByPlantio(plantio.id);
        setTimelineData(data);
        setLoading(false);
        setShowSelectorModal(false);
    };

    const renderHeader = () => (
        <SafeBlurView intensity={30} tint="dark" style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitles}>
                <Text style={styles.title}>Calendário Agrícola</Text>
                <TouchableOpacity onPress={() => setShowSelectorModal(true)} style={styles.selectorBtn}>
                    <Text style={styles.subtitle}>
                        {selectedTalhao ? `${selectedTalhao.nome} • ${selectedPlantio?.cultura_nome || 'Selecione o Ciclo'}` : 'Selecione um Talhão'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#10B981" />
                </TouchableOpacity>
            </View>
        </SafeBlurView>
    );

    const renderEmpty = () => {
        if (loading) return <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50 }} />;
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={60} color="#9CA3AF" />
                <Text style={styles.emptyText}>Nenhum evento registrado nesta linha do tempo.</Text>
                <Text style={styles.emptySubtext}>Inicie um plantio para começar a traçar a história deste talhão!</Text>
            </View>
        );
    };

    return (
        <ImageBackground source={RURAL_BG} style={styles.container} resizeMode="cover">
            <View style={styles.overlay} />
            
            {renderHeader()}

            <FlatList
                data={timelineData}
                keyExtractor={(item) =
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    > item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                    <AgroTimelineCard event={item} isLast={index === timelineData.length - 1} />
                )}
                ListEmptyComponent={renderEmpty}
            />

            {/* Modal para Trocar Talhão/Plantio */}
            <Modal visible={showSelectorModal} transparent animationType="slide">
                <SafeBlurView intensity={40} tint="dark" style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecione o Ciclo de Plantio</Text>
                            <TouchableOpacity onPress={() => setShowSelectorModal(false)}>
                                <Ionicons name="close-circle" size={30} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                        
                        <FlatList
                            data={talhoes}
                            keyExtractor={t =
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    > t.id}
                            renderItem={({ item }) => (
                                <View style={styles.talhaoGroup}>
                                    <Text style={styles.talhaoName}>{item.nome}</Text>
                                    {plantios.length === 0 && selectedTalhao?.id === item.id ? (
                                        <Text style={styles.noPlantio}>Sem plantios registrados</Text>
                                    ) : null}
                                    {selectedTalhao?.id === item.id && plantios.map(p => (
                                        <TouchableOpacity 
                                            key={p.id} 
                                            style={[styles.plantioBtn, selectedPlantio?.id === p.id && styles.plantioBtnActive]}
                                            onPress={() => handleSelectPlantio(p)}
                                        >
                                            <Ionicons name="leaf" size={16} color={selectedPlantio?.id === p.id ? "#FFF" : "#10B981"} />
                                            <Text style={[styles.plantioBtnText, selectedPlantio?.id === p.id && {color: '#FFF'}]}>
                                                {p.cultura_nome} - {new Date(p.data_plantio).toLocaleDateString('pt-BR')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                    {selectedTalhao?.id !== item.id && (
                                        <TouchableOpacity style={styles.loadBtn} onPress={() => handleSelectTalhao(item)}>
                                            <Text style={styles.loadBtnText}>Ver Ciclos deste Talhão</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        />
                    </View>
                </SafeBlurView>
            </Modal>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17, 24, 39, 0.85)' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backBtn: { marginRight: 15 },
    headerTitles: { flex: 1 },
    title: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
    subtitle: { color: '#10B981', fontSize: 14, fontWeight: 'bold', marginRight: 5 },
    selectorBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 2, padding: 5, backgroundColor: 'rgba(16,185,129,0.1)', alignSelf: 'flex-start', borderRadius: 8 },
    listContent: { padding: 20, paddingBottom: 100 },
    emptyContainer: { alignItems: 'center', marginTop: 80, padding: 20 },
    emptyText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 15, textAlign: 'center' },
    emptySubtext: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 10 },
    
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1F2937', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '70%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    talhaoGroup: { backgroundColor: '#111827', borderRadius: 15, padding: 15, marginBottom: 15 },
    talhaoName: { color: '#D1FAE5', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    plantioBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: 'rgba(16,185,129,0.05)', borderRadius: 10, marginBottom: 5, borderWidth: 1, borderColor: 'rgba(16,185,129,0.1)' },
    plantioBtnActive: { backgroundColor: '#10B981' },
    plantioBtnText: { color: '#10B981', marginLeft: 10, fontWeight: '600' },
    loadBtn: { padding: 10, alignItems: 'center', backgroundColor: '#374151', borderRadius: 8 },
    loadBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    noPlantio: { color: '#9CA3AF', fontSize: 12, fontStyle: 'italic', marginBottom: 10 }
});
